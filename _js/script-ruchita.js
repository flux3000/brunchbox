var _myresults = [];
var _jObject={};


$(document).ready(function() {
	
 
    /////////// Geolocation stuff ///////////
    var mylat;
    var mylong;

    if (navigator.geolocation) {
        var options = {
			enableHighAccuracy: true,
			timeout: 5000,
			maximumAge: 0
        };

		function success(pos) {
			var crd = pos.coords;
			
			
			mylat = crd.latitude;
			mylong = crd.longitude;
			mylatlong = [mylat, mylong];
			       

			$("#mylatlong").html(mylat + ", " + mylong);
			google.maps.event.addDomListener(window, 'load', mapsInitialize(mylatlong[0], mylatlong[1], "map-canvas"));    
			       
        };

        function error(err) {
          console.warn('ERROR(' + err.code + '): ' + err.message);
        };       

        navigator.geolocation.getCurrentPosition(success,error,options);       
    }  

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

		//TEST VARIABLES - SOUTH HALL			
		//mylat = 37.8713;
		//mylong = -122.2585;

		//TEST VARIABLES - NASHVILLE HOUSE
		//mylat = 36.127042;
		//mylong = -86.813706;

		var distance;
		if ($(this).hasClass("radius-1")) {
			distance = 1609; // 1 mile
		} else if ($(this).hasClass("radius-3")) {
	    	distance = 4828; // 3 miles
		} else if ($(this).hasClass("radius-5")) {
	    	distance = 8046; // 5 miles
	    } else {	    	
	    	console.log("ERROR: DISTANCE NOT SET");
	    }
	    //var distance = 40000; // testing

		var accessor = {
		  consumerSecret: auth.consumerSecret,
		  tokenSecret: auth.accessTokenSecret
		};

		parameters = [];

		parameters.push(['ll', mylat+','+mylong]);
		parameters.push(['radius_filter', distance]);
		parameters.push(['category_filter', "breakfast_brunch"]);
		parameters.push(['sort', 2]); // 1=distance, 2=highest rating

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

		OAuth.setTimestampAndNonce(message);
		OAuth.SignatureMethod.sign(message, accessor);

		var parameterMap = OAuth.getParameterMap(message.parameters);
		parameterMap.oauth_signature = OAuth.percentEncode(parameterMap.oauth_signature)

		$.ajax({
		  'url': message.action,
		  'data': parameterMap,
		  'cache': true,
		  'async': true,
		  'dataType': 'jsonp',
		  'jsonpCallback': 'cb',
		  'success': function(data, textStats, XMLHttpRequest) {

		    // prepare the second call, for the next 20 results.
			parameters.push(['offset', 20]);
			parameters.push(['limit', 20]);

			OAuth.setTimestampAndNonce(message);
			OAuth.SignatureMethod.sign(message, accessor);

			var parameterMap = OAuth.getParameterMap(message.parameters);
			parameterMap.oauth_signature = OAuth.percentEncode(parameterMap.oauth_signature)

			$.ajax({
			  'url': message.action,
			  'data': parameterMap,
			  'cache': true,
			  'async': true,
			  'dataType': 'jsonp',
			  'jsonpCallback': 'cb',
			  'success': function(newdata, textStats, XMLHttpRequest) {
			    var mybusinesses = $.merge(data.businesses, newdata.businesses);
			    //console.log(mybusinesses);			    
			    returnBusinesses(mybusinesses);

			  }
		    });
		  }
	    });
init();

	});


});

function init() {
	createJsonResponse();
	var diameter = 960,
    format = d3.format(",d"),
    color = d3.scale.category20c();
    console.log("diameter"+ diameter);

	var bubble = d3.layout.pack()
    .sort(null)
    .size([diameter, diameter])
    .padding(1.5);
    console.log("bubble"+ bubble);

	var svg = d3.select("body").append("svg")
    .attr("width", diameter)
    .attr("height", diameter)
    .attr("class", "bubble");

d3.json(_jObject, function(error, root) {
	console.log("inside d3.json"+_jObject);
  var node = svg.selectAll(".node")
      .data(bubble.nodes(classes(root))
      .filter(function(d) 
      	{ 
      	console.log("d.name"+d.name);
      	return !d.name; 
      }))
    .enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) 
      	{ 
      		return "translate(" + d.x + "," + d.y + ")"; 
      	});

  node.append("title")
      .text(function(d) 
      { 
      	return d.name + ": " + format(d.value); 
      });

  node.append("circle")
      .attr("r", function(d) { return d.r; })
      .style("fill", function(d) { return color(d.packageName); });

  node.append("text")
      .attr("dy", ".3em")
      .style("text-anchor", "middle")
      .text(function(d) { return d.className.substring(0, d.r / 3); });
});

// Returns a flattened hierarchy containing all leaf nodes under the root.
function classes(root) {
  var classes = [];

  function recurse(name, node) {
    if (node.name) node.name.forEach(function(child) 
    	{ recurse(node.name, child); });
    else classes.push({packageName: name, className: node.name, value: node.distance});
  }

  recurse(null, root);
  console.log("classes"+ classes);
  return {name: classes};

	}

d3.select(self.frameElement).style("height", diameter + "px");



}
function createJsonResponse(){
	//creating a json object

    	console.log("inside createJSonResponse");
    	for(i in _myresults)
    	{
        _jObject[i] = _myresults[i];
    	}
    	console.log("JSON object" + _jObject);
    	_jObject = JSON.stringify(_jObject);
    	console.log("_jObject stringified"+_jObject);

}



function returnBusinesses(businesses) {
	//console.log(businesses);
	var myresults = [];
	if(!businesses.length==0) {
		for (var i = 0; i < businesses.length; i++) {
			var this_result = [];
			this_result["name"] = businesses[i]["name"];
		    this_result["rating"] = businesses[i]["rating"];
		    this_result["distance"] = ((businesses[i]["distance"]) * 0.000621371).toFixed(2);
		    myresults.push(this_result);
		}
	}
	showBusinesses(myresults);
}

function showBusinesses(myresults){
	// sort results by distance, lowest first
	var sort = 1; // Set to 0 to see how Yelp is ordering it
	if (sort){
		myresults.sort(function(a,b) {
		  return parseFloat(a.distance,10) - parseFloat(b.distance,10);
		});
	}

	for (var j = 0; j < myresults.length; j++) {
		$("#business-results").append('<li>'+(j+1)+'. '+myresults[j]["name"]+' - Distance: '+myresults[j]["distance"]+' Miles - Avg Rating: '+myresults[j]["rating"]+'</li>');
	}
	$("#business-results").append('<li>-----------------</li>');	
}


// google maps code
var map;
function mapsInitialize(lat, long, targetID) {
    var myLatlng = new google.maps.LatLng(lat, long);
    
    var mapOptions = {
    	zoom: 14,
    	center: myLatlng,
    	mapTypeId: google.maps.MapTypeId.ROADMAP   
    };
    
    map = new google.maps.Map(document.getElementById(targetID), mapOptions);
    
    var marker = new google.maps.Marker({
        position: myLatlng,
        map: map,
    });
}

