
/**
 * ImageView with an external map as a background.
 * @class MapImageView
 */
var MapImageView = GraphicView.extend( {

	$image: null,

	/**
	 * ExternalMap implementation that will be used.
	 * @var {class} ExternalMapImplementation
	 */
	ExternalMapImplementation: null,

	/**
	 * Angle between the line from the lower left corner of the image
	 * to the lower right corner of the image and the line from the
	 * lower left corner of the image and 3 o'clock.
	 * @var {Number} rotationAngle
	 */
	rotationAngle: 0,

	/**
	 * Bounding box of the image on the map: [[swLon, swLat], [neLon, neLat]].
	 * @var {Array} bounds
	 */
	bounds: null,

	/**
	 * Whether the view has been moved since the last time the bounds were set.
	 * @var {Boolean} mapMoved
	 */
	mapMoved: false,

	topLeft: null,
	center: null,

	/**
	 * Vector (in geographical coordinates: [lon, lat]) from the lower left
	 * corner of the image to the lower right corner.
	 * @var {Array} mapX
	 */
	mapX: null,

	/**
	 * Vector (in geographical coordinates: [lon, lat]) from the lower left
	 * corner of the image to the upper left corner.
	 * @var {Array} mapY
	 */
	mapY: null,

	externalMap: null,
	marker: null,
	$imageBackground: null,

	zoomGranularity: 1,

	initialZoom: null,
	
	/**
	 * Difference between the initial zoom and the maximum zoom at which
	 * links will be displayed.
	 * @var {Number} pointDisplayThreshold
	 */
	pointDisplayThreshold: 2,

	/**
	 * Difference between the initial zoom and the maximum zoom at which
	 * the background image will be displayed.
	 * @var {Number} imageDisplayThreshold
	 */
	imageDisplayThreshold: 3,

	/**
	 * Create a new MapImageView.
	 * @constructor
	 * @param {String} imageSrc URL of the image that will be shown in this view
	 * @param {Array} location Geographical coordinates ([lower left corner
	 * of the image, upper right corner]) of the map (optional)
	 */
	init: function( imageSrc, location, ExternalMapImplementation ) {
		this._super();
		this.imageSrc = imageSrc;
		this.location = [
			translateGeographicCoordinates( location[0] ),
			translateGeographicCoordinates( location[1] )
		];
		this.ExternalMapImplementation = ExternalMapImplementation;
	},

	/**
	 * Generate the contents of the ImageView.
	 * @return {$Image} image content of the ImageView
	 */
	generateBackground: function() {
		var that = this;
		var errorMessage;
		var externalMapWrapper = $('<div></div>').addClass( 'vtour-externalmap' );
		this.$image = $( '<img></img>' );
		this.loadImage( this.$image, this.imageSrc, function() {
			that.externalMap = new that.ExternalMapImplementation
				( externalMapWrapper, function() {
					if ( that.ExternalMapImplementation.canAddHTML ) {
						that.externalMap.addElement( $imageBackground );
					}
					that.prepareImage();
					that.externalMap.setBounds( that.bounds, function( zoom ) {
						that.mapMoved = false;
						that.initialZoom = zoom;
						that.zoom = zoom;
						that.updateZoom();
					} );
					that.removeBlockingLoading();
				}, function() {
					that.removeBlockingLoading();
					errorMessage = mw.message( 'vtour-errordesc-externalmaperror' );
					that.showError( errorMessage );
				} );
			if ( !that.externalMap.isReady() ) {
				that.showBlockingLoading();
			}
		} );
		var $imageBackground = this.$imageBackground =
			this.$image.addClass( 'vtour-background' );

		externalMapWrapper.addClass( 'vtour-movable' );
		$imageBackground.addClass( 'vtour-movable' );

		if ( this.ExternalMapImplementation.canAddHTML ) {
			return externalMapWrapper;
		} else {
			return [externalMapWrapper, $imageBackground];
		}
	},

	move: function( delta, isAbsolute ) {
		if ( !this.isReady() ) {
			return;
		}
		this.mapMoved = true;
		if ( isAbsolute ) {
			this.externalMap.moveTo( translateGeographicCoordinates( delta ) );
		}  else {
			this.externalMap.moveBy( [-delta[0], -delta[1]] );
		}
		this.updateImageBackground();
	},

	isReady: function() {
		return this._super() && this.externalMap.isReady();
	},

	updateZoom: function() {
		var canAddHTML = this.ExternalMapImplementation.canAddHTML;
		var sw, nw;
		var height, width;
		if ( this.isReady() ) {
			this.externalMap.zoom( this.zoom );
			this.updateZoomInterval();

			sw = this.externalMap.geoToPixel( this.location[0], canAddHTML );
			nw = this.externalMap.geoToPixel( this.topLeft, canAddHTML );

			height = hypotenuse( sw[0] - nw[0], sw[1] - nw[1] );
			width = height / this.$image.data( 'nativeHeight' )
				* this.$image.data( 'nativeWidth' );

			this.$imageBackground.width( width );
			this.$imageBackground.height( height );
			this.updateImageBackground();
		}
		this._super();
	},

	createDefaultButtons: function() {
		var that = this;
		this._super();
		this.addButton( 'vtour-buttonreset', function() {
			that.reset();	
		} );
	},

	reset: function() {
		var that = this;
		if ( !this.isReady() ) {
			return;
		}
		if ( this.mapMoved || this.zoom !== this.initialZoom ) {
			this.mapMoved = false;
			this.zoom = this.externalMap.setBounds( this.bounds,
				function( zoom ) {
					that.zoom = zoom;
					that.updateZoom();
				} );
		}
		this._super();
	},	

	/**
	 * Calculate the rotation angle and position of the image.
	 */
	prepareImage: function() {
		var dlat, dlon;
		var diagonal;
		var diagAngle, totalAngle, complementary;
		var currentWidth, currentHeight;
		var widthX, widthY;
		var heightX, heightY;
		var boundingBox;
		var bottomRight;

		// FIXME: We are working with geographic coordinates here. This
		// is probably inaccurate for long distances.
		dlat = this.location[1][1] - this.location[0][1];
		dlon = this.location[1][0] - this.location[0][0];

		diagonal = hypotenuse( dlon, dlat );

		diagAngle = Math.atan2( this.$image.data( 'nativeHeight' ),
			this.$image.data( 'nativeWidth' ) );
		totalAngle = Math.atan2( dlat, dlon );
		this.$image.rotate( {angle: this.rotationAngle / DEG2RAD} );
		this.rotationAngle = totalAngle - diagAngle;
		this.$image.rotate( {angle: -this.rotationAngle / DEG2RAD} );

		currentHeight = Math.sin( diagAngle ) * diagonal;
		currentWidth = Math.cos( diagAngle ) * diagonal;

		widthY = Math.sin( this.rotationAngle ) * currentWidth;
		widthX = Math.cos( this.rotationAngle ) * currentWidth;

		complementary = Math.PI/2 - this.rotationAngle;
		heightY = Math.sin( complementary ) * currentHeight;
		heightX = Math.cos( complementary ) * currentHeight;

		this.topLeft = [
			this.location[0][0] - heightX,
			this.location[0][1] + heightY
		];
		bottomRight = [
			this.location[0][0] + widthX,
			this.location[0][1] + widthY
		];

		this.center = [
			this.location[0][0] - heightX / 2 + widthX / 2,
			this.location[0][1] + heightY / 2 + widthY / 2
		];

		boundingBox = calculateBoundingBox( [
			this.location[0],
			this.location[1],
			this.topLeft,
			bottomRight
		] );

		this.bounds = [
			[boundingBox.x, boundingBox.y + boundingBox.height],
			[boundingBox.x + boundingBox.width, boundingBox.y]
		];

		this.mapX = [widthX, widthY];
		this.mapY = [-heightX, heightY];
	},

	/**
	 * Update the location of the image that has been overimposed on the map.
	 */
	updateImageBackground: function() {
		var canAddHTML = this.ExternalMapImplementation.canAddHTML;
		var centerPoint;
		if ( this.zoom >= this.initialZoom - this.imageDisplayThreshold ) {
			centerPoint = this.externalMap.geoToPixel( this.center, canAddHTML );
			this.$imageBackground.show();
			this.removeTourMarker();
			setPosition( this.$imageBackground, centerPoint, true );
		} else {
			this.$imageBackground.hide();
			this.addTourMarker();
		}
		this.updateLinks();
	},

	/**
	 * Add a marker to the map.
	 */
	addTourMarker: function() {
		var that = this;
		var title;
		var externalMap = this.externalMap;
		if ( this.marker === null ) {
			title = mw.message( 'vtour-thismap' ).toString();
			this.marker = externalMap.addMarker( title, this.center, function() {
				that.reset();
			} );
		}
	},

	/**
	 * Remove the marker from the map.
	 */
	removeTourMarker: function() {
		if ( this.marker !== null ) {
			this.externalMap.removeMarker( this.marker );
			this.marker = null;
		}
	},

	updateZoomInterval: function() {
		var interval = this.externalMap.getZoomInterval();
		this.minZoom = interval[0];
		this.maxZoom = interval[1];
	},

	updateLinks: function() {
		var that = this;
		if ( !this.isReady() ) {
			return;
		}
		$.each( this.links, function( i, link ) {
			link.setRotationAngle( that.rotationAngle );
		} );
		this._super();
	},

	updateSinglePoint: function( delta ) {
		var $image;
		var nativeWidth, nativeHeight;
		var vector, mapPoint;
		if ( !this.isReady() ) {
			return null;
		}
		if ( this.zoom < this.initialZoom - this.pointDisplayThreshold ) {
			return null;
		}
		$image = this.$image;
		nativeWidth = $image.data( 'nativeWidth' );
		nativeHeight = $image.data( 'nativeHeight' );
		vector = sum(
			mult( this.mapX, delta[0] / nativeWidth ),
			mult( this.mapY, delta[1] / nativeHeight )
		);
		mapPoint = sum( this.location[0], vector );
		return this.externalMap.geoToPixel( mapPoint, false );
	}
} );

