
/**
 * ImageView with an external map as a background.
 * @class MapImageView
 */
var MapImageView = GraphicView.extend( {

	$image: null,

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
	 * @param {$Image} $image image that will be shown in this view
	 * @param {Array} location Geographical coordinates ([[lat, lon]
	 * lower left corner of the image, [lat, lon] upper right corner]) of the
	 * map (optional)
	 */
	init: function( $image, location ) {
		this._super();
		this.$image = $image;
		this.location = location;
	},

	/**
	 * Generate the contents of the ImageView.
	 * @return {$Image} image content of the ImageView
	 */
	generateBackground: function() {
		var that = this;
		var externalMapWrapper = $('<div></div>').css( {
			'width': '100%',
			'height': '100%'
		} );
		var $imageBackground = this.$imageBackground =
			this.$image.addClass( 'vtour-background' );
		this.externalMap = new GoogleExternalMap( function() {
			var externalMapHTML = that.externalMap.getHTML();
			if ( that.externalMap.canAddHTML ) {
				that.externalMap.addElement( $imageBackground );
			}
			that.prepareImage();
			that.externalMap.setBounds( that.bounds, function( zoom ) {
				that.initialZoom = zoom;
				that.zoom = zoom;
				that.updateZoom();
			} );

			externalMapWrapper.append( externalMapHTML );
		} );

		externalMapWrapper.addClass( 'vtour-movable' );
		$imageBackground.addClass( 'vtour-movable' );

		if ( this.externalMap.canAddHTML ) {
			return externalMapWrapper;
		} else {
			return [externalMapWrapper, $imageBackground];
		}
	},

	move: function( delta ) {
		this.externalMap.move( [-delta[0], -delta[1]] );
		this.updateImageBackground();
	},

	updateZoom: function() {
		var canAddHTML = this.externalMap.canAddHTML;
		var sw, nw;
		var height, width;
		if ( this.externalMap.isReady() ) {
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
			that.zoom = that.externalMap.setBounds( that.bounds,
				function( zoom ) {
					that.zoom = zoom;
					that.updateZoom();
				} );
		} );
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

		diagAngle = Math.atan2( this.$image.height(), this.$image.width() );
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
		var canAddHTML = this.externalMap.canAddHTML;
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
		var markerTitle;
		if ( this.marker === null ) {
			markerTitle = mw.message( 'vtour-thismap' ).toString();
			this.marker = this.externalMap.addMarker( markerTitle, this.center );
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
		$.each( this.links, function( i, link ) {
			link.setRotationAngle( that.rotationAngle );
		} );
		this._super();
	},

	updateSinglePoint: function( delta ) {
		var $image;
		var nativeWidth, nativeHeight;
		var vector, mapPoint;
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

