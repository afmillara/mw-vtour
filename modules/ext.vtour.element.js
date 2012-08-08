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
	 * Create an Element.
	 * @constructor
	 * @param {VirtualTour} tour VirtualTour to which this Element will belong
	 * @param {String} name Name of the new Element
	 */
	init: function( tour, name ) {
		this.tour = tour;
		this.elementName = name;
	},

	/**
	 * Removes this Element from a parent node and performs cleanup.
	 * @param {$Node} $parent  parent node
	 */
	end: function( $parent ) {
		//.empty() also destroys the event handlers
		$parent.children().detach();
	}
} );

