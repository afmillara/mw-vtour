
/**
 * Place whose main content is a spherical panorama.
 * @class CanvasPanoPlace
 */
var CanvasPanoPlace = Place.extend( {

	spClass: 'vtour-panonode',
	iconClass: 'vtour-panoplacemarker',

	variableAngle: true,

	/**
	 * View used by the PanoPlace.
	 * @var {PanoView} view
	 */
	view: null,
	
	/**
	 * Base angle (in radians) that is added to the longitude to calculate
	 * the current angle.
	 * @var {Number} baseAngle
	 */
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
	 */
	init: function( tour, name, description, visible, location, map, imageSrc ) {
		this._super( tour, name, description, visible, location, map);
		this.imageSrc = imageSrc;
	},

	changeZoom: function( zoom ) {
		this.view.changeExternalZoom( zoom );
	},

	move: function( center ) {
		this.view.move( [center[0] * DEG2RAD, center[1] * DEG2RAD], true );
	},

	setAngle: function( angle ){
		this.baseAngle = angle*DEG2RAD;
		this.angle = this.baseAngle;
	},

	/**
	 * Change the current angle.
	 * @param {Number} angle New angle (in degrees)
	 */
	changeAngle: function( angle ) {
		if ( !this.error ) {
			this.view.changeAngle( angle * DEG2RAD - this.baseAngle );
		}
	},

	addTo: function( parent ) {
		var message;
		if ( this.view === null ) {
			this.createView( PanoView );
		}
		parent.append( this.$html );
		this.view.reset();
		this._super( parent );
	},

	createView: function( ViewClass ) {
		var that = this;
		this.view = new ViewClass( this.imageSrc );
		this.$html = this.view.getHTML();
		if ( this.baseAngle !== null ) {
			$( this.view ).bind( 'panoOrientationChanged.vtour', function() {
				that.angle = that.view.orientation[0] + that.baseAngle;
				$( that ).trigger( 'angleChanged.vtour' );
			} );
		}
		$( this.view ).bind( 'error.vtour', function( event, message ) {
			that.tour.showError( message );
		} );
		$.each( this.links, function( i, link ) {
			that.view.addLink( link );
		} );
	},

	applyPosition: function( position ) {
		var that = this;
		var _super = that._super;
		this.view.whenReadyDo( function() {
			_super.call( that, position );
		} );
	}
} );

/**
 * Place whose main content is a panorama, for browser that don't support the
 * Canvas element.
 * @class FallbackPanoPlace
 */
var FallbackPanoPlace = ImagePlace.extend( {

	iconClass: 'vtour-panoplacemarker',

	createView: function() {
		return new FallbackPanoView( this.imageSrc );
	}
} );

/**
 * Best available implementation of PanoPlace.
 * @var PanoPlace
 */
var PanoPlace = supports2DCanvas() ? CanvasPanoPlace : FallbackPanoPlace;

