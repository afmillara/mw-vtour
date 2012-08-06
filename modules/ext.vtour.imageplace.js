
/**
 * Place whose main content is an image.
 * @class ImagePlace
 */
var ImagePlace = Place.extend( {

	spClass: 'vtour-imagenode',
	iconClass: 'vtour-imageplacemarker',

	initialPosition: {
		zoom: null,
		center: [0, 0]
	},

	/**
	 * ImageView used in this ImagePlace.
	 * @var {ImageView} view
	 */
	view: null,

	imageSrc: null,

	/**
	 * Create a new ImagePlace.
	 * @param {VirtualTour} tour    VirtualTour to which this Place belongs
	 * @param {String} name name of the place
	 * @param {String} description  description of the place
	 * @param {Boolean} visible  whether this place can be seen in a map
	 * @param {Number[]} location location of the place in the map ([x, y])
	 * @param {Map} map map that contains this place
	 * @param {String} imageSrc URL of the image
	 */
	init: function( tour, name, description, visible, location, map, imageSrc ) {
		this._super( tour, name, description, visible, location, map);
		this.imageSrc = imageSrc;
	},

	changeZoom: function( zoom ) {
		this.view.changeExternalZoom( zoom );
	},

	move: function( center ) {
		this.view.move( center, true );
	},

	addTo: function( parent ) {
		var that = this;
		if ( this.view === null ) {
			this.view = this.createView();
			this.$html = this.view.getHTML();
			this.onMouseUp = function(){
				this.view.onMouseUp.call( this.view );
			};
			this.onMouseMove = function( x, y ){
				this.view.onMouseMove.call( this.view, x, y );
			};
			$( this.view ).bind( 'error.vtour', function( event, message ) {
				that.tour.showError( message );
			} );
			$.each( this.links, function( i, link ) {
				that.view.addLink( link );
			} );
		}
		parent.append( this.$html );
		this.view.reset();
		this._super( parent );
	},

	applyPosition: function( position ) {
		var that = this;
		var _super = that._super;
		this.view.whenReadyDo( function() {
			_super.call( that, position );
		} );
	},

	/**
	 * Create a view for this place.
	 * @return GraphicView New view
	 */
	createView: function() {
		return new ImageView( this.imageSrc );
	}
} );

