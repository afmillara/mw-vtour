/**
 * Place whose main content is a panorama.
 * @class CanvasPanoPlace
 */
var CanvasPanoPlace = Place.extend( {

	spClass: 'vtour-panonode',

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
	 * @param {$Image} $image Image contained in this PanoPlace
	 */
	init: function( tour, name, description, visible, location, map, $image ) {
		this._super( tour, name, description, visible, location, map);
		this.$image = $image;
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
	 * @param {Number} angle New angle (in radians)
	 */
	changeAngle: function( angle ){ // FIXME: rad or deg?
		if ( !this.error ) {
			this.view.changeAngle( angle - this.baseAngle );
		}
	},

	addTo: function( parent ) {
		var that = this;
		var message;
		if ( this.view === null ) {
			if ( !this.checkImage( this.$image, parent ) ) {
				return;
			}	
			this.view = new PanoView( this.$image );
			this.$html = this.view.generate();
			this.onMouseUp = function() {
				this.view.onMouseUp.call( this.view );
			};
			this.onMouseMove = function( x, y ) {
				this.view.onMouseMove.call( this.view, x, y );
			};
			if ( this.baseAngle !== null ) {
				$( this.view ).bind( 'panoOrientationChanged.vtour', function() {
					that.angle = that.view.orientation[0] + that.baseAngle;
					$( that ).trigger( 'angleChanged.vtour' );
				});
			}
			$.each( this.links, function( i, link ) {
				that.view.addLink( link );
			} );
		}
		parent.append( this.$html[0], this.$html[1] );

		try {
			this.view.update();
		} catch ( error ) {
			message = mw.message( 'vtour-errordesc-canvaserror',
				imageNameFromPath( that.$image.attr( 'src' ) ) );
			this.showError( message, parent );
			return;
		}

		this._super( parent );
	}
} );

/**
 * Place whose main content is a panorama, for browser that don't support the
 * Canvas element.
 * @class FallbackPanoPlace
 */
var FallbackPanoPlace = ImagePlace.extend( {

	createView: function() {
		return new FallbackPanoView( this.$image );
	}
} );

/**
 * Best available implementation of PanoPlace.
 * @var PanoPlace
 */
var PanoPlace = supports2DCanvas() ? CanvasPanoPlace : FallbackPanoPlace;

