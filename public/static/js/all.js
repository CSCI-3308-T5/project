function submitSearch(){

}

function newStarRatingAndLink(v,n){
	return `<div class="row">
				<div class="col-7">
					<a class="fs-24px" href="/games/`+encodeURIComponent(v)+`">`+v+`</a>
				</div>
				<div class="col-5" style="min-width:200px; position:relative; left:-3.5%;">
					`+newStarRating(v,n)+`
				</div>
			</div>`;
}

function newStarRating(v,num){
	let s = "";
	for(var i = 5;i>0;i--){
		if(i==num)s+=`<input type="radio" id="star#`+v+`-`+num+`" name="GameName#`+v+`" value="`+num+`" checked />
					<label for="star#`+v+`-`+num+`" title="text"></label>`;
		else s+=`<input type="radio" id="star#`+v+`-`+num+`" name="GameName#`+v+`" value="`+num+`" />
				 <label for="star#`+v+`-`+num+`" title="text"></label>`;
	}
	return `<div class="rate" name="Game#`+v+`-" style="position:relative; left: 20%;">
				`+s+`
			</div>`;
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
