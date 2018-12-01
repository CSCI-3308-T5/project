$(document).ready(function(){
	let oldRating = 0;
	for(let i = 0;i<10;i+=2){
		if(document.getElementsByClassName("rate")[0].childNodes[i].checked){
			oldRating = (10-i)/2;
		}
	}
	$(".rate > input").click(function(event){
		let clickId = event.target.id;
		let rating = parseInt(clickId[clickId.length-1]);
		let name = clickId.substring(5,clickId.length-2);
		if(rating==oldRating){
			oldRating = 0;
			rating = 0;
			event.target.checked = false;
		}else{
			oldRating = rating;
		}
		$.ajax({ //send ajax request
			type: "POST",
			contentType: "application/json",
			url: "/games/rate", //send request to rating url
			data: "{\"rating\":"+rating+",\n\"name\":\""+name+"\"}", //send data as json
			success: function(data){//TODO
				if(data!="Success"){
					showAlert("An error occurred. Please try again later.");
				}
			}
		});
	});
});
