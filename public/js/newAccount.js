var newAccountForm = document.getElementById("newAccountForm");
var usernameField = document.getElementById("usernameField");
var usernameError = document.getElementById("usernameError");
var emailField = document.getElementById("emailField");
var emailError = document.getElementById("emailError");
var passwordField = document.getElementById("passwordField");
var passwordError = document.getElementById("passwordError");
var passwordConfirmField = document.getElementById("passwordConfirmField");
var passwordConfirmError = document.getElementById("passwordConfirmError");
var termsAndCondsBox = document.getElementById("termsAndCondsBox");
var termsError = document.getElementById("termsError");
var alert = document.getElementById("alert");

function usernameCheck(){
	const usernameRegex = /^[a-zA-Z0-9]*$/;
	if(usernameField.value.length<3||usernameField.value.length>24||!usernameRegex.exec(usernameField.value)){
		usernameField.setCustomValidity("invalid");
		usernameError.innerHTML = "Username must be 3-24 characters from the set: a-z,A-Z,0-9";
		usernameError.className = "error active"; //show alert
		return false;
	}else{
		usernameField.setCustomValidity("");
		usernameError.innerHTML = "";
		usernameError.className = "error"; //hide alert
		return true;
	}
}

function emailCheck(){
	const rfc5322 = /^([!#-'*+/-9=?A-Z^-~-]+(\.[!#-'*+/-9=?A-Z^-~-]+)*|"([]!#-[^-~ \t]|(\\[\t -~]))+")@([!#-'*+/-9=?A-Z^-~-]+(\.[!#-'*+/-9=?A-Z^-~-]+)*|\[[\t -Z^-~]*])$/;
	if(!rfc5322.exec(emailField.value)){
		emailField.setCustomValidity("invalid");
		emailError.innerHTML = "Please enter a valid email";
		emailError.className = "error active"; //show alert
		return false;
	}else{
		emailField.setCustomValidity("");
		emailError.innerHTML = "";
		emailError.className = "error"; //hide alert
		return true;
	}
}

function passwordCheck(){
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

function termsCheck(){
	if(!termsAndCondsBox.checked){
		termsAndCondsBox.setCustomValidity("invalid");
		termsError.innerHTML = "You must agree to the (nonexistent) Terms and Conditions";
		termsError.className = "error active"; //show alert
		return false;
	}else{
		termsAndCondsBox.setCustomValidity("");
		termsError.innerHTML = "";
		termsError.className = "error"; //hide alert
		return true;
	}
}

function hideAlert(){
	alert.innerHTML = "";
	alert.className = "alert"; //hide alert at top of page
}

usernameField.addEventListener("input", usernameCheck);
emailField.addEventListener("input", emailCheck);
passwordField.addEventListener("input", passwordCheck);
passwordConfirmField.addEventListener("input", passwordConfirmCheck);
termsAndCondsBox.addEventListener("input", termsCheck);
newAccountForm.addEventListener("submit", function(event){ //TODO change how data is sent to encrypt password and whatnot
	event.preventDefault(); //form is submitted through ajax, so prevent the button from reloading the page
	if(!usernameCheck()|!emailCheck()|!passwordCheck()|!passwordConfirmCheck()|!termsCheck()){
		return;
	}
	$.ajax({ //send ajax request
		type: "POST",
		url: "/accountCreate", //send request to url /accountCreate
		data: $("#newAccountForm").serialize(), //convert data from form into json/xml (not sure which)
		success: function(data){
			if(data=="Success"){ //TODO redirect instead
				alert.innerHTML = "Success<button type=\"button\" class=\"close\" onclick=\"hideAlert();\"><span>&times;</span></button>";
				alert.className = "alert-success alert active"; //show alert
			}else{
				alert.innerHTML = data+"<button type=\"button\" class=\"close\" onclick=\"hideAlert();\"><span>&times;</span></button>";
				alert.className = "alert-danger alert active"; //show alert
			}
		}
	});
});
