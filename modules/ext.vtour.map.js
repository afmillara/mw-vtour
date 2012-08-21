/**
 * Map that displays an image and links to places.
 *
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 * 
 * @file
 */

/**
 * Map with one or more Places on it.
 * @class Map
 */
//* class Map extends Element {
var Map = Element.extend( {

	/**
	 * Upper neighbour of this map.
	 * @var {Map} up
	 */
	//* protected Map up;
	up: null,

	/**
	 * Lower neighbour of this map.
	 * @var {Map} down
	 */
	//* protected Map down;
	down: null,

	/**
	 * Starting place for this map.
	 * @var {Place} defaultPlace
	 */
	//* protected Place defaultPlace;
	defaultPlace: null,

	/**
	 * ImageView used in this map.
	 * @var {ImageView} view
	 */
	//* protected ImageView view;
	view: null,

	/**
	 * Array of extra buttons added by the map.
	 * @var {$HTML[]} extraButtons
	 */
	//* protected $HTML[] extraButtons;
	extraButtons: null,

	/**
	 * HTML nodes for the map.
	 * @var {$HTML[]} html
	 */
	//* protected $HTML[] html;
	html: null,

	/**
	 * Create a new Map.
	 * @param {VirtualTour} tour VirtualTour to which this Map will belong
	 * @param {String} name Name of the new Map
	 * @param {String} imageSrc Image path
	 * @param {Number[][]} Location Geographical coordinates ([[lat, lon]
	 * lower left corner of the image, [lat, lon] upper right corner]) of the
	 * map (optional)
	 * @constructor
	 */
	//* public void init( VirtualTour tour, String name, String imageSrc, Number[][] location );
	init: function( tour, name, imageSrc, location ) {
		this._super( tour, name );
		this.imageSrc = imageSrc;
		this.location = location;
		this.places = [];
	},

	/**
	 * Add this HTML code for this Map to a given node.
	 * @param {$HTML} $parent HTML node to which this Map will be added
	 */
	//* public void addTo( $HTML parent );
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
			// TODO: Links from maps aren't currently supported.
			$.each( this.links, function( i, link ) {
				that.view.addLink( link );
			} );
		}
		parent.append( this.html );
		this.view.reset();
	},

	/**
	 * Set the starting place.
	 * @param {Place} place Starting place
	 */
	//* public void setDefault( Place place );
	setDefault: function( place ) {
		this.defaultPlace = place;
	},

	/**
	 * Get a neighbour of the current map and place.
	 * @param {String} way Either 'up' or 'down'
	 * @return Place Neighbour place, or null if no neighbour exists
	 */
	//* protected Place getNeighbour( String way );
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
	//* public void update();
	update: function() {
		if ( !this.error ) {
			this.updateExtraButtons();
			this.view.update();
		}
	},

	//* protected void updateExtraButtons();
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
	//* public void addPlace( Place place );
	addPlace: function( place ) {
		this.places.push( place );
	},

	/**
	 * Get the ExternalMap implementation that will be used.
	 * @return class External map implementation
	 */
	//* protected Class getExternalMapClass();
	getExternalMapClass: function() {
		var externalMapClassName = mw.config.get( 'wgVtourExternalMap' );
		return ExternalMap.classes[externalMapClassName] || null;
	}
} );
//* }

