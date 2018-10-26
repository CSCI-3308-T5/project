const express = require("express");
const bodyParser = require("body-parser");
const path = require("path")
const Promise = require("bluebird")
const pg = Promise.promisifyAll(require("pg"));
const bcrypt = Promise.promisifyAll(require("bcrypt"));
const clientSession = require("client-sessions");
const childProcess = require("child_process")
const app = express();

let port = process.env.PORT;
let dbURL = process.env.DATABASE_URL;

const saltRounds = 10;
const hmacSecret = "randomsecretcrap";

var production = true;
if (port == null || port == "") { //not deployed on heroku
	production = false;
	port = 3000;
	pg.defaults.ssl = true;
	dbURL = childProcess.execSync("heroku config:get DATABASE_URL").toString(); //get heroku database connection string
}

var dbPool = new pg.Pool({
	connectionString: dbURL,
	max: 20,
});

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
	secret: 'R7tWv36I4ALVw637TaK2NgfekRKyUa7h', //encryption key
	duration: 30 * 60 * 1000, //cookie works for 30 minutes
	activeDuration: 10 * 60 * 1000, //if cookie expires in less than 10 minutes, add 10 minutes to cookie duration if user still on site
	httpOnly: true, //cookie inaccessible from client-side js
	secureProxy: true, //cookie only sent over https connections
}));
//handle http get requests that match the pattern
app.use((req,res,next) => { //cookie checker middleware, sets res.locals.loggedIn to appropriate value
	if(req.session&&req.session.username&&req.session.hash&&Date.now()-req.session.timeStamp<=(24*60*60*1000)){ //cookies expire after 24 hours
		bcrypt.compare(hmacSecret+req.session.username+req.session.timeStamp,req.session.hash, (err,match) => {
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
app.get("/*", (req, res) => { //TODO update the redirects as more pages are added
	let reqUrl = req.path.substring(1);
	if(reqUrl=="logout"){
		req.session.reset();
		res.redirect("/login");
		return;
	}
	const loginForbidden = new Set(["newAccount","login"]);
	const loginRequired = new Set(["dashboard","profile"]);
	if(res.locals.loggedIn){//user logged in
		if(loginForbidden.has(reqUrl)){
			res.redirect("/dashboard");
			return;
		}
	}else{//user not logged in
		if(loginRequired.has(reqUrl)){
			res.redirect("/login");
			return;
		}
	}
	res.render(req.path.substring(1));
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
			await client.query("insert into users (username, email, hashedpass) values ($1,$2,$3)",[username, email, hash]);
			res.send("Success");
		}else{
			if(result.rows[0].username==username)res.send("An account with that username already exists");
			else res.send("An account with that email already exists");
		}
	}catch(err){
		console.log(err);
		res.sendStatus(400);
	}
});
app.post("/login", async (req,res) => { //TODO add logout
	if(res.locals.loggedIn){
		res.send("Already logged in");
		return;
	}
	const username = req.body["usernameField"];
	const plaintextPassword = req.body["passwordField"];
	try{
		let result = await dbPool.query("select * from users where username=$1 or email=$1", [username]);
		if(result.rows.length==0) res.send("Incorrect username/email");
		else{
			let match = await bcrypt.compare(plaintextPassword,result.rows[0]["hashedpass"]);
			if(match){
				req.session.username = result.rows[0]["username"];
				req.session.timeStamp = Date.now();
				if(req.body["rememberMeBox"]){
					req.session.setDuration(Number.MAX_SAFE_INTEGER); //prevent cookie from expiring on client side
					req.session.timeStamp = 8640000000000000; //max Date
				}
				let hash = await bcrypt.hash(hmacSecret+req.session.username+req.session.timeStamp,saltRounds);
				req.session.hash = hash;
				res.send("Success");
			}else{
				res.send("Incorrect password");
			}
		}
	}catch(err){
		console.log(err);
		res.sendStatus(err);
	}
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`)); //sets the app to listen on the given port
