
/**
 * AngleMarker implementation that uses a canvas.
 * @class CanvasAngleMarker
 */
var CanvasAngleMarker = AngleMarker.extend( {
	
	/**
	 * Aperture of the "cone" (actually a triangle), in radians.
	 * @var {Number} coneAngle
	 */
	coneAngle: 50 * DEG2RAD,

	/**
	 * Height of the triangle.
	 * @var {Number} coneRadius
	 */
	coneRadius: 60,

	/**
	 * Opacity when highlighted.
	 * @var {Number} highOpacity
	 */
	highOpacity: 0.5,

	/**
	 * Opacity when not highlighted.
	 * @var {Number} lowOpacity
	 */
	lowOpacity: 0.15,

	/**
	 * Polygon object that is used to generate the canvas.
	 * @var {Polygon} polygon
	 */
	polygon: null,

	/**
	 * Current opacity of the marker.
	 * @var {Number} currentOpacity
	 */
	currentOpacity: 0,

	generate: function() {
		var that = this;
		var polygon = this.polygon = new Polygon();
		var $polygonCanvas = polygon.getHTML();

		$( polygon ).bind( 'polygonMouseDown', function( e, x, y ) {
			that.mouseDown( x, y );
		} );

		if ( this.variableAngle ) {
			$( document ).mouseup( function() {
				// FIXME: Shouldn't bind to document events.
				that.mouseUp();
			} );
			$( document ).mousemove( function( event ) {
				that.mouseMove( event.pageX, event.pageY );
			} );
			$( polygon ).bind( 'polygonHoverChanged', function( event, hover ) {
				$polygonCanvas.css( 'cursor', hover ? 'move' : '' );
			} );
		}
		
		$polygonCanvas.addClass( 'vtour-canvasanglemarker' );
		return $polygonCanvas;
	},

	show: function() {
		this.polygon.setVertices( [
			this.location,
			calculateCircumferencePoint
				( this.location, this.coneRadius,
				this.angle - this.coneAngle / 2 ),
			calculateCircumferencePoint
				( this.location, this.coneRadius,
				this.angle + this.coneAngle / 2 )
		] );
		this.polygon.drawCanvas( this.currentOpacity );
	},

	setHighlighted: function( highlighted ) {
		this.currentOpacity = highlighted ? this.highOpacity : this.lowOpacity;
	}
} );

