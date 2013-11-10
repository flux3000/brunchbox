var _myresults = [];
var _jObject={};


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

	

	if(!data.businesses.length==0) {
		for (var i = 0; i < data.businesses.length; i++) {
			var this_result = [];
			this_result["name"] = data.businesses[i]["name"];
		    this_result["rating"] = data.businesses[i]["rating"];
		    this_result["distance"] = ((data.businesses[i]["distance"]) * 0.000621371).toFixed(2);
		    _myresults.push(this_result);
		    
		}

		// sort results by distance, lowest first
		_myresults.sort(function(a,b) {
		  return parseFloat(a.distance,10) - parseFloat(b.distance,10);
		});
		console.log(_myresults);

		for (var j = 0; j < _myresults.length; j++) {
			$("#business-results").append('<li>'+(j+1)+'. '+_myresults[j]["name"]+' - Distance: '+_myresults[j]["distance"]+' Miles - Avg Rating: '+_myresults[j]["rating"]+'</li>');
		}



	}
}

function init() {
	createJsonResponse();
	var diameter = 960,
    format = d3.format(",d"),
    color = d3.scale.category20c();

	var bubble = d3.layout.pack()
    .sort(null)
    .size([diameter, diameter])
    .padding(1.5);

	var svg = d3.select("body").append("svg")
    .attr("width", diameter)
    .attr("height", diameter)
    .attr("class", "bubble");

d3.json(_jObject, function(error, root) {
  var node = svg.selectAll(".node")
      .data(bubble.nodes(classes(root))
      .filter(function(d) 
      	{ 
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
    if (node.name) node.name.forEach(function(child) { recurse(node.name, child); });
    else classes.push({packageName: name, className: node.name, value: node.distance});
  }

  recurse(null, root);
  return {name: classes};
	}

d3.select(self.frameElement).style("height", diameter + "px");



}
function createJsonResponse(){
	//creating a json object

    	
    	for(i in _myresults)
    	{
        _jObject[i] = _myresults[i];
    	}
    	console.log("JSON object" + _jObject);
    	_jObject = JSON.stringify(_jObject);
}

