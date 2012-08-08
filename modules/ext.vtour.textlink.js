/**
 * Text-based link to a Place.
 *
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 * 
 * @file
 */

/**
 * Link from a TextPlace to another place.
 * @class TextLink
 */
var TextLink = Link.extend( {

	/**
	 * Create a new TextLink.
	 * @constructor
	 *
	 * @param {VirtualTour} tour Tour to which this link belongs
	 * @param {Place} destination Place to which this links points
	 */
	init: function( tour, destination, $link ) {
		this._super( tour, destination );
		this.$link = $link;
		// We don't want the native tooltip to appear along with our "tooltip".
		$link.removeAttr( 'title' );
	},

	getHTML: function() {
		var that = this;
		this.$link.click( function( event ) {
			that.$link[0].scrollIntoView( 'vtour-tour-' + that.tour.id );
			that.follow();
			event.preventDefault();
		} );
		this.$link.bind( 'mouseenter mousemove', function( event ) {
			that.hover( [event.pageX, event.pageY] );
		} ).mouseleave( function() {
			that.noHover();
		} );
		return this.$link;
	}
} );
