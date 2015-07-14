var Utilities = {

	ajaxRequest: function() {
		
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
	},

	numberFormat: function(x) {
		x = x.toFixed(2) 
		return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	},

	formatInput: function(x) {	

		//remove pound sign
		x = x.replace(/\u00A3/g, '');

		// remove whitespace
		x = x.replace(/\s+/g,'');

		return x;
	}
};

var Master = {

	// select elements to modify
	pageTitle: document.getElementById('page-title'),
	mainHeading: document.getElementById('main-heading'),
	story: document.getElementById('story'),
	totalPledged: document.getElementById('total-pledged'),
	target: document.getElementById('target'),
	ownerName: document.getElementById('owner-name'),
	percentPledged: document.getElementById('percent-pledged'),
	progressBar: document.getElementById('progress-bar'),
	pledgeForm: document.getElementById('pledge-form'),
	errorContainer: document.getElementById('error-container'),

	// message text
	completeMsg: 'We have reached the target!<br>Thank you for your pledges.',			
	thankYouMsg: 'Thanks for your pledge!',
	pledgeErrorMsg: 'Sorry, something went wrong<br>your pledge was not subitted.',
	validationErrorMsg: 'Please enter a number',
	pledgeErrorMsg: 'Sorry, something went wrong.',	

	bindSubmit: function(jsonTotal, jsonTarget) {

		// when pledge submitted validate form input and post pledge to database
		Master.pledgeForm.addEventListener('submit', function(e){

			e.preventDefault();   				 				  		

			var amount = Master.pledgeForm.elements['pledge-amount'].value;

			// clear previous error message
		  	Master.errorContainer.innerHTML = '';

		  	// Format input
		  	amount = Utilities.formatInput(amount);

		  	// check if not empty or not a number
		  	if ( !amount || isNaN(amount) ) {
			  	Master.errorContainer.innerHTML = '<span class="error-message">' + Master.validationErrorMsg + '</span>';
			}
		  	else {

		  		var newTotal = Number(amount) + Number(jsonTotal);
		  		console.log(newTotal);

		  		// handle case where pledge exceeds target
		  		if (newTotal > jsonTarget) {

		  			var remaining = Number(jsonTarget) - Number(jsonTotal);

		  			Master.errorContainer.innerHTML = '<span class="error-message">We only need £' + remaining + ' to reach the target<br>Would you like to pledge that instead?</span>';
		  			Master.pledgeForm.elements['pledge-amount'].value = remaining;
		  		}
		  		else {
		  			Master.postPledge(amount);
		  		}

		  	}  	

		});
	},

	getContent: function() {

		var mygetrequest = new Utilities.ajaxRequest();
		mygetrequest.onreadystatechange = populatePage;
		mygetrequest.open('GET', '/api/crowdFundingPage' + "?" + (new Date()).getTime(), true); // date and time to avoid caching
		mygetrequest.send(null);

		function populatePage(){
			if (mygetrequest.readyState == 4){

				if (mygetrequest.status == 200 || window.location.href.indexOf('http') == -1){
		   			var jsondata = eval('('+mygetrequest.responseText+')') //retrieve result as a JavaScript object

					// populate page content
					Master.pageTitle.innerHTML = 'JustGiving - ' + jsondata.name;
					Master.mainHeading.innerHTML = jsondata.name;
					Master.story.innerHTML = jsondata.story;

					Master.totalPledged.innerHTML = '&pound;' + Utilities.numberFormat(jsondata.totalPledged);
					Master.target.innerHTML = 'pledged of <strong>&pound;' + Utilities.numberFormat(jsondata.target) + '</strong> funding target';
					Master.ownerName.innerHTML = jsondata.owner;

					// calculate percentage
					var percentPledgedValue = Math.floor((jsondata.totalPledged / jsondata.target) * 100);
					Master.percentPledged.innerHTML = percentPledgedValue + '&#37;';

					// update progress bar
					Master.progressBar.value = percentPledgedValue;

					// check if target has been reached
					if (jsondata.totalPledged >= jsondata.target) {
						Master.pledgeForm.className = Master.pledgeForm.className + ' success';
						Master.pledgeForm.innerHTML = '<span class="thank-you-message">' + Master.completeMsg + '</span>';
					}
					else {
						Master.bindSubmit(jsondata.totalPledged, jsondata.target);
					}

				}
				else{
					Master.errorContainer.innerHTML('<span class="error-message">' + Master.otherErrorMsg + '</span>')
				}
			}
		}
	},	

	init: function() {
		Master.getContent();
	},	

	postPledge: function(amount) {

		// post pledged amount to the server
		console.log('posting');

		var tries = 0;

		// add loading class to form
		var pledgeFormDefaultClass = Master.pledgeForm.className;
		Master.pledgeForm.className = Master.pledgeForm.className + ' loading';

		var mypostrequest = new Utilities.ajaxRequest();

		mypostrequest.onreadystatechange = pledgeResponse;
		mypostrequest.open('POST', '/api/pledge/' + encodeURIComponent(amount));
		mypostrequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		mypostrequest.send(encodeURIComponent(amount)); 

		function pledgeResponse() {

			if (mypostrequest.readyState === 4) {

				if (mypostrequest.status === 200) {
					
					console.log('post success');

					Master.pledgeForm.className = pledgeFormDefaultClass + ' success';
					Master.pledgeForm.innerHTML = '<span class="thank-you-message">' + Master.thankYouMsg + '</span>';

					// update page content
					Master.getContent();


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
					Master.pledgeForm.className = pledgeFormDefaultClass;					
					Master.errorContainer.innerHTML = '<span class="error-message">' + Master.pledgeErrorMsg + '</span>';
				}
			}		
		}
	}
			
} 


// window load
window.onload = function() {
	Master.init();
};
