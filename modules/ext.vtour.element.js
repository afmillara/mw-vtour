/**
 * Basic displayable element.
 *
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 * 
 * @file
 */

/**
 * Element that can be added to or removed from a tour.
 * @class Element
 */
var Element = Class.extend( {

	/**
	 * Array of Links from this Element to Places.
	 * @var {Array} links
	 */
	links: null,

	/**
	 * Create an Element.
	 * @constructor
	 * @param {VirtualTour} tour VirtualTour to which this Element will belong
	 * @param {String} name Name of the new Element
	 */
	init: function( tour, name ) {
		this.links = [];
		this.tour = tour;
		this.elementName = name;
	},

	/**
	 * Add a new link from this Element.
	 * @param {Link} link Link to a Place
	 */
	addLink: function( link ) {
		this.links.push( link );
	},

	/**
	 * Remove this Element from a parent node and perform cleanup.
	 * @param {$Node} $parent  parent node
	 */
	end: function( $parent ) {
		//.empty() also destroys the event handlers
		$parent.children().detach();
	}
} );

