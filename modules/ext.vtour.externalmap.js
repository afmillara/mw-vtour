
/**
 * Common interface for external map APIs.
 * @class ExternalMap
 */
var ExternalMap = Class.extend( {

	/**
	 * Whether HTML elements can be inserted in the map.
	 * @var {Boolean} canAddHTML
	 */
	canAddHTML: false,

	/**
	 * Create a new ExternalMap.
	 * @param {function()} callback Function to call when the ExternalMap can be used.
	 * Asynchronous loading might be needed
	 */
	init: function( callback ) {
		throw new Error( 'Not implemented: init' );
	},

	/**
	 * Set the bounds for this ExternalMap.
	 * @param {Array} bounds Array of coordinates: [[swLat, swLon], [neLat, neLon]]
	 */
	setBounds: function( bounds ) {
		this.bounds = bounds;
	},

	/**
	 * Convert geographical coordinates to coordinates in the page.
	 * @param {Array} geoCoords Array of coordinates: [[swLat, swLon], [neLat, neLon]]
	 * @param {Boolean} insideMap Whether the returned coordinates are relative to the
	 * map (for elements that have been inserted in it) or to its container
	 * @return Array Array of coordinates: [x, y]
	 */
	geoToPixel: function( geoCoords, insideMap ) {
		throw new Error( 'Not implemented: geoToPixel' );
	},

	/**
	 * Convert coordinates ([x, y]) relative to the container to geographical coordinates.
	 * @param {Array} pixel Coordinates
	 * @return Array Array of coordinates: [lat, lon]
	 */
	pixelToGeo: function( pixel ) {
		throw new Error( 'Not implemented: pixelToGeo' );
	},

	/**
	 * Return the map HTML element.
	 * @return $HTML jQuery element wrapping the HTML nodes that form the map
	 */
	getHTML: function() {
		throw new Error( 'Not implemented: getHTML' );
	},

	/**
	 * Change the position in the map by the given values.
	 * @param {Number} dx X increment (in pixels)
	 * @param {Number} dy Y increment (in pixels)
	 */
	move: function( dx, dy ) {
		throw new Error( 'Not implemented: move' );
	},

	/**
	 * Set the zoom.
	 * @param {Number} zoom New zoom value, as defined by the API being used
	 */
	zoom: function( zoom ) {
		throw new Error( 'Not implemented: zoom' );
	},

	/**
	 * Return the zoom inteval: the maximum and minimum zoom.
	 * Note that they may change after moving.
	 * @return Array Zoom interval: [minZoom, maxZoom]
	 */
	getZoomInterval: function() {
		throw new Error( 'Not implemented: getZoomInterval' );
	},

	/**
	 * Insert a DOM node in the map, if the implementation supports doing so
	 * (the value of canAddHTML should be checked). The location of the inserted
	 * element when moving or zooming is not defined.
	 * @param {$HTML} element DOM node(s) that will be added to the ExternalMap
	 */
	addElement: function( element ) {
		throw new Error( 'Not implemented: addElement' );
	}
} );

