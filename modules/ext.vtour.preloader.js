/**
 * Image preloader. Runs a callback function after all images have loaded.
 */

var Preloader = function() {
	var images = [];
	var pending = 0;
	var callbackSuccess = null;
	var callbackError = null;

	var imageLoadEnded = function() {
		--pending;
		if ( pending == 0 ) { // If all images are loaded
			doneLoading();
		}
	};

	var imageError = function( $img ) {
		callbackError( $img );
		imageLoadEnded();
	}

	var doneLoading = function() {
		images.length = 0; // Clear the image array
		callbackSuccess();
	};

	/**
	 * Adds a image to the list of images which will be loaded.
	 * @param path {String} path to the image
	 * @return {$Image} jQuery object containing the image which will be loaded
	 */
	this.add = function( path ) {
		var $img = $( "<img></img>" );
		images.push( {"obj": $img, "src": path} );
		++pending;

		$img.load(function() {
			// Store the native size of the image
			$img.data( "nativeHeight", $img[0].height );
			$img.data( "nativeWidth", $img[0].width );

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
	 * @param onLoad {function()} function which will be called when the images are loaded
	 */
	this.start = function( onLoad, onError ) {
		callbackSuccess = onLoad;
		callbackError = onError;
		if ( this.pending == 0 ){
			// If there are no images, end now
			doneLoading();
		}
		// Set the "src" attribute so the images start loading
		$.each( images, function( i, entry ) {
			entry.obj.attr( "src", entry.src );
		} );
	};
};
