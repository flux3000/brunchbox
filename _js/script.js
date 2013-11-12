//var mybusinesses;

$(document).ready(function() {
	//init();

	$('#radius').change(function() {
		var rangeval = parseFloat($(this).val()).toFixed(1);
		$("#range-preview-text").html(rangeval);
	});

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
	$('.btn-primary').click(function(e) {
		e.preventDefault();
		$("#business-results").empty();
		$("#visualization").fadeOut().empty();

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
		if (mylat != '') {			
			mylat = 37.8713;
			mylong = -122.2585;
		}

		var distance_miles = $('#radius').val();
		var distance_meters = 1609.34 * distance_miles;

		var accessor = {
		  consumerSecret: auth.consumerSecret,
		  tokenSecret: auth.accessTokenSecret
		};

		parameters = [];

		parameters.push(['ll', mylat+','+mylong]);
		parameters.push(['radius_filter', distance_meters]);
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


	});



});

function init() {


}



function createChart(businesses) {


	// set up the svg 	
	var w = 900
	var h = 500
	var padding = 20

	var col_count = 10
	var row_count = 4
	//var col_width = (w-padding) / col_count
	//var row_height = (h-padding) / row_count
	var col_width = 80
	var row_height = 80

	//viz.attr("width", w).attr("height", h)

    // Make JSON
	myBusinesses = [];
	col_pos = 1;
	row_pos = 1;
    for (var i = 0; i < businesses.length; i++) {

    	thisBusiness = {};
    	thisBusiness.name = businesses[i]["name"];
    	thisBusiness.rating = businesses[i]["rating"];
    	thisBusiness.distance = businesses[i]["distance"];

    	// Assign column and row positions (x and y coords)
    	if (col_pos > col_count) { 
    		// after we reach col_count (e.g. 10), we will set col_pos back to 1 and increment row_pos.
    		col_pos = 1;
    		row_pos++;
    	} 
		thisBusiness.x_coord = (col_pos * col_width);
		thisBusiness.y_coord = (row_pos * row_height);
    	col_pos++;

    	// Calculate circle radius - based on distance

    	thisBusiness.radius = (24 - thisBusiness.distance*3);

    	// Calculate circle color - based on rating
    	var hue = Math.floor(thisBusiness.rating * 120 / 5);
    	thisBusiness.color = "hsla(" + hue + ", 100%, 50%, 1)";

    	myBusinesses.push(thisBusiness);

    }
	
	var svgContainer = d3.select("#visualization");
	svgContainer.attr("width", w).attr("height", h)

	var circles = svgContainer.append("g")
		.selectAll("circle")
		.data(myBusinesses)
		.enter()
		.append("circle");

	var circleAttributes = circles
		.attr("cx", function (d) { return d.x_coord; })
		.attr("cy", function (d) { return d.y_coord; })
		.attr("r", function (d) { return d.radius; })
		.attr("name", function (d) { return d.name; })
		.attr("distance", function (d) { return d.distance; })
		.attr("rating", function (d) { return d.rating; })
		.attr("class", "circle")
		.style("fill", function(d) { return d.color; })
		.on("mouseenter", function(d) {

				d3.select(this)
					.transition().duration(200)
					.attr("r", d.radius+10)
					.attr("opacity", .6);
					$("#business-popup")
						.css({
							"left": $(this).position().left + 20,
							"top": $(this).position().top - 100
						})
						// TO-DO - Enrich the text that is being returned in the pop-up
						.text($(this).attr("name")+" - "+$(this).attr("distance")+" miles away"+" - "+"Avg Rating: "+$(this).attr("rating")+" Stars")
						.fadeIn(50);
			})
						
		.on("mouseleave", function(d) {
				d3.select(this)
					.transition().duration(200)
					.attr("r", d.radius)
					.attr("opacity", 1);
					$("#business-popup").fadeOut(50);
			})

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

	// sort results by distance, lowest first
	var sort = 1; // Set to 0 to see how Yelp is ordering it
	if (sort){
		myresults.sort(function(a,b) {
		  return parseFloat(a.distance,10) - parseFloat(b.distance,10);
		});
	}

	showBusinesses(myresults);
	createChart(myresults);
	$("#visualization").fadeIn();
}

function showBusinesses(myresults){
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


