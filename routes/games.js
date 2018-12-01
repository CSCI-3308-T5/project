const express = require("express");
const path = require("path");
const router = express.Router();

var main = require("./index.js");
var dbPool = main.dbPool;

router.get("/*", (req, res, next) => { //TODO update the redirects as more pages are added
	if(!res.locals.loggedIn){
		res.redirect("/auth/login");
		return;
	}
	next();
}); //look in pages folder and return file matching name from request TODO add redirect

router.get("/add", (req, res) => {
	res.render("addGame");
});
router.get("/:gameName", async (req, res) => {
	let temp = (await dbPool.query("select * from games where gamename=$1;",[req.params.gameName])).rows;
	if(temp.length==0){
		res.sendStatus(404);
		return;
	}
	res.locals.gameData = temp[0];
	res.locals.gameRating = await main.getRating(req.session.userid,req.params.gameName)
	res.render("gameInfo");
});
router.get("/:gameName/edit", async (req, res) => {
	let temp = (await dbPool.query("select * from games where gamename=$1;",[req.params.gameName])).rows;
	if(temp.length==0){
		res.sendStatus(404);
		return;
	}
	res.locals.gameData = temp[0];
	res.render("gameEdit");
});
router.post("/rate", async (req, res) => {
	if((await dbPool.query("select column_name from information_schema.columns where table_name='game_ratings' and column_name=$1;",[req.body["name"]])).rows.length==0){
		res.send("DNE"); //Does Not Exist
		return;
	}
	if(req.body["rating"]!=0) await dbPool.query("update game_ratings set \""+req.body["name"]+"\"=$1 where id=$2;",[req.body["rating"],req.session.userid]);
	else await dbPool.query("update game_ratings set \""+req.body["name"]+"\"=NULL where id=$1;",[req.session.userid]);
	res.send("Success");
});
router.post("/add", async (req, res) => {
	try{
		await dbPool.query("insert into games (gamename,pictureurl,gamedescription) values ($1,$2,$3);",[req.body["title"],req.body["pictureurl"],req.body["description"]]);
		await dbPool.query("alter table game_ratings add \""+req.body["title"]+"\" smallint;");
		res.send("Success");
	}catch(err){
		console.log(err);
		res.status(400).send(err);
	}
});
router.post("/edit", async (req, res) => {
	try{
		await dbPool.query("update games set pictureurl=$1, gamedescription=$2 where gamename=$3;",[req.body["pictureurl"],req.body["description"],req.body["title"]]);
		res.send("Success");
	}catch(err){
		console.log(err);
		res.status(400).send(err);
	}
});
router.post("/recommendations", async (req, res) => {
	//TODO get recommendations and send them back
});

router.use((req, res) => res.sendStatus(418)); //if this is reached, the request was broken

module.exports.router = router;
