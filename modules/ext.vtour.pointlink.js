/**
 * Link around a single point.
 *
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 * 
 * @file
 */

/**
 * Link from a single point in a graphic Place to another Place.
 * @class PointLink
 */
//* class PointLink extends Link {
var PointLink = Link.extend( {

	//* protected $HTML $nodeIcon;
	$nodeIcon: null,

	/**
	 * Create a new PlaceLink.
	 * @param {VirtualTour} tour Tour to which the link belongs
	 * @param {Place} destination Destination of the link
	 * @param {Number[]} location Location of the link ([x, y]) on the origin Place
	 * @constructor
	 */
	//* public void init( VirtualTour tour, Place destination, Number[] location );
	init: function( tour, destination, location ) {
		this._super( tour, destination );
		this.location = location;
	},

	/**
	 * Get the HTML for the icon.
	 * @return $HTML icon HTML node for the icon
	 */
	//* public $HTML getIconNode();
	getIconNode: function() {
		return $( '<div></div>' ).addClass( this.destination.getIconClass() );
	},

	/**
	 * Generate an HTML link.
	 * @return $HTML jQuery object wrapping the link
	 */
	//* protected $HTML generate();
	generate: function() {
		var that = this;
		var $nodeIcon = this.getIconNode();
		$nodeIcon.addClass( 'vtour-pointlink' );
		$nodeIcon.click( function() {
			that.follow();
		} );
		$nodeIcon.bind( 'mouseenter mousemove', function( event ) {
			that.hover( [event.pageX, event.pageY] );
		} ).bind( 'mouseleave', function() {
			that.noHover();
		} );

		return $nodeIcon;
	},

	//* public $HTML getHTML();
	getHTML: function() {
		if ( this.$nodeIcon === null ) {
			this.$nodeIcon = this.generate();
			this.updatePosition();
		}
		return this.$nodeIcon;
	},

	//* public Boolean updatePosition();	
	updatePosition: function() {
		var htmlPos = this.posCallback ? this.posCallback( this.location ) : null;
		this.$nodeIcon.toggle( htmlPos !== null );
		if ( htmlPos !== null ) {
			setPosition( this.$nodeIcon, htmlPos );
			return true;
		} else {
			return false;
		}
	}
} );
//* }

