var imageEntry = document.getElementById("imageEntry");
var imageURLField = document.getElementById("newImageURLField");
var titleField = document.getElementById("newTitleField");
var descriptionField = document.getElementById("newDescriptionField");

function loadImage(){
	imageEntry.src = imageURLField.value;
}

function submitGame(){
	$.ajax({ //send ajax request
		type: "POST",
		contentType: "application/json",
		url: "/games/add", //send request to rating url
		data: "{\"pictureurl\":\""+imageURLField.value+"\",\"title\":\""+titleField.value+"\",\"description\":\""+descriptionField.value+"\"}", //send data as json
		success: function(data){//TODO
			if(data=="Success"){
				window.location.href="/games/"+titleField.value;
			}else {
				showAlert(data);
			}
		}
	});
}
