/**
 * "Interface" for external maps.
 *
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 * 
 * @file
 */

/**
 * Common interface for external map APIs.
 * @class ExternalMap
 */
//* class ExternalMap {
var ExternalMap = Class.extend( {

	/**
	 * Create a new ExternalMap.
	 * @param {$HTML} $mapContainer jQuery element wrapping a DOM node that will
	 * contain the map
	 * @param {function( ExternalMap )} onLoad Function to call when the ExternalMap
	 * can be used. Asynchronous loading might be needed
	 * @param {function( ExternalMap )} onError Function to call if the ExternalMap
	 * cannot be used
	 * @param {Boolean} showControls Whether UI controls should be shown
	 * @constructor
	 */
	//* public void init( $HTML $mapContainer, function onLoad, function onError, Boolean showControls );
	init: function( $mapContainer, onLoad, onError, showControls ) {
		throw new Error( 'Not implemented: init' );
	},

	/**
	 * Set the bounds for this ExternalMap.
	 * @param {Number[][]} bounds Array of coordinates: [[swLon, swLat], [neLon, neLat]]
	 */
	//* public void setBounds( Number[][] bounds );
	setBounds: function( bounds ) {
		this.bounds = bounds;
	},

	/**
	 * Convert geographical coordinates to coordinates in the page.
	 * @param {Number[][]} geoCoords Array of coordinates: [[swLon, swLat], [neLon, neLat]]
	 * @param {Boolean} insideMap Whether the returned coordinates are relative to the
	 * map (for elements that have been inserted in it) or to its container
	 * @return Number[] Array of coordinates: [x, y]
	 */
	//* public Number[] geoToPixel( Number[][] geoCoords, Boolean insideMap );
	geoToPixel: function( geoCoords, insideMap ) {
		throw new Error( 'Not implemented: geoToPixel' );
	},

	/**
	 * Convert coordinates ([x, y]) relative to the container to geographical coordinates.
	 * @param {Number[]} pixel Coordinates
	 * @return Number[] Array of coordinates: [lon, lat]
	 */
	//* public Number[] pixelToGeo( Number[] pixel );
	pixelToGeo: function( pixel ) {
		throw new Error( 'Not implemented: pixelToGeo' );
	},

	/**
	 * Adds a marker to a given location on the map.
	 * @param {String} text Title of the marker
	 * @param {String} description Description of the marker (can be null)
	 * @param {Number[]} location Pair of geographic coordinates (lon, lat)
	 * @param {function} callback Function that will be called when the
	 * marker icon is clicked
	 * @return Object Marker object
	 */
	//* public Object addMarker( String title, String description, Number[] location,
	//* 	function callback );
	addMarker: function( title, description, location, callback ) {
		throw new Error( 'Not implemented: addMarker' );
	},

	/**
	 * Removes a marker from a given location on the map.
	 * @param {Object} marker Marker object returned by addMarker
	 */
	//* public void removeMarker( Object marker );
	removeMarker: function( marker ) {
		throw new Error( 'Not implemented: removeMarker' );
	},

	/**
	 * Change the position in the map by the given values.
	 * @param {Number[]} Increment (in pixels: [dx, dy])
	 */
	//* public void moveBy( Number[] delta );
	moveBy: function( delta ) {
		throw new Error( 'Not implemented: moveBy' );
	},

	/**
	 * Change the position in the map to the given value.
	 * @param {Number[]} location New location ([lon, lat])
	 */
	//* public void moveTo( Number[] location );
	moveTo: function( location ) {
		throw new Error( 'Not implemented: moveTo' );
	},

	/**
	 * Set the zoom.
	 * @param {Number} zoom New zoom value, as defined by the API being used
	 */
	//* public void zoom( Number zoom );
	zoom: function( zoom ) {
		throw new Error( 'Not implemented: zoom' );
	},

	/**
	 * Return the zoom inteval: the maximum and minimum zoom.
	 * Note that they may change after moving.
	 * @return Number[] Zoom interval: [minZoom, maxZoom]
	 */
	//* public Number[] getZoomInterval();
	getZoomInterval: function() {
		throw new Error( 'Not implemented: getZoomInterval' );
	},

	/**
	 * Insert a DOM node in the map, if the implementation supports doing so
	 * (the value of canAddHTML should be checked). The location of the inserted
	 * element when moving or zooming is not defined.
	 * @param {$HTML} $element DOM node(s) that will be added to the ExternalMap
	 */
	//* public void addElement( $HTML $element );
	addElement: function( $element ) {
		throw new Error( 'Not implemented: addElement' );
	}
} );

/**
 * Whether HTML elements can be inserted in the map.
 * @var {Boolean} canAddHTML
 */
//* public static Boolean canAddHTML;
ExternalMap.canAddHTML = false;

/**
 * List of available ExternalMap classes.
 * @var {Class[]} classes
 */
//* public static Class[] classes;
ExternalMap.classes = [];

//* }

