
/**
 * Base class for angle markers in maps. Implementations must override show, generate
 * and setHighlighted.
 * @class AngleMarker
 */
var AngleMarker = Class.extend( {

	/**
	 * Whether the angle may be changed.
	 * @var {Boolean} variableAngle
	 */
	variableAngle: false,

	/**
	 * Base location of the angle marker, relative to the parent element.
	 * @var {Array} location
	 */
	location: [0, 0],

	/**
	 * Absolute base location of the angle marker.
	 * @var {Array} absoluteLocation
	 */
	absoluteLocation: null,

	/**
	 * Whether the marker is being pressed.
	 * @var {Boolean} mouseIsDown
	 */
	mouseIsDown: false,

	/**
	 * Angle from the base location at which the marker is being pressed.
	 * @var {Number} initialAngleDiff
	 */
	initialAngleDiff: null,

	/**
	 * Current angle.
	 * @var {Number} angle
	 */
	angle: 0,

	/**
	 * jQuery node containing the marker HTML element.
	 * @var {$HTML} $marker
	 */
	$marker: null,


	// "Public" methods

	/**
	 * Crete a new AngleMarker.
	 * @constructor
	 * @param {Boolean} variableAngle Whether the angle may be changed
	 */
	init: function( variableAngle ) {
		this.variableAngle = variableAngle;
		this.$marker = this.generate();
		this.setHighlighted( true );
	},

	/**
	 * Return the marker as a DOM node.
	 * @return $HTML Element, wrapped in a jQuery collection
	 */
	getHTML: function() {
		return this.$marker;
	},

	/**
	 * Set the base location.
	 * @param {Number} location Base location
	 */
	setLocation: function( location ) {
		this.absoluteLocation = null;
		this.location = location;
	},

	/**
	 * Change the angle.
	 * @param {Number} angle New angle
	 */
	setAngle: function( angle ) {
		this.angle = angle;
	},

	/**
	 * Show or hide the marker.
	 * @param {Boolean} show Whether to show or hide the marker
	 */
	toggle: function( show ) {
		this.$marker.toggle( show );
	},

	/**
	 * Control whether the element should be highlighted.
	 * @param {Boolean} highlighted Whether the element should be highlighted
	 */
	setHighlighted: function( highlighted ) {
		throw new Error( 'Not implemented: setHighlighted' );
	},

	/**
	 * Show the element or update its appearance.
	 */
	show: function() {
		throw new Error( 'Not implemented: show' );
	},


	// "Protected" methods
	
	/**
	 * Start dragging the marker.
	 * Implementations must call this method when appropriate.
	 * @param {Number} x Absolute X coordinate where the action started
	 * @param {Number} y Absolute Y coordinate where the action started
	 */
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
	mouseUp: function() {
		this.mouseIsDown = false;
	},

	/**
	 * Drag the marker to a given location.
	 * Implementations must call this method when appropriate.
	 * @param {Number} x Absolute X coordinate to which the marker is being dragged
	 * @param {Number} y Absolute Y coordinate to which the marker is being dragged 
	 */
	mouseMove: function( x, y ) {
		var mouseAngle, newAngle;
		if (this.mouseIsDown){
			mouseAngle = calculateAngle( this.getAbsoluteLocation(), [x, y] );
			if ( mouseAngle !== null ){
				newAngle = mouseAngle - this.initialAngleDiff;
				$( this ).trigger( 'angleChanged.vtour', newAngle );
			}
		}
	},
	
	/**
	 * Initialize this.$marker with a suitable DOM node.
	 */
	generate: function() {
		throw new Error( 'Not implemented: generate' );
	},


	// "Private" methods	

	/**
 	 * Return the absolute location of the marker.
 	 * @return {Array} Absolute location of the marker
	 */
	getAbsoluteLocation: function() {
		var offset;
		if ( this.absoluteLocation === null ) {
			offset = this.$marker.parent().offset();
			this.absoluteLocation =
				sum( this.location, [offset.left, offset.top] );
		}
		return this.absoluteLocation;
	}
} );

