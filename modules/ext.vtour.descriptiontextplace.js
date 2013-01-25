/**
 * TextPlace used for descriptions.
 *
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 * 
 * @file
 */

/**
 * "TextPlace" used for descriptions of other places.
 * @class DescriptionTextPlace
 */
var DescriptionTextPlace = TextPlace.extend( {

	useFx: false,

	/**
	 * Create a new DescriptionTextPlace.
	 * @param {VirtualTour} tour Current tour
	 * @param {$HTML} content DOM node that contains the text that will be shown
	 * @constructor
	 */
	init: function( tour, content ) {
		this._super( tour, null, null, false, null, null, content );
	}
} );

