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

var dbPool = new pg.Pool({
	connectionString: dbURL,
	max: 20,
});

var emailTransporter = nodemailer.createTransport(emailURL);

module.exports.saltRounds = saltRounds;
module.exports.dbPool = dbPool;
module.exports.emailTransporter = emailTransporter;
module.exports.hmacSecret1 = hmacSecret1;
module.exports.encryptionSecret = encryptionSecret;
module.exports.client_session_secret = client_session_secret;

var auth = require("./auth.js");

if(production){ //when deployed on heroku, forward all requests to https (we can still write in http because heroku handles https for us)
	app.use((req, res, next) => {
		if (req.header('x-forwarded-proto') !== 'https')
			res.redirect(`https://${req.header('host')}${req.url}`);
		else
			next();
	});
}

app.set("views", path.join(__dirname,"../public/views"))
app.set("view engine", "pug")

app.get("/static*", (req,res) => res.sendFile(path.join(__dirname,"../public"+req.path))); //look in public/static for all static files

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
app.get('/favicon.ico' , (req, res) => res.sendFile(path.join(__dirname,"../public/static/images/favicon.ico")));
//app.use("/auth", auth.router)
app.get("/*", (req, res, next) => { //TODO update the redirects as more pages are added
	let reqUrl = req.path.substring(1).split('/'); //break uri into pieces
	for(let i = 0;i<reqUrl.length;i++) reqUrl[i] = decodeURIComponent(reqUrl[i]); //unescape characters (i.e "%20" -> ' ')
	if(reqUrl[0]=="logout"){
		req.session.reset();
		res.redirect("/auth/login");
		return;
	}else if(reqUrl[0]=="auth"){
		next();
		return;
	}
	const loginRequired = new Set(["dashboard","profile"]);
	if(!res.locals.loggedIn && loginRequired.has(reqUrl[0])){
		res.redirect("/auth/login");
		return;
	}
	res.render(reqUrl[0]);
}); //look in pages folder and return file matching name from request TODO add redirects
//handle http post requests that match the pattern
app.post("/*",bodyParser.json()); //ignore this, it parses data into req.body
app.post("/*",bodyParser.urlencoded({extended: true})); //ignore this, it parses data into req.body
app.use("/auth", auth.router)
app.get("/*", (req, res) => res.sendStatus(404)); //if all else fails, return 404


app.use((req, res) => res.sendStatus(418)); //if this is reached, the request was broken
app.listen(port, () => console.log(`App listening on port ${port}!`)); //sets the app to listen on the given port
