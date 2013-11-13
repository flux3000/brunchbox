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

            // get human-readable address from the lat/long coordinates using Google's reverse geocoding API
            codeLatLng(mylat, mylong)

            //google.maps.event.addDomListener(window, 'load', mapsInitialize(mylatlong[0], mylatlong[1], "map-canvas"));    
			       
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
		if (mylat == '') {
			console.log("lat/long not set - using default of South Hall, UC Berkeley");			
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
			    console.log(mybusinesses);			    
			    returnBusinesses(mybusinesses);

			  }
		    });
		  }
	    });
	});

});


function createChart(businesses) {

	// set up the svg 	
	var w = 900
	var h = 400
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
    	thisBusiness.display_address = businesses[i]["display_address"];
    	thisBusiness.image_url = businesses[i]["image_url"];
    	thisBusiness.rating_img_url = businesses[i]["rating_img_url"];
    	thisBusiness.rating_img_url_small = businesses[i]["rating_img_url_small"];
    	thisBusiness.url = businesses[i]["url"];


    	console.log(thisBusiness);

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

    	thisBusiness.radius = (24 - thisBusiness.distance*3.5);

    	// Calculate circle color - based on rating
    	var hue = Math.floor(thisBusiness.rating * 270 / 5);
    	var multiplier = Math.pow((5 - thisBusiness.rating),2);
    	var intensity = (100 - (Math.round(multiplier * 2)/2) * 10);
    	var bright = 50 + ((Math.pow(multiplier,2) * 2.75));
    	thisBusiness.color = "hsla(" + hue + ", " + intensity + "%, " + bright + "%, 1)";

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
		.attr("street_address", function (d) { return d.street_address; })
		.attr("city_state_zip", function (d) { return d.city_state_zip; })
		.attr("image_url", function (d) { return d.image_url; })
		.attr("rating", function (d) { return d.rating; })
		.attr("rating_img_url", function (d) { return d.rating_img_url; })
		.attr("rating_img_url_small", function (d) { return d.rating_img_url_small; })
		.attr("url", function (d) { return d.url; })
		.attr("class", "circle")
		.style("fill", function(d) { return d.color; })
		.on("mouseenter", function(d) {

			d3.select(this)
				.transition().duration(200)
				.attr("r", d.radius+10)
				.attr("opacity", .6);
				$("#business-popup")
					.css({
						"left": $(this).position().left + 30,
						"top": $(this).position().top - 125,
						//"height":150
					})
					// TO-DO - Enrich the text that is being returned in the pop-up
					.html('<div class="img"><img src="' + $(this).attr("image_url") + '"></div><div class="text"><div class="name">'+ $(this).attr("name")+'</div><div class="description"><span class="glyphicon glyphicon-map-marker"></span>'+$(this).attr("distance")+' miles away'+'<br/><img src="'+$(this).attr("rating_img_url")+'" alt="'+$(this).attr("rating")+ ' Stars"></div></div>')
					.fadeIn(300);			
			})
						
		.on("mouseleave", function(d) {
				d3.select(this)
					.transition().duration(200)
					.attr("r", d.radius)
					.attr("opacity", 1);
					$("#business-popup").fadeOut(50);
			})

		.on("click", function(d) {
			window.open($(this).attr("url"));
			});

	circles.append("image")
	  .attr("xlink:href", "https://github.com/favicon.ico")
	  .attr("x", -8)
	  .attr("y", -8)
	  .attr("width", 16)
	  .attr("height", 16);
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
		    this_result["display_address"] = businesses[i]["location"]["display_address"];
		    this_result["image_url"] = businesses[i]["image_url"];
		    this_result["rating_img_url"] = businesses[i]["rating_img_url"];
		    this_result["rating_img_url_small"] = businesses[i]["rating_img_url_small"];
		    this_result["url"] = businesses[i]["url"];

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
		$("#business-results").append('<li><a href="'+myresults[j]["url"]+'"><span class="glyphicon glyphicon-cutlery"></span> <span style="font-weight:bold;">'+myresults[j]["name"]+'</span> <img style="padding:0px 4px;" src="'+myresults[j]["rating_img_url_small"]+'"> Distance: '+myresults[j]["distance"]+' Miles</a></li>');

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

// google geolocation code - to get address from lat/long coordinates
var geocoder;
var myaddress;
function codeLatLng(mylat, mylong) {
    geocoder = new google.maps.Geocoder();
    var latlng = new google.maps.LatLng(mylat, mylong);
    geocoder.geocode({'latLng': latlng}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            if (results[0]) {
                myaddress = results[0].formatted_address;
                $("#myaddress").html("Your (approximate) location:<br><span style='font-weight:bold;'>" + myaddress + "</span>");
            }
        } else {
            $("#myaddress").html("Your coordinates:<br><span style='font-weight:bold;'>" + mylat + ", " + mylong + "</span>");
        }
    });
}

