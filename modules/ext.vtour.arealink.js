
/**
 * Link in the shape of a polygon.
 * @class AreaLink
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


	// "Public" methods

	/**
	 * Create a new AreaLink
	 * @constructor
	 * @param {VirtualTour} tour VirtualTour to which this link belongs
	 * @param {Place} destination Place where the link will take the user
	 * @param {Array} location Array of vertices of the polygon
	 */
	init: function( tour, destination, location ) {
		this._super( tour, destination );
		this.location = location;
		this.polygon = new Polygon();
	},

	/**
	 * Generate the HTML for this AreaLink.
	 * @return {$Canvas} generated HTML for the link
	 */
	generate: function() {
		var that = this;
		var $polygon = $( this.polygon );
		var $canvas = this.polygon.getHTML().addClass( 'vtour-arealink' );

		$polygon.on( 'polygonHoverChanged.vtour', function( e, inCanvas, location ) {
			$canvas.toggleClass( 'vtour-arealink-hover', inCanvas );
			that.drawCanvas();
			if ( inCanvas ) {
				that.hover( location );
			} else {
				that.noHover();
			}
		} );
		$polygon.on( 'polygonClick.vtour', function( e ) {
			that.$canvas.removeClass( 'vtour-arealink-hover' );
			that.follow();
		} );

		return $canvas;
	},

	getHTML: function() {
		if ( this.$canvas === null ) {
			this.$canvas = this.generate();
		}
		return this.$canvas;
	},

	updatePosition: function() {
		var htmlPos = this.posCallback( this.location );
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
		if ( this.htmlPos !== null ) {
			opacity = this.$canvas.hasClass( 'vtour-arealink-hover' ) ?
				this.hoverOpacity : this.noHoverOpacity;
			this.polygon.drawCanvas( opacity );
		}
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
	 * @param {Array} location Array of vertices of the polygon ([x, y])
	 */
	init: function( tour, destination, location ) {
		this._super( tour, destination );
		this.location = location;
	},

	updatePosition: function() {
		var htmlPos = this.posCallback( this.location );
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

