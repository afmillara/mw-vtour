
/**
 * GraphicView that contains an image.
 * @class ImageView
 */
var ImageView = GraphicView.extend( {
	
	originalSize: null,

	zoom: null,

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
		this.originalSize = [
			this.$image.data( 'nativeWidth' ),
			this.$image.data( 'nativeHeight' )
		];
		return this.$image.addClass( 'vtour-background' );
	},

	update: function() {
		this.fitParent();
		this.updateZoom();
	},

	fitParent: function() {
		this.changeZoom( this.getZoomToFit(), true );
	},

	getZoomToFit: function() {
		var $repMovable = this.html[0];
		var horizontalRatio = $repMovable.parent().width() / this.originalSize[0];
		var verticalRatio = $repMovable.parent().height() / this.originalSize[1];
		return Math.min( horizontalRatio, verticalRatio );
	},

	updateZoom: function( zoom ) {
		var $repMovable = this.html[0];
		var width, height;
		var currentScroll;

		currentScroll = this.getScroll();
		this._super( zoom );

		resize( $repMovable.children(), this.zoom );
		center( $repMovable.children(), $repMovable );
		this.move( currentScroll, true );
		$repMovable.toggleClass( 'vtour-movable',
			this.$image.width() > $repMovable.width()
				|| this.$image.height() > $repMovable.height() );
		this.updateLinks();
	},

	move: function( movement, isAbsolute ) {
		var $image = this.$image;
		// If absolute: in pixels of the original image. Otherwise, in pixels of the
		// current image.
		if ( isAbsolute ) {
			movement = this.translateScroll( movement );
		}
		scroll( this.html[0], movement, isAbsolute );
	},

	/**
	 * Get the current center of the image in order to restore it later if needed.
	 * @return Array Center ([x, y])
	 */
	getScroll: function() {
		var $repMovable = this.html[0];
		var $image = this.$image;
		var relativeCenter = [
			$repMovable.width() < $image.width() ?
				$repMovable.width() / 2 + $repMovable.scrollLeft() :
					$image.width() / 2,
			$repMovable.height() < $image.height() ?
				$repMovable.height() / 2 + $repMovable.scrollTop() :
					$image.height() / 2
		];
		return this.contentPointToLinkPoint( relativeCenter );
	},

	translateScroll: function( linkPoint ) {
		var $repMovable = this.html[0];
		var $image = this.$image;
		var imagePoint = this.updateSinglePoint( linkPoint );
		return [
			$repMovable.width() < $image.width() ? imagePoint[0] : 0,
			$repMovable.height() < $image.height() ? imagePoint[1] : 0,
		];
	},

	contentPointToLinkPoint: function( contentPoint ) {
		return mult( contentPoint, 1/this.zoom );
	},

	updateSinglePoint: function( delta ) {
		return mult( delta, this.zoom );
	}
} );

