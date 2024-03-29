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
var CanvasAreaLink = Link.extend( {

	/**
	 * Opacity when the mouse pointer is over the area (0-1).
	 * @var {Number} hoverOpacity
	 */
	hoverOpacity: 0.7,

	/**
	 * Opacity when the mouse pointer is not over the area (0-1).
	 * @var {Number} noHoverOpacity
	 */
	noHoverOpacity: 0.1,

	/**
	 * Polygon object that controls the canvas.
	 * @var {Polygon} polygon
	 */
	polygon: null,

	/**
	 * jQuery collection wrapping the area canvas.
	 * @var {$Canvas} $canvas
	 */
	$canvas: null,

	/**
	 * Whether the polygon can be seen.
	 * @var {Boolean} visible
	 */
	visible: true,

	/**
	 * Create a new AreaLink
	 * @param {VirtualTour} tour VirtualTour to which this link belongs
	 * @param {Place} destination Place where the link will take the user
	 * @param {Number[]} location Array of vertices of the polygon
	 * @constructor
	 */
	init: function( tour, destination, location ) {
		this._super( tour, destination );
		this.location = location;
		this.polygon = new Polygon();
	},

	/**
	 * Change the polygon visibility.
	 * @param {Boolean} visible true if the polygon will be displayed
	 */
	setVisible: function( visible ) {
		this.visible = visible;
	},

	/**
	 * Generate the HTML for this AreaLink.
	 * @return {$Canvas} generated HTML for the link
	 */
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

	getHTML: function() {
		if ( this.$canvas === null ) {
			this.$canvas = this.generate();
			this.updatePosition();
		}
		return this.$canvas;
	},

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

/**
 * Fallback "AreaLink" for browsers where CanvasAreaLink cannot be used.
 * It simply shows a PointLink at the mean X and Y coordinates of the vertices.
 * @class FallbackAreaLink
 */
var FallbackAreaLink = PointLink.extend( {

	/**
	 * Create a new FallbackAreaLink.
	 * @param {VirtualTour} tour Tour to which the link belongs
	 * @param {Place} destination Destination of the link
	 * @param {Number[]} location Array of vertices of the polygon ([x, y])
	 * @constructor
	 */
	init: function( tour, destination, location ) {
		this._super( tour, destination );
		this.location = location;
	},

	updatePosition: function() {
		var htmlPos = this.posCallback ? this.posCallback( this.location ) : null;
		this.$nodeIcon.toggle( htmlPos !== null );
		if ( htmlPos !== null ) {
			setPosition( this.$nodeIcon, calculateMeanPoint( htmlPos ) );
		}
	}
} );

/**
 * Best available AreaLink implementation.
 * @var AreaLink
 */
var AreaLink = supports2DCanvas() ? CanvasAreaLink : FallbackAreaLink;

