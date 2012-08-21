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
//* class Element {
var Element = Class.extend( {

	/**
	 * Array of Links from this Element to Places.
	 * @var {Link[]} links
	 */
	//* protected Link[] links;
	links: null,

	/**
	 * Create an Element.
	 * @param {VirtualTour} tour VirtualTour to which this Element will belong
	 * @param {String} name Name of the new Element
	 * @constructor
	 */
	//* public void init( VirtualTour tour, String name );
	init: function( tour, name ) {
		this.links = [];
		this.tour = tour;
		this.elementName = name;
	},

	/**
	 * Add a new link from this Element.
	 * @param {Link} link Link to a Place
	 */
	//* public void addLink( Link link );
	addLink: function( link ) {
		this.links.push( link );
	},

	/**
	 * Remove this Element from a parent node and perform cleanup.
	 * @param {$HTML} $parent  parent node
	 */
	//* public void end( $HTML $parent );
	end: function( $parent ) {
		//.empty() also destroys the event handlers
		$parent.children().detach();
	}
} );
//* }

