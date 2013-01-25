/**
 * Google Maps external map.
 * Uses Google Maps Javascript API v3 (closed source library - Is this actually 'linking'? If so,
 * is that a problem?).
 * Google's Terms of Use apply to users of this service: https://developers.google.com/maps/terms
 *
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 * 
 * @file
 */

/**
 * ExternalMap implementation that uses Google Maps Javascript API v3.
 * @class GoogleExternalMap
 */
var GoogleExternalMap = ExternalMap.extend( {

	/**
	 * Whether UI controls should be shown.
	 * @var {Boolean} showUIControls
	 */
	showUIControls: null,

	/**
	 * Empty overlay used internally to access parts of Google Maps API that
	 * otherwise unreachable.
	 * @var {Google.Maps.OverlayView} dummyOverlay
	 */
	dummyOverlay: null,

	/**
	 * Container element for the map.
	 * @var {$HTML} $mapContainer
	 */
	$mapContainer: null,

	/**
	 * Google Map.
	 * @var {Google.Maps.Map} map
	 */
	map: null,

	/**
	 * Maximum zoom for this area.
	 * @var {Number} maxZoomHere
	 */
	maxZoomHere: 22,

	init: function( $mapContainer, onLoad, onError, showUIControls ) {
		var that = this;
		this.$mapContainer = $mapContainer;
		this.showUIControls = !!showUIControls;
		GoogleExternalMap.loadGoogleMaps( function() {
			that.prepareContainer();
			onLoad( that );
		}, function() {
			onError( that );
		} );
	},

	setBounds: function( bounds, callback ) {
		var gmaps = GoogleExternalMap.gmaps;
		var map = this.map;
		var boundsUpdated;
		this._super( bounds );
		boundsUpdated = this.updateBounds();
		if ( callback ) {
			if ( boundsUpdated ) {
				gmaps.event.addListenerOnce( map, 'bounds_changed',
					function() {
						callback( map.getZoom() );
					} );
			} else {
				callback( map.getZoom() );
			}
		}
	},

	geoToPixel: function( geo, insideMap ) {
		if ( !this.isReady() ) {
			return null;
		}
		var gmaps = GoogleExternalMap.gmaps;
		var latLng = new gmaps.LatLng( geo[1], geo[0] );
		var projection = this.dummyOverlay.getProjection();
		var point;
		if ( insideMap ) {
			point = projection.fromLatLngToDivPixel( latLng );
		} else {
			point = projection.fromLatLngToContainerPixel( latLng );
		}
		return [point.x, point.y];
	},

	pixelToGeo: function( pixel ) {
		if ( !this.isReady() ) {
			return null;
		}
		var gmaps = GoogleExternalMap.gmaps;
		var point = new gmaps.Point( pixel[0], pixel[1] );
		var latLng = this.dummyOverlay.getProjection()
			.fromContainerPixelToLatLng( point );
		return [latLng.lng(), latLng.lat()];
	},

	getZoomInterval: function() {
		this.updateMaxZoom();
		return [1, this.maxZoomHere];
	},

	addMarker: function( title, description, location, callback ) {
		var gmaps = GoogleExternalMap.gmaps;
		var map = this.map;
		var marker = new gmaps.Marker( {
			position: new gmaps.LatLng( location[1], location[0] ),
			title: title
		} );
		var infoWindow = null;

		if ( description !== null ) {
			infoWindow = new gmaps.InfoWindow();
			infoWindow.setContent( description );
		}

		if ( callback || infoWindow ) {
			gmaps.event.addListener( marker, 'click', function() {
				if ( infoWindow ) {
					infoWindow.open( map, this );
				}
				( callback || $.noop )();
			} );
		}

		marker.setMap( this.map );
		return marker;
	},

	removeMarker: function( marker ) {
		marker.setMap( null );
	},

	moveBy: function( delta ) {
		this.map.panBy( delta[0], delta[1] );
	},

	moveTo: function( location ) {
		var gmaps = GoogleExternalMap.gmaps;
		var latLng = new gmaps.LatLng( location[1], location[0] );
		this.map.panTo( latLng );
	},

	zoom: function( newZoom ) {
		this.map.setZoom( newZoom );

		// Zooming behaves weirdly in some browsers when no move is made
		// immediately afterwards. Is it our fault somehow?
		this.moveBy( [0.01, 0] );
		this.moveBy( [-0.01, 0] );
	},

	updateBounds: function() {
		var gmaps = GoogleExternalMap.gmaps;
		var swBounds = new gmaps.LatLng( this.bounds[0][1], this.bounds[0][0] );
		var neBounds = new gmaps.LatLng( this.bounds[1][1], this.bounds[1][0] );
		var bounds = new gmaps.LatLngBounds( swBounds, neBounds );
		var currentBounds = this.map.getBounds();
		if ( bounds.equals( currentBounds ) ) {
			return false;
		} else {
			this.map.fitBounds( bounds );
			return true;
		}
	},

	addElement: function( element ) {
		var that = this;
		var overlay = new GoogleExternalMap.MapOverlay( element );
		overlay.setMap( that.map );
	},

	/**
	 * Update the value for the maximum zoom.
	 */
	updateMaxZoom: function() {
		var service = new GoogleExternalMap.gmaps.MaxZoomService();
		var that = this;
		// The zoom is updated asynchronously.
		service.getMaxZoomAtLatLng( this.map.getCenter(), function( result ) {
			if ( result.status === google.maps.MaxZoomStatus.OK ) {
				that.maxZoomHere = result.zoom;
			}
		} );
	},

	/**
	 * Initialize the map.
	 */
	prepareContainer: function() {
		var gmaps = GoogleExternalMap.gmaps;

		var options = {
			center: new gmaps.LatLng( 0, 0 ),
			zoom: 1,
			mapTypeId: gmaps.MapTypeId.SATELLITE,
			disableDefaultUI: !this.showUIControls,
			draggable: this.showUIControls,
			scrollwheel: this.showUIControls,
			disableDoubleClickZoom: this.showUIControls
		};

		this.map = new gmaps.Map( this.$mapContainer[0], options );

		// That fancy 45º imagery breaks the map.
		this.map.setTilt( 0 );

		this.dummyOverlay = new GoogleExternalMap.MapOverlay( $( '<div></div>' ) );
		this.dummyOverlay.setMap( this.map );
	},

	/**
	 * Return whether the map is ready.
	 * @return Boolean true if the API has been loaded and the map can be
	 * used, false otherwise
	 */
	isReady: function() {
		return !!GoogleExternalMap.gmaps && !!this.dummyOverlay.getProjection();
	}
} );

/**
 * Google Maps API.
 * @var {Google.Maps} gmaps
 */
GoogleExternalMap.gmaps = null;

/**
 * Path to the GoogleMaps API (including a callback).
 * @var {string} APIUrl
 */
GoogleExternalMap.APIUrl = mw.config.get( 'wgVtourGoogleExternalMapAPIUrl' )
	+ '&callback=wfVtourGMapsApiLoaded';

GoogleExternalMap.APITimeout = mw.config.get( 'wgVtourGoogleExternalMapTimeout' );

/**
 * Whether GoogleExternalMap is currently loading.
 * @var {Boolean} loadStarted
 */
GoogleExternalMap.loadStarted = false;

/**
 * Load the Google Maps Javascript API.
 * @param {function()} onLoad Function that will be called when the API finishes loading,
 * or immediately if it is already available
 * @param {function()} onError Function that will be called if an error occurs
 */
GoogleExternalMap.loadGoogleMaps = function( onLoad, onError ){
	var callback;
	GoogleExternalMap.gmaps = GoogleExternalMap.gmaps
		|| ( window.google ? window.google.maps : null );
	callback = function() {
		GoogleExternalMap.MapOverlay = GoogleExternalMap.initMapOverlay();
		onLoad();
	};
	if ( GoogleExternalMap.gmaps === null ) {
		$( GoogleExternalMap ).bind( 'gmapsApiLoaded.vtour', callback );

		if ( !GoogleExternalMap.loadStarted ) {
			GoogleExternalMap.loadStarted = true;
			$.ajax( {
				url: GoogleExternalMap.APIUrl,
				dataType: 'script',
				timeout: GoogleExternalMap.APITimeout,
				error: function() {
					( onError || $.noop )();
				}
			} );
		}
	} else {
		callback();
	}
};

/**
 * Function to call after the Google Maps API finishes loading.
 */
GoogleExternalMap.apiLoaded = function() {
	GoogleExternalMap.gmaps = window.google.maps;
	$(GoogleExternalMap).trigger( 'gmapsApiLoaded.vtour' );
};
window.wfVtourGMapsApiLoaded = GoogleExternalMap.apiLoaded;

/**
 * Initialize the MapOverlay class.
 */
GoogleExternalMap.initMapOverlay = function() {
	var MapOverlay = function( element ) {
		this.element = element;
	};
	MapOverlay.prototype = new GoogleExternalMap.gmaps.OverlayView();
	MapOverlay.prototype.onAdd = function() {
		var $mapContainer = this.$mapContainer =
				$( '<div></div>' ).append( this.element );
		this.getPanes().overlayLayer.appendChild( this.element[0] );
	};
	MapOverlay.prototype.onRemove = function() {
		this.$mapContainer.detach();
		this.$mapContainer = null;
	};
	MapOverlay.prototype.draw = function(){
	};
	return MapOverlay;
};

GoogleExternalMap.canAddHTML = true;

ExternalMap.classes.Google = GoogleExternalMap;


