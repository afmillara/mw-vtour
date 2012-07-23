
/**
 * Graphic polygon that is displayed in a given place and detects mouse events occurring inside.
 * @class Polygon
 */
var Polygon = Class.extend( {

	/**
	 * Canvas where the polygon is drawn.
	 * @var {$Canvas} $canvas
	 */
	$canvas: null,

	/**
	 * Array of vertices.
	 * @var {Array} vertices
	 */
	vertices: [[0, 0]],
	
	/**
	 * Create a new Polygon.
	 * @constructor
	 */
	init: function() {
		var that = this;
		var $canvas = this.$canvas = $( '<canvas></canvas>' ).addClass( 'vtour-polygon' );
		this.context = $canvas[0].getContext( '2d' );
		// FIXME: Doesn't fire when it should.
		$canvas.bind( 'mousemove mouseenter mouseleave', function( e ) {
			$( that ).trigger( 'polygonHoverChanged',
				[that.inCanvas( e.pageX, e.pageY ), [e.pageX, e.pageY]] );
		} );
		this.createEventForEventInCanvas( 'click', 'polygonClick' );
		this.createEventForEventInCanvas( 'mousedown', 'polygonMouseDown' );
	},

	/**
	 * Trigger an event in the polygon when another event is triggered
	 * inside the canvas.
	 * @param {String} eventInCanvas Name of the event that may be triggered in the canvas
	 * @param {String} newEvent Name of the event that will be triggered
	 */
	createEventForEventInCanvas: function(eventInCanvas, newEvent ) {
		var that = this;
		this.$canvas.bind( eventInCanvas, function( e ) {
			if ( that.inCanvas( e.pageX, e.pageY ) ) {
				$( that ).trigger( newEvent, [e.pageX, e.pageY] );
				e.stopPropagation();
			}
		} );
	},

	/**
	 * Return the canvas.
	 * @return $Canvas Canvas
	 */
	getHTML: function() {
		return this.$canvas;
	},

	/**
	 * Set the vertices of the polygon.
	 * @param {Array} vertices Array of pairs of coordinates
	 */
	setVertices: function( vertices ) {
		this.vertices = vertices;
	},

	resizeIfNeeded: function( width, height ) {
		var $canvas = this.$canvas;
		var canvasWidth = $canvas.attr( 'width' );
		var canvasHeight = $canvas.attr( 'height' );
		var resized = false;
		if ( width > canvasWidth ) {
			$canvas.attr( 'width', width );
			resized = true;
		}
		if ( height > canvasHeight ) {
			$canvas.attr( 'height', height );
			resized = true;
		}
		if ( !resized ) {
			this.context.clearRect( 0, 0, canvasWidth, canvasHeight );
		}
	},

	/**
	 * Draw the canvas at the specified location.
	 * @param {Number} globalAlpha Canvas opacity
	 */
	drawCanvas: function( globalAlpha ) {
		var color = this.$canvas.css( 'color' );
		var context = this.context;
		var boundingBox = calculateBoundingBox( this.vertices );
		var firstVertex = this.vertices[0];
		var vertexIndex, currentVertex;
		var boundingBox = calculateBoundingBox( this.vertices );
		this.$canvas.attr( 'width', boundingBox.width + 1 );
		this.$canvas.attr( 'height', boundingBox.height + 1 );
//		this.resizeIfNeeded( boundingBox.width + 1, boundingBox.height + 1 );
		this.$canvas.css( {
			'left': boundingBox.x,
			'top': boundingBox.y
		} );

		context.fillStyle = color;
		context.globalAlpha = globalAlpha;

		context.beginPath();
		context.moveTo( firstVertex[0] - boundingBox.x, firstVertex[1] - boundingBox.y );
		for ( vertexIndex = 1; vertexIndex < this.vertices.length; vertexIndex++ ) {
			currentVertex = this.vertices[vertexIndex];
			context.lineTo( currentVertex[0] - boundingBox.x, currentVertex[1] - boundingBox.y );
		}
		context.fill();
	},

	/**
	 * Determine where a given point relative to the HTML element is inside the polygon.
	 * @param {Number} mouseX X coordinate of the point
	 * @param {Number} mouseY Y coordinate of the point
	 * @return Boolean true if the point is inside the polygon, false otherwise
	 */
	inCanvas: function( mouseX, mouseY ) {
		var offset = this.$canvas.offset();
		var x = mouseX - offset.left;
		var y = mouseY - offset.top;
		return x >= 0 && y >= 0 && !!this.getCanvasPixel( x, y )[3];
	},

	/**
	 * Extract a single pixel from the canvas.
	 * @param {Number} x X coordinate of the pixel
	 * @param {Number} y Y coordinate of the pixel
	 * @return Array Content of the pixel ()[r, g, b, a])
	 */
	getCanvasPixel: function( x, y ) {
		return this.context.getImageData( x, y, 1, 1 ).data;
	}
} );

