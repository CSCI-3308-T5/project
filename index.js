const express = require("express");
const bodyParser = require("body-parser");
const path = require("path")
const pg = require("pg");
const bcrypt = require("bcrypt");
const app = express();

let port = process.env.PORT;
let dbURL = process.env.DATABASE_URL;

const saltRounds = 10;

var production = true;
if (port == null || port == "") { //not deployed on heroku
	production = false;
	port = 3000;
	dbURL = "postgres://project3308:project@localhost:5432/project"; //you need a user named project3308 with password project with permission to access/edit a database named project
																	 //you may also need to add 'host all all localhost trust' to pg_hba.conf
}

var dbPool = new pg.Pool({
	connectionString: dbURL,
	max: 20,
});

if(production){ //when deployed on heroku, forward all requests to https (we can still write in http because heroku handles https for us)
	app.use((req, res, next) => {
		if (req.header('x-forwarded-proto') !== 'https')
			res.redirect(`https://${req.header('host')}${req.url}`)
		else
			next()
	});
}

//handle http get requests that match the pattern
app.get("/", (req, res) => res.sendFile(path.join(__dirname,"public/pages/home.html")));
app.get("/*",express.static(path.join(__dirname,'public/pages'))); //look in pages folder first and return file matching name from request
app.get("/*",express.static(path.join(__dirname,'public'))); //look in public folder and return file matching name from request
app.get("/*", (req, res) => res.sendStatus(404)); //if all else fails, return 404
//handle http post requests that match the pattern
app.post("/*",bodyParser.json()); //ignore this, it parses data into req.body
app.post("/*",bodyParser.urlencoded({extended: true})); //ignore this, it parses data into req.body
app.post("/accountCreate", (req, res) => { //handles account creation requests
	//console.log(req.body);
	const username = req.body["usernameField"];
	const email = req.body["emailField"];
	const plaintextPassword = req.body["passwordField"];
	dbPool.connect((err,client,release)=>{ //connect to database
		if(err){
			client.end(); //kill client
			throw err;
		}
		client.query("select * from users where username=$1 or email=$2", [username, email], (err1, result) => { //query database
			if(err1){
				client.end(); //kill client
				throw err1;
			}
			if(result.rows.length==0){ //no rows matching query
				bcrypt.hash(plaintextPassword, saltRounds, function(err2, hash) { //salt and hash password
					if(err2){
						client.end(); //kill client
						throw err2;
					}
			  		client.query("insert into users (username, email, hashedpass) values ($1,$2,$3) returning *",[username,email,hash], (err3, result2) => {
						if(err3){
							client.end(); //kill client
							throw err3;
						}
						release(); //release client back to pool
						res.send("Success"); //send string back to ajax request
					});
				});
			}else{
				release(); //release client back to pool
				for(let i = 0;i<result.rows.length;i++){
					if(result.rows[i]["username"]==username){
						res.send("An account with that username already exists"); //send string back to ajax request
						break;
					}else if(result.rows[i]["email"]==email){
						res.send("An account with that email already exists"); //send string back to ajax request
						break;
					}
				}
			}
		});
	});
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`)); //sets the app to listen on the given port
