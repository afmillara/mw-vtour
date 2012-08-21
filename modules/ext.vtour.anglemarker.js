/**
 * Graphic elements that display the places angles on the map.
 *
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 * 
 * @file
 */

/**
 * Base class for angle markers in maps. Implementations must override show, generate
 * and setHighlighted. The press.vtour event is fired when the angle marker is pressed
 * (whatever that means for the implementation used) and the angleChanged.vtour event is
 * fired (passing the new angle as an additional parameter) when the marker is moved.
 * @class BaseAngleMarker
 */
//* class BaseAngleMarker {
var BaseAngleMarker = Class.extend( {

	/**
	 * Whether the angle may be changed.
	 * @var {Boolean} variableAngle
	 */
	//* protected Boolean variableAngle;
	variableAngle: false,

	/**
	 * Base location of the angle marker, relative to the parent element.
	 * @var {Number[]} coordinates
	 */
	//* protected Number[] coordinates;
	coordinates: [0, 0],

	/**
	 * Absolute base location of the angle marker.
	 * @var {Number[]} absoluteLocation
	 */
	//* protected Number[] absoluteLocation;
	absoluteLocation: null,

	/**
	 * Whether the marker is being pressed.
	 * @var {Boolean} mouseIsDown
	 */
	//* protected Boolean mouseIsDown;
	mouseIsDown: false,

	/**
	 * Angle from the base location at which the marker is being pressed.
	 * @var {Number} initialAngleDiff
	 */
	//* protected Number initialAngleDiff;
	initialAngleDiff: null,

	/**
	 * Current angle.
	 * @var {Number} angle
	 */
	//* protected Number angle;
	angle: 0,

	/**
	 * jQuery node containing the marker HTML element.
	 * @var {$HTML} $marker
	 */
	//* protected $HTML $marker;
	$marker: null,

	/**
	 * Create a new AngleMarker.
	 * @param {Boolean} variableAngle Whether the angle may be changed
	 * @constructor
	 */
	//* public void init( Boolean variableAngle );
	init: function( variableAngle ) {
		this.variableAngle = variableAngle;
		this.$marker = this.generate();
		this.setHighlighted( true );
	},

	/**
	 * Return the marker as a DOM node.
	 * @return {$HTML} Element, wrapped in a jQuery collection
	 */
	//* public $HTML getHTML();
	getHTML: function() {
		return this.$marker;
	},

	/**
	 * Set the base location.
	 * @param {Number} coordinates Base location
	 */
	//* public void setLocation( Number coordinates );
	setLocation: function( coordinates ) {
		this.absoluteLocation = null;
		this.coordinates = coordinates;
	},

	/**
	 * Change the angle.
	 * @param {Number} angle New angle
	 */
	//* public void setAngle( Number angle );
	setAngle: function( angle ) {
		this.angle = angle;
	},

	/**
	 * Show or hide the marker.
	 * @param {Boolean} show Whether to show or hide the marker
	 */
	//* public void toggle( Boolean show );
	toggle: function( show ) {
		this.$marker.toggle( show );
	},

	/**
	 * Control whether the element should be highlighted.
	 * @param {Boolean} highlighted Whether the element should be highlighted
	 */
	//* public void setHighlighted( Boolean highlighted );
	setHighlighted: function( highlighted ) {
		throw new Error( 'Not implemented: setHighlighted' );
	},

	/**
	 * Show the element or update its appearance.
	 */
	//* public void show();
	show: function() {
		throw new Error( 'Not implemented: show' );
	},

	/**
	 * Start dragging the marker.
	 * Implementations must call this method when appropriate.
	 * @param {Number} x Absolute X coordinate where the action started
	 * @param {Number} y Absolute Y coordinate where the action started
	 */
	//* protected void mouseDown( Number x, Number y );
	mouseDown: function( x, y ) {
		var centerPoint, initialAngle;
		$( this ).trigger( 'press.vtour' );
		if ( this.variableAngle ) {
			this.mouseIsDown = true;
			centerPoint = this.getAbsoluteLocation();
			initialAngle = calculateAngle( centerPoint, [x, y] ) || 0;
			this.initialAngleDiff = initialAngle - this.angle;
		}
	},

	/**
	 * Stop dragging the marker.
	 * Implementations must call this method when appropriate.
	 */
	//* protected void mouseUp();
	mouseUp: function() {
		this.mouseIsDown = false;
	},

	/**
	 * Drag the marker to a given location.
	 * Implementations must call this method when appropriate.
	 * @param {Number} x Absolute X coordinate to which the marker is being dragged
	 * @param {Number} y Absolute Y coordinate to which the marker is being dragged 
	 */
	//* protected void mouseMove( Number x, Number y );
	mouseMove: function( x, y ) {
		var mouseAngle, newAngle;
		if (this.mouseIsDown){
			mouseAngle = calculateAngle( this.getAbsoluteLocation(), [x, y] );
			if ( !isNaN( mouseAngle !== null ) ) {
				newAngle = mouseAngle - this.initialAngleDiff;
				$( this ).trigger( 'angleChanged.vtour', newAngle );
			}
		}
	},
	
	/**
	 * Initialize this.$marker with a suitable DOM node.
	 * @return $HTML jQuery collection wrapping an element
	 */
	//* protected $HTML generate();
	generate: function() {
		throw new Error( 'Not implemented: generate' );
	},

	/**
	 * Return the absolute location of the marker.
	 * @return {Number[]} Absolute location of the marker
	 */
	//* protected Number[] getAbsoluteLocation();
	getAbsoluteLocation: function() {
		var offset;
		if ( this.absoluteLocation === null ) {
			offset = this.$marker.parent().offset();
			this.absoluteLocation =
				sum( this.coordinates, [offset.left, offset.top] );
		}
		return this.absoluteLocation;
	}
} );
//* }

/**
 * AngleMarker implementation that uses a canvas.
 * @class CanvasAngleMarker
 */
//* class CanvasAngleMarker extends BaseAngleMarker {
var CanvasAngleMarker = BaseAngleMarker.extend( {
	
	/**
	 * Aperture of the "cone" (actually a triangle), in radians.
	 * @var {Number} coneAngle
	 */
	//* protected Number coneAngle;
	coneAngle: 50 * DEG2RAD,

	/**
	 * Height of the triangle.
	 * @var {Number} coneRadius
	 */
	//* protected Number coneRadius;
	coneRadius: 60,

	/**
	 * Opacity when highlighted.
	 * @var {Number} highOpacity
	 */
	//* protected Number highOpacity;
	highOpacity: 0.5,

	/**
	 * Opacity when not highlighted.
	 * @var {Number} lowOpacity
	 */
	//* protected Number lowOpacity;
	lowOpacity: 0.15,

	/**
	 * Polygon object that is used to generate the canvas.
	 * @var {Polygon} polygon
	 */
	//* protected Polygon polygon;
	polygon: null,

	/**
	 * Current opacity of the marker.
	 * @var {Number} currentOpacity
	 */
	//* protected Number currentOpacity;
	currentOpacity: 0,

	//* protected void onMouseMove();
	onMouseMove: null,

	//* protected void onMouseUp();
	onMouseUp: null,

	//* protected $HTML generate();
	generate: function() {
		var that = this;
		var polygon = this.polygon = new Polygon();
		var $polygonCanvas = polygon.getHTML();

		this.onMouseUp = function() {
			$( document )
				.unbind( 'mouseup', that.onMouseUp )
				.unbind( 'mousemove', that.onMouseMove );
			that.mouseUp();
		};

		this.onMouseMove = function( event ) {
			that.mouseMove( event.pageX, event.pageY );
		};

		if ( this.variableAngle ) {
			$( polygon ).bind( 'polygonMouseDown.vtour', function( e, x, y ) {
				$( document )
					.mousemove( that.onMouseMove )
					.mouseup( that.onMouseUp );
				that.mouseDown( x, y );
			} );
		}		

		$( polygon ).bind( 'polygonHoverChanged.vtour', function( event, hover ) {
			var className = that.variableAngle ?
				'vtour-anglemarker-movable' : 'vtour-anglemarker-fixed';
			$polygonCanvas.toggleClass( className, hover );
		} );
		
		$polygonCanvas.addClass( 'vtour-canvasanglemarker' );
		return $polygonCanvas;
	},

	//* public void show();
	show: function() {
		this.polygon.setVertices( [
			this.coordinates,
			calculateCircumferencePoint
				( this.coordinates, this.coneRadius,
				this.angle - this.coneAngle / 2 ),
			calculateCircumferencePoint
				( this.coordinates, this.coneRadius,
				this.angle + this.coneAngle / 2 )
		] );
		this.polygon.drawCanvas( this.currentOpacity );
	},

	//* public void setHighlighted( Boolean highlighted );
	setHighlighted: function( highlighted ) {
		this.currentOpacity = highlighted ? this.highOpacity : this.lowOpacity;
	}
} );
//* }

/**
 * Angle marker that uses an image. Suitable for browsers that don't support
 * HTML5 canvas element.
 * @class ImageAngleMarker
 */
//* class ImageAngleMarker extends BaseAngleMarker {
var ImageAngleMarker = BaseAngleMarker.extend( {

	/**
	 * Radius of the marker: distance to the base location.
	 * @var {Number} radius
	 */
	//* protected Number radius;
	radius: 25,

	/**
	 * Opacity when highlighted.
	 * @var {Number} highOpacity
	 */
	//* protected Number highOpacity;
	highOpacity: 1,

	/**
	 * Opacity when not highlighted.
	 * @var {Number} lowOpacity
	 */
	//* protected Number lowOpacity;
	lowOpacity: 0.35,

	//* protected void onMouseMove();
	onMouseMove: null,

	//* protected void onMouseUp();
	onMouseUp: null,

	//* protected $HTML generate();
	generate: function() {
		var that = this;
		var $angleIcon = $( '<div></div>' ).addClass( 'vtour-anglemarkerimage' );

		if ( this.variableAngle ) {
			$angleIcon.addClass( 'vtour-anglemarker-movable' );
		} else {
			$angleIcon.addClass( 'vtour-anglemarker-fixed' );
		}

		this.onMouseUp = function() {
			$( document )
				.unbind( 'mouseup', that.onMouseUp )
				.unbind( 'mousemove', that.onMouseMove );
			that.mouseUp();
		};

		this.onMouseMove = function( event ) {
			that.mouseMove( event.pageX, event.pageY );
		};

		if ( this.variableAngle ) {
			$angleIcon.mousedown( function( e ) {
				$( document )
					.mousemove( that.onMouseMove )
					.mouseup( that.onMouseUp );
				that.mouseDown( e.pageX, e.pageY );
				e.stopPropagation();
				e.preventDefault();
			} );
		}

		return $angleIcon;
	},

	//* public void setHighlighted( Boolean highlighted );
	setHighlighted: function( highlighted ) {
		this.$marker.fadeTo( 0, highlighted ? this.highOpacity : this.lowOpacity );
	},

	//* public void show();
	show: function() {
		setPosition( this.$marker, calculateCircumferencePoint( this.coordinates,
			this.radius, this.angle ) );
	}
} );
//* }

/**
 * Best available implementation of AngleMarker.
 * @var AngleMarker
 */
var AngleMarker = supports2DCanvas() ? CanvasAngleMarker : ImageAngleMarker;

