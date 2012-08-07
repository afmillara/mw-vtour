
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
	init: function( tour, name, imageSrc, location ) {
		this._super( tour, name );
		this.imageSrc = imageSrc;
		this.location = location;
		this.places = [];
	},

	/**
	 * Add this HTML code for this Map to a given node.
	 * @param {$Element} $parent    HTML node to which this Map will be added
	 */
	addTo: function( parent ) {
		var that = this;
		var noExternalMapMessage;
		var ExternalMapImplementation;
		if ( this.view === null ) {
			if ( this.location ) {
				ExternalMapImplementation = this.getExternalMapClass();
				if ( ExternalMapImplementation === null ) {
					noExternalMapMessage = mw.message( 'vtour-errordesc-noexternalmap' );
					this.tour.showError( noExternalMapMessage );
					this.view = new ImageView( this.imageSrc );
				} else {
					this.view = new MapImageView( this.imageSrc,
						this.location, ExternalMapImplementation );
				}
			} else {
				this.view = new ImageView( this.imageSrc );
			}

			this.extraButtons = [];
			this.extraButtons.push(
				this.view.addButton( 'vtour-buttonup', function() {
					that.tour.move( that.getNeighbour( 'up' ) );
				}, 'vtour-button-up' )
			);
			this.extraButtons.push(
				this.view.addButton( 'vtour-buttondown', function() {
					that.tour.move( that.getNeighbour( 'down' ) );
				}, 'vtour-button-down' )
			);

			this.html = this.view.getHTML();
			$( this.view ).bind( 'error.vtour', function( event, message ) {
				that.tour.showError( message );
			} );
			$.each( this.places, function( i, place ) {
				that.view.addLink( place.getMapLink() );
			} );
		}
		parent.append( this.html );
		this.view.reset();
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
			this.view.toggleButton( this.extraButtons[index],
				this.getNeighbour( ways[index] ) !== null );
		}
	},

	/**
	 * Adds a new Place to this Map.
	 * @param {Place} place place that will be added
	 */
	addPlace: function( place ) {
		this.places.push( place );
	},

	/**
	 * Get the ExternalMap implementation that will be used.
	 * @return class External map implementation
	 */
	getExternalMapClass: function() {
		var externalMapClassName = mw.config.get( 'wgVtourExternalMap' );
		return ExternalMap.classes[externalMapClassName] || null;
	}
} );

