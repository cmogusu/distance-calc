<?php 
	$cost_per_mile = (isset($_GET['cost_per_mile']) && (float)$_GET['cost_per_mile']) ? (float)$_GET['cost_per_mile'] : 2.5;
?>

<!DOCTYPE html>
<html>
<head>
	<title>Maps Taxi</title>
	<link rel="stylesheet" type="text/css" href="https://jlblogistics.com/account/css/assets/bootstrap.css">
	<link rel="stylesheet" type="text/css" href="https://jlblogistics.com/account/css/skins/brk-blue.css">
	<link rel="stylesheet" type="text/css" href="https://jlblogistics.com/account/css/skins/brk-base-color.css">
	<link rel="stylesheet" type="text/css" href="https://jlblogistics.com/account/css/assets/styles.min.css">
	<link rel="stylesheet" type="text/css" href="https://jlblogistics.com/account/css/components/breadcrumbs.css">
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.0.13/css/all.css" integrity="sha384-DNOHZ68U8hZfKXOrtjWvjxusGo9WQnrNx2sqG0tfsghAvtVlRW3tvkXWZh58N9jp" crossorigin="anonymous">
</head>
<body>
	<style>
      html, body {
        height: 100%;
        margin: 0;
        padding: 0;
      }
      .form_collapsed{
        padding-top: 72px;
        height: 300px !important;
        overflow: hidden;
      }

      .form_open{
        width: auto !important;
        overflow: visible !important;
      }
      .jq-selectbox__dropdown{
        bottom: auto !important;
      }
      .location-icon{
        position: absolute;
        z-index: 4;
        top: 50%;
        right: 12px;
        cursor: pointer;
        color: rgba(var(--brk-dark-base-rgb),.4);
        -webkit-transform: translateY(0) scale(1);
        -ms-transform: translateY(0) scale(1);
        transform: translateY(0) scale(1);
        -webkit-transition: all 0.8s;
        -ms-transition: all 0.8s;
        transition: all 0.8s;
      }
      .brk-form-wrap-active .location-icon{
        -webkit-transform: translateY(-115%) scale(0.7);
            -ms-transform: translateY(-115%) scale(0.7);
                transform: translateY(-115%) scale(0.7);
      }

        input:disabled{
            background: #fff;
            width: 100%;
        }
    </style>
	
    
    <div id="form_test" class="form_open">
        <form class="brk-form-strict form_step" data-step="1">
            <div class="align-items-center">

                <div class="row">
                    <div class="col-sm-6">
                        <div class="brk-form-wrap">
                            <input type="text" class="brk-form-input-transparent quote_form_map rendered" name="pick_up" id="pick_up" data-module_id="" placeholder="" autocomplete="off">
                            <label class="input-label" for="pick_up">Pick up Location</label>
                            <span class="icon-before location-icon" data-location="pickUp" title="Use my current location"><i class="fa fa-map-marker-alt" aria-hidden="true"></i></span>
                        </div>
                    </div>
                    <div class="col-sm-6">
                        <div class="brk-form-wrap">
                            <input type="text" class="brk-form-input-transparent quote_form_map rendered" name="drop_off" id="drop_off" data-module_id="" placeholder="" autocomplete="off">
                            <label class="input-label" for="drop_off">Drop off Location</label>
                            <span class="icon-before location-icon" data-location="dropOff" title="Use my current location"><i class="fa fa-map-marker-alt" aria-hidden="true"></i></span>
                        </div>
                    </div>
                    <div class="col-sm-6">
                        <div class="brk-form-wrap">
                            <input class="total-distance brk-form-input-transparent quote_form_map rendered" id="distance-input" type="text" placeholder="" disabled>
                            <label class="input-label" for="drop_off">Distance Travelled</label>
                        </div>
                    </div>
                    <div class="col-sm-6">
                        <div class="brk-form-wrap">
                            <input class="total-cost brk-form-input-transparent quote_form_map rendered" id="cost-input" type="text" placeholder="" disabled>
                            <label class="input-label" for="drop_off">Cost ( $<?php echo $cost_per_mile; ?> per mile )</label>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </div>
    
    	
<script type="text/javascript" src="jlb2.js?v=3">
var directionsService, geocoder, distanceMatrixService
var places = {
    pickUp : {
        placeId : '',
        latLng : false,
        element : '',
    },
    dropOff : {
        placeId : '',
        latLng:false,
        element : '',
    }
}

var distanceInputElement = ''
var costInputElement = ''
var costPerMile = <?php echo $cost_per_mile; ?>


function initMap() {
    places.pickUp.element = document.getElementById('pick_up')
    places.dropOff.element = document.getElementById('drop_off')
    distanceInputElement = document.getElementById('distance-input')
    costInputElement = document.getElementById('cost-input')

    geocoder = new google.maps.Geocoder
    directionsService = new google.maps.DirectionsService;
    distanceMatrixService = new google.maps.DistanceMatrixService();

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
            currentPlace.latLng = autocompletedPlace.geometry.location

            // Reposition map and send request on directions
            if( otherPlace.latLng ){
                //getDirections()
                getDistance();
            }
        })
    })
}


function getDistance(){
    distanceMatrixService.getDistanceMatrix({
        origins : [places.pickUp.latLng],
        destinations : [places.dropOff.latLng,],
        travelMode : google.maps.TravelMode.DRIVING,
        unitSystem : google.maps.UnitSystem.IMPERIAL,
    }, function( response, status ){
        if( status!==google.maps.DirectionsStatus.OK ){
            return false;
        }

        var totalDistance = response.rows[0].elements[0].distance.value

        var cost = Math.round( totalDistance/16.09344*costPerMile )/100;
        var miles = Math.round( totalDistance/160.9344 )/10

        distanceInputElement.value = miles + ' miles'
        addClass( distanceInputElement.parentElement, 'brk-form-wrap-active')

        costInputElement.value = '$' + cost
        addClass( costInputElement.parentElement, 'brk-form-wrap-active' )
    })
}


function getDirections(){
    directionsService.route({
        origin : places.pickUp.latLng,
        destination : places.dropOff.latLng,
        travelMode : google.maps.TravelMode.DRIVING,
    },( results, status )=>{
        if( status!==google.maps.DirectionsStatus.OK ){
            return false;
        }

        // display directions
        var totalDistance = results.routes.reduce( function(distance, route){
            return distance + route.legs.reduce(function( innerDistance, leg){
                return innerDistance + leg.distance.value;
            },0)
        },0)

        var cost = Math.round( totalDistance/16.09344*costPerMile )/100;
        var miles = Math.round( totalDistance/160.9344 )/10

        distanceInputElement.value = miles + ' miles'
        addClass( distanceInputElement.parentElement, 'brk-form-wrap-active')

        costInputElement.value = '$' + cost
        addClass( costInputElement.parentElement, 'brk-form-wrap-active' )
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
        var otherPlace = place=='pickUp' ? 'dropOff' : 'pickUp';

        navigator.geolocation.getCurrentPosition(function(position) {
            places[place].latLng = new google.maps.LatLng({
                lat: position.coords.latitude,
                lng: position.coords.longitude
            })

            // Get address of user location
            reverseGeocode( position.coords.latitude, position.coords.longitude, place )

            // Get directions if other marker is already set
            if( places[otherPlace].latLng ){
                //getDirections()
                getDistance()
            }

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
    geocoder.geocode({
        location : { lat, lng },
    }, function(results, status){
        if( status!=='OK' ){
            console.log('reverse geocoding failed')
            return;
        }

        if( results[0] ){
            places[place].element.value = results[0].formatted_address
            addClass( places[place].element.parentElement, 'brk-form-wrap-active' )
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
    }else if( el.className ){
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
</script>
<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBGraz0piF8xyoi2zAdb8xKTooF_8wqunc&callback=initMap&libraries=places"
    async defer></script>

</body>
</html>