
/**
 * GraphicView that contains a spherical panorama.
 * @class PanoView
 */ 
var PanoView = GraphicView.extend( {

	/**
	 * Maximum possible field of view.
	 * @var {Array} MAX_FOV
	 */
	MAX_FOV: [Math.PI*2, Math.PI],

	$image: null,
	image: null,
	$canvas: null,
	canvas: null,
	ctx: null,

	zoomGranularity: 50,
	moveSensitivity: 0.01,

	maxZoom: 100,
	minZoom: 100,

	/**
	 * Relation between the maximum zoom and the image quality.
	 * @var {Number} maxZoomMultiplier
	 */
	maxZoomMultiplier: 3,

	/**
	 * Internal zoom/external zoom ratio.
	 * @var {Number} baseZoom
	 */
	baseZoom: 200,

	/**
 	 * Current angle of the panorama viewer.
 	 * @var {Array} orientation
 	 */
	orientation: [0, 0],
	zoom: 200,

	/**
	 * Canvas that contains the panoramic image.
	 * @var {$Canvas} imageCanvas
	 */
	imageCanvas: null,

	/**
	 * Panoramic image data.
	 * @var {CanvasPixelArray} imageData
	 */
	imageData: null,

	/**
	 * Buffer where the generated images will be painted.
	 * @var {ImageData} destBuffer
	 */ 
	destBuffer: null,

	/**
	 * Destination buffer data.
	 * @var {CanvasPixelArray} destBufferData
	 */
	destBufferData: null,

	/**
	 * Field of view.
	 * @var {Array} FOV
	 */
	FOV: null,

	widthMul: null,
	heightMul: null,
	hsFOV: 0,
	vsFOV: 0,

	/**
	 * Create a new PanoView.
	 * @constructor
	 * @param {$Image} Equirectangular panoramic image
	 */
	init: function( $image ){
		this._super();
		this.$image = $image;
		this.image = $image[0];
		this.$canvas = $( '<canvas></canvas>' ).css( {
			'height': '100%',
			'width': '100%'
		} );
		this.canvas = this.$canvas[0];
		this.ctx = this.canvas.getContext( '2d' );
	},

	generateBackground: function() {
		return this.$canvas.addClass( 'vtour-background' );
	},

	/**
	 * Set the zoom level by specifying the external (1 => default) zoom
	 * value.
	 * @param {Number} zoom Zoom level
	 */
	changeExternalZoom: function( zoom ) {
		this.changeZoom( zoom * this.baseZoom, true );
	},

	reset: function() {
		this.changeZoom( this.baseZoom );
		this.move( [0, 0], true );
	},

	update: function() {
		var $repMovable = this.html[0];
		var wRatio, hRatio;

	    	if ( this.imageData === null ) {
			this.prepare();
		}

		if ( this.destBuffer === null
				|| this.canvas.width != $repMovable.width()
				|| this.canvas.height != $repMovable.height() ) {
			this.canvas.width = $repMovable.width();
			this.canvas.height = $repMovable.height();

			this.updateBuffer();	

			wRatio = this.FOV[0] < this.MAX_FOV[0]?
				Math.abs(2*Math.tan(this.FOV[0]/2)): Number.POSITIVE_INFINITY;
			hRatio = this.FOV[1] < this.MAX_FOV[1]?
				Math.abs(2*Math.tan(this.FOV[1]/2)): Number.POSITIVE_INFINITY;
			var hardMinZoom = Math.max(this.canvas.width/wRatio, this.canvas.height/hRatio);
			if (this.minZoom < hardMinZoom){
				this.minZoom = hardMinZoom;
				this.changeZoom( 0 );
			}
		}
		this._super();
		this.show();
	},

	/**
	 * Update the destination buffer.
	 */
	updateBuffer: function() {
		this.destBuffer = this.ctx.getImageData( 0, 0,
			this.canvas.width, this.canvas.height );
		this.destBufferData = this.destBuffer.data;
		for (var i = 0; i < 4 * this.canvas.width * this.canvas.height; i++ ){
			this.destBufferData[i] = 255;
		}
	},

	/**
	 * Create the image buffer and precalculate the field of view.
	 */
	prepare: function() {
		var possibleMaxZoom;

		this.html[0].addClass( 'vtour-movable' );

		this.imageCanvas = $( '<canvas></canvas>' )[0];
		this.imageCanvas.width = this.image.width;
		this.imageCanvas.height = this.image.height;

		var imageCtx = this.imageCanvas.getContext( '2d' );
		imageCtx.drawImage( this.image, 0, 0,
				this.image.width, this.image.height );

		this.imageData = imageCtx.getImageData( 0, 0,
				this.image.width, this.image.height ).data;

		this.FOV = [this.MAX_FOV[0], this.MAX_FOV[1]];
		var ratio = this.image.width / this.image.height / 2;
		if (ratio > 1){
			// FIXME: Was /= ratio - 0.1. Why?
			this.FOV[1] /= ratio;
		} else if ( ratio < 1 ) {
			this.FOV[0] *= ratio;
		}

		// Longitude -> pixel X
		this.widthMul = this.image.width / this.FOV[0];

		// Latitude -> pixel Y
		this.heightMul = ( this.image.height - 1 ) / this.FOV[1];

		this.hsFOV = this.FOV[0] / 2;
		this.vsFOV = this.FOV[1] / 2;

		possibleMaxZoom = Math.max(
			this.image.width / this.FOV[0],
			this.image.height / this.FOV[1]
		) * this.maxZoomMultiplier;
		this.maxZoom = Math.max( possibleMaxZoom, this.baseZoom );
	},

	updateZoom: function() {
		this._super();
		var wRatio = this.FOV[0] < this.MAX_FOV[0] ?
				Math.abs( 2 * Math.tan( this.FOV[0] / 2 ) ) : Number.POSITIVE_INFINITY;
		var hRatio = this.FOV[1] < this.MAX_FOV[1] ?
				Math.abs( 2 * Math.tan( this.FOV[1] / 2 ) ) : Number.POSITIVE_INFINITY;

		if ( wRatio * this.zoom < this.canvas.width
				|| hRatio * this.zoom < this.canvas.height ) {
			this.zoom = Math.max( this.canvas.width / wRatio, this.canvas.height / hRatio);
		}
		this.updateLinks();
		this.show();
	},

	/**
	 * Scroll the view to reveal a different area of its contents.
	 * @param {Number[]} movement	movement ([x, y])
	 * @param {Boolean} isAbsolute if true, the first argument is the new
	 * center of the view. Otherwise, it is substracted from the current position
	 */
	move: function( movement, isAbsolute ) {
		var orientation = this.orientation;
		var relativeMovement, absoluteMovement;
		var MAX_FOV = this.MAX_FOV;
		if ( isAbsolute ) {
			movement = translateGeographicCoordinates( movement );
		}
		for (var i = 0; i < 2; i++ ) {
			if ( isAbsolute ) {
				absoluteMovement = movement[i];
			} else {
				relativeMovement = movement[i] * this.baseZoom / this.zoom;
				absoluteMovement = orientation[i] - relativeMovement;
			}
			orientation[i] = absoluteMovement;
			/*if (FOV[i] < MAX_FOV[i]){
				var maxAngle = Math.atan2([canvas.height, canvas.width][i]/2,f);
				if (aPos[i] + maxAngle > FOV[i]/2){
					aPos[i] = FOV[i]/2 - maxAngle;
				} else if (aPos[i] - maxAngle < -FOV[i]/2){
					aPos[i] = -FOV[i]/2 + maxAngle;
				}
			}*/
		}
		if (orientation[1] > MAX_FOV[1] / 2 ) {
			orientation[1] = MAX_FOV[1] / 2;
		} else if ( orientation[1] < -MAX_FOV[1] / 2 ) {
			orientation[1] = -MAX_FOV[1] / 2;
		}
		this.updateLinks();
		$(this).trigger( 'panoOrientationChanged.vtour' );
		this.show();
	},

	changeAngle: function( angle ) {
		console.log(angle/DEG2RAD);
		this.move( [angle, 0], true );	
	},

	/**
	 * Paint a frame on the canvas.
	 */
	show: function() {
		var round = Math.round;
		var sin = Math.sin;
		var cos = Math.cos;
		var sqrt = Math.sqrt;
		var atan = Math.atan;
		var atan2 = Math.atan2;
		var PI = Math.PI;

		var widthMul = this.widthMul;
		var heightMul = this.heightMul;
		var hsFOV = this.hsFOV;
		var vsFOV = this.vsFOV;

		var imageWidth = this.image.width;

		var canvasWidth = this.canvas.width;
		var canvasHeight = this.canvas.height;

		var dX = this.canvas.width/2;
		var dY = this.canvas.height/2;

		var destBufferData = this.destBufferData;
		var imageData = this.imageData;

		var x, y;
		var sX, sY, sZ;
		var lat, lon;
		var pixelX, pixelY;

		var originPixel, destinationPixel;
		destinationPixel = 0;

		var baseLon = this.orientation[0];
		var baseLat = this.orientation[1];

		var basePos = [
			-this.zoom * cos( baseLat ) * cos( baseLon ),
			this.zoom * sin( baseLat ),
			this.zoom * cos( baseLat ) * sin( baseLon )
		];

		var xPx = sin( baseLon );
		var xPy = sin( baseLat ) * cos( baseLon );
		var yPy = cos( baseLat );
		var zPx = cos( baseLon );
		var zPy = -sin( baseLat ) * sin( baseLon );

		for ( y = 0; y < canvasHeight; y++ ) {
			sY = basePos[1] + yPy * ( y - dY );
			for ( x = 0; x < canvasWidth; x++ ) {
				sX = basePos[0] + xPx * ( x - dX ) + xPy * ( y - dY );
				sZ = basePos[2] + zPx * ( x - dX ) + zPy * ( y - dY );

				lat = atan( sY / sqrt( sX * sX + sZ * sZ ) );
				lon = atan2( sX, sZ ) + PI / 2;
				if ( lon > PI ) {
					lon = -( PI * 2 - lon );
				}

				pixelX = round( widthMul * ( lon + hsFOV ) );
				pixelY = round( heightMul * ( lat + vsFOV ) );
				originPixel = 4 * ( pixelY * imageWidth + pixelX );

				destBufferData[destinationPixel] = imageData[originPixel];
				destBufferData[destinationPixel+1] = imageData[originPixel+1];
				destBufferData[destinationPixel+2] = imageData[originPixel+2];
				destinationPixel += 4;
			}
		}

		this.ctx.putImageData( this.destBuffer, 0, 0 );
	},

	updateSinglePoint: function( delta ) { // TODO: Implement again, but in a sane way.
		var x, y;

		var PI = Math.PI;

		var sin = Math.sin;
		var cos = Math.cos;

		var baseLon, baseLat;
		var lon, lat;
		var xPx, xPy, yPy, zPx, zPy;
		var dX, dY;

		var basePos, linkPos;
		var slProp, lProp;
		var linkPoint;
		var diff;
		var index;
	
		delta = translateGeographicCoordinates( delta );
	
		baseLon = this.orientation[0];
		baseLat = this.orientation[1];

		lon = delta[0]*DEG2RAD;
		lat = delta[1]*DEG2RAD;

		xPx = sin( baseLon );
		xPy = sin( baseLat ) * cos( baseLon );
		yPy = cos( baseLat );
		zPx = cos( baseLon );
		zPy = -sin( baseLat ) * sin( baseLon );

		dX = this.canvas.width / 2;
		dY = this.canvas.height / 2;

		basePos = [
			-this.zoom * cos( baseLat ) * cos( baseLon ),
			this.zoom * sin( baseLat ),
			this.zoom * cos( baseLat ) * sin( baseLon )
		];

		linkPos = [
			-cos( lat ) * cos( lon ),
			sin( lat ),
			cos( lat ) * sin( lon )
		];

		//Intersection
		slProp = dotProduct( basePos, basePos ) / dotProduct( basePos, linkPos );
		lProp = Math.abs( slProp );

		linkPoint = [linkPos[0] * lProp, linkPos[1] * lProp, linkPos[2] * lProp];

		diff = [];
		for ( index = 0; index < basePos.length; index++ ) {
			diff.push( linkPoint[index] - basePos[index] );
		}

		if ( baseLat === PI/2 ){ // yPy ~= 0
			if ( baseLon === 0 ){ // xPx ~= 0
				y = diff[0] / xPy;
				x = diff[2] / zPx;
			} else if ( baseLon === PI / 2 ) { // zPx ~= 0
				y = diff[2] / zPy;
				x = diff[0] / xPx;
			} else {
				y = ( diff[2] * xPx / zPx - diff[0] ) / ( zPy * xPx / zPx - xPy );
				x = ( diff[0] - xPy * y ) / xPx;
			}
		} else {
			y = diff[1] / yPy;
			if ( baseLon === 0 ){ // xPx ~= 0
				x = diff[2] / zPx;
			} else {
				x = ( diff[0] - xPy * y ) / xPx;
			}
		}
		x += dX;
		y += dY;
		if ( slProp >= 0 ) {
			return [x, y];
		} else {
			return null;
		}
	}
});

/**
 * GraphicView that contains a spherical panorama, for browser that don't support
 * the Canvas element.
 * @class FallbackPanoView
 */
var FallbackPanoView = ImageView.extend( {

	getFOV: function() {
		// FIXME: Duplicated code.
		var FOV = [Math.PI*2, Math.PI];
		var width = this.$image.width();
		var height = this.$image.height();
		var ratio = width / height / 2;
		if (ratio > 1){
			FOV[1] /= ratio;
		} else if ( ratio < 1 ) {
			FOV[0] *= ratio;
		}
		return FOV;
	},

	contentPointToLinkPoint: function( contentPoint ) {
		var FOV = this.getFOV();
		var width = this.$image.width();
		var height = this.$image.height();
		contentPoint = sum( contentPoint, [-width / 2, -height / 2] );
		return translateGeographicCoordinates( [
			contentPoint[0] / width * FOV[0] / DEG2RAD,
			contentPoint[1] / height * FOV[1] / DEG2RAD
		] );
	},

	updateSinglePoint: function( delta ) {
		var width = this.$image.width();
		var height = this.$image.height();
		var FOV = this.getFOV();
		var distanceToCenter;
		delta = translateGeographicCoordinates( delta );
		distanceToCenter = [
			normalizeAngle( delta[0] * DEG2RAD + FOV[0] / 2 ),
			normalizeAngle( delta[1] * DEG2RAD + FOV[1] / 2 )
		];
		return [
			distanceToCenter[0] / FOV[0] * width,
			distanceToCenter[1] / FOV[1] * height
		];
	}
} );

