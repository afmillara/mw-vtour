
/**
 * Place whose main content is an image.
 * @class ImagePlace
 */
var ImagePlace = Place.extend( {

	spClass: 'vtour-imagenode',

	initialPosition: {
		zoom: null,
		center: [0, 0]
	},

	/**
 	 * ImageView used in this ImagePlace.
 	 * @var {ImageView} view
 	 */
	view: null,

	/**
	 * Create a new ImagePlace.
	 * @param {VirtualTour} tour    VirtualTour to which this Place belongs
	 * @param {String} name name of the place
	 * @param {String} description  description of the place
	 * @param {Boolean} visible  whether this place can be seen in a map
	 * @param {Number[]} location location of the place in the map ([x, y])
	 * @param {Map} map map that contains this place
	 * @param {$Image} $image    image contained in this ImagePlace
	 */
	init: function( tour, name, description, visible, location, map, $image ) {
		this._super( tour, name, description, visible, location, map);
		this.$image = $image;
	},

	changeZoom: function( zoom ) {
		this.view.changeExternalZoom( zoom );
	},

	move: function( center ) {
		this.view.move( center, true );
	},

	addTo: function( parent ) {
		var view;
		if ( this.view === null ) {
			if ( !this.checkImage( this.$image, parent ) ) {
				return;
			}	
			this.view = this.createView();
			this.$html = this.view.generate();
			this.onMouseUp = function(){
				this.view.onMouseUp.call( this.view );
			};
			this.onMouseMove = function( x, y ){
				this.view.onMouseMove.call( this.view, x, y );
			};
			view = this.view;
			$.each( this.links, function( i, link ) {
				view.addLink( link );
			} );
		}
		parent.css( 'position', 'relative' ).append( this.$html[0], this.$html[1] );
		this.view.reset();
		this.view.update();
		this._super( parent );
	},

	/**
	 * Create a view for this place.
	 * @return GraphicView New view
	 */
	createView: function() {
		return new ImageView( this.$image );
	}
} );

