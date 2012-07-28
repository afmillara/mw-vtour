
/**
 * ImageView with an external map as a background.
 * @class MapImageView
 */
var MapImageView = ImageView.extend( {

	rotationAngle: 0,
	bounds: null,
	topLeft: null,
	center: null,

	mapX: null,
	mapY: null,

	externalMap: null,
	$imageBackground: null,

	zoomGranularity: 1,

	/**
	 * Create a new MapImageView.
	 * @constructor
	 * @param {$Input[]} extraButtons buttons to add to the interface along the default ones
	 * @param {Array} location	geographical coordinates ([[lat, lon]
	 * lower left corner of the image, [lat, lon] upper right corner]) of the
	 * map (optional)
	 * @param {$Image} $image image that will be shown in this view
	 */
	init: function( $image, location, extraButtons ) {
		this._super( $image, extraButtons );
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
		var $imageBackground = this.$imageBackground = this._super();

		this.externalMap = new GoogleExternalMap( function() {
			var externalMapHTML = that.externalMap.getHTML();
			if ( that.externalMap.canAddHTML ) {
				that.externalMap.addElement( $imageBackground );
			}
			that.prepareImage();
			that.externalMap.setBounds( that.bounds, function( zoom ) {
				that.zoom = zoom;
				that.updateZoom();
			} );

			externalMapWrapper.append( externalMapHTML );
		} );

		if ( this.externalMap.canAddHTML ) {
			return externalMapWrapper;
		} else {
			return [externalMapWrapper, $imageBackground];
		}
	},

	prepareImage: function() {
		// FIXME: Shouldn't work with geographic coordinates like this.
		var dlat = this.location[1][1] - this.location[0][1];
		var dlon = this.location[1][0] - this.location[0][0];

		var diagonal = hypotenuse( dlon, dlat );

		var diagAngle = Math.atan2( this.$image.height(), this.$image.width() );
		var totalAngle = Math.atan2( dlat, dlon );

		this.$image.rotate( {angle: this.rotationAngle / DEG2RAD} );
		this.rotationAngle = totalAngle - diagAngle;
		this.$image.rotate( {angle: -this.rotationAngle / DEG2RAD} );

		var currentHeight = Math.sin( diagAngle ) * diagonal;
		var currentWidth = Math.cos( diagAngle ) * diagonal;

		var widthY = Math.sin( this.rotationAngle ) * currentWidth;
		var widthX = Math.cos( this.rotationAngle ) * currentWidth;

		var complementary = Math.PI/2 - this.rotationAngle;
		var heightY = Math.sin( complementary ) * currentHeight;
		var heightX = Math.cos( complementary ) * currentHeight;

		this.topLeft = [
			this.location[0][0] - heightX,
			this.location[0][1] + heightY
		];
		this.center = [
			this.location[0][0] - heightX / 2 + widthX / 2,
			this.location[0][1] + heightY / 2 + widthY / 2
		];
		var bottomRight = [
			this.location[0][0] + widthX,
			this.location[0][1] + widthY
		];
		var boundingBox = calculateBoundingBox( [
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

	move: function( delta ) {
		this.updateImageBackground();
		this.externalMap.move( [-delta[0], -delta[1]] );
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
		// FIXME: Change to _super when this class inherits directly from graphicview.
		this.incButton.prop( 'disabled', !this.canZoomIn() );
		this.decButton.prop( 'disabled', !this.canZoomOut() );
	},

	/**
	 * Update the location of the image that has been overimposed on the map.
	 */
	updateImageBackground: function() {
		var canAddHTML = this.externalMap.canAddHTML;
		var centerPoint = this.externalMap.geoToPixel( this.center, canAddHTML );
		setPosition( this.$imageBackground, centerPoint, true );
		this.updateLinks();
	},

	updateZoomInterval: function() {
		var interval = this.externalMap.getZoomInterval();
		this.minZoom = interval[0];
		this.maxZoom = interval[1];
	},

	updateSinglePoint: function( delta ) {
		var $image = this.$image;
		var nativeWidth = $image.data( 'nativeWidth' );
		var nativeHeight = $image.data( 'nativeHeight' );
		var vector = sum(
			mult( this.mapX, delta[0] / nativeWidth ),
			mult( this.mapY, delta[1] / nativeHeight )
		);
		var mapPoint = sum( this.location[0], vector );
		return this.externalMap.geoToPixel( mapPoint, false );
	}
} );

