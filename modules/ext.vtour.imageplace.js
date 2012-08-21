/**
 * Place that displays an image.
 *
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 * 
 * @file
 */

/**
 * Place whose main content is an image.
 * @class ImagePlace
 */
//* class ImagePlace extends Place {
var ImagePlace = Place.extend( {

	//* protected String spClass;
	spClass: 'vtour-imagenode',

	//* protected String iconClass;
	iconClass: 'vtour-imageplacemarker',

	//* protected Position initialPosition;
	initialPosition: {
		zoom: null,
		center: [0, 0]
	},

	/**
	 * ImageView used in this ImagePlace.
	 * @var {ImageView} view
	 */
	//* protected ImageView view;
	view: null,

	//* protected String imageSrc;
	imageSrc: null,

	/**
	 * Create a new ImagePlace.
	 * @param {VirtualTour} tour    VirtualTour to which this Place belongs
	 * @param {String} name name of the place
	 * @param {String} description  description of the place
	 * @param {Boolean} visible  whether this place can be seen in a map
	 * @param {Number[]} location location of the place in the map ([x, y])
	 * @param {Map} map map that contains this place
	 * @param {String} imageSrc URL of the image
	 * @constructor
	 */
	//* public void init( VirtualTour tour, String name, String description, Boolean visible,
	//* 	Number[] location, Map map, String imageSrc );
	init: function( tour, name, description, visible, location, map, imageSrc ) {
		this._super( tour, name, description, visible, location, map);
		this.imageSrc = imageSrc;
	},

	//* public void changeZoom( Number zoom );
	changeZoom: function( zoom ) {
		this.view.changeExternalZoom( zoom );
	},

	//* public void move( Number[] center );
	move: function( center ) {
		this.view.move( center, true );
	},

	//* public void addTo( $HTML parent );
	addTo: function( parent ) {
		var that = this;
		if ( this.view === null ) {
			this.view = this.createView();
			this.$html = this.view.getHTML();
			$( this.view ).bind( 'error.vtour', function( event, message ) {
				that.tour.showError( message );
			} );
			$.each( this.links, function( i, link ) {
				that.view.addLink( link );
			} );
		}
		parent.append( this.$html );
		this.view.reset();
		this._super( parent );
	},

	//* protected void applyPosition( Position position );
	applyPosition: function( position ) {
		var that = this;
		var _super = that._super;
		this.view.whenReadyDo( function() {
			_super.call( that, position );
		} );
	},

	/**
	 * Create a view for this place.
	 * @return GraphicView New view
	 */
	//* protected ImageView createView();
	createView: function() {
		return new ImageView( this.imageSrc );
	}
} );
//* }

