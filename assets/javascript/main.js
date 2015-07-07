function ajaxRequest(){
 var activexmodes = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP'] //activeX versions to check for in IE
 if (window.ActiveXObject){ //Test for support for ActiveXObject in IE first (as XMLHttpRequest in IE7 is broken)
 	for (var i = 0; i < activexmodes.length; i++){
 		try{
 			return new ActiveXObject(activexmodes[i])
 		}
 		catch(e){
			//suppress error
		}
	}
}
 else if (window.XMLHttpRequest) // if Mozilla, Safari etc
 	return new XMLHttpRequest()
 else
 	return false
}

var mygetrequest = new ajaxRequest()
mygetrequest.onreadystatechange = populatePage;
mygetrequest.open('GET', '/api/crowdFundingPage', true);
mygetrequest.send(null);

function populatePage(){
	if (mygetrequest.readyState == 4){

		if (mygetrequest.status == 200 || window.location.href.indexOf('http') == -1){
   		var jsondata = eval('('+mygetrequest.responseText+')') //retrieve result as a JavaScript object
   
		   // populate page content
		   document.getElementById('page-title').innerHTML = 'JustGiving - ' + jsondata.name;
		   document.getElementById('main-heading').innerHTML = jsondata.name;
		   document.getElementById('story').innerHTML = jsondata.story;
		   document.getElementById('total-pledged').innerHTML = '&pound;' + jsondata.totalPledged;
		   document.getElementById('target').innerHTML = 'pledged of <strong>&pound;' + jsondata.target + '</strong> funding target';
		   document.getElementById('owner-name').innerHTML = jsondata.owner;

		   // calculate percentage
		   var percentPledged = Math.floor((jsondata.totalPledged / jsondata.target) * 100);
		   document.getElementById('percent-pledged').innerHTML = percentPledged + '%';

		   // update progress bar
		   document.getElementById('progress-bar').value = percentPledged;

		}
		else{
			alert('Sorry there appears to have been an error. Please try again by refreshing the page.')
			}
	}
}

// update progress bar and pledged amount after new pledge is submitted
function updateProgress(){
	if (mygetrequest.readyState == 4){

		if (mygetrequest.status == 200 || window.location.href.indexOf('http') == -1){
   		var jsondata = eval('('+mygetrequest.responseText+')') //retrieve result as a JavaScript object

	   /* update total */
	   document.getElementById('total-pledged').innerHTML = '&pound;' + jsondata.totalPledged;

	   // calculate percentage
	   var percentPledged = Math.floor((jsondata.totalPledged / jsondata.target) * 100);
	   document.getElementById('percent-pledged').innerHTML = percentPledged + '%';

	   // update progress bar
	   document.getElementById('progress-bar').value = percentPledged;

		}
		else{
			alert('An error has occured making the request')
		}
	}
}

// post pledged amount to the server
function postPledge(pledgeForm, amount) {

	console.log('posting');

	// add loading class to form
	pledgeForm.className = pledgeForm.className + " loading";

	var mypostrequest = new ajaxRequest();

	mypostrequest.onreadystatechange = pledgeResponse;
	mypostrequest.open('POST', '/api/pledge/' + encodeURIComponent(amount));
	mypostrequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	mypostrequest.send(encodeURIComponent(amount)); 

	function pledgeResponse() {
		console.log('pledgeResponse');

		if (mypostrequest.readyState === 4) {
			console.log(mypostrequest.status);

			if (mypostrequest.status === 200) {
				console.log('thank you');

				pledgeForm.className = pledgeForm.className + ' success';
				pledgeForm.innerHTML = '<span class="thank-you-message">Thanks for your pledge!</span>';

				var mygetrequest = new ajaxRequest();
				mygetrequest.onreadystatechange = updateProgress;
				mygetrequest.open('GET', '/api/crowdFundingPage');
				mygetrequest.send(null);

			} else {
				alert('There was a problem with the request.');
			}
		}		
	}

} 

// validate form abd post pledge to database
var pledgeForm = document.getElementById('pledge-form'); 

pledgeForm.addEventListener('submit', function(e){

	var amount = pledgeForm.elements['pledge-amount'].value;

  // validate input
  if( amount != '') {

  	postPledge(pledgeForm, amount);

  }
  else {
  	alert('please enter a number');
  }

  e.preventDefault(); 

});


// update funding totals


// init everything
window.onload = function(e){ 
	console.log('window loaded');
}