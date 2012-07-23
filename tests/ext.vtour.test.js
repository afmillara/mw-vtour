module( 'ext.vtour', QUnit.newMwEnvironment() );

test( 'Loading images', 4, function() {
	var preloader = new Preloader();
	var imgPath = mw.config.get('wgExtensionAssetsPath')
			+ '/Vtour/modules/img/iconoElemento.gif';
	var img1 = preloader.add( imgPath );
	var img2 = preloader.add( imgPath );
	stop();
	preloader.start( function() {
		start();
		equals( img1.width(), 25, 'Image width set' );
		equals( img1.height(), 25, 'Image height set' );
		equals( img2.data( 'nativeWidth' ), 25, 'Native image width stored' );
		equals( img2.data( 'nativeHeight' ), 25, 'Native image height stored' );
	}, function() {
		ok( false, 'Couldn\'t load the images' );
	} );
} );

test( 'Resizing images', 2, function() {
	var preloader = new Preloader();
	var imgPath = mw.config.get('wgExtensionAssetsPath')
			+ '/Vtour/modules/img/ojo.gif';
	testImg = preloader.add( imgPath );
	stop();
	preloader.start( function() {
		start();
		var resizedImg = resizeToFit( testImg.clone( true ), 200, 200 );
		equals( resizedImg.width() / resizedImg.height(),
			resizedImg.data( 'nativeWidth' ) / resizedImg.data( 'nativeHeight' ),
			'Image proportions preserved' );
		ok( resizedImg.width() <= 200 && resizedImg.height() <= 200,
			'Image not larger than provided size' );
	}, function() {
		ok( false, 'Couldn\'t load the image' );
	} );
} );

test( 'Calculating minimum bounding box', 4, function() {
	var box = calculateBoundingBox( [ [ -3, 4 ], [ 5, 8 ], [ 9, -10 ], [ 3, 14 ] ] );
	equals( box.x, -3, 'Starting x' );
	equals( box.y, -10, 'Starting y' );
	equals( box.width, 12, 'Box width' );
	equals( box.height, 24, 'Box height' );
} );
