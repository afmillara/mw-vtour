
module( 'ext.vtour', QUnit.newMwEnvironment() );

test( 'Loading images', 4, function() {
	var imgPath = mw.config.get('wgExtensionAssetsPath')
		+ '/Vtour/modules/img/reset.png';
	var $img = $( '<img></img>' );
	stop();
	loadImage( $img, imgPath, function() {
		start();
		equals( $img.width(), 20, 'Image width set' );
		equals( $img.height(), 20, 'Image height set' );
		equals( $img.data( 'nativeWidth' ), 20, 'Native image width stored' );
		equals( $img.data( 'nativeHeight' ), 20, 'Native image height stored' );
	}, function() {
		ok( false, 'Couldn\'t load the image' );
	} );
} );

test( 'Resizing images', 2, function() {
	var imgPath = mw.config.get('wgExtensionAssetsPath')
		+ '/Vtour/modules/img/loading.gif';
	var $img = $( '<img></img>' );
	var $resizedImg;
	stop();
	loadImage( $img, imgPath, function() {
		start();
		$resizedImg = resizeToFit( $img.clone( true ), 200, 200 );
		equals( $resizedImg.width() / $resizedImg.height(),
			$img.width() / $img.height(),
			'Image proportions preserved' );
		ok( $resizedImg.width() <= 200 && $resizedImg.height() <= 200,
			'Image not larger than provided size' );
	} );
} );

test( 'Calculating minimum bounding box', 4, function() {
	var box = calculateBoundingBox( [ [ -3, 4 ], [ 5, 8 ], [ 9, -10 ], [ 3, 14 ] ] );
	equals( box.x, -3, 'Starting x' );
	equals( box.y, -10, 'Starting y' );
	equals( box.width, 12, 'Box width' );
	equals( box.height, 24, 'Box height' );
} );

test( 'Calculating hypotenuses', 1, function() {
	equals( hypotenuse( 3, 4 ), 5, 'Hypotenuses are calculated correctly' );
} );

test( 'Utility functions for vectors', 6, function() {
	equals( dotProduct( [0, 1], [1, 0] ), 0, 'The dot product of orthogonal vectors is 0' );
	equals( dotProduct( [1, 3, -5], [4, -2, -1] ), 3,
		'Dot products are calculated for tridimensional vectors' );

	same( calculateMeanPoint( [[1, 2], [2, 2], [1, 1], [3, 0]] ), [1.75, 1.25],
		'Mean points are calculated' );

	same( sum( [1, 2, 3, 4], [5, 5, 2, 0] ), [6, 7, 5, 4], 'Vectors are summed' );
	same( sum( [1, 2, 3, 4], 3 ), [4, 5, 6, 7], 'Vectors and numbers are summed' );
	same( mult( [1, 2, 3, 4], 5 ), [5, 10, 15, 20], 'Vectors can be multiplied by numerical factors' );
} );

test( 'Utility functions for angles', 5, function() {
	var circumferencePoint = calculateCircumferencePoint( [0, 0], 3, 270 * DEG2RAD );
	same( [Math.round( circumferencePoint[0] ), Math.round( circumferencePoint[1] )], [-3, 0],
		'Points in a circumference are calculated' );
	equals( calculateAngle( [1, 0], [-3, 0] ), 90 * DEG2RAD, 'Angles are calculated' );
	ok( isNaN( calculateAngle( [0, 10], [0, 10] ) ),
		'NaN is returned by calculateAngle when the two points are the same' );
	equals( Math.round( normalizeAngle( 725 * DEG2RAD ) / DEG2RAD ), 5,
		'Angles > 360º are normalized' );
	equals( Math.round( normalizeAngle( -30 * DEG2RAD ) / DEG2RAD ), 330,
		'Angles < 0º are normalized' );
} );

