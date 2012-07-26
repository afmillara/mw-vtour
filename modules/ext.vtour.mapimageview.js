
/**
 * ImageView with an external map as a background.
 * @class MapImageView
 */
var MapImageView = ImageView.extend( {

	rotationAngle: null,
	bounds: null,
	topLeft: null,

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

		this.prepareImage();

		this.externalMap = new GoogleExternalMap( function() {
			var externalMapHTML = that.externalMap.getHTML();
			that.externalMap.setBounds( that.bounds, function( zoom ) {
				that.zoom = zoom;
				that.updateZoom();
			} );

			if ( that.externalMap.canAddHTML ) {
				that.externalMap.addElement( $imageBackground );
			}

			externalMapWrapper.append( externalMapHTML );
		} );

		if ( this.externalMap.canAddHTML ) {
			return externalMapWrapper;
		} else {
			return [externalMapWrapper, $imageBackground];
		}
	},

	prepareImage: function() {
		/*var dlat = this.location[0][0] - this.location[1][0];
		var dlon = this.location[1][1] - this.location[0][1];

		var diagonal = hypotenuse( dlon, dlat );

		var diagAngle = Math.atan2( this.$image.height(), this.$image.width() );
		var totalAngle = Math.atan2( dlat, dlon );

		this.rotationAngle = totalAngle - diagAngle;

		var currentHeight = Math.sin( diagAngle ) * diagonal;
		var currentWidth = Math.cos( diagAngle ) * diagonal;

		var heightUnderMapWidth = Math.sin( this.rotationAngle ) * currentWidth;
		var widthUnderMapWidth = Math.cos( this.rotationAngle ) * currentWidth;

		var complementary = Math.PI/2 - this.rotationAngle;
		var heightUnderMapHeight = Math.sin( complementary ) * currentHeight;
		var widthUnderMapWidth = Math.cos( complementary ) * currentHeight;

		if ( dlon*/

		this.bounds = this.location;
		this.topLeft = [this.location[1][0], this.location[0][1]];
	},

	move: function( delta ) {
		this.externalMap.move( [-delta[0], -delta[1]] );
		this.updateImageBackground();
	},

	updateZoom: function() {
		var canAddHTML = this.externalMap.canAddHTML;
		var sw, ne;
		var height, width;
		if ( this.externalMap.isReady() ) {
			this.externalMap.zoom( this.zoom );
			this.updateZoomInterval();

			sw = this.externalMap.geoToPixel( this.location[0], canAddHTML );
			ne = this.externalMap.geoToPixel( this.location[1], canAddHTML );

			height = sw[1] - ne[1];
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
		var nw = this.externalMap.geoToPixel( this.topLeft, canAddHTML );
		setPosition( this.$imageBackground, nw, false );
	},

	updateZoomInterval: function() {
		var interval = this.externalMap.getZoomInterval();
		this.minZoom = interval[0];
		this.maxZoom = interval[1];
	}
} );

