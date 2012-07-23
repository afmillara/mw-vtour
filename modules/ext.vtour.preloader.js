
/**
 * Image preloader. Runs a callback function after all images have loaded.
 */
var Preloader = function() {
	
	/**
	 * List of images to preload.
	 * @var {Array} images
	 */
	var images = [];

	/**
	 * Number of images that haven't been loaded yet.
	 * @var {Number} pending
	 */
	var pending = 0;

	/**
	 * Callback function called when all images that could be loaded
	 * have been loaded.
	 * @var {function|null} callbackSuccess
	 */
	var callbackSuccess = null;

	/**
	 * Callback function called when an image fails to load.
	 * @var {function($Image)|null} callbackError
	 */
	var callbackError = null;

	/**
	 * Function to call when an image has loaded correctly.
	 */
	var imageLoadEnded = function() {
		--pending;
 		// If all images that can be loaded have been loaded
		if ( pending == 0 ) {
			doneLoading();
		}
	};

	/**
	 * Function to call when an image has failed to load.
	 * @param {$Image} $img Image that cannot be loaded
	 */
	var imageError = function( $img ) {
		callbackError( $img );
		$img.data( 'error', true );
		imageLoadEnded();
	}

	/**
	 * Function to call when all images that can be loaded have been loaded.
	 */
	var doneLoading = function() {
		// Clear the image array.
		images.length = 0; 
		callbackSuccess();
	};

	/**
	 * Adds a image to the list of images which will be loaded.
	 * @param path {String} path to the image
	 * @return {$Image} jQuery object containing the image which will be loaded
	 */
	this.add = function( path ) {
		var $img = $( '<img></img>' );
		images.push( {'obj': $img, 'src': path} );
		++pending;

		$img.load(function() {
			// Store the native size of the image
			$img.data( 'nativeHeight', $img[0].height );
			$img.data( 'nativeWidth', $img[0].width );

			// jQuery doesn't set the dimensions until the
			// element is in the DOM, so they are set
			// here explicitly
			$img.height( $img[0].height );
			$img.width( $img[0].width );

			imageLoadEnded();
		} );

		$img.error( function() {
			imageError( $img );
		} );

		return $img;
	};

	/**
	 * Starts loading the images.
	 * @param onLoad {function} function which will be called when the
	 * images are loaded
	 * @param onError {function} function which will be called when an
	 * image fails to load
	 */
	this.start = function( onLoad, onError ) {
		callbackSuccess = onLoad || $.noop;
		callbackError = onError || $.noop;
		if ( this.pending == 0 ){
			// If there are no images, end now
			doneLoading();
		}
		// Set the "src" attribute so the images start loading
		$.each( images, function( i, entry ) {
			entry.obj.attr( 'src', entry.src );
		} );
	};
};

