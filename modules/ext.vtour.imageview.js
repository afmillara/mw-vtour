
/**
 * GraphicView that contains an image.
 * @class ImageView
 */
var ImageView = GraphicView.extend( {

	/**
	 * Create a new ImageView.
	 * @constructor
	 * @param {Array} extraButtons Buttons to add to the interface along the default ones
	 * @param {$Image} $image Image that will be shown in this view
	 */
	init: function( extraButtons, $image ) {
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

	/**
	 * Update the ImageView.
	 */
	update: function() {
		this.updateZoom();
		this.updateLinks();
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
			movement = [
				movement[0] / $image.data( 'nativeWidth' ) * $image.width(),
				movement[1] / $image.data( 'nativeHeight' ) * $image.height()	
			];
		}
		scroll( this.html[0], movement, isAbsolute );
	},

	/**
	 * Get the current value of the scroll in order to restore it later if needed.
	 * @return Array Scroll ([horizontal, vertical])
	 */
	getScroll: function() {
		var $repMovable = this.html[0];
		var $image = this.$image;
		var relativeCenter = [
			this.html[0].scrollLeft() + $repMovable.width() / 2,
			this.html[0].scrollTop() + $repMovable.height() / 2
		];
		return [
			relativeCenter[0] / $image.width() * $image.data( 'nativeWidth' ),
			relativeCenter[1] / $image.height() * $image.data( 'nativeHeight' )
		];
	},

	updateSinglePoint: function( delta ) {
		return [delta[0] * this.$image.width() / this.$image.data( 'nativeWidth' ),
				delta[1] * this.$image.height() / this.$image.data( 'nativeHeight' )];
	}
} );

