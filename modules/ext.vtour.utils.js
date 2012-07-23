/**
 * Miscellaneous utility functions.
 */

var DEG2RAD = Math.PI/180;

/**
 * Resize one or more elements so they fit in a box of a provided size, while preserving their proportions.
 *
 * @param {$Element} $elements  jQuery object containing DOM elements
 * @param {Number} width    maximum possible width of the elements after resizing
 * @param {Number} height   maximum possible height of the elements after resizing
 *
 * @return {$Image} original image (modified in place)
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
 *
 * @param {$Node} $node jQuery object containing one or more nodes to center
 * @param {$Node} $parent   jQuery object containing the parent node
 * @return {$Node} original node (modified in place)
 */
var center = function( $node, $parent ) {
	$node.addClass( 'vtour-centered' );
	if ( $parent.height() > $node.height() ) {
		$node.css( {'top': '50%',
			'margin-top': -$node.height() / 2} );
	} else { // No need to center horizontally
		$node.css( {'top': 0, 'margin-top': 0} );
	}
	if ( $parent.width() > $node.width() ) {
		$node.css( {'left': '50%',
			'margin-left': -$node.width() / 2} );
	} else { // No need to center vertically
		$node.css( {'left': 0, 'margin-left': 0} );
	}
	return $node;
};

/**
 * Create a button.
 *
 * @param {String} text desired text content of the button
 * @param {Boolean} enabled whether the created button must be enabled
 * @param {function} callback  function that will be called when the button is clicked
 * @return {$Element} a jQuery object which contains a button element
 */
var createButton = function( text, enabled, callback ) {
	return $( '<input></input>', {'type': 'button', 'value': text} )
			.prop( 'disabled', !enabled ).click( callback );
};

/**
 * Calculate a minimum bounding rectangle for a given set
 * of points: the rectangle with the smallest area which contains
 * all the points.
 *
 * @param {Number[][]} points   array of pairs of coordinates
 * @return minimum bounding rectangle:
 * {Number} x   left coordinate of the box
 * {Number} y   top coordinate of the box
 * {Number} width   width of the box
 * {Number} height  height of the box
 */
var calculateBoundingBox = function( points ) {
	var maxX = -Infinity;
	var maxY = -Infinity;
	var minX = Infinity;
	var minY = Infinity;
	for ( var i = 0; i < points.length; i++ ) {
		maxX = Math.max( maxX, points[i][0] );
		maxY = Math.max( maxY, points[i][1] );
		minX = Math.min( minX, points[i][0] );
		minY = Math.min( minY, points[i][1] );
	}
	return {'x': minX, 'y': minY,
		'width': maxX - minX,
		'height': maxY - minY};
};

var dotProduct = function(v1, v2){
	var product = 0;
	var pos;

	if (v1.length !== v2.length){
		throw new Error( 'Vectors must be the same length' );
	}

	for ( pos = 0; pos < v1.length; pos++ ){
		product += v1[pos]*v2[pos];
	}

	return product;
}

var hypotenuse = function( c1, c2 ) {
	var powC1 = c1 * c1;
	var powC2 = c2 * c2;
	return Math.sqrt( powC1 + powC2 );
}

var setPosition = function( $element, position, center ) {
	if ( center === undefined ) {
		center = true;
	}
	$element.css( {'position': 'absolute',
		'left': position[0] - ( center ? ( $element.width() / 2 ) : 0 ),
		'top': position[1] - ( center ? ( $element.height() / 2 ) : 0 )} );
}

/**
 * Scroll a view to reveal a different area of its contents.
 * @param {$Node} $element jQuery collection of DOM nodes to scroll
 * @param {Number[]} movement	movement ([x, y])
 * @param {Boolean} isAbsolute if true, the first argument is the new
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
}

var calculateCircumferencePoint = function( center, radius, angle ) {
	return [
		center[0] + radius * Math.cos( angle - Math.PI/2 ),
		center[1] + radius * Math.sin( angle - Math.PI/2 ),
	];
}

var calculateAngle = function( reference, point ) {
	var delta = sum( point, mult( reference, -1 ) );

	if (delta[0] !== 0 && delta[1] !== 0){
		return Math.atan2( delta[1], delta[0] );
	} else {
		return null;
	}
}

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
}

var mult = function( array, factor ) {
	var result = [];
	if ( !$.isArray( array ) ) {
		return null;
	}
	for ( index = 0; index < array.length; index++ ) {
		result.push( array[index] * factor );
	}
	return result;
}

var clone = function( object ) {
	var Clone = function(){};
	Clone.prototype = object;
	return new Clone();
}

var imageNameFromPath = function( path ) {
	var lastSlash = path.lastIndexOf( '/' );
	return decodeURIComponent( path.substr( lastSlash + 1 ) );
}

var supports2DCanvas = function() {
	return !!window.CanvasRenderingContext2D;
}
