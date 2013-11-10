$(document).ready(function() {
	init();
 
    /////////// Geolocation stuff ///////////
    /*
    if (navigator.geolocation) {
        var options = {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        };

        function success(pos) {
          var crd = pos.coords;
          var mylat = crd.latitude;
          var mylong = crd.longitude;
          mylatlong = [mylat, mylong];

          $("#mylatlong").html(mylat + ", " + mylong);

          //google.maps.event.addDomListener(window, 'load', mapsInitialize(mylatlong[0], mylatlong[1], "map-me"));    
        
        };

        function error(err) {
          console.warn('ERROR(' + err.code + '): ' + err.message);
        };       

        navigator.geolocation.getCurrentPosition(success,error,options);       
    } */ 

    // Get Yelp Data
	$('.btn-primary').click(function() {

		$("#business-results").empty();

		var auth = { 
		  consumerKey: "jyd8C9Il7EuLc5XIJtNzbQ", 
		  consumerSecret: "IzSPxrZ_LZBaRCF7ayJCiZEBsCc",
		  accessToken: "GprEePHJEbPI7V0KG7cj9I1eOU-3iGGj",
		  // THIS TOKEN SECRET SHOULD BE OBFUSCATED SOMEHOW - EXTERNAL PHP?
		  accessTokenSecret: "3Lq3QINeY8H7lLcB1Bij9QBqhEY",
		  serviceProvider: { 
		    signatureMethod: "HMAC-SHA1"
		  }
		};

	    var testlat = 37.8621574;
	    var testlong = -122.25017369999999;
	    var distance = 4828; // 3 miles

		var accessor = {
		  consumerSecret: auth.consumerSecret,
		  tokenSecret: auth.accessTokenSecret
		};

		parameters = [];

		parameters.push(['ll', testlat+','+testlong]);
		parameters.push(['radius_filter', 4828]);
		parameters.push(['category_filter', "restaurants"]);
		parameters.push(['sort', 1]);

		parameters.push(['callback', 'cb']);
		parameters.push(['oauth_consumer_key', auth.consumerKey]);
		parameters.push(['oauth_consumer_secret', auth.consumerSecret]);
		parameters.push(['oauth_token', auth.accessToken]);
		parameters.push(['oauth_signature_method', 'HMAC-SHA1']);

		var message = { 
		  'action': 'http://api.yelp.com/v2/search',
		  'method': 'GET',
		  'parameters': parameters 
		};
		var firstparameters = parameters;
		console.log(firstparameters);

		OAuth.setTimestampAndNonce(message);
		OAuth.SignatureMethod.sign(message, accessor);

		var parameterMap = OAuth.getParameterMap(message.parameters);
		parameterMap.oauth_signature = OAuth.percentEncode(parameterMap.oauth_signature)

		$.ajax({
		  'url': message.action,
		  'data': parameterMap,
		  'cache': true,
		  'dataType': 'jsonp',
		  'jsonpCallback': 'cb',
		  'success': function(data, textStats, XMLHttpRequest) {
		    //console.log(data);
		    returnResults(data);
		  }
	    });

		parameters.push(['offset', 20]);
		parameters.push(['limit', 20]);

		var message = { 
		  'action': 'http://api.yelp.com/v2/search',
		  'method': 'GET',
		  'parameters': parameters 
		};
		var secondparameters = parameters;
		console.log(secondparameters);

		OAuth.setTimestampAndNonce(message);
		OAuth.SignatureMethod.sign(message, accessor);

		var parameterMap = OAuth.getParameterMap(message.parameters);
		parameterMap.oauth_signature = OAuth.percentEncode(parameterMap.oauth_signature)

		$.ajax({
		  'url': message.action,
		  'data': parameterMap,
		  'cache': true,
		  'dataType': 'jsonp',
		  'jsonpCallback': 'cb',
		  'success': function(data, textStats, XMLHttpRequest) {
		    //console.log(data);
		    returnResults(data);
		  }
	    });

	});

});

function returnResults(data) {

	var myresults = [];

	if(!data.businesses.length==0) {
		for (var i = 0; i < data.businesses.length; i++) {
			var this_result = [];
			this_result["name"] = data.businesses[i]["name"];
		    this_result["rating"] = data.businesses[i]["rating"];
		    this_result["distance"] = ((data.businesses[i]["distance"]) * 0.000621371).toFixed(2);
		    myresults.push(this_result);
		}

		// sort results by distance, lowest first
		myresults.sort(function(a,b) {
		  return parseFloat(a.distance,10) - parseFloat(b.distance,10);
		});
		console.log(myresults);

		for (var j = 0; j < myresults.length; j++) {
			$("#business-results").append('<li>'+(j+1)+'. '+myresults[j]["name"]+' - Distance: '+myresults[j]["distance"]+' Miles - Avg Rating: '+myresults[j]["rating"]+'</li>');
		}

	}
}

function init() {

}
