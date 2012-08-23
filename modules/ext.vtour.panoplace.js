/**
 * Place that contains a panorama.
 *
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 * 
 * @file
 */

/**
 * Place whose main content is a spherical panorama.
 * @class CanvasPanoPlace
 */
//* class CanvasPanoPlace extends Place {
var CanvasPanoPlace = Place.extend( {

	//* protected String spClass;
	spClass: 'vtour-panonode',

	//* protected String iconClass;
	iconClass: 'vtour-panoplacemarker',

	//* protected Boolean variableAngle;
	variableAngle: true,

	/**
	 * View used by the PanoPlace.
	 * @var {PanoView} view
	 */
	//* protected PanoView view;
	view: null,
	
	/**
	 * Base angle (in radians) that is added to the longitude to calculate
	 * the current angle.
	 * @var {Number} baseAngle
	 */
	//* protected Number baseAngle;
	baseAngle: null,

	/**
	 * Create a new PanoPlace.
	 * @param {VirtualTour} tour VirtualTour to which this Place belongs
	 * @param {String} name Name of the place
	 * @param {String} description Description of the place
	 * @param {Boolean} visible Whether this place can be seen in a map
	 * @param {Number[]} location Location of the place in the map ([x, y])
	 * @param {Map} map Map that contains this place
	 * @param {String} imageSrc URL of the image
	 * @constructor
	 */
	//* public void init( VirtualTour tour, String name, String description, Boolean visible,
	//*	Number[] location, Map map, String imageSrc );
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
		this.view.move( [center[0] * DEG2RAD, center[1] * DEG2RAD], true );
	},

	//* public void setAngle( Number angle );
	setAngle: function( angle ) {
		this.baseAngle = angle * DEG2RAD;
		this.angle = this.baseAngle;
	},

	/**
	 * Change the current angle.
	 * @param {Number} angle New angle (in degrees)
	 */
	//* public void changeAngle( Number angle );
	changeAngle: function( angle ) {
		if ( !this.error ) {
			this.view.changeAngle( angle * DEG2RAD - this.baseAngle );
		}
	},

	//* public void addTo( $HTML parent );
	addTo: function( parent ) {
		var message;
		if ( this.view === null ) {
			this.view = this.createView( PanoView );
		}
		parent.append( this.$html );
		this.view.reset();
		this._super( parent );
	},

	//* protected GraphicView createView( Class ViewClass );
	createView: function( ViewClass ) {
		var that = this;
		var view = new ViewClass( this.imageSrc );
		this.$html = view.getHTML();
		if ( this.baseAngle !== null ) {
			$( view ).bind( 'panoOrientationChanged.vtour', function() {
				that.angle = view.orientation[0] + that.baseAngle;
				$( that ).trigger( 'angleChanged.vtour' );
			} );
		}
		$( view ).bind( 'error.vtour', function( event, message ) {
			that.tour.showError( message );
		} );
		$.each( this.links, function( i, link ) {
			view.addLink( link );
		} );
		return view;
	},

	//* protected void applyPosition( Position position );
	applyPosition: function( position ) {
		var that = this;
		var _super = that._super;
		this.view.whenReadyDo( function() {
			_super.call( that, position );
		} );
	}
} );
//* }

/**
 * Place whose main content is a panorama, for browser that don't support the
 * Canvas element.
 * @class FallbackPanoPlace
 */
//* class FallbackPanoPlace extends ImagePlace {
var FallbackPanoPlace = ImagePlace.extend( {

	//* protected String iconClass;
	iconClass: 'vtour-panoplacemarker',

	//* protected GraphicView createView();
	createView: function() {
		return new FallbackPanoView( this.imageSrc );
	}
} );
//* }

/**
 * Best available implementation of PanoPlace.
 * @var PanoPlace
 */
var PanoPlace = supports2DCanvas() ? CanvasPanoPlace : FallbackPanoPlace;

