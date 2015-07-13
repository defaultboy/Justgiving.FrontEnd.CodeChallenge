function numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// define type of ajax request
function ajaxRequest(){
	
	var activexmodes = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP'] // activeX versions to check for in ie
 	
 	if (window.ActiveXObject){ // test for support for activeXobject in ie first (as XMLHttpRequest doesn't work in ie7)
 			for (var i = 0; i < activexmodes.length; i++){
 				try{
 					return new ActiveXObject(activexmodes[i])
 					}
 				catch(e){
					// suppress error
					}
				}
		}

	else if (window.XMLHttpRequest){ // mozilla, safari etc
 		return new XMLHttpRequest()
	}
	
	else {
 		return false
	}
}

// post pledged amount to the server
function postPledge(amount) {

	console.log('posting');

	var tries = 0;

	// add loading class to form
	var pledgeFormDefaultClass = pledgeForm.className;
	pledgeForm.className = pledgeForm.className + ' loading';

	var mypostrequest = new ajaxRequest();

	mypostrequest.onreadystatechange = pledgeResponse;
	mypostrequest.open('POST', '/api/pledge/' + encodeURIComponent(amount));
	mypostrequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	mypostrequest.send(encodeURIComponent(amount)); 

	function pledgeResponse() {

		if (mypostrequest.readyState === 4) {

			if (mypostrequest.status === 200) {
				
				console.log('post success');

				pledgeForm.className = pledgeFormDefaultClass + ' success';
				pledgeForm.innerHTML = '<span class="thank-you-message">Thanks for your pledge!</span>';

				pledgeSuccess();


			} else if (mypostrequest.status === 500 && tries <= 10) {

				// if 500 error try again up to 10 times otherwise abandon in case there's a real server error
				tries ++;

				console.log('error 500 trying again ' + tries);
				mypostrequest.onreadystatechange = pledgeResponse;
				mypostrequest.open('POST', '/api/pledge/' + encodeURIComponent(amount));
				mypostrequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
				mypostrequest.send(encodeURIComponent(amount)); 				

			}

			else {
				pledgeForm.className = pledgeFormDefaultClass;					
				errorContainer.innerHTML = '<span class="error-message">Sorry, your pledge was not subitted.<br>Please try again.</span>';
			}
		}		
	}		
} 

// when pledge is successful update totals
function pledgeSuccess(){

	// update totals and progress bar
	var myupdaterequest = new ajaxRequest();
	myupdaterequest.onreadystatechange = updateTotals;
	myupdaterequest.open('GET', '/api/crowdFundingPage' + "?" + (new Date()).getTime(), true);
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
				errorContainer.innerHTML = '<span class="error-message">Sorry, something went wrong.</span>';
				}
		}
	}

}


// select elements to modify and store them as variables
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

// ajax call to get initial content
var mygetrequest = new ajaxRequest()
mygetrequest.onreadystatechange = populatePage;
mygetrequest.open('GET', '/api/crowdFundingPage' + "?" + (new Date()).getTime(), true); // date and time to avoid caching
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
		   percentPledged.innerHTML = percentPledgedValue + '&#37;';

		   // update progress bar
		   progressBar.value = percentPledgedValue;

		}
		else{
			errorContainer.innerHTML('<span class="error-message">Sorry, something went wrong.<br>Please try again.</span>')
		}
	}
}

// validate form input and post pledge to database
pledgeForm.addEventListener('submit', function(e){

	var amount = pledgeForm.elements['pledge-amount'].value;

	// clear previous error message if there was one
  	errorContainer.innerHTML = '';
	
	//remove pound sign
	amount = amount.replace(/\u00A3/g, '');

	// remove whitespace
	var amount = amount.replace(/\s+/g,'');	

  	// check if not empty or not a number
  	if( !amount || isNaN(amount) ) {
  		e.preventDefault();   		
  		errorContainer.innerHTML = '<span class="error-message">Please enter a number.</span>';
  	}
 	else {
  		postPledge(amount);
  	}

  e.preventDefault(); 

});