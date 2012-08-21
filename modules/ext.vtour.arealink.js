/**
 * Link in the shape of a polygon, and fallback implementation based in a PointLink.
 *
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 * 
 * @file
 */

/**
 * Link in the shape of a polygon.
 * @class CanvasAreaLink
 */
//* class CanvasAreaLink extends Link {
var CanvasAreaLink = Link.extend( {

	/**
	 * Opacity when the mouse pointer is over the area (0-1).
	 * @var {Number} hoverOpacity
	 */
	//* protected Number hoverOpacity;
	hoverOpacity: 0.7,

	/**
	 * Opacity when the mouse pointer is not over the area (0-1).
	 * @var {Number} noHoverOpacity
	 */
	//* protected Number noHoverOpacity;
	noHoverOpacity: 0.1,

	/**
	 * Polygon object that controls the canvas.
	 * @var {Polygon} polygon
	 */
	//* protected Polygon polygon;
	polygon: null,

	/**
	 * jQuery collection wrapping the area canvas.
	 * @var {$Canvas} $canvas
	 */
	//* protected $Canvas $canvas;
	$canvas: null,

	/**
	 * Whether the polygon can be seen.
	 * @var {Boolean} visible
	 */
	//* protected Boolean visible;
	visible: true,

	/**
	 * Create a new AreaLink
	 * @param {VirtualTour} tour VirtualTour to which this link belongs
	 * @param {Place} destination Place where the link will take the user
	 * @param {Number[]} location Array of vertices of the polygon
	 * @constructor
	 */
	//* public void init( VirtualTour tour, Place destination, Number[] location );
	init: function( tour, destination, location ) {
		this._super( tour, destination );
		this.location = location;
		this.polygon = new Polygon();
	},

	/**
	 * Change the polygon visibility.
	 * @param {Boolean} visible true if the polygon will be displayed
	 */
	//* public void setVisible( Boolean visible );
	setVisible: function( visible ) {
		this.visible = visible;
	},

	/**
	 * Generate the HTML for this AreaLink.
	 * @return {$Canvas} generated HTML for the link
	 */
	//* protected $Canvas generate();
	generate: function() {
		var that = this;
		var $polygon = $( this.polygon );
		var $canvas = this.polygon.getHTML().addClass( 'vtour-arealink' );

		$polygon.bind( 'polygonHoverChanged.vtour', function( e, inCanvas, x, y ) {
			$canvas.toggleClass( 'vtour-arealink-hover', inCanvas );
			that.drawCanvas();
			if ( inCanvas ) {
				that.hover( [x, y] );
			} else {
				that.noHover();
			}
		} );
		$polygon.bind( 'polygonClick.vtour', function( e ) {
			that.$canvas.removeClass( 'vtour-arealink-hover' );
			that.follow();
		} );

		return $canvas;
	},

	//* public $Canvas getHTML();
	getHTML: function() {
		if ( this.$canvas === null ) {
			this.$canvas = this.generate();
			this.updatePosition();
		}
		return this.$canvas;
	},

	//* public Boolean updatePosition();
	updatePosition: function() {
		var htmlPos = this.posCallback ? this.posCallback( this.location ) : null;
		this.$canvas.toggle( htmlPos !== null );
		if ( htmlPos !== null ) {
			this.polygon.setVertices( htmlPos );
			this.drawCanvas();
			return true;
		} else {
			return false;
		}
	},

	/**
	 * Draw the polygon in the HTML node.
	 */
	//* protected void drawCanvas();
	drawCanvas: function() {
		var color, opacity;
		if ( this.visible ) {
			if ( this.$canvas.hasClass( 'vtour-arealink-hover' ) ) {
				opacity = this.hoverOpacity;
			} else {
				opacity = this.noHoverOpacity;
			}
		} else {
			opacity = 0;
		}
		this.polygon.drawCanvas( opacity );
	}
} );
//* }

/**
 * Fallback "AreaLink" for browsers where CanvasAreaLink cannot be used.
 * It simply shows a PointLink at the mean X and Y coordinates of the vertices.
 * @class FallbackAreaLink
 */
//* class FallbackAreaLink extends PointLink {
var FallbackAreaLink = PointLink.extend( {

	/**
	 * Create a new FallbackAreaLink.
	 * @param {VirtualTour} tour Tour to which the link belongs
	 * @param {Place} destination Destination of the link
	 * @param {Number[]} location Array of vertices of the polygon ([x, y])
	 * @constructor
	 */
	//* public void init( VirtualTour tour, Place destination, Number[] location );
	init: function( tour, destination, location ) {
		this._super( tour, destination );
		this.location = location;
	},

	//* public void updatePosition();
	updatePosition: function() {
		var htmlPos = this.posCallback ? this.posCallback( this.location ) : null;
		this.$nodeIcon.toggle( htmlPos !== null );
		if ( htmlPos !== null ) {
			setPosition( this.$nodeIcon, calculateMeanPoint( htmlPos ) );
		}
	}
} );
//* }

/**
 * Best available AreaLink implementation.
 * @var AreaLink
 */
var AreaLink = supports2DCanvas() ? CanvasAreaLink : FallbackAreaLink;

