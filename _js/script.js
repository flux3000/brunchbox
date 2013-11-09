$(document).ready(function() {
	init();
 
    /////////// Geolocation stuff ///////////
    
    if (navigator.geolocation) {
        var options = {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        };

        function success(pos) {
          var crd = pos.coords;
          console.log('Your current position is:');
          console.log('Latitude : ' + crd.latitude);
          console.log('Longitude: ' + crd.longitude);
          console.log('More or less ' + crd.accuracy + ' meters.');

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
    }   

});

function init() {

}
