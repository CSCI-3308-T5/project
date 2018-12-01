function submitSearch(){

}

function newStarRatingAndLink(v,n){
	return `<div class="flex-justify"><a class="fs-24px" href="/games/`+encodeURIComponent(v)+`">`+v+`</a>`+newStarRating(v,n)+`</div>`;
}

function newStarRating(v,num){
	let s = "";
	for(var i = 5;i>0;i--){
		if(i==num)s+=`<input type="radio" id="star#`+v+`-`+i+`" name="GameName#`+v+`" value="`+i+`" checked /><label for="star#`+v+`-`+i+`" title="text"></label>`;
		else s+=`<input type="radio" id="star#`+v+`-`+i+`" name="GameName#`+v+`" value="`+i+`" /><label for="star#`+v+`-`+i+`" title="text"></label>`;
	}
	return `<div class="rate" id="Game#`+v+`">`+s+`</div>`;
}

function showAlert(msg){
	document.getElementById("alert").innerHTML = msg+"<button type=\"button\" class=\"close\" onclick=\"hideAlert();\"><span>&times;</span></button>";
	document.getElementById("alert").className = "alert-danger alert active"; //show alert
}

function showAlertSuccess(msg){
	document.getElementById("alert").innerHTML = msg+"<button type=\"button\" class=\"close\" onclick=\"hideAlert();\"><span>&times;</span></button>";
	document.getElementById("alert").className = "alert-success alert active"; //show alert
}

function hideAlert(){
	document.getElementById("alert").innerHTML = "";
	document.getElementById("alert").className = "alert"; //hide alert at top of page
}
