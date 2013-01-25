/**
 * Place with text content.
 *
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 * 
 * @file
 */

/**
 * Place that contains HTML generated from wiki markup.
 * @class TextPlace
 */
var TextPlace = Place.extend( {

	spClass: 'vtour-textnode',

	iconClass: 'vtour-textplacemarker',

	/**
	 * Whether the TextPlace should fade in gradually.
	 * @var {Boolean} useFx
	 */
	useFx: true,

	/**
	 * Create a new TextPlace.
	 * @param {VirtualTour} tour VirtualTour to which this Place belongs
	 * @param {String} name Name of the place
	 * @param {String} description Description of the place
	 * @param {Boolean} visible Whether this place can be seen in a map
	 * @param {Number[]} location Location of the place in the map ([x, y])
	 * @param {Map} map Map that contains this place
	 * @param {$HTML} content DOM node that contains the text that will be shown
	 * @constructor
	 */
	init: function( tour, name, description, visible, location, map, content ) {
		this._super( tour, name, description, visible, location, map );
		this.content = content;
	},

	move: function( movement ) {
		var absoluteMovement = [];
		var size = [ this.$html.width(), this.$html.height() ]; 
		var index;
		for ( index = 0; index < movement.length; index++ ) {
			absoluteMovement.push( movement[index] / 100 * size[index] );
		}
		scroll( this.$html.parent(), absoluteMovement, true );
	},

	addTo: function( parent ) {
		if ( this.$html === null ) {
			this.$html = $( '<div></div>' );
			var element = this;
		}
		this.$html.append(this.content.children());
		parent.append( this.$html );
		this._super( parent, !this.useFx );
	},

	/**
	 * Register a TextLink if it is contained in this place.
	 * @param {TextLink} link Link to register
	 * @return Boolean Whether the link was registered
	 */
	registerLinkIfInside: function( link ) {
		if ( $.contains( this.content[0], link.getHTML()[0] ) ) {
			this.links.push( link );
			return true;
		} else {
			return false;
		}
	},

	cleanup: function( $parent ) {
		// Make the content stay attached to the document.
		// Some scripts might break otherwise.
		this.content.append( this.$html.children() );
	}
} );

