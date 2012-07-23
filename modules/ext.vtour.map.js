
/**
 * Map with one or more Places on it.
 * @class Map
 */
var Map = Element.extend( {

	/**
	 * Upper neighbour of this map.
	 * @var {Map} up
	 */
	up: null,

	/**
	 * Lower neighbour of this map.
	 * @var {Map} down
	 */
	down: null,

	/**
	 * Starting place for this map.
	 * @var {Place} defaultPlace
	 */ 
	defaultPlace: null,

	/**
	 * ImageView used in this map.
	 * @var {ImageView} view
	 */
	view: null,

	/**
	 * Array of extra buttons added by the map.
	 * @var {Array} extraButtons
	 */
	extraButtons: null,

	/**
	 * HTML nodes for the map.
	 * @var {Array} html
	 */
	html: null,

	/**
	 * Create a new Map.
	 * @constructor
	 * @param {VirtualTour} tour VirtualTour to which this Map will belong
	 * @param {String} name Name of the new Map
	 * @param {$Image} $image Map background
	 * @param {Array} Location Geographical coordinates ([[lat, lon]
	 * lower left corner of the image, [lat, lon] upper right corner]) of the
	 * map (optional)
	 */
	init: function( tour, name, $image, location ) {
		this._super( tour, name );
		this.$image = $image;
		this.location = location;
		this.places = [];
	},

	/**
	 * Add this HTML code for this Map to a given node.
	 * @param {$Element} $parent    HTML node to which this Map will be added
	 */
	addTo: function( parent ) {
		var that = this;
		if ( this.view === null ) {
			if ( !this.checkImage( this.$image, parent ) ) {
				return;
			}
			this.extraButtons = [
				createButton( '^', true, function() {
					that.tour.move( that.getNeighbour( 'up' ) );
				} ),
				createButton( 'v', true, function() {
					that.tour.move( that.getNeighbour( 'down' ) );
				} )
			];
			if ( this.location ) {
				this.view = new MapImageView( this.extraButtons, this.$image,
					this.location );
			} else {
				this.view = new ImageView( this.extraButtons, this.$image );
			}
			this.html = this.view.generate();
			this.onMouseUp = function(){
				this.view.onMouseUp.call( this.view );
			};
			this.onMouseMove = function( x, y ){
				this.view.onMouseMove.call( this.view, x, y );
			};
			$.each( this.places, function( i, place ) {
				that.view.addLink( place.getMapLink() );
			} );
		}
		parent.css( 'position', 'relative' ).append( this.html[0], this.html[1] );
	},

	/**
	 * Set the starting place.
	 * @param {Place} place Starting place
	 */
	setDefault: function( place ) {
		this.defaultPlace = place;
	},

	/**
	 * Get a neighbour of the current map and place.
	 * @param {String} way Either 'up' or 'down'
	 * @return Place|null Neighbour place, or null if no neighbour exists
	 */
	getNeighbour: function( way ) {
		if ( this.tour.currentPlace[way] ) {
			return this.tour.currentPlace[way];
		} else if ( this[way] && this[way].defaultPlace ) {
			return this[way].defaultPlace;
		} else {
			return null;
		}
	},

	/**
	 * Update the location of the links in the map.
	 */
	update: function() {
		if ( !this.error ) {
			this.updateExtraButtons();
			this.view.update();
		}
	},

	updateExtraButtons: function() {
		var ways = [ 'up', 'down' ];
		var index;
		for ( index = 0; index < ways.length; index++ ) {
			this.extraButtons[index].prop( 'disabled',
				this.getNeighbour( ways[index] ) === null );
		}
	},

	/**
	 * Adds a new Place to this Map.
	 * @param {Place} place place that will be added
	 */
	addPlace: function( place ) {
		this.places.push( place );
	}
} );
