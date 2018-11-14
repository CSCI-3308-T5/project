var loginForm = document.getElementById("loginForm");
var usernameField = document.getElementById("usernameField");
var usernameError = document.getElementById("usernameError");
var passwordField = document.getElementById("passwordField");
var passwordError = document.getElementById("passwordError");
var rememberMeBox = document.getElementById("rememberMeBox");
var alert = document.getElementById("alert");

function usernameCheck(){
	if(usernameField.value.length==0){
		usernameField.setCustomValidity("invalid");
		usernameError.innerHTML = "Please enter your username";
		usernameError.className = "error active"; //show alert
		return false;
	}else{
		usernameField.setCustomValidity("");
		usernameError.innerHTML = "";
		usernameError.className = "error"; //hide alert
		return true;
	}
}

function passwordCheck(){
	if(passwordField.value.length==0){
		passwordField.setCustomValidity("invalid");
		passwordError.innerHTML = "Please enter your password";
		passwordError.className = "error active"; //show alert
		return false;
	}else{
		passwordField.setCustomValidity("");
		passwordError.innerHTML = "";
		passwordError.className = "error"; //hide alert
		return true;
	}
}

function hideAlert(){
	alert.innerHTML = "";
	alert.className = "alert"; //hide alert at top of page
}

usernameField.addEventListener("input", usernameCheck);
passwordField.addEventListener("input", passwordCheck);

loginForm.addEventListener("submit", function(event){ //TODO change how data is sent to encrypt password and whatnot
	event.preventDefault(); //form is submitted through ajax, so prevent the button from reloading the page
	if(!usernameCheck()|!passwordCheck()){
		return;
	}
	$.ajax({ //send ajax request
		type: "POST",
		url: "/auth/login", //send request to url /login
		data: $("#loginForm").serialize(), //convert data from form into json/xml (not sure which)
		success: function(data){
			if(data=="Success"){
				window.location.replace("dashboard");
			}else{
				alert.innerHTML = data+"<button type=\"button\" class=\"close\" onclick=\"hideAlert();\"><span>&times;</span></button>";
				alert.className = "alert-danger alert active"; //show alert
			}
		}
	});
});
