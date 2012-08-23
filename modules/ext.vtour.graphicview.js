/**
 * Interactive view that can be moved and zoomed.
 *
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 * 
 * @file
 */

/**
 * Interactive view which provides a graphic interface for resizing or moving
 * its contents.
 * Subclasses must implement generateBackground(), move() and updateZoom()
 * to control the contents and the behavior when moving and zooming, respectively,
 * and updateLinkPosition([x, y]): [x, y] to translate link coordinates relative to
 * the content to coordinates in the GraphicView.
 * When an error occurs in the view, the error.vtour event is triggered.
 * @class GraphicView
 */
//* class GraphicView {
var GraphicView = Class.extend( {

	/**
	 * Opacity (0-1) of an enabled interface button.
	 * @var {Number} enabledButtonOpacity
	 */
	//* protected Number enabledButtonOpacity;
	enabledButtonOpacity: 1,

	/**
	 * Opacity (0-1) of a disabled interface button.
	 * @var {Number} disabledButtonOpacity
	 */
	//* protected Number disabledButtonOpacity;
	disabledButtonOpacity: 0.3,

	/**
	 * Sensitivity of the mouse movement (the higher the more sensitive).
	 * @var {Number} moveSensitivity
	 */
	//* protected Number moveSensitivity;
	moveSensitivity: 1,

	/**
	 * Amount by which the zoom is increased or decreased every time
	 * a zoom button is pressed.
	 * @var {Number} zoomGranularity
	 */
	//* protected Number zoomGranularity;
	zoomGranularity: 0.1,

	/**
	 * Maximum possible zoom for the graphic view.
	 * @var {Number} maxZoom
	 */
	//* protected Number maxZoom;
	maxZoom: 1,

	/**
	 * Minimum possible zoom for the graphic view.
	 * @var {Number} minZoom
	 */
	//* protected Number minZoom;
	minZoom: 1,

	/**
	 * Current zoom (the higher the bigger the contents are).
	 * @var {Number} zoom
	 */
	//* protected Number zoom;
	zoom: 1,

	/**
	 * Last position of the mouse while dragging the view (x, y).
	 * @var {Number[]} mouseLast
	 */
	//* protected Number[] mouseLast;
	mouseLast: null,

	/**
	 * Container of all the elements of the view.
	 * @var {$HTML} viewContainer
	 */
	//* protected $HTML viewContainer;
	viewContainer: null,

	/**
	 * Layer that contains the background and can be moved.
	 * @var {$HTML} $movableLayer
	 */
	//* protected $HTML $movableLayer;
	$movableLayer: null,

	/**
	 * Layer that contains the interface buttons.
	 * @var {$HTML} $buttonLayer
	 */
	//* protected $HTML $buttonLayer;
	$buttonLayer: null,

	/**
	 * Image that is being loaded at the moment.
	 * @var {$Image} $imageBeingLoaded
	 */
	//* protected $Image $imageBeingLoaded;
	$imageBeingLoaded: null,

	//* protected void mouseUp();
	mouseUp: null,

	//* protected void mouseMove();
	mouseMove: null,

	/**
	 * Whether a "loading" symbol is being displayed.
	 * @var {Boolean} loadingBeingDisplayed
	 */
	//* protected Boolean loadingBeingDisplayed;
	loadingBeingDisplayed: false,

	/**
	 * Create a new GraphicView.
	 * @param {$HTML[]} extraButtons Array of additional buttons
	 * @constructor
	 */
	//* public void init( $HTML[] extraButtons );
	init: function( extraButtons ) {
		this.buttons = [];
		this.links = [];
	},

	/**
	 * Start loading an image. Trigger the ready.vtour event when the image
	 * is done loading. Only one image can be loaded at a time
	 * @param {$Image} $image Image object
	 * @param {string} imageSrc Path to the image
	 * @param {function( $Image )} onLoad Function to call when the image is loaded
	 * @return {$Image} Image object that was passed
	 */
	//* protected $Image loadImage( $Image $image, String imageSrc, function onLoad );
	loadImage: function( $image, imageSrc, onLoad ) {
		if ( this.$imageBeingLoaded !== null ) {
			throw new Error( 'Trying to load an image without waiting for the last one.' );
		}
		var that = this;
		this.$imageBeingLoaded = $image;
		loadImage( $image, imageSrc, function() {
			that.$imageBeingLoaded = null;
			that.removeBlockingLoading();
			( onLoad || $.noop )( $image );
			$( that ).trigger( 'ready.vtour' );
		}, function() {
			var message = mw.message( 'vtour-errordesc-filenotfound',
				imageNameFromPath( imageSrc ) );
			that.$imageBeingLoaded = null;
			that.removeBlockingLoading();
			that.showError( message );
		} );
		return $image;
	},

	/**
	 * Call a given function when the view is ready (immediately if the view is ready now).
	 * @param {function()} callback Function to call
	 */
	//* public void whenReadyDo( function callback );
	whenReadyDo: function( callback ) {
		if ( this.isReady() ) {
			callback();
		} else {
			$( this ).bind( 'ready.vtour', callback );
		}
	},

	/**
	 * Show an error message.
	 * @param {Message} message MediaWiki message object
	 */
	//* public void showError( Message message );
	showError: function( message ) {
		var description = mw.message( 'vtour-errorinside', message.toString() ).toString(); 
		this.$movableLayer.children().detach();
		this.$buttonLayer.children().detach();
		this.showMessage( description, this.$movableLayer );
		$( this ).trigger( 'error.vtour', message );
		this.error = true;
	},

	/**
	 * Show a symbol that indicates that the view is currently loading.
	 */
	//* protected void showLoading();
	showLoading: function() {
		var description = mw.message( 'vtour-loadingtext' ).toString();
		this.loadingBeingDisplayed = true;
		this.showMessage( mw.message( 'vtour-loading', description ).toString(),
			this.viewContainer );
	},

	/**
	 * Remove the 'loading' symbol, if present.
	 */
	//* protected void removeLoading();
	removeLoading: function() {
		this.loadingBeingDisplayed = false;
		this.viewContainer.find( '.vtour-loading' ).detach();
	},

	/**
	 * Show a 'loading' symbol, and remove everything else from the view.
	 */
	//* protected void showBlockingLoading();
	showBlockingLoading: function() {
		var ii;
		this.showLoading();
		this.$movableLayer.detach();
		this.$buttonLayer.detach();
	},

	/**
	 * Remove the 'loading' symbol, and restore the removed elements.
	 */
	//* protected void removeBlockingLoading();
	removeBlockingLoading: function() {
		var ii;
		this.viewContainer.append( this.$movableLayer );
		this.viewContainer.append( this.$buttonLayer );
		this.removeLoading();
	},

	/**
	 * Add a DOM element to a given parent and center it.
	 * @param {$HTML} $html DOM element that will be added
	 * @param {$HTML} $parent Element where the first one will be added
	 */
	//* protected void showMessage( $HTML $html, $HTML $parent );
	showMessage: function( $html, $parent ) {
		$html = $( $html );
		$parent.append( $html );
		center( $html, $parent );
	},

	/**
	 * Return whether an image is currently loading.
	 * @return Boolean Whether an image is currently loading
	 */
	//* protected Boolean isLoading();
	isLoading: function() {
		return this.$imageBeingLoaded !== null;
	},	

	/**
	 * Return whether the view is ready.
	 * @return Boolean Whether the view is ready
	 */
	//* protected Boolean isReady();
	isReady: function() {
		return !this.isLoading() && !this.error;
	},

	/**
	 * Add a button to the view (before the HTML code is generated).
	 * @param {String} imageClass Class that will be added to the button
	 * @param {function} callback Function that will be called when the
	 * button is clicked
	 * @param {String} tooltipMsgName Name of the tooltip message
	 * @param {Boolean} enabled Whether the element should be enabled.
	 * Default is true
	 * @return $HTML A jQuery object which contains a button element
	 */
	//* public $HTML addButton( String imageClass, function callback, String tooltipMsgName,
	//*	Boolean enabled );
	addButton: function( imageClass, callback, tooltipMsgName, enabled ) {
		var tooltip = mw.message( tooltipMsgName ).toString();
		var button = $( '<div></div>' )
			.attr( 'title', tooltip )
			.addClass( imageClass )
			.click( function( event ) {
				callback();
				event.stopPropagation();
				event.preventDefault();
			} );
		this.toggleButton( button, enabled || enabled === undefined );
		this.buttons.push( button );
		return button;
	},

	/**
	 * Enable or disable a button created with addButton().
	 * @param {$HTML} button Button to enable/disable
	 * @param {Boolean} show Whether to enable or disable the button
	 */
	//* public void toggleButton( $HTML button, Boolean show );
	toggleButton: function( button, show ) {
		var opacity = show ? this.enabledButtonOpacity : this.disabledButtonOpacity;
		button.fadeTo( 0, opacity );
		button.toggleClass( 'vtour-button', show );
	},

	/**
	 * Get the HTML code for this GraphicView.
	 * @return {$HTML} HTML node
	 */
	//* public $HTML getHTML();
	getHTML: function() {
		if ( this.viewContainer === null ) {
			this.viewContainer = $( '<div></div>' )
				.addClass( 'vtour-viewcontainer' );
			this.generate();
			this.viewContainer.append( this.$movableLayer, this.$buttonLayer );
		}
		return this.viewContainer;
	},

	/**
	 * Generate the view layers.
	 */
	//* protected void generate();
	generate: function() {
		var that = this;
		var $bgLayer, $nodeLayer, $buttonLayer, $movableLayer;

		$buttonLayer = this.$buttonLayer =
			$( '<div></div>' ).addClass( 'vtour-buttonlayer' );
		$movableLayer = this.$movableLayer =
			$( '<div></div>' ).addClass( 'vtour-repmovable' );

		$bgLayer = this.generateBackground();
		$nodeLayer = $( '<div></div>' ).addClass( 'vtour-nodelayer' );

		if ( !$.isArray( $bgLayer ) ) {
			$bgLayer = [$bgLayer];
		}

		$movableLayer.append.apply( $movableLayer, $bgLayer );
		$movableLayer.append( $nodeLayer );

		this.createDefaultButtons();
		for ( var i = 0; i < this.buttons.length; i++ ) {
			$buttonLayer.append( this.buttons[i] );
		}

		$movableLayer.mousedown( function( event ) {
			that.mouseLast = [event.pageX, event.pageY];
			$( document ).mousemove( that.mouseMove ).mouseup( that.mouseUp );
			return false;
		} );

		$movableLayer.mousewheel( function( event, delta ) {
			that.changeZoom( that.zoomGranularity * delta );
			return false;
		} );

		$movableLayer.bind( 'selectstart dragstart', function( e ) {
			e.preventDefault();
		} );

		this.mouseUp = function() {
			that.mouseLast = null;
			$( document )
				.unbind( 'mousemove', that.mouseMove )
				.unbind( 'mouseup', that.mouseUp );
		};

		this.mouseMove = function( event ) {
			var x = event.pageX;
			var y = event.pageY;
			if ( that.mouseLast !== null ) {
				that.move( [that.moveSensitivity * ( x - that.mouseLast[0] ),
				that.moveSensitivity * ( y - that.mouseLast[1] )] );
				that.mouseLast = [x, y];
			}
		};

		this.error = false;
	},

	/**
	 * Update the GraphicView.
	 */
	//* protected void update();
	update: function() {
		if ( this.isLoading() && !this.loadingBeingDisplayed ) {
			this.showBlockingLoading();
		} else if ( this.isReady() ) {	
			this.updateLinks();
		}
	},

	/**
	 * Generate the background of this view.
	 * @return $HTML[]|$HTML An HTML element or an array of HTML elements
	 */
	//* protected $HTML generateBackground();
	generateBackground: function() {
		throw new Error( 'Not implemented: generateBackground' );
	},

	/**
	 * Scroll the view to reveal a different area of its contents.
	 * @param {Number[]} movement Movement
	 * @param {Boolean} isAbsolute If true, the first argument is the new
	 * center of the view. Otherwise, it is added to the current position
	 */
	//* public void move( Number[] movement, Boolean isAbsolute );
	move: function( movement, isAbsolute ) {
		throw new Error( 'Not implemented: move' );
	},

	/**
	 * Update the zoom level in the view.
	 */
	//* protected void updateZoom();
	updateZoom: function() {
		this.toggleButton( this.incButton, this.canZoomIn() );
		this.toggleButton( this.decButton, this.canZoomOut() );
	},

	/**
	 * Reset the view to the original position.
	 */
	//* public void reset();
	reset: function() {
		this.update();
	},

	/**
	 * Create the default buttons for this view.
	 */
	//* protected Boolean createDefaultButtons();
	createDefaultButtons: function() {
		var that = this;
		this.incButton = this.addButton( 'vtour-buttonplus', function() {
			that.changeZoom( that.zoomGranularity );
		}, 'vtour-button-zoomin', this.canZoomIn() );
		this.decButton = this.addButton( 'vtour-buttonminus', function() {
			that.changeZoom( -that.zoomGranularity );
		}, 'vtour-button-zoomout', this.canZoomOut() );
	},

	/**
	 * Change the current zoom level.
	 * @param {Number} zoom New zoom value
	 * @param {Boolean} isAbsolute If true, the first argument will be the new zoom value.
	 * Otherwise, it will be added to the current one
	 */
	//* public void changeZoom( Number zoom, Boolean isAbsolute );
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
	//* protected Boolean canZoomIn();
	canZoomIn: function() {
		return this.zoom < this.maxZoom;
	},

	/**
	 * Determine whether the zoom level can be decreased.
	 * @return {Boolean} true if the zoom level can be decreased, false otherwise
	 */
	//* protected Boolean canZoomOut();
	canZoomOut: function() {
		return this.zoom > this.minZoom;
	},

	/**
	 * Add an HTML node to the view.
	 * @param {$HTML} HTML node
	 */
	//* public void addOver( $HTML htmlNode );
	addOver: function( htmlNode ) {
		this.$movableLayer.children( '.vtour-nodelayer' ).append( htmlNode );
	},

	/**
	 * Add a link to the view.
	 * @param {Link} link Link that will be added
	 */
	//* public void addLink( Link link );
	addLink: function( link ) {
		var that = this;
		var elements, index;
		this.links.push( link );
		link.setPosCallback( function( position ) {
			var result, current, index;
			if ( $.isArray( position[0] ) ) {
				return that.translateMultiplePoints( position );
			} else {
				return that.translateSinglePoint( position );
			}

		} );
		elements = link.getHTML();
		if ( !$.isArray( elements ) ) {
			elements = [elements];
		}
		for ( index = 0; index < elements.length; index++ ) {
			this.addOver( elements[index] );
		}
	},

	/**
	 * Update the placement of the links in the view.
	 */
	//* public void updateLinks();
	updateLinks: function() {
		$.each( this.links, function( i, link ) {
			link.updatePosition();
		} );
	},

	/**
	 * Translate an array of coordinates.
	 * @param {Number[][]} position Array of pairs of coordinates
	 * @return Number[][] Array of pairs of coordinates, or null if the
	 * given coordinates can't be translated
	 */
	//* protected void translateMultiplePoints( Number[][] position );
	translateMultiplePoints: function( position ) {
		var index;
		var current;
		var result = [];
		for ( index = 0; index < position.length; index++ ) {
			current = this.translateSinglePoint( position[index] );
			if ( current === null ) {
				return null;
			}
			result.push( current );
		}
		return result;
	},

	/**
	 * Translate a pair of coordinates.
	 * @param {Number[]} point Pair of coordinates
	 * @return Number[] Pair of coordinates, or null if the given coordinates
	 * can't be translated
	 */
	//* protected Number[] translateSinglePoint( Number[] point );
	translateSinglePoint: function( point ) {
		throw new Error( 'Not implemented: translateSinglePoint' );
	}
} );
//* }

