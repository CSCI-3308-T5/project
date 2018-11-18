$(document).ready(function(){
	$(".rate > input").click(function(event){
		let clickId = event.target.id;
		let rating = parseInt(clickId[clickId.length-1]);
		let name = clickId.substring(5,clickId.length-2);
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
