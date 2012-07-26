
/**
 * ExternalMap implementation that uses Google Maps Javascript API v3.
 * @class GoogleExternalMap
 */
var GoogleExternalMap = ExternalMap.extend( {

	canAddHTML: true,

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

	init: function( callback ) {
		GoogleExternalMap.loadGoogleMaps( function() {
			callback();
		} );
	},

	setBounds: function( bounds, callback ) {
		var gmaps = GoogleExternalMap.gmaps;
		var map = this.map;
		this._super( bounds );
		this.updateBounds();
		if ( callback ) {
			gmaps.event.addListenerOnce( map, 'bounds_changed',
				function() {
					callback( map.getZoom() );
				} );
		}
	},

	geoToPixel: function( geo, insideMap ) {
		var gmaps = GoogleExternalMap.gmaps;
		var latLng = new gmaps.LatLng( geo[0], geo[1] );
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
		var gmaps = GoogleExternalMap.gmaps;
		var point = new gmaps.Point( pixel[0], pixel[1] );
		var latLng = this.dummyOverlay.getProjection()
			.fromContainerPixelToLatLng( point );
		return [latLng.lat(), latLng.lng()];
	},

	getHTML: function() {
		this.$mapContainer = $( '<div></div' ).css( {
			'width': '100%',
			'height': '100%'
		} );
		this.prepareContainer();
		return this.$mapContainer;
	},

	getZoomInterval: function() {
		this.updateMaxZoom();
		return [0, this.maxZoomHere];
	},

	move: function( delta ) {
		this.map.panBy( delta[0], delta[1] );
	},

	zoom: function( newZoom ) {
		this.map.setZoom( newZoom );

		// Zooming behaves weirdly in some browsers when no move is made
		// immediately afterwards. Is it our fault somehow?
		this.move( [0, 0] );
	},

	updateBounds: function() {
		var gmaps = GoogleExternalMap.gmaps;
		var swBounds = new gmaps.LatLng( this.bounds[0][0], this.bounds[0][1] );
		var neBounds = new gmaps.LatLng( this.bounds[1][0], this.bounds[1][1] );
		var bounds = new gmaps.LatLngBounds( swBounds, neBounds );
		this.map.fitBounds( bounds );
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
			zoom: 0,
			mapTypeId: gmaps.MapTypeId.HYBRID,
			//disableDefaultUI: true,
			draggable: false,
			scrollwheel: false,
			disableDoubleClickZoom: true
		};
		this.map = new gmaps.Map( this.$mapContainer[0], options );
		this.dummyOverlay = new GoogleExternalMap.MapOverlay( $( '<div></div>' ) );
		this.dummyOverlay.setMap( this.map );
	},

	/**
	 * Return whether the Maps API has been loaded.
	 * @return Boolean true if the API has been loaded,
	 * false otherwise
	 */
	isReady: function() {
		return !!GoogleExternalMap.gmaps;
	}
} );

/**
 * Google Maps API.
 * @var {Google.Maps} gmaps
 */
GoogleExternalMap.gmaps = null;

/**
 * Whether GoogleExternalMap is currently loading.
 * @var {Boolean} loadStarted
 */
GoogleExternalMap.loadStarted = false;

/**
 * Load the Google Maps Javascript API.
 * @param {function()} onLoad Function that will be called when the API finishes loading,
 * or immediately if it is already available
 */
GoogleExternalMap.loadGoogleMaps = function( onLoad ){
	var callback;
	GoogleExternalMap.gmaps = GoogleExternalMap.gmaps
			|| ( window.google ? window.google.maps : null );
	callback = function() {
		GoogleExternalMap.MapOverlay = GoogleExternalMap.initMapOverlay();
		onLoad();
	};
	if ( GoogleExternalMap.gmaps === null ) {
		$( GoogleExternalMap ).bind( 'gmapsApiLoaded', callback );

		if ( !GoogleExternalMap.loadStarted ) {
			GoogleExternalMap.loadStarted = true;
			$.getScript( 'http://maps.google.com/maps/api/js?sensor=false&callback=wfVtourGMapsApiLoaded' );
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
	$(GoogleExternalMap).trigger( 'gmapsApiLoaded' );
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
		/*var gmaps = GoogleExternalMap.gmaps;

		var projection = this.getProjection();
		var swBounds = new gmaps.LatLng(this.bounds[0][0],this.bounds[0][1]);
		var neBounds = new gmaps.LatLng(this.bounds[1][0],this.bounds[1][1]);
		var sw = projection.fromLatLngToDivPixel(swBounds);
		var ne = projection.fromLatLngToDivPixel(neBounds);

		this.$mapContainer.width(ne.x - sw.x);
		this.$mapContainer.height(ne.y - sw.y);

		setPosition(this.$mapContainer, [sw.x, sw.y]);*/
	};
	return MapOverlay;
};

