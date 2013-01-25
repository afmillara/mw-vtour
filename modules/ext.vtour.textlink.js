/**
 * Text-based link to a Place.
 *
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 * 
 * @file
 */

/**
 * Link to a Place in the same page. Used both inside TextPlaces and outside Vtours.
 * @class TextLink
 */
var TextLink = Link.extend( {

	/**
	 * Create a new TextLink.
	 * @param {VirtualTour} tour Tour to which this link belongs
	 * @param {Place} destination Place to which this links points
	 * @param {$HTML} $link DOM node for the link
	 * @constructor
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
			$( '#vtour-tour-' + that.tour.id )[0].scrollIntoView();
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

