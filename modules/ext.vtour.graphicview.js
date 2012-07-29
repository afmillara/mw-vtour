
/**
 * Interactive view which provides a graphic interface for resizing or moving
 * its contents.
 * Subclasses must implement generateBackground(), move() and updateZoom()
 * to control the contents and the behavior when moving and zooming, respectively,
 * and updateLinkPosition([x, y]): [x, y] to translate link coordinates relative to
 * the content to coordinates in the GraphicView.
 * @class GraphicView
 */
var GraphicView = Class.extend( {

	enabledButtonOpacity: 1,
	disabledButtonOpacity: 0.3,

	/**
	 * Sensitivity of the mouse movement (the higher the more sensitive).
	 * @var {Number} moveSensitivity
	 */
	moveSensitivity: 1,

	/**
	 * Amount by which the zoom is increased or decreased every time
	 * a zoom button is pressed.
	 * @var {Number} zoomGranularity
	 */
	zoomGranularity: 0.1,

	/**
	 * Maximum possible zoom for the graphic view.
	 * @var {Number} maxZoom
	 */
	maxZoom: 5, //TODO: Ajustar en función del tamaño de la imagen.

	/**
	 * Minimum possible zoom for the graphic view.
	 * @var {Number} minZoom
	 */
	minZoom: 0.1,

	/**
	 * Current zoom (the higher the bigger the contents are).
	 * @var {Number} zoom
	 */
	zoom: 1,

	mouseLast: null,
	html: null,

	/**
	 * Create a new GraphicView.
	 * @constructor
	 */
	init: function( extraButtons ) {
		this.buttons = [];
		this.links = [];
	},

	/**
	 * Add a button to the view (before the HTML code is generated).
	 * @param {imageClass} Class that will be added to the button
	 * @param {function} callback Function that will be called when the
	 * button is clicked
	 * @param {Boolean} enabled Whether the element should be enabled.
	 * Default is true.
	 * @return $HTML A jQuery object which contains a button element
	 */
	addButton: function( imageClass, callback, enabled ) {
		var button = $( '<div></div>' )
			.addClass( imageClass ).click( callback );
		this.toggleButton( button, enabled || enabled === undefined );
		this.buttons.push( button );
		return button;
	},

	toggleButton: function( button, show ) {
		var opacity = show ? this.enabledButtonOpacity : this.disabledButtonOpacity;
		button.fadeTo( 0, opacity );
		button.toggleClass( 'vtour-button', show );
	},

	/**
	 * Generate the HTML code for this GraphicView.
	 * @return {$Node} Generated HTML node
	 */
	generate: function() {
		var that = this;
		var $bgLater, $nodeLayer, $buttonLayer, $repMovable;

		$bgLayer = this.generateBackground();
		if ( !$.isArray( $bgLayer ) ) {
			$bgLayer = [$bgLayer];
		}

		$nodeLayer = $( '<div></div>' ).addClass( 'vtour-nodelayer' );
		$buttonLayer = $( '<div></div>' ).addClass( 'vtour-buttonlayer' );
		$repMovable = $( '<div></div>' ).addClass( 'vtour-viewcontainer' );

		$repMovable.append.apply( $repMovable, $bgLayer );
		$repMovable.append( $nodeLayer );

		this.html = [$repMovable, $buttonLayer];

		this.createDefaultButtons();
		for ( var i = 0; i < this.buttons.length; i++ ) {
			$buttonLayer.append( this.buttons[i] );
		}

		$repMovable.mousedown( function( event ) {
			that.mouseLast = [event.pageX, event.pageY];
			return false;
		} );

		$repMovable.mousewheel( function( event, delta ) {
			that.changeZoom( that.zoomGranularity * delta );
			return false;
		} );

		$repMovable.on( 'selectstart dragstart', function( e ) {
			e.preventDefault();
		} );
		
		return this.html;
	},

	/**
	 * Update the GraphicView.
	 */
	update: function() {
		this.updateLinks();
	},

	/**
	 * Generate the background of this view.
	 * @return Array|$HTML An HTML element or an array of HTML elements
	 */
	generateBackground: function() {
		throw new Error( 'Not implemented: generateBackground' );
	},

	/**
	 * Scroll the view to reveal a different area of its contents.
	 * @param {Array} movement Movement
	 * @param {Boolean} isAbsolute If true, the first argument is the new
	 * center of the view. Otherwise, it is added to the current position
	 */
	move: function( movement, isAbsolute ) {
		throw new Error( 'Not implemented: move' );
	},

	/**
 	 * Update the zoom level in the view.
 	 */
	updateZoom: function() {
		this.toggleButton( this.incButton, this.canZoomIn() );
		this.toggleButton( this.decButton, this.canZoomOut() );
	},

	onMouseUp: function() {
	    this.mouseLast = null;
	},

	onMouseMove: function(x, y){
		if ( this.mouseLast !== null ) {
			this.move( [this.moveSensitivity * ( x - this.mouseLast[0] ),
					this.moveSensitivity * ( y - this.mouseLast[1] )] );
			this.mouseLast = [x, y];
		}
	},

	reset: function() {
	},

	/**
	 * Create the default buttons for this view.
	 */
	createDefaultButtons: function() {
		var that = this;
		this.incButton = this.addButton( 'vtour-buttonplus', function() {
			that.changeZoom( that.zoomGranularity );
		}, this.canZoomIn() );
		this.decButton = this.addButton( 'vtour-buttonminus', function() {
			that.changeZoom( -that.zoomGranularity );
		}, this.canZoomOut() );
	},

	/**
	 * Change the current zoom level.
	 * @param {Number} zoom New zoom value
	 * @param {Boolean} isAbsolute If true, the first argument will be the new zoom value.
	 * Otherwise, it will be added to the current one
	 */
	changeZoom: function( zoom, isAbsolute ) {
		if ( !isAbsolute ) {
			zoom += this.zoom;
		}
		if ( zoom > this.maxZoom ) {
			this.zoom = this.maxZoom;
		} else if ( zoom < this.minZoom ) {
			this.zoom = this.minZoom;
		} else {
			this.zoom = zoom;
		}
		this.updateZoom();
	},

	/**
	 * Determine whether the zoom level can be increased.
	 * @return {Boolean} true if the zoom level can be increased, false otherwise
	 */
	canZoomIn: function() {
		return this.zoom < this.maxZoom;
	},

	/**
	 * Determine whether the zoom level can be decreased.
	 * @return {Boolean} true if the zoom level can be decreased, false otherwise
	 */
	canZoomOut: function() {
		return this.zoom > this.minZoom;
	},

	/**
	 * Add an HTML node to the view.
	 * @param {$Node} HTML node
	 */
	addOver: function( htmlNode ) {
		this.html[0].children( '.vtour-nodelayer' ).append( htmlNode );
	},

	/**
	 * Add a link to the view.
	 * @param {Link} link Link that will be added
	 */
	addLink: function( link ) {
		var that = this;
		var elements, index;
		this.links.push( link );
		link.setPosCallback( function( position ) {
			var result, current, index;
			if ( $.isArray( position[0] ) ) {
				return that.updateMultiplePoints( position );
			} else {
				return that.updateSinglePoint( position );
			}

		} );
		elements = link.getHTML();
		if ( !$.isArray( elements ) ) {
			elements = [elements];
		}
		for ( var index = 0; index < elements.length; index++ ) {
			this.addOver( elements[index] );
		}
	},

	/**
	 * Update the placement of the links in the view.
	 */
	updateLinks: function() {
		$.each( this.links, function( i, link ) {
			link.updatePosition();
		} );
	},

	/**
	 * Translate an array of coordinates.
	 * @param {Array} position Array of pairs of coordinates
	 * @return Array|null Array of pairs of coordinates, or null if the
	 * given coordinates can't be translated
	 */
	updateMultiplePoints: function( position ) {
		var index;
		var current;
		var result = [];
		for ( index = 0; index < position.length; index++ ) {
			current = this.updateSinglePoint( position[index] );
			if ( current === null ) {
				return null;
			}
			result.push( current );
		}
		return result;
	},
	/**
	 * Translate a pair of coordinates.
	 * @param {Array} position Pair of coordinates
	 * @return Array|null Pair of coordinates, or null if the given coordinates
	 * can't be translated
	 */
	updateSinglePoint: function( position ) {
		throw new Error( 'Not implemented: updateSinglePoint' );
	}
} );

