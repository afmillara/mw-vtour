
/**
 * Angle marker that uses an image. Suitable for browsers that don't support
 * HTML 5 canvas element.
 * @class ImageAngleMarker
 */
var ImageAngleMarker = AngleMarker.extend( {

	/**
	 * Radius of the marker: distance to the base location.
	 * @var {Number} radius
	 */
	radius: 25,

	/**
	 * Opacity when highlighted.
	 * @var {Number} highOpacity
	 */
	highOpacity: 1,

	/**
	 * Opacity when not highlighted.
	 * @var {Number} lowOpacity
	 */
	lowOpacity: 0.35,

	generate: function() {
		var that = this;
		var $angleIcon = $( '<div></div>' ).addClass( 'vtour-angleicon' )
			.css( 'cursor', this.variableAngle ? 'move' : 'default' );
		$angleIcon.mousedown( function( e ) {
			that.mouseDown( e.pageX, e.pageY );
			e.stopPropagation();
		} );
		if ( this.variableAngle ) {
			// FIXME: Shouldn't bind to document events.
			$( document ).mouseup( function() {
				that.mouseUp();
			} );
			$( document ).mousemove( function( event ) {
				that.mouseMove( event.pageX, event.pageY );
			});
		}
		return $angleIcon;
	},

	setHighlighted: function( highlighted ) {
		this.$marker.fadeTo( 0, highlighted ? this.highOpacity : this.lowOpacity );
	},

	show: function() {
		setPosition( this.$marker, calculateCircumferencePoint( this.location,
			this.radius, this.angle ) );
	}
} );

