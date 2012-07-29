
/**
 * GraphicView that contains an image.
 * @class ImageView
 */
var ImageView = GraphicView.extend( {

	$image: null,

	typicalMinZoom: 0.1,
	maxZoomMultiplier: 2,

	/**
	 * Create a new ImageView.
	 * @constructor
	 * @param {$Image} $image Image that will be shown in this view
	 * @param {Array} extraButtons Buttons to add to the interface along
	 * the default ones (optional)
	 */
	init: function( $image, extraButtons ) {
		this._super( extraButtons );
		this.$image = $image;
	},

	/**
	 * Generate the contents of the ImageView.
	 * @return {$Image} image Content of the ImageView
	 */
	generateBackground: function() {
		return this.$image.addClass( 'vtour-background' );
	},

	update: function() {
		var realSizeZoom = this.getRealSizeZoom();
		this.minZoom = Math.min( this.typicalMinZoom, realSizeZoom );
		this.maxZoom = Math.max( 1, this.maxZoomMultiplier * realSizeZoom );
		this.updateZoom();
		this._super();
	},

	createDefaultButtons: function() {
		var that = this;
		return this._super().concat( [
			createButton( '1', true, function() {
				that.changeZoom( that.getRealSizeZoom() );
			} )
		] );
	},

	updateZoom: function() {
		var $repMovable = this.html[0];
		var width, height;
		var scroll;

		this._super();
		scroll = this.getScroll();

		width = this.zoom * $repMovable.parent().width();
		height = this.zoom * $repMovable.parent().height();
		resizeToFit( $repMovable.children(), width, height );
		center( $repMovable.children(), $repMovable );
		$repMovable.toggleClass( 'vtour-movable',
			this.$image.width() > $repMovable.width()
				|| this.$image.height() > $repMovable.height() );

		this.move( scroll, true );
		this.updateLinks();
	},

	move: function( movement, isAbsolute ) {
		var $image = this.$image;
		// If absolute: in pixels of the original image. Otherwise, in pixels of the
		// current image.
		if ( isAbsolute ) {
			movement = this.updateSinglePoint( movement );
		}
		if ( movement !== null ) {
			scroll( this.html[0], movement, isAbsolute );
		}
	},

	/**
	 * Set the zoom level by specifying the external (1 => real size) zoom
	 * value.
	 * @param {Number} zoom Zoom level
	 */
	changeExternalZoom: function( zoom ) {
		this.changeZoom( zoom * this.getRealSizeZoom(), true );
	},

	/**
	 * Calculate the internal (1 => filling the parent element) zoom level that
	 * matches an external (1 => real size of the image) zoom level of 1.
	 * @return Number Zoom level
	 */
	getRealSizeZoom: function() {
		var $image = this.$image;
		var $repMovable = this.html[0];
		return Math.min(
			$image.data( 'nativeWidth' ) / $repMovable.parent().width(),
			$image.data( 'nativeHeight' ) / $repMovable.parent().height()
		);
	},

	/**
	 * Get the current value of the scroll in order to restore it later if needed.
	 * @return Array Scroll ([horizontal, vertical])
	 */
	getScroll: function() {
		var $repMovable = this.html[0];
		// FIXME: Scrolling doesn't always work as it should. $repMovable -> $image in some cases?
		var relativeCenter = [
			this.html[0].scrollLeft() + $repMovable.width() / 2,
			this.html[0].scrollTop() + $repMovable.height() / 2
		];
		return this.contentPointToLinkPoint( relativeCenter );
	},

	contentPointToLinkPoint: function( contentPoint ) {
		var $image = this.$image;
		return [
			contentPoint[0] / $image.width() * $image.data( 'nativeWidth' ),
			contentPoint[1] / $image.height() * $image.data( 'nativeHeight' )
		];
	},

	updateSinglePoint: function( delta ) {
		var $image = this.$image;
		var result = [
			delta[0] * $image.width() / $image.data( 'nativeWidth' ),
			delta[1] * $image.height() / $image.data( 'nativeHeight' )
		];
		if ( result[0] < 0 || result[0] >= $image.width()
				|| result[1] < 0 || result[1] >= $image.height() ) {
			return null;
		} else {
			return result;
		}
	}
} );

