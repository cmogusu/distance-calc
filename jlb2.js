var markers = []
var map
var locations = []
var icons_array = []
var markersOnMap = {}

var map, directionsService, directionsRenderer, geocoder
var places = {
    pickUp : {
        placeId : '',
        marker : false,
        element : '',
    },
    dropOff : {
        placeId : '',
        marker : false,
        element : '',
    }
}
var totalDistance = 0
var removeMapListener = false


function initMap() {
    places.pickUp.element = document.getElementById('pick_up')
    places.dropOff.element = document.getElementById('drop_off')

    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: new google.maps.LatLng(40.701896845000306, -73.90824226899952),
        //center: new google.maps.LatLng(20.9176265, -100.7446703),
        mapTypeId: 'terrain'
    });
    
    geocoder = new google.maps.Geocoder
    directionsService = new google.maps.DirectionsService;
    directionsRenderer = new google.maps.DirectionsRenderer({
        draggable: true,
        map:map,
    })

    addAutocompleteToInputs()
    addMapClickListener()
    setUserCurrentLocation();
}


function addAutocompleteToInputs(){
    var options = { geocode : true }
    var autocompletes = [
        new google.maps.places.Autocomplete( places.pickUp.element, options ),
        new google.maps.places.Autocomplete( places.dropOff.element, options )
    ];

    
    autocompletes.map(function(autocomplete, index){
        // Set fields that we would like to retrieve
        autocomplete.setFields(['place_id','geometry'])

        // Attach listeners when a location is selected
        autocomplete.addListener('place_changed',function(){
            var autocompletedPlace = autocomplete.getPlace();

            if( !autocompletedPlace.place_id || !autocompletedPlace.geometry ){
                return false;
            }


            var currentPlace = places[ index==0 ? 'pickUp' : 'dropOff' ]
            var otherPlace = places[index!=0 ? 'pickUp' : 'dropOff']
            currentPlace.placeId = autocompletedPlace.place_id

            // Add marker if it was not set before, and then reposition it
            if( !currentPlace.marker ){
                currentPlace.marker = new google.maps.Marker({
                    draggable:true,
                    label : {
                        color : '#fff',
                        text : index==0 ? 'A' : 'B',
                    }
                });
                currentPlace.marker.setMap(map)
            }

            currentPlace.marker.setPosition(autocompletedPlace.geometry.location)

            // Reposition map and send request on directions
            if( otherPlace.marker ){
                removeMapListener.remove()
                getDirections()
            }else{
                map.panTo( autocompletedPlace.geometry.location )
            }
        })
    })
}


function getDirections(){
    directionsService.route({
        origin : places.pickUp.marker.getPosition(),
        destination : places.dropOff.marker.getPosition(),
        travelMode : google.maps.TravelMode.DRIVING,
    },( results, status )=>{
        if( status!==google.maps.DirectionsStatus.OK ){
            return false;
        }

        // Remove original markers
        places.pickUp.marker.setMap(null)
        places.dropOff.marker.setMap(null)

        // display directions
        directionsRenderer.setDirections(results);

        totalDistance = results.routes.reduce( function(distance, route){
            return distance + route.legs.reduce(function( innerDistance, leg){
                return innerDistance + leg.distance.value;
            },0)
        },0)

        var costPerMile = 2.5;
        var cost = Math.round( totalDistance/16.09344*costPerMile )/100;
        var miles = Math.round( totalDistance/160.9344 )/10

        jQuery('.total-distance').val( miles + ' miles' ).parent().addClass('brk-form-wrap-active')
        jQuery('.total-cost').val( '$' + cost ).parent().addClass('brk-form-wrap-active')

    })
}


function setUserCurrentLocation(){
    var userLocationIcons = jQuery('.location-icon')

    if( !navigator.geolocation ){    
        userLocationIcons.remove()
    }

    
    userLocationIcons.on('click',function(){
        var place = $(this).attr('data-location')
        var otherPlace = place=='pickUp' ? 'dropOff' : 'pickUp';

        navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            }

            if( !places[place].marker ){
                places[place].marker = new google.maps.Marker({
                    draggable:true,
                    label : {
                        color : '#fff',
                        text : place=='pickUp' ? 'A' : 'B',
                    }
                });

                places[place].marker.setMap( map )
            }

            
            places[place].marker.setPosition( pos )

            // Get address of user location
            reverseGeocode( position.coords.latitude, position.coords.longitude, place )

            // Get directions if other marker is already set
            if( places[otherPlace].marker ){
                getDirections()
            }else{
                map.panTo(pos)
            }

        }, function() {
            userLocationIcons.off('click').remove();
        });
    })
}


function addMapClickListener(){
    removeMapListener = map.addListener('click',function(event){
        var place
        var otherPlace

        if( !places.pickUp.marker ){
            place = 'pickUp'
            otherPlace = 'dropOff'
        }else if( !places.dropOff.marker ){
            place = 'dropOff'
            otherPlace = 'pickUp'
        }else{
            removeMapListener && removeMapListener.remove()
            return false;
        }

        // get address from marked location 
        reverseGeocode( event.latLng.lat(), event.latLng.lng(), place )

        // add markers to map
        places[place].marker = new google.maps.Marker({
            draggable:true,
            label : {
                color : '#fff',
                text : place=='pickUp' ? 'A' : 'B',
            }
        });

        places[place].marker.setMap( map )
        places[place].marker.setPosition( event.latLng )

        if( places[otherPlace].marker ){
            getDirections()
        }
    })
}


function reverseGeocode( lat, lng, place ){
    geocoder.geocode({
        location : { lat, lng },
    }, function(results, status){
        if( status!=='OK' ){
            console.log('reverse geocoding failed')
            return;
        }

        if( results[0] ){
            jQuery( places[place].element ).val( results[0].formatted_address ).parent().addClass('brk-form-wrap-active');
            
        }
    })
}

        
function calculateAndDisplayRoute(directionsService, directionsDisplay,location_car) {
    /*var origin = "San Fernando de Apure, Apure, Venezuela"
    var destination = 'San Juan de Payara, Apure, Venezuela'*/

    destination = document.getElementById('pick_up').value
    if(destination!=''){
        directionsService.route({
            origin: location_car,//document.getElementById('start').value,
            destination: destination,// document.getElementById('end').value,
            travelMode: 'DRIVING'
        }, function(response, status) {
            console.log(response)
            if (status === 'OK') {
                directionsDisplay.setDirections(response);
            } else {
                window.alert('Directions request failed due to ' + status);
            }
        });
    }
}


jQuery(function($){
    $('#pick_up,#drop_off').on('focus',function(){
        $(this).parent().addClass('brk-form-wrap-active')
    }).on('blur',function(){
        if( !$(this).val() ){
            $(this).parent().removeClass('brk-form-wrap-active')
        }
    })
})
