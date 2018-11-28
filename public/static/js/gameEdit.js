var imageEntry = document.getElementById("imageEntry");
var imageURLField = document.getElementById("editImageURLField");
var descriptionField = document.getElementById("editDescriptionField");
const gameTitle = document.getElementById("gameTitle").innerText;

function loadImage(){
	imageEntry.src = imageURLField.value;
}

function submitGame(){
	$.ajax({ //send ajax request
		type: "POST",
		contentType: "application/json",
		url: "/games/edit", //send request to rating url
		data: "{\"pictureurl\":\""+imageURLField.value+"\",\"title\":\""+gameTitle+"\",\"description\":\""+descriptionField.value+"\"}", //send data as json
		success: function(data){//TODO
			if(data=="Success"){
				window.location.href="/games/"+gameTitle;
			}else {
				showAlert(data);
			}
		}
	});
}
