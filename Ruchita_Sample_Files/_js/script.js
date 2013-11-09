$(document).ready(function() {
	init();
    //Geolocation

    // try to get user's geo-location
    if (navigator.geolocation) {
        console.log("inside navigator.geolocation function");
        // geolocation code
        navigator.geolocation.getCurrentPosition(success, error);
    
        // success function
        function success(pos) 
        {

            var mapLat = pos.coords.latitude;
            console.log(mapLat);

            var mapLong = pos.coords.longitude;
            console.log(mapLong);
            google.maps.event.addDomListener(window, 'load', initialize(37.869154, -122.290768, "map-div"));
        };
    
        // error function
        function error() 
        {
            alert("error")
        };
    
    }

  console.log("map");
});

var map;
function initialize(lat, long, targetID) {
    var mapOptions = {
        zoom: 7,
        center: new google.maps.LatLng(lat, long),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById(targetID), mapOptions);
}

function init() {
  
}


