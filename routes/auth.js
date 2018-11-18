const express = require("express");
const path = require("path");
const Promise = require("bluebird");
const bcrypt = Promise.promisifyAll(require("bcrypt"));
const nodemailer = Promise.promisifyAll(require("nodemailer"));
const crypto = require("crypto");
const router = express.Router();

var main = require("./index.js");
var saltRounds = main.saltRounds;
var dbPool = main.dbPool;
var emailTransporter = main.emailTransporter;
var hmacSecret1 = main.hmacSecret1;
var encryptionSecret = main.encryptionSecret;
var client_session_secret = main.client_session_secret;

function encrypt(str){
	let iv = crypto.randomBytes(8).toString("hex");
	let cipher = crypto.createCipheriv('aes-256-cbc',encryptionSecret,iv);
	return cipher.update(str,"binary","binary")+cipher.final("binary")+iv;
}

function decrypt(str){
	let iv = str.substring(str.length-16);
	str = Buffer.from(str.substring(0,str.length-16),"binary");
	let decipher = crypto.createDecipheriv('aes-256-cbc',encryptionSecret,iv);
	return (decipher.update(str,"binary")+decipher.final("binary")).toString();
}

//handle http get requests that match the pattern
function authCheck(req,res,next){ //cookie checker middleware, sets res.locals.loggedIn to appropriate value
	if(req.session&&req.session.username&&req.session.hash&&Date.now()-req.session.timestamp<=(24*60*60*1000)){ //cookies expire after 24 hours
		bcrypt.compare(hmacSecret1+req.session.username+req.session.timestamp,req.session.hash, (err,match) => {
			if(err) throw err;
			res.locals.loggedIn = match;
			res.locals.username = req.session.username;
			next();
		});
	}else{
		res.locals.loggedIn = false;
		next();
	}
}

router.get("/*", (req, res) => { //TODO update the redirects as more pages are added
	let reqUrl = req.path.substring(1).split('/'); //break uri into pieces
	for(let i = 0;i<reqUrl.length;i++) reqUrl[i] = decodeURIComponent(reqUrl[i]); //unescape characters (i.e "%20" -> ' ')
	if(res.locals.loggedIn){
		res.redirect("/dashboard");
		return;
	}
	res.render(reqUrl[0]);
}); //look in pages folder and return file matching name from request TODO add redirect
router.post("/accountCreate", async (req, res) => { //handles account creation requests
	const username = req.body["usernameField"];
	const email = req.body["emailField"];
	const plaintextPassword = req.body["passwordField"];
	//TODO check that username/email/password meet requirements on server side
	try{
		let result = await dbPool.query("select * from users where username=$1 or email=$2", [username, email]);
		if(result.rows.length==0){
			let hash = await bcrypt.hash(plaintextPassword, saltRounds);
			await dbPool.query("insert into users (username, email, hashedpass) values ($1,$2,$3)",[username, email, hash]);
			await dbPool.query("insert into game_ratings default values;");
			res.send("Success");
		}else{
			if(result.rows[0].username==username)res.send("An account with that username already exists");
			else res.send("An account with that email already exists");
		}
	}catch(err){
		console.log(err);
		res.status(400).send(err);
	}
});
router.post("/login", async (req,res) => {
	const username = req.body["usernameField"];
	const plaintextPassword = req.body["passwordField"];
	try{
		let result = await dbPool.query("select * from users where username=$1 or email=$1", [username]);
		if(result.rows.length==0) res.send("Incorrect username/email");
		else{
			let match = await bcrypt.compare(plaintextPassword,result.rows[0]["hashedpass"]);
			if(match){
				req.session.username = result.rows[0]["username"];
				req.session.timestamp = Date.now();
				if(req.body["rememberMeBox"]){
					req.session.setDuration(Number.MAX_SAFE_INTEGER); //prevent cookie from expiring on client side
					req.session.timestamp = 8640000000000000; //max Date
				}
				let hash = await bcrypt.hash(hmacSecret1+req.session.username+req.session.timestamp,saltRounds);
				req.session.hash = hash;
				req.session.userid = result.rows[0]["id"];
				res.send("Success");
			}else{
				res.send("Incorrect password");
			}
		}
	}catch(err){
		console.log(err);
		res.status(400).send(err);
	}
});
router.post("/forgotPassword", async (req, res) =>{
	const emailAddress = req.body["emailField"];
	try{
		let result = await dbPool.query("select * from users where email=$1",[emailAddress]);
		if(result.rows.length==0){
			res.send("No account is associated with that email address.");
		}else{
			let emailEncrypted = encrypt(emailAddress);
			let timestamp = Date.now()+"";
			let timestampEncrypted = encrypt(timestamp);
			let hmac = await bcrypt.hash(hmacSecret1+emailAddress+timestamp,saltRounds);
			let hmacEncrypted = encrypt(hmac);
			let fpURL = "https://gameconnect.herokuapp.com/auth/resetPassword/"+encodeURIComponent(emailEncrypted)+'/'+encodeURIComponent(timestampEncrypted)+'/'+encodeURIComponent(hmacEncrypted);
			let message = {
    			from: 'gameconnectapp@gmail.com',
    			to: emailAddress,
    			subject: 'Forgot Password Request',
    			text: `Hi,\n A forgot password request was requested for this
				email address. Please click the link (or copy and paste it into
				your address bar) to reset your password. If you didn't send
				this request, please ignore this message, and the link below
				will expire in 24 hours. \n\n ` + fpURL,
    			html: `<p>\nHi,<br> A forgot password request was requested for
				this email address. Please click the link (or copy and paste it
				into your address bar) to reset your password. If you didn't
				send this request, please ignore this message, and the link
				below will expire in 24 hours. <br><br>`+fpURL+`</p>`
			};
			let info = await emailTransporter.sendMail(message);
			if(info.rejected.length!=0) res.send("Failed to send email.");
			else res.send("Success");
		}
	}catch(err){
		console.log(err);
		res.status(400).send(err);
	}
});
router.post("/resetPassword/:email/:timestamp/:hmac", async (req, res) => {
	let email = decrypt(decodeURIComponent(req.params.email));
	let timestamp = decrypt(decodeURIComponent(req.params.timestamp));
	let hmac = decrypt(decodeURIComponent(req.params.hmac));
	if(Date.now()-parseInt(timestamp)>=(24*60*60*1000)){
		res.send("URL too old.");
	}else{
		try{
			let match = await bcrypt.compare(hmacSecret1+email+timestamp,hmac);
			if(match){
				let hashedpass = await bcrypt.hash(req.body["passwordField"],saltRounds);
				await dbPool.query("update users set hashedpass=$2 where email=$1",[email,hashedpass]);
				res.send("Success");
			}else{
				res.send("URL invalid.");
			}
		}catch(err){
			console.log(err);
			res.status(400).send(err);
		}
	}
});

router.use((req, res) => res.sendStatus(418)); //if this is reached, the request was broken

module.exports.router = router;
module.exports.authCheck = authCheck;
