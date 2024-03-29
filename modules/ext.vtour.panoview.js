/**
* View that displays a panorama.
*
* Vtour - a virtual tour system for MediaWiki
* Copyright (C) 2012 Álvaro Fernández Millara
* 
* @file
*/

/**
* GraphicView that contains a spherical panorama.
* @class PanoView
*/ 
var PanoView = GraphicView.extend( {
	
	/**
	 * Maximum possible field of view.
	 * @var {Number[]} MAX_FOV
	 */
	MAX_FOV: [Math.PI*2, Math.PI],
	
	$image: null,
	
	image: null,
	
	$canvas: null,
	
	canvas: null,
	
	ctx: null,
	
	zoomGranularity: 50,
	
	moveSensitivity: 0.01,
	
	maxZoom: 200,
	
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
	 * @var {Number[]} orientation
	 */
	orientation: [0, 0],
	
	zoom: 200,
	
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
	 * @var {Number[]} FOV
	 */
	FOV: null,
	
	widthMul: null,
	
	heightMul: null,
	
	hsFOV: 0,
	
	vsFOV: 0,
	
	/**
	 * Create a new PanoView.
	 * @param {String} imageSrc URL of the image that will be shown in this view
	 * @constructor
	 */
	init: function( imageSrc ){
		this._super();
		this.imageSrc = imageSrc;
		this.$canvas = $( '<canvas></canvas>' ).css( {
			'height': '100%',
			'width': '100%'
		} );
		this.canvas = this.$canvas[0];
		this.ctx = this.canvas.getContext( '2d' );
	},
	
	generateBackground: function() {
		var that = this;
		this.$image = $( '<img></img>' );
		this.loadImage( this.$image, this.imageSrc, function() {
			that.image = that.$image[0];
			that.update();
		} );
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
		this._super();
	},
	
	update: function() {
		var $movableLayer = this.$movableLayer;
		var wRatio, hRatio;
		if ( this.isReady() ) {
			if ( this.imageData === null ) {
				this.prepare();
			}
			// isReady is checked again because prepare may cause an error.
			if ( this.isReady() && this.destBuffer === null
					|| this.canvas.width != $movableLayer.width()
					|| this.canvas.height != $movableLayer.height() ) {
				this.canvas.width = $movableLayer.width();
				this.canvas.height = $movableLayer.height();
	
				this.updateBuffer();	
	
				wRatio = this.FOV[0] < this.MAX_FOV[0]?
					Math.abs(2*Math.tan(this.FOV[0]/2)): Number.POSITIVE_INFINITY;
				hRatio = this.FOV[1] < this.MAX_FOV[1]?
					Math.abs(2*Math.tan(this.FOV[1]/2)): Number.POSITIVE_INFINITY;
				var hardMinZoom = Math.max(this.canvas.width/wRatio,
					this.canvas.height/hRatio);
				if (this.minZoom < hardMinZoom){
					this.minZoom = hardMinZoom;
				}
				this.updateZoom();
			}
		}
		this._super();
		if ( this.isReady() ) {
			this.show();
		}
	},
	
	/**
	 * Update the destination buffer.
	 */
	updateBuffer: function() {
		if ( this.canvas.width && this.canvas.height ) {
			this.destBuffer = this.ctx.getImageData( 0, 0,
				this.canvas.width, this.canvas.height );
			this.destBufferData = this.destBuffer.data;
		} else {
			this.destBufferData = [];
		}
		for (var i = 0; i < 4 * this.canvas.width * this.canvas.height; i++ ){
			this.destBufferData[i] = 255;
		}
	},
	
	/**
	 * Create the image buffer and precalculate the field of view.
	 */
	prepare: function() {
		var possibleMaxZoom;
		var imageCanvas;
		var imageCtx;
	
		this.$movableLayer.addClass( 'vtour-movable' );
	
		imageCanvas = $( '<canvas></canvas>' )[0];
		imageCanvas.width = this.image.width;
		imageCanvas.height = this.image.height;
	
		imageCtx = imageCanvas.getContext( '2d' );
		imageCtx.drawImage( this.image, 0, 0,
				this.image.width, this.image.height );
	
		try {
			this.imageData = imageCtx.getImageData( 0, 0,
				this.image.width, this.image.height ).data;
		} catch ( error ) {
			// Probably a security error.
			this.showError( mw.message( 'vtour-errordesc-canvaserror',
				imageNameFromPath( this.imageSrc ) ) );
			return;
		}
	
		this.FOV = [this.MAX_FOV[0], this.MAX_FOV[1]];
		var ratio = this.image.width / this.image.height / 2;
		if (ratio > 1){
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
		if ( !this.isReady() || !this.FOV ) {
			return;
		}
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
	 * Scroll the view to reveal a different area of its contents. panoOrientationChanged
	 * is triggered whenever the longitude value is modified.
	 * @param {Number[]} movement	movement ([x, y])
	 * @param {Boolean} isAbsolute if true, the first argument is the new
	 * center of the view. Otherwise, it is substracted from the current position
	 */
	move: function( movement, isAbsolute ) {
		var orientation = this.orientation;
		var relativeMovement, absoluteMovement;
		var MAX_FOV = this.MAX_FOV;
		var i;

		if ( !this.isReady() ) {
			return;
		}
	
		if ( isAbsolute ) {
			// FIXME: Internally, longitude is -180 E to 180 W, and latitude
			// is -90 N to 90 S, while the standard is the opposite. This should
			// be fixed in show() and similar places rather than here.
			movement = mult( movement, -1 );
			movement = translateGeographicCoordinates( movement );
		}
		for (i = 0; i < 2; i++ ) {
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

		for ( i = 0; i < 2; i++ ) {
			orientation[i] = normalizeAngle( orientation[i] + Math.PI ) - Math.PI;
		}

		this.updateLinks();	
		$( this ).trigger( 'panoOrientationChanged.vtour' );
		this.show();
	},

	changeAngle: function( angle ) {
		var center = mult(
			translateGeographicCoordinates( [angle, this.orientation[1]] ), -1
		);
		this.move( center, true );	
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

		var dX = ( this.canvas.width - 1 ) / 2;
		var dY = (this.canvas.height - 1 ) / 2;

		var destBufferData = this.destBufferData;
		var imageData = this.imageData;

		var x, y;
		var sX, sY, sZ;
		var lat, lon;

		var pixelX, pixelY;

		var originPixel;
		var destinationPixel = 0;

		var baseLon = this.orientation[0];
		var baseLat = this.orientation[1];

		var baseX = -this.zoom * cos( baseLat ) * cos( baseLon );
		var baseY = this.zoom * cos( baseLat ) * sin( baseLon );
		var baseZ = this.zoom * sin( baseLat );

		var xPx = sin( baseLon );
		var xPy = sin( baseLat ) * cos( baseLon );
		var yPx = cos( baseLon );
		var yPy = -sin( baseLat ) * sin( baseLon );
		var zPy = cos( baseLat );

		var latCache = [];
		var lonCache = [];

		var canvasHalf = canvasWidth / 2;
		var canvasRev = canvasWidth - 1;

		for ( y = 0; y < canvasHeight; y++ ) {
			sZ = baseZ + zPy * ( y - dY );
			for ( x = 0; x < canvasWidth; x++ ) {
				if ( x >= canvasHalf ) {
					lat = latCache[canvasRev - x];
					lon = 2 * baseLon - lonCache[canvasRev - x];
				} else {
					sX = baseX + xPx * ( x - dX ) + xPy * ( y - dY );
					sY = baseY + yPx * ( x - dX ) + yPy * ( y - dY );

					lat = atan( sZ / sqrt( sX * sX + sY * sY ) );
					lon = atan2( sX, sY ) + PI / 2;

					latCache[x] = lat;
					lonCache[x] = lon;
				}

				if ( lon > PI ) {
					lon = -( PI * 2 - lon );
				}
				if ( lon < -PI ) {
					lon = PI * 2 + lon;
				}

				pixelX = round( widthMul * ( lon + hsFOV ) );
				pixelY = round( heightMul * ( lat + vsFOV ) );
				originPixel = 4 * ( pixelY * imageWidth + pixelX );

				destBufferData[destinationPixel + 0] = imageData[originPixel + 0];
				destBufferData[destinationPixel + 1] = imageData[originPixel + 1];
				destBufferData[destinationPixel + 2] = imageData[originPixel + 2];
				destinationPixel += 4;
			}
		}
		if ( this.destBuffer !== null ) {
			this.ctx.putImageData( this.destBuffer, 0, 0 );
		}
	},

	translateSinglePoint: function( point ) {
		var x, y;

		var PI = Math.PI;

		var sin = Math.sin;
		var cos = Math.cos;

		var baseLon, baseLat;
		var lon, lat;
		var xPx, xPy, yPx, yPy, zPy;
		var dX, dY;

		var basePos, linkPos;
		var slProp, lProp;
		var linkPoint;
		var diff;
		var index;
	
		point = mult( translateGeographicCoordinates( point ), -1 );
	
		baseLon = this.orientation[0];
		baseLat = this.orientation[1];

		lon = point[0]*DEG2RAD;
		lat = point[1]*DEG2RAD;

		xPx = sin( baseLon );
		xPy = sin( baseLat ) * cos( baseLon );
		yPx = cos( baseLon );
		yPy = -sin( baseLat ) * sin( baseLon );
		zPy = cos( baseLat );

		dX = this.canvas.width / 2;
		dY = this.canvas.height / 2;

		basePos = [
			-this.zoom * cos( baseLat ) * cos( baseLon ),
			this.zoom * cos( baseLat ) * sin( baseLon ),
			this.zoom * sin( baseLat )
		];

		linkPos = [
			-cos( lat ) * cos( lon ),
			cos( lat ) * sin( lon ),
			sin( lat )
		];

		//Intersection
		slProp = dotProduct( basePos, basePos ) / dotProduct( basePos, linkPos );
		lProp = Math.abs( slProp );

		linkPoint = [linkPos[0] * lProp, linkPos[1] * lProp, linkPos[2] * lProp];

		diff = [];
		for ( index = 0; index < basePos.length; index++ ) {
			diff.push( linkPoint[index] - basePos[index] );
		}

		// [ diff[0] = xPx * x + xPy * y
		// [ diff[1] = yPx * x + yPy * y
		// [ diff[2] = zPy * y
		if ( parseFloat( zPy.toFixed( 3 ) ) === 0 ) {
			if ( parseFloat( xPx.toFixed( 3 ) ) === 0 ) {
				y = diff[0] / xPy;
				x = diff[1] / yPx;
			} else if ( parseFloat( yPx.toFixed( 3 ) ) === 0 ) {
				y = diff[1] / yPy;
				x = diff[0] / xPx;
			} else {
				y = ( diff[1] * xPx / yPx - diff[0] ) / ( yPy * xPx / yPx - xPy );
				x = ( diff[0] - xPy * y ) / xPx;
			}
		} else {
			y = diff[2] / zPy;
			if ( parseFloat( xPx.toFixed( 3 ) ) === 0 ) {
				x = diff[1] / yPx;
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
		return mult( translateGeographicCoordinates( [
			contentPoint[0] / width * FOV[0] / DEG2RAD,
			contentPoint[1] / height * FOV[1] / DEG2RAD
		] ), -1 );
	},

	translateSinglePoint: function( point ) {
		var width = this.$image.width();
		var height = this.$image.height();
		var FOV = this.getFOV();
		var distanceToCenter;
		point = mult( translateGeographicCoordinates( point ), -1 );
		distanceToCenter = [
			normalizeAngle( point[0] * DEG2RAD + FOV[0] / 2 ),
			normalizeAngle( point[1] * DEG2RAD + FOV[1] / 2 )
		];
		return [
			distanceToCenter[0] / FOV[0] * width,
			distanceToCenter[1] / FOV[1] * height
		];
	}
} );

