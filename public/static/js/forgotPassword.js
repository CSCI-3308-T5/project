var forgotPasswordForm = document.getElementById("forgotPasswordForm");
var usernameField = document.getElementById("emailField");
var usernameError = document.getElementById("emailError");
var alert = document.getElementById("alert");

function emailCheck(){
	if(emailField.value.length==0){
		emailField.setCustomValidity("invalid");
		emailError.innerHTML = "Please enter your email address";
		emailError.className = "error active"; //show alert
		return false;
	}else{
		emailField.setCustomValidity("");
		emailError.innerHTML = "";
		emailError.className = "error"; //hide alert
		return true;
	}
}

function hideAlert(){
	alert.innerHTML = "";
	alert.className = "alert"; //hide alert at top of page
}

emailField.addEventListener("input", emailCheck);

forgotPasswordForm.addEventListener("submit", function(event){ //TODO change how data is sent to encrypt password and whatnot
	event.preventDefault(); //form is submitted through ajax, so prevent the button from reloading the page
	if(!emailCheck()){
		return;
	}
	$.ajax({ //send ajax request
		type: "POST",
		url: "/forgotPassword", //send request to url /forgotPassword
		data: $("#forgotPasswordForm").serialize(), //convert data from form into json/xml (not sure which)
		success: function(data){
			if(data=="Success"){
				alert.innerHTML = "Please check your inbox for a password reset email. <button type=\"button\" class=\"close\" onclick=\"hideAlert();\"><span>&times;</span></button>";
				alert.className = "alert-success alert active"; //show alert
			}else{
				alert.innerHTML = data+"<button type=\"button\" class=\"close\" onclick=\"hideAlert();\"><span>&times;</span></button>";
				alert.className = "alert-danger alert active"; //show alert
			}
		}
	});
});
