// select elements to modify
var pageTitle = document.getElementById('page-title'),
mainHeading = document.getElementById('main-heading'),
story = document.getElementById('story'),
totalPledged = document.getElementById('total-pledged'),
target = document.getElementById('target'),
ownerName = document.getElementById('owner-name'),
percentPledged = document.getElementById('percent-pledged'),
progressBar	= document.getElementById('progress-bar'),
pledgeForm = document.getElementById('pledge-form'),
errorContainer = document.getElementById('error-container'); 

function numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function ajaxRequest(){
 var activexmodes = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP'] //activeX versions to check for in IE
 if (window.ActiveXObject){ //test for support for ActiveXObject in IE first (as XMLHttpRequest in IE7 is broken)
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
		   pageTitle.innerHTML = 'JustGiving - ' + jsondata.name;
		   mainHeading.innerHTML = jsondata.name;
		   story.innerHTML = jsondata.story;

		   var jsonTotalPledged = jsondata.totalPledged.toFixed(2);

		   totalPledged.innerHTML = '&pound;' + numberWithCommas(jsonTotalPledged);
		   target.innerHTML = 'pledged of <strong>&pound;' + numberWithCommas(jsondata.target) + '</strong> funding target';
		   ownerName.innerHTML = jsondata.owner;

		   // calculate percentage
		   var percentPledgedValue = Math.floor((jsondata.totalPledged / jsondata.target) * 100);
		   percentPledged.innerHTML = percentPledgedValue + '%';

		   // update progress bar
		   progressBar.value = percentPledgedValue;

		}
		else{
			errorContainer.innerHTML('<span class="error-message">Sorry, something went wrong.<br>Please try again.</span>')
		}
	}
}

// post pledged amount to the server
function postPledge(pledgeForm, amount) {

	console.log('posting');

	// add loading class to form
	var pledgeFormDefaultClass = pledgeForm.className;
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
				console.log('post success');

				pledgeForm.className = pledgeFormDefaultClass + ' success';
				pledgeForm.innerHTML = '<span class="thank-you-message">Thanks for your pledge!</span>';

				// update totals and progress bar
				var myupdaterequest = new ajaxRequest()
				myupdaterequest.onreadystatechange = updateTotals;
				myupdaterequest.open('GET', '/api/crowdFundingPage', true);
				myupdaterequest.send(null);

				function updateTotals(){
					if (myupdaterequest.readyState == 4){

						if (myupdaterequest.status == 200 || window.location.href.indexOf('http') == -1){
   							var jsondata = eval('('+myupdaterequest.responseText+')') //retrieve result as a JavaScript object

							// populate page content
							var jsonTotalPledged = jsondata.totalPledged.toFixed(2);

							totalPledged.innerHTML = '&pound;' + numberWithCommas(jsonTotalPledged);

							// calculate percentage
							var percentPledgedValue = Math.floor((jsondata.totalPledged / jsondata.target) * 100);
							percentPledged.innerHTML = percentPledgedValue + '%';

							// update progress bar
							progressBar.value = percentPledgedValue;

						}
						else{
							// handle 500 error here
							errorContainer.innerHTML = '<span class="error-message">Sorry, something went wrong submitting your pledge.<br />Please try again.</span>';
							}
					}
				}

			} else {
				pledgeForm.className = pledgeFormDefaultClass;
				errorContainer.innerHTML = '<span class="error-message">Sorry, something went wrong submitting your pledge.<br />Please try again.</span>';
			}
		}		
	}
} 

// validate form abd post pledge to database
pledgeForm.addEventListener('submit', function(e){

	var amount = pledgeForm.elements['pledge-amount'].value;
	
	//remove pound sign
	amount = amount.replace(/\u00A3/g, '');

  	// check if not null empty or not a number
  	if( !amount || isNaN(amount) ) {
  		e.preventDefault();   		
  		errorContainer.innerHTML = '<span class="error-message">Please enter a number.</span>';
  	}
 	else {
  		postPledge(pledgeForm, amount);
  	}

  e.preventDefault(); 

});


// init everything
window.onload = function(e){ 
	console.log('window loaded');
}