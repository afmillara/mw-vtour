/**
 * View that displays a map image over an external map.
 *
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 * 
 * @file
 */

/**
 * ImageView with an external map as a background.
 * @class MapImageView
 */
//* class MapImageView extends GraphicView {
var MapImageView = GraphicView.extend( {

	//* protected $Image $image;
	$image: null,

	/**
	 * ExternalMap implementation that will be used.
	 * @var {Class} ExternalMapImplementation
	 */
	//* protected Class ExternalMapImplementation;
	ExternalMapImplementation: null,

	/**
	 * Angle between the line from the lower left corner of the image
	 * to the lower right corner of the image and the line from the
	 * lower left corner of the image and 3 o'clock.
	 * @var {Number} rotationAngle
	 */
	//* protected Number rotationAngle;
	rotationAngle: 0,

	/**
	 * Bounding box of the image on the map: [[swLon, swLat], [neLon, neLat]].
	 * @var {Number[][]} bounds
	 */
	//* protected Number[][] bounds;
	bounds: null,

	/**
	 * Whether the view has been moved since the last time the bounds were set.
	 * @var {Boolean} mapMoved
	 */
	//* protected Boolean mapMoved;
	mapMoved: false,

	//* protected Number[] topLeft;
	topLeft: null,

	//* protected Number[] center;
	center: null,

	/**
	 * Vector (in geographical coordinates: [lon, lat]) from the lower left
	 * corner of the image to the lower right corner.
	 * @var {Number[]} mapX
	 */
	//* protected Number[] mapX;
	mapX: null,

	/**
	 * Vector (in geographical coordinates: [lon, lat]) from the lower left
	 * corner of the image to the upper left corner.
	 * @var {Number[]} mapY
	 */
	//* protected Number[] mapY;
	mapY: null,

	//* protected ExternalMap externalMap;
	externalMap: null,

	//* protected Object marker;
	marker: null,

	//* protected $HTML $imageBackground;
	$imageBackground: null,

	//* protected Number zoomGranularity;
	zoomGranularity: 1,

	//* protected Number initialZoom;
	initialZoom: null,
	
	/**
	 * Difference between the initial zoom and the maximum zoom at which
	 * links will be displayed.
	 * @var {Number} pointDisplayThreshold
	 */
	//* protected Number pointDisplayThreshold;
	pointDisplayThreshold: 2,

	/**
	 * Difference between the initial zoom and the maximum zoom at which
	 * the background image will be displayed.
	 * @var {Number} imageDisplayThreshold
	 */
	//* protected Number imageDisplayThreshold;
	imageDisplayThreshold: 3,

	/**
	 * Array of geographical coordinates of the image (lower left corner,
	 * upper right corner).
	 * @var {Number[]} location
	 */
	//* protected Number[] location;
	location: null,

	/**
	 * Create a new MapImageView.
	 * @constructor
	 * @param {String} imageSrc URL of the image that will be shown in this view
	 * @param {Number[]} location Geographical coordinates ([lower left corner
	 * of the image, upper right corner]) of the map (optional)
	 * @param {Class} ExternalMapImplementation External map implementation that will
	 * be used
	 */
	//* public void init( String imageSrc, Number[] location, Class ExternalMapImplementation );
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
	//* protected $Image generateBackground();
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

	//* public void move( Number[] delta, Boolean isAbsolute );
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

	//* public Boolean isReady();
	isReady: function() {
		return this._super() && this.externalMap.isReady();
	},

	//* protected void updateZoom();
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

	//* protected void createDefaultButtons();
	createDefaultButtons: function() {
		var that = this;
		this._super();
		this.addButton( 'vtour-buttonreset', function() {
			that.reset();	
		}, 'vtour-button-reset' );
	},

	//* public void reset();
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
	//* protected void prepareImage();
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
		this.rotationAngle = totalAngle - diagAngle;
		this.$image.rotate( -this.rotationAngle / DEG2RAD );

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
	//* protected void updateImageBackground();
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
	 * Add a marker to the map in the center of the image.
	 */
	//* protected void addTourMarker();
	addTourMarker: function() {
		var that = this;
		var title;
		var externalMap = this.externalMap;
		if ( this.marker === null ) {
			title = mw.message( 'vtour-thismap' ).toString();
			this.marker = externalMap.addMarker( title, null, this.center, function() {
				that.reset();
			} );
		}
	},

	/**
	 * Remove the marker from the map.
	 */
	//* protected void removeTourMarker();
	removeTourMarker: function() {
		if ( this.marker !== null ) {
			this.externalMap.removeMarker( this.marker );
			this.marker = null;
		}
	},

	//* protected void updateZoomInterval();
	updateZoomInterval: function() {
		var interval = this.externalMap.getZoomInterval();
		this.minZoom = interval[0];
		this.maxZoom = interval[1];
	},

	//* protected void updateLinks();
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

	//* protected Number[] translateSinglePoint( Number[] point );
	translateSinglePoint: function( point ) {
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
			mult( this.mapX, point[0] / nativeWidth ),
			mult( this.mapY, 1 - point[1] / nativeHeight )
		);
		mapPoint = sum( this.location[0], vector );
		return this.externalMap.geoToPixel( mapPoint, false );
	}
} );
//* }

