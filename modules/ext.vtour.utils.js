/**
 * Miscellaneous utility functions and constants.
 *
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 * 
 * @file
 */

/**
 * Miscellaneous utility functions and constants.
 * @class Utils
 */
// TODO: Make this an object.

/**
 * Radians in a degree.
 * @var {Number} DEG2RAD
 */
var DEG2RAD = Math.PI/180;

/**
 * Load an image.
 * @param {$Image} $img jQuery collection wrapping an image node
 * @param {String} src Image path
 * @param {function()} onLoad Function that will be called when the image
 * is loaded
 * @param {function()} onError Function that will be called if the image
 * cannot be loaded
 * @return $Image Image node that was passed as a parameter
 */
var loadImage = ( function() {
	var reallyLoad, loadEnded;
	var loading = false;
	var imageList = [];

	loadEnded = function() {
		loading = false;
		if ( imageList.length > 0 ) {
			reallyLoad( imageList.shift() );
		}
	};

	reallyLoad = function( imageInfo ) {
		loading = true;

		imageInfo.$img.one( 'load', function() {
			// Store the native size of the image
			imageInfo.$img.data( 'nativeHeight', imageInfo.$img[0].height );
			imageInfo.$img.data( 'nativeWidth', imageInfo.$img[0].width );

			// jQuery doesn't set the dimensions until the
			// element is in the DOM, so they are set
			// here explicitly
			imageInfo.$img.height( imageInfo.$img[0].height );
			imageInfo.$img.width( imageInfo.$img[0].width );

			loadEnded();
			( imageInfo.onLoad || $.noop )( imageInfo.$img );
		} ).one( 'error', function() {
			loadEnded();
			( imageInfo.onError || $.noop )();
		} );
		// one() is used instead of error() because sometimes handlers
		//  fired for the wrong image
		
		imageInfo.$img.attr( 'src', imageInfo.src );
	};

	return function( $img, src, onLoad, onError ) {
		var imageInfo = {
			$img: $img,
			src: src,
			onLoad: onLoad,
			onError: onError
		};

		if ( loading ) {
			imageList.push( imageInfo );
		} else {
			reallyLoad( imageInfo );
		}

		return $img;
	};
} )();

/**
 * Resize one or more elements so they fit in a box of a provided size, while
 * preserving their proportions.
 * @param {$HTML} $elements jQuery object containing DOM elements
 * @param {Number} width Maximum possible width of the elements after resizing
 * @param {Number} height Maximum possible height of the elements after resizing
 * @return $HTML Original elements (modified in place)
 */
var resizeToFit = function( $elements, width, height ) {
	var nativeWidth = $elements.data( 'nativeWidth' );
	var nativeHeight = $elements.data( 'nativeHeight' );
	if ( width / nativeWidth < height / nativeHeight ) {
		// The new image width must be the specified width.
		// The other dimension is changed in order to preserve
		// image proportions
		$elements.height( width / nativeWidth * nativeHeight );
		$elements.width( width );
	} else {
		// The new image height must be the specified height.
		$elements.width( height / nativeHeight * nativeWidth );
		$elements.height( height );
	}
	return $elements;
};

/**
 * Center a node (both horizontally and vertically) in its parent.
 * @param {$HTML} $node jQuery object containing one or more nodes to center
 * @param {$HTML} $parent jQuery object containing the parent node
 * @return $HTML Original node (modified in place)
 */
var center = function( $node, $parent ) {
	$node.addClass( 'vtour-centered' );
	if ( $parent.height() > $node.height() ) {
		$node.css( {'top': '50%',
			'margin-top': -$node.height() / 2} );
	} else {
		// No need to center horizontally
		$node.css( {'top': 0, 'margin-top': 0} );
	}
	if ( $parent.width() > $node.width() ) {
		$node.css( {'left': '50%',
			'margin-left': -$node.width() / 2} );
	} else {
		// No need to center vertically
		$node.css( {'left': 0, 'margin-left': 0} );
	}
	return $node;
};

/**
 * Calculate a minimum bounding rectangle for a given set
 * of points: the rectangle with the smallest area which contains
 * all the points.
 * @param {Number[][]} points Array of pairs of coordinates
 * @return minimum bounding rectangle:
 * {"x": left coordinate of the box, "y": top coordinate of the box,
 * "width": width of the box, "height": height of the box}
 */
var calculateBoundingBox = function( points ) {
	var maxX = -Infinity;
	var maxY = -Infinity;
	var minX = Infinity;
	var minY = Infinity;
	var index, current;
	for ( index = 0; index < points.length; index++ ) {
		current = points[index];
		maxX = Math.max( maxX, current[0] );
		maxY = Math.max( maxY, current[1] );
		minX = Math.min( minX, current[0] );
		minY = Math.min( minY, current[1] );
	}
	return {
		'x': minX,
		'y': minY,
		'width': maxX - minX,
		'height': maxY - minY
	};
};

/**
 * Calculate the dot product of two vectors.
 * @param {Number[]} v1 First vector
 * @param {Number[]} v2 Seconde vector
 * @return Number Dot product
 */
var dotProduct = function(v1, v2){
	var product = 0;
	var index;
	if (v1.length !== v2.length){
		throw new Error( 'Vectors must be the same length' );
	}
	for ( index = 0; index < v1.length; index++ ){
		product += v1[index] * v2[index];
	}
	return product;
};

/**
 * Calculate the length of the hypotenuse of a right-angled triangle,
 * given the catheti.
 * @param {Number} c1 Lenght of one cathetus
 * @param {Number} c2 Lenght of the other cathetus
 * @return Number Lenght of the hypotenuse
 */
var hypotenuse = function( c1, c2 ) {
	var powC1 = c1 * c1;
	var powC2 = c2 * c2;
	return Math.sqrt( powC1 + powC2 );
};

/**
 * Set the position of an element.
 * @param {$HTML} $element Element that will be moved
 * @param {Number[]} position New position of the element ([x, y])
 * @param {Boolean} center true if the center of the element is to be placed
 * on the given coordinates, false if the upper left corner of the element
 * will be put there. The default value is true
 */
var setPosition = function( $element, position, center ) {
	if ( center === undefined ) {
		center = true;
	}
	$element.css( {
		'position': 'absolute',
		'left': position[0] - ( center ? ( $element.width() / 2 ) : 0 ),
		'top': position[1] - ( center ? ( $element.height() / 2 ) : 0 )
	} );
};

/**
 * Scroll a view to reveal a different area of its contents.
 * @param {$HTML} $element jQuery collection of DOM nodes to scroll
 * @param {Number[]} movement Movement ([x, y])
 * @param {Boolean} isAbsolute If true, the first argument is the new
 * center of the view. Otherwise, it is added to the current position
 */
var scroll = function( $element, movement, isAbsolute ) {
	var topLeftScroll;
	if ( isAbsolute ) {
		topLeftScroll = [movement[0] - $element.width() / 2,
				movement[1] - $element.height() / 2];
	} else {
		topLeftScroll = [$element.scrollLeft() - movement[0],
				$element.scrollTop() - movement[1]];
	} 
	$element.scrollLeft( topLeftScroll[0] );
	$element.scrollTop( topLeftScroll[1] );
};

/**
 * Calculate a point in a circumference.
 * @param {Number[]} center Center point of the circumference ([x, y])
 * @param {Number} radius Radius of the circumference
 * @param {Number} angle Angle formed by the line from the center
 * to the calculated point and the line from the center to 12 o'clock
 * (in radians)
 * @return Number[] Coordinates of the point in the circumference ([x, y])
 */
var calculateCircumferencePoint = function( center, radius, angle ) {
	return [
		center[0] + radius * Math.cos( angle - Math.PI / 2 ),
		center[1] + radius * Math.sin( angle - Math.PI / 2 )
	];
};

/**
 * Calculate the angle between the line from a reference point to another point
 * and the line from the reference point to 12 o'clock.
 * @param {Number[]} reference Reference point ([x, y])
 * @param {Number[]} point Other point ([x, y])
 * @return {Number} Angle (in radians), or NaN if the two points are the same
 */
var calculateAngle = function( reference, point ) {
	var delta = sum( point, mult( reference, -1 ) );

	if (delta[0] !== 0 || delta[1] !== 0){
		return Math.atan2( delta[1], delta[0] ) - Math.PI / 2;
	} else {
		return NaN;
	}
};

/**
 * Sum the elements of two arrays (a[i] + b[i]) of the same length, or the elements
 * of an array and a fixed number (a[i] + b).
 * @param {Number[]} a First array
 * @param {Number[]|Number} b Second array or number
 * @return Number[] Result
 */
var sum = function( a, b ) {
	var tmp, index;
	var c = [];
	if ( !$.isArray( a ) ) {
		return null;
	}
	if ( $.isArray( b ) ) {
		if ( b.length !== a.length ) {
			return null;
		}
		for ( index = 0; index < a.length; index++ ) {
			c.push( a[index] + b[index] );
		}
	} else {
		for ( index = 0; index < a.length; index++ ) {
			c.push( a[index] + b );
		}
	}
	return c;
};

/**
 * Multiply all the elements of an array by a given factor (array[i] * factor).
 * @param {Number[]} array Array of numbers
 * @param {Number} factor Factor
 * @return Number[] Result
 */
var mult = function( array, factor ) {
	var result = [];
	var index;
	if ( !$.isArray( array ) ) {
		return null;
	}
	for ( index = 0; index < array.length; index++ ) {
		result.push( array[index] * factor );
	}
	return result;
};

/**
 * Make a shallow copy of an object.
 * @param {Object} object Object that will be cloned
 * @return Object New object
 */
var clone = function( object ) {
	var Clone = function(){};
	Clone.prototype = object;
	return new Clone();
};

// FIXME: It would be better to send the image name and just recover it here.
/**
 * Extract an image name from a path to a file in MediaWiki.
 * @param {String} path URL
 * @return String Name of the image
 */
var imageNameFromPath = function( path ) {
	// MediaWiki image names can't contain slashes, so this should work
	var lastSlash = path.lastIndexOf( '/' );
	return decodeURIComponent( path.substr( lastSlash + 1 ) );
};

/**
 * Calculate an angle that is equivalent to a given one and is contained
 * in the interval [0, 2*PI).
 * @param {Number} angle Angle in radians
 * @return Number "Normalized" angle in radians
 */
var normalizeAngle = function( angle ) {
	angle %= Math.PI * 2;
	if ( angle < 0 ) {
		angle = Math.PI * 2 + angle;
	}
	return angle;
};

/**
 * Calculate a "mean point" of a series of 2D points, defined as the point
 * with mean X and mean Y.
 * @param {Number[][]} points Array of points (pairs of coordinates: [x, y])
 * @return Number[] Mean point ([x, y])
 */
var calculateMeanPoint = function( points ) {
	var total = [0, 0];
	var ii, jj;
	for ( ii = 0; ii < points.length; ii++ ) {
		for ( jj = 0; jj < points[ii].length; jj++ ) {
			total[jj] += points[ii][jj];
		}
	}
	return mult( total, 1 / points.length );
};

/**
 * Translate a pair of geographical coordinates to (or from) the [lon, lat] format
 * used internally, reversing the order if needed.
 * @param {Number[]} coordinates Pair of coordinates in the order used externally,
 * [lat, lon] by default
 * @return Number[] Array of coordinates in the internal format
 */
var translateGeographicCoordinates = function( coordinates ) {
	coordinates = [coordinates[0], coordinates[1]];
	if ( mw.config.get( 'wgVtourStandardLatLngOrder' ) ) {
		coordinates.reverse();
	}
	return coordinates;
};

/**
 * Find whether the browser supports the HTML5 Canvas element.
 * @return Boolean true if the browser supports the Canvas element,
 * false otherwise
 */
var supports2DCanvas = function() {
	return !!window.CanvasRenderingContext2D;
};


