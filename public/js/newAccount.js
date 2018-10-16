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
		usernameError.className = "error active";
		return false;
	}else{
		usernameField.setCustomValidity("");
		usernameError.innerHTML = "";
		usernameError.className = "error";
		return true;
	}
}

function emailCheck(){
	const rfc5322 = /^([!#-'*+/-9=?A-Z^-~-]+(\.[!#-'*+/-9=?A-Z^-~-]+)*|"([]!#-[^-~ \t]|(\\[\t -~]))+")@([!#-'*+/-9=?A-Z^-~-]+(\.[!#-'*+/-9=?A-Z^-~-]+)*|\[[\t -Z^-~]*])$/;
	if(!rfc5322.exec(emailField.value)){
		emailField.setCustomValidity("invalid");
		emailError.innerHTML = "Please enter a valid email";
		emailError.className = "error active";
		return false;
	}else{
		emailField.setCustomValidity("");
		emailError.innerHTML = "";
		emailError.className = "error";
		return true;
	}
}

function passwordCheck(){
	if(passwordField.value.length<6){
		passwordField.setCustomValidity("invalid");
		passwordError.innerHTML = "Password must be 6 or more characters";
		passwordError.className = "error active";
		return false;
	}else if(passwordField.value.length>72){ //bcrypt has a maximum character count of 72
		passwordField.setCustomValidity("invalid");
		passwordError.innerHTML = "Password must be less than 73 characters";
		passwordError.className = "error active";
		return false;
	}else{
		passwordField.setCustomValidity("");
		passwordError.innerHTML = "";
		passwordError.className = "error";
		return true;
	}
}

function passwordConfirmCheck(){
	if(passwordField.value!=passwordConfirmField.value){
		passwordConfirmField.setCustomValidity("invalid");
		passwordConfirmError.innerHTML = "Passwords must match";
		passwordConfirmError.className = "error active";
		return false;
	}else{
		passwordConfirmField.setCustomValidity("");
		passwordConfirmError.innerHTML = "";
		passwordConfirmError.className = "error";
		return true;
	}
}

function termsCheck(){
	if(!termsAndCondsBox.checked){
		termsAndCondsBox.setCustomValidity("invalid");
		termsError.innerHTML = "You must agree to the (nonexistent) Terms and Conditions";
		termsError.className = "error active";
		return false;
	}else{
		termsAndCondsBox.setCustomValidity("");
		termsError.innerHTML = "";
		termsError.className = "error";
		return true;
	}
}

function hideAlert(){
	alert.innerHTML = "";
	alert.className = "alert";
}

usernameField.addEventListener("input", usernameCheck);
emailField.addEventListener("input", emailCheck);
passwordField.addEventListener("input", passwordCheck); //TODO add bcrypt to backend
passwordConfirmField.addEventListener("input", passwordConfirmCheck);
termsAndCondsBox.addEventListener("input", termsCheck);
newAccountForm.addEventListener("submit", function(event){ //TODO change how data is sent to encrypt password and whatnot
	event.preventDefault(); //form is submitted through ajax, so this is unnecessary
	if(!usernameCheck()|!emailCheck()|!passwordCheck()|!passwordConfirmCheck()|!termsCheck()){
		return;
	}
	$.ajax({
		type: "POST",
		url: "/accountCreate",
		data: $("#newAccountForm").serialize(),
		success: function(data){
			if(data=="Success"){ //TODO redirect instead
				alert.innerHTML = "Success<button type=\"button\" class=\"close\" onclick=\"hideAlert();\"><span>&times;</span></button>";
				alert.className = "alert-success alert active";
			}else{
				alert.innerHTML = data+"<button type=\"button\" class=\"close\" onclick=\"hideAlert();\"><span>&times;</span></button>";
				alert.className = "alert-danger alert active";
			}
		}
	});
});
