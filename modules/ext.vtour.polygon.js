/**
 * Graphic polygon that uses a canvas.
 *
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 * 
 * @file
 */

/**
 * Graphic polygon that is displayed in a given place and detects mouse events occurring inside.
 * The following events may be triggered in the generated nodes:
 * - polygonHoverChanged: When the mouse is moved inside the polygon or exits it. It includes
 *   whether the mouse is inside the canvas, e.pageX and e.pageY as additional arguments,
 *   in that order.
 * - polygonClick: When the polygon is clicked. e.pageX and e.pageY are passed as additional
 *   arguments.
 * - polygonMouseDown: When the mouse button is pressed. e.pageX and e.pageY are passed as
 *   additional arguments.
 * @class Polygon
 */
// TODO: Implement Polygon in SVG, which is better suited for this kind of things
//* class Polygon {
var Polygon = Class.extend( {

	/**
	 * Canvas where the polygon is drawn.
	 * @var {$Canvas} $canvas
	 */
	//* protected $Canvas $canvas;
	$canvas: null,

	/**
	 * Array of vertices.
	 * @var {Number[][]} vertices
	 */
	//* protected Number[][] vertices;
	vertices: [[0, 0]],

	/**
	 * Maximum canvas width/height.
	 * Some browser crash when large canvases are used.
	 * @var {Number} maxCanvasSize
	 */
	//* protected Number maxCanvasSize;
	maxCanvasSize: 1000,
	
	/**
	 * Create a new Polygon.
	 * @constructor
	 */
	//* public void init();
	init: function() {
		var that = this;
		var $canvas = this.$canvas = $( '<canvas></canvas>' ).addClass( 'vtour-polygon' );

		var mouseMayBeOut = function( event ) {
			if ( event.target !== that.$canvas[0]
					|| !that.inCanvas( event.pageX, event.pageY ) ) {
				$( that ).trigger( 'polygonHoverChanged.vtour',
					[false, event.pageX, event.pageY] );
				$( document ).unbind( 'mousemove', mouseMayBeOut );
			}
		};

		$canvas.mousemove( function( event ) {
			if ( that.inCanvas( event.pageX, event.pageY ) ) {
				$( that ).trigger( 'polygonHoverChanged.vtour',
					[true, event.pageX, event.pageY] );
				$( document ).mousemove( mouseMayBeOut );
			}			
		} );

		this.createEventForEventInCanvas( 'click', 'polygonClick.vtour' );
		this.createEventForEventInCanvas( 'mousedown', 'polygonMouseDown.vtour' );

		this.context = $canvas[0].getContext( '2d' );
	},

	/**
	 * Trigger an event in the Polygon object when another event is triggered
	 * in the canvas element inside the displayed polygon.
	 * @param {String} eventInCanvas Name of the event that may be triggered in the canvas
	 * @param {String} newEvent Name of the event that will be triggered
	 */
	//* protected void createEventForEventInCanvas( String eventInCanvas, String newEvent );
	createEventForEventInCanvas: function(eventInCanvas, newEvent ) {
		var that = this;
		this.$canvas.bind( eventInCanvas, function( e ) {
			if ( that.inCanvas( e.pageX, e.pageY ) ) {
				$( that ).trigger( newEvent, [e.pageX, e.pageY] );
				e.stopPropagation();
				e.preventDefault();
			}
		} );
	},

	/**
	 * Return the canvas.
	 * @return $Canvas Canvas
	 */
	//* public $Canvas getHTML();
	getHTML: function() {
		return this.$canvas;
	},

	/**
	 * Set the vertices of the polygon.
	 * @param {Number[][]} vertices Array of pairs of coordinates
	 */
	//* public void setVertices( Number[][] vertices );
	setVertices: function( vertices ) {
		this.vertices = vertices;
	},

	/**
	 * Draw the canvas at the specified location.
	 * @param {Number} globalAlpha Canvas opacity
	 */
	//* public void drawCanvas( Number globalAlpha );
	drawCanvas: function( globalAlpha ) {
		var color = this.$canvas.css( 'color' );
		var context = this.context;
		var boundingBox = calculateBoundingBox( this.vertices );
		var firstVertex = this.vertices[0];
		var vertexIndex, currentVertex;

		if ( boundingBox.width >= this.maxCanvasSize
			|| boundingBox.height >= this.maxCanvasSize ) {
			this.context.clearRect( 0, 0,
				this.$canvas.attr( 'width' ),
				this.$canvas.attr( 'height' ) );
			return;
		}
		this.$canvas.attr( 'width', boundingBox.width + 1 );
		this.$canvas.attr( 'height', boundingBox.height + 1 );
		this.$canvas.css( {
			'left': boundingBox.x,
			'top': boundingBox.y
		} );

		// If the canvas is drawn with alpha = 0, we won't be able to detect
		// whether the mouse is inside the polygon.
		context.globalAlpha = Math.max( globalAlpha, 0.01 );
		context.fillStyle = color;

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
	//* protected Boolean inCanvas( Number mouseX, Number mouseY );
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
	 * @return Uint8ClampedArray Content of the pixel ([r, g, b, a])
	 */
	//* protected Uint8ClampedArray getCanvasPixel( Number x, Number y );
	getCanvasPixel: function( x, y ) {
		return this.context.getImageData( x, y, 1, 1 ).data;
	}
} );
//* }

