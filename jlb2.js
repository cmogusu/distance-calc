var directionsService, geocoder
var places = {
    pickUp : {
        placeId : '',
        element : '',
    },
    dropOff : {
        placeId : '',
        element : '',
    }
}
var totalDistance = 0


function initMap() {
    places.pickUp.element = document.getElementById('pick_up')
    places.dropOff.element = document.getElementById('drop_off')

    geocoder = new google.maps.Geocoder
    directionsService = new google.maps.DirectionsService;

    addAutocompleteToInputs()
    setUserCurrentLocation()
    tieInputEvents()
}


function addAutocompleteToInputs(){
    var options = { geocode : true }
    var autocompletes = [
        new google.maps.places.Autocomplete( places.pickUp.element, options ),
        new google.maps.places.Autocomplete( places.dropOff.element, options )
    ];

    
    autocompletes.map(function(autocomplete, index){
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

            // Reposition map and send request on directions
            if( otherPlace.placeId ){
                getDirections()
            }
        })
    })
}


function getDirections(){
    directionsService.route({
        origin : { placeId : places.pickUp.placeId },
        destination : { placeId : places.dropOff.placeId },
        travelMode : google.maps.TravelMode.DRIVING,
    },( results, status )=>{
        if( status!==google.maps.DirectionsStatus.OK ){
            return false;
        }


        // display directions
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
    var userLocationIcons = Array.from( document.querySelectorAll('.location-icon') )

    if( !navigator.geolocation ){    
        userLocationIcons.map( function(element){ element.style.display = 'none' })
        return false;
    }

    var handleClick = function(event){
        var place = event.currentTarget.getAttribute('data-location')

        navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            }

            // Get address of user location
            reverseGeocode( position.coords.latitude, position.coords.longitude, place )

        }, function() {
            google.maps.event.clearListeners( event.currentTarget, 'click', handleClick)
            event.target.style.display = 'none'
        });
    }
    
    userLocationIcons.map( function( element ){
        google.maps.event.addDomListener( element, 'click', handleClick )
    })
}


function reverseGeocode( lat, lng, place ){
    var otherPlace = place=='pickUp' ? 'dropOff' : 'pickUp';

    geocoder.geocode({
        location : { lat, lng },
    }, function(results, status){
        if( status!=='OK' ){
            console.log('reverse geocoding failed')
            return;
        }

        if( results[0] ){
            places[place].placeId = results[0].place_id
            places[place].element.value = results[0].formatted_address
            addClass( places[place].element.parentElement, 'brk-form-wrap-active' )
        }

        // Get directions if other marker is already set
        if( places[otherPlace].placeId ){
            getDirections()
        }
    })
}


function tieInputEvents(){
    var onFocus = function(event){
        addClass( event.currentTarget.parentElement, 'brk-form-wrap-active' )
    }
    var onBlur = function(event){
        if( !event.target.value ){
            removeClass( event.currentTarget.parentElement, 'brk-form-wrap-active' );
        }
    }
    google.maps.event.addDomListener( places.pickUp.element, 'focus', onFocus )
    google.maps.event.addDomListener( places.pickUp.element, 'blur', onBlur )
    google.maps.event.addDomListener( places.dropOff.element, 'focus', onFocus )
    google.maps.event.addDomListener( places.dropOff.element, 'blur', onBlur )
}

function addClass( el, className ){
    if( !el || !className ){
        return false;
    }

    if ( el.classList && el.classList.add ){
        el.classList.add(className);
    }
    else if( el.className ){
        el.className += ' ' + className;
    }
};

function removeClass( el, className){
    if( !el || !className ){
        return false;
    }

    if ( el.classList && el.classList.remove ){
        el.classList.remove(className);
    }else if( el.className && className.split ){
        el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }
};