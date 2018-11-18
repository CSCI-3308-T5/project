var newRatingTitleError = document.getElementById("newRatingTitleError");
var newRatingTitleField = document.getElementById("newRatingTitleField");
var ratings = document.getElementById("ratings");

function getRecommendations(){
	$.ajax({ //send ajax request
		type: "POST",
		contentType: "application/json",
		url: "/games/recommendations",
		data: "",
		success: function(data){//TODO

		}
	});
}

$(document).ready(function(){
	$(".rate > input").click(function(event){
		let clickId = event.target.id;
		let rating = parseInt(clickId[clickId.length-1]);
		let name = clickId.substring(5,clickId.length-2);
		let newGame = false;
		if(name=="newgame"){
			newGame = true;
			name = newRatingTitleField.value;
			if(name==""){
				newRatingTitleError.className = "error active";
				newRatingTitleError.innerHTML = "Please enter the name of a game."
				return;
			}else{
				newRatingTitleError.className = "error";
			}
			newRatingTitleField.value = "";
			document.getElementById(clickId).checked = false;
			clickId = "star#"+name+"-"+rating;
			if(document.getElementById(clickId)){
				document.getElementById(clickId).click();
				return;
			}
		}
		$.ajax({ //send ajax request
			type: "POST",
			contentType: "application/json",
			url: "/games/rate", //send request to rating url
			data: "{\"rating\":"+rating+",\n\"name\":\""+name+"\"}", //send data as json
			success: function(data){//TODO
				if(data!="Success"){
					if(newGame&&data=="DNE"){
						newRatingTitleError.className = "error active";
						newRatingTitleError.innerHTML = "This game isn't in our database. Would you like to <a href=\"/games/add\">add it?</a>"
					}else{
						showAlert("An error occurred. Please try again later.");
					}
				}else if(newGame){
					ratings.innerHTML=newStarRatingAndLink(name,rating)+ratings.innerHTML;
					console.log(ratings.innerHTML);
				}
			}
		});
	});
});
