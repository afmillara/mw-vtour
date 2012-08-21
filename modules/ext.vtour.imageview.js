/**
 * View that displays an image.
 *
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 * 
 * @file
 */

/**
 * GraphicView that contains an image.
 * @class ImageView
 */
//* class ImageView extends GraphicView {
var ImageView = GraphicView.extend( {

	//* protected $Image $image;
	$image: null,

	//* protected Number typicalMinZoom;
	typicalMinZoom: 0.1,

	//* protected Number maxZoomMultiplier;
	maxZoomMultiplier: 2,

	/**
	 * Create a new ImageView.
	 * @param {String} imageSrc URL of the image that will be shown in this view
	 * @constructor
	 */
	//* public void init( String imageSrc );
	init: function( imageSrc ) {
		this._super();
		this.imageSrc = imageSrc;
	},

	/**
	 * Generate the contents of the ImageView.
	 * @return {$Image} image Content of the ImageView
	 */
	//* protected $Image generate();
	generateBackground: function() {
		var that = this;
		this.$image = $( '<img></img>' );
		this.loadImage( this.$image, this.imageSrc, function() {
			that.update();
		} );
		return this.$image.addClass( 'vtour-background' );
	},

	//* public void reset();
	reset: function() {
		this.changeZoom( 1, true );
		this._super();
	},

	//* public void update();
	update: function() {
		if ( this.isReady() ) {
			var realSizeZoom = this.getRealSizeZoom();
			this.minZoom = Math.min( this.typicalMinZoom, realSizeZoom );
			this.maxZoom = Math.max( 1, this.maxZoomMultiplier * realSizeZoom );
			this.updateZoom();
		}
		this._super();
	},

	//* protected void createDefaultButtons();
	createDefaultButtons: function() {
		var that = this;
		this._super();
		this.addButton( 'vtour-buttonfit', function() {
			that.changeZoom( 1, true );
		}, 'vtour-button-fitimage' );
		this.addButton( 'vtour-buttonrealsize', function() {
			that.changeExternalZoom( 1 );
		}, 'vtour-button-realsize' );
	},

	//* protected void updateZoom();
	updateZoom: function() {
		var $movableLayer = this.$movableLayer;
		var width, height;
		var scroll;

		if ( !this.isReady() ) {
			return;
		}

		this._super();
		scroll = this.getScroll();

		width = this.zoom * $movableLayer.parent().width();
		height = this.zoom * $movableLayer.parent().height();
		resizeToFit( $movableLayer.children(), width, height );
		center( $movableLayer.children(), $movableLayer );
		$movableLayer.toggleClass( 'vtour-movable',
			this.$image.width() > $movableLayer.width()
				|| this.$image.height() > $movableLayer.height() );

		this.move( scroll, true );
		this.updateLinks();
	},

	//* public void move( Number[] movement, Boolean isAbsolute );
	move: function( movement, isAbsolute ) {
		var $image = this.$image;
		if ( !this.isReady() ) {
			return;
		}
		// If absolute: in pixels of the original image. Otherwise, in pixels of the
		// current image.
		if ( isAbsolute ) {
			movement = this.translateSinglePoint( movement );
		}
		if ( movement !== null ) {
			scroll( this.$movableLayer, movement, isAbsolute );
		}
	},

	/**
	 * Set the zoom level by specifying the external (1 => real size) zoom
	 * value.
	 * @param {Number} zoom Zoom level
	 */
	//* public void changeExternalZoom( Number zoom );
	changeExternalZoom: function( zoom ) {
		this.changeZoom( zoom * this.getRealSizeZoom(), true );
	},

	/**
	 * Calculate the internal (1 => filling the parent element) zoom level that
	 * matches an external (1 => real size of the image) zoom level of 1.
	 * @return Number Zoom level
	 */
	//* protected Number getRealSizeZoom();
	getRealSizeZoom: function() {
		var $image = this.$image;
		var $movableLayer = this.$movableLayer;
		return Math.min(
			$image.data( 'nativeWidth' ) / $movableLayer.parent().width(),
			$image.data( 'nativeHeight' ) / $movableLayer.parent().height()
		);
	},

	/**
	 * Get the current value of the scroll in order to restore it later if needed.
	 * @return Number[] Scroll ([horizontal, vertical])
	 */
	//* protected Number[] getScroll();
	getScroll: function() {
		var $movableLayer = this.$movableLayer;
		// FIXME: Scrolling doesn't always work as it should. $movableLayer -> $image in some cases?
		var relativeCenter = [
			$movableLayer.scrollLeft() + $movableLayer.width() / 2,
			$movableLayer.scrollTop() + $movableLayer.height() / 2
		];
		return this.contentPointToLinkPoint( relativeCenter );
	},

	//* protected Number[] contentPointToLinkPoint( Number[] contentPoint );
	contentPointToLinkPoint: function( contentPoint ) {
		var $image = this.$image;
		return [
			contentPoint[0] / $image.width() * $image.data( 'nativeWidth' ),
			contentPoint[1] / $image.height() * $image.data( 'nativeHeight' )
		];
	},

	//* protected Number[] translateSinglePoint( Number[] point );
	translateSinglePoint: function( point ) {
		var $image = this.$image;
		var result = [
			point[0] * $image.width() / $image.data( 'nativeWidth' ),
			point[1] * $image.height() / $image.data( 'nativeHeight' )
		];
		result[0] = limitToRange( result[0], 0, $image.width() - 1 );
		result[1] = limitToRange( result[1], 0, $image.height() - 1 );
		return result;
	}
} );
//* }

