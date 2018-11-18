var resetPasswordForm = document.getElementById("resetPasswordForm");
var passwordField = document.getElementById("passwordField");
var passwordError = document.getElementById("passwordError");
var passwordConfirmField = document.getElementById("passwordConfirmField");
var passwordConfirmError = document.getElementById("passwordConfirmError");

function passwordCheck(){
	if(passwordConfirmField.value.length!=0) passwordConfirmCheck();
	if(passwordField.value.length<6){
		passwordField.setCustomValidity("invalid");
		passwordError.innerHTML = "Password must be 6 or more characters";
		passwordError.className = "error active"; //show alert
		return false;
	}else if(passwordField.value.length>72){ //bcrypt has a maximum character count of 72
		passwordField.setCustomValidity("invalid");
		passwordError.innerHTML = "Password must be less than 73 characters";
		passwordError.className = "error active"; //show alert
		return false;
	}else{
		passwordField.setCustomValidity("");
		passwordError.innerHTML = "";
		passwordError.className = "error"; //hide alert
		return true;
	}
}

function passwordConfirmCheck(){
	if(passwordField.value!=passwordConfirmField.value){
		passwordConfirmField.setCustomValidity("invalid");
		passwordConfirmError.innerHTML = "Passwords must match";
		passwordConfirmError.className = "error active"; //show alert
		return false;
	}else{
		passwordConfirmField.setCustomValidity("");
		passwordConfirmError.innerHTML = "";
		passwordConfirmError.className = "error"; //hide alert
		return true;
	}
}

passwordField.addEventListener("input", passwordCheck);
passwordConfirmField.addEventListener("input", passwordConfirmCheck);
resetPasswordForm.addEventListener("submit", function(event){ //TODO change how data is sent to encrypt password and whatnot
	event.preventDefault(); //form is submitted through ajax, so prevent the button from reloading the page
	if(!passwordCheck()|!passwordConfirmCheck()){
		return;
	}
	$.ajax({ //send ajax request
		type: "POST",
		url: window.location.href, //send current url as post instead of get
		data: $("#resetPasswordForm").serialize(), //convert data from form into json/xml (not sure which)
		success: function(data){
			if(data=="Success"){ //TODO redirect instead
				showAlertSuccess("Success, redirecting to login...");
				setTimeout( () => {
       				window.location.href = "/auth/login";
    			}, 2000);
			}else{
				showAlert(data);
			}
		}
	});
});
