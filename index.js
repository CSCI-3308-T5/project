const express = require("express");
const bodyParser = require("body-parser");
const path = require("path")
const Promise = require("bluebird")
const pg = Promise.promisifyAll(require("pg"));
const bcrypt = Promise.promisifyAll(require("bcrypt"));
const clientSession = require("client-sessions");
const childProcess = require("child_process");
const nodemailer = Promise.promisifyAll(require("nodemailer"));
const crypto = require("crypto");
const app = express();

let port = process.env.PORT;
let dbURL = process.env.DATABASE_URL;
let emailURL = process.env.EMAIL_URL;

const saltRounds = 10;
var hmacSecret1 = process.env.HMAC_SECRET1;
var encryptionSecret = process.env.ENCRYPTION_SECRET;
var client_session_secret = process.env.CLIENT_SESSION_SECRET;

var production = true;
if (port == null || port == "") { //not deployed on heroku
	production = false;
	port = 3000;
	pg.defaults.ssl = true;
	dbURL = childProcess.execSync("heroku config:get DATABASE_URL -a gameconnect").toString(); //get heroku database connection string
	emailURL = childProcess.execSync("heroku config:get EMAIL_URL -a gameconnect").toString(); //get email connection string from heroku
	hmacSecret1 = childProcess.execSync("heroku config:get HMAC_SECRET1 -a gameconnect").toString(); //get hmacSecret1 from heroku
	client_session_secret = childProcess.execSync("heroku config:get CLIENT_SESSION_SECRET -a gameconnect").toString(); //get another secret thing from heroku
	encryptionSecret = childProcess.execSync("heroku config:get ENCRYPTION_SECRET -a gameconnect").toString().substring(0,32); //get another secret thing from heroku
}

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

var dbPool = new pg.Pool({
	connectionString: dbURL,
	max: 20,
});

var emailTransporter = nodemailer.createTransport(emailURL);

if(production){ //when deployed on heroku, forward all requests to https (we can still write in http because heroku handles https for us)
	app.use((req, res, next) => {
		if (req.header('x-forwarded-proto') !== 'https')
			res.redirect(`https://${req.header('host')}${req.url}`);
		else
			next();
	});
}

app.set("views", path.join(__dirname,"public/views"))
app.set("view engine", "pug")

app.get("/static*", (req,res) => res.sendFile(path.join(__dirname,"public"+req.path))); //look in public/static for all static files

//session middleware
app.use(clientSession({
	cookieName: 'session',
	secret: client_session_secret, //encryption key
	duration: 30 * 60 * 1000, //cookie works for 30 minutes
	activeDuration: 10 * 60 * 1000, //if cookie expires in less than 10 minutes, add 10 minutes to cookie duration if user still on site
	httpOnly: true, //cookie inaccessible from client-side js
	secureProxy: true, //cookie only sent over https connections
}));
//handle http get requests that match the pattern
app.use((req,res,next) => { //cookie checker middleware, sets res.locals.loggedIn to appropriate value
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
});
app.get("/", (req, res) => res.render("home"));
app.get('/favicon.ico' , (req, res) => res.sendFile(path.join(__dirname,"public/static/images/favicon.ico")));
app.get("/*", (req, res) => { //TODO update the redirects as more pages are added
	let reqUrl = req.path.substring(1).split('/'); //break uri into pieces
	for(let i = 0;i<reqUrl.length;i++) reqUrl[i] = decodeURIComponent(reqUrl[i]); //unescape characters (i.e "%20" -> ' ')
	if(reqUrl[0]=="logout"){
		req.session.reset();
		res.redirect("/login");
		return;
	}
	const loginForbidden = new Set(["newAccount","login","forgotPassword"]);
	const loginRequired = new Set(["dashboard","profile"]);
	if(res.locals.loggedIn){//user logged in
		if(loginForbidden.has(reqUrl[0])){
			res.redirect("/dashboard");
			return;
		}
	}else{//user not logged in
		if(loginRequired.has(reqUrl[0])){
			res.redirect("/login");
			return;
		}
	}
	res.render(reqUrl[0]);
}); //look in pages folder and return file matching name from request TODO add redirects
app.get("/*", (req, res) => res.sendStatus(404)); //if all else fails, return 404
//handle http post requests that match the pattern
app.post("/*",bodyParser.json()); //ignore this, it parses data into req.body
app.post("/*",bodyParser.urlencoded({extended: true})); //ignore this, it parses data into req.body
app.post("/accountCreate", async (req, res) => { //handles account creation requests
	const username = req.body["usernameField"];
	const email = req.body["emailField"];
	const plaintextPassword = req.body["passwordField"];
	//TODO check that username/email/password meet requirements on server side
	try{
		let result = await dbPool.query("select * from users where username=$1 or email=$2", [username, email]);
		if(result.rows.length==0){
			let hash = await bcrypt.hash(plaintextPassword, saltRounds);
			await dbPool.query("insert into users (username, email, hashedpass) values ($1,$2,$3)",[username, email, hash]);
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
app.post("/login", async (req,res) => {
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
app.post("/forgotPassword", async (req, res) =>{
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
			let fpURL = "https://gameconnect.herokuapp.com/resetPassword/"+encodeURIComponent(emailEncrypted)+'/'+encodeURIComponent(timestampEncrypted)+'/'+encodeURIComponent(hmacEncrypted);
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
app.post("/resetPassword/:email/:timestamp/:hmac", async (req, res) => {
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

app.use((req, res) => res.sendStatus(418)); //if this is reached, the request was broken
app.listen(port, () => console.log(`App listening on port ${port}!`)); //sets the app to listen on the given port
