/**
 * Class that controls what is being displayed in the tour.
 *
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 * 
 * @file
 */


/**
 * A single virtual tour, containing Places and Maps.
 * @class VirtualTour
 */
var VirtualTour = Class.extend( {

	/**
	 * ID of the VirtualTour.
	 * @var {Number} id
	 */
	id: null,

	/**
	 * Place that is being displayed currently.
	 * @var {Place} currentPlace
	 */
	currentPlace: null,

	/**
	 * id -> place map.
	 * @var {Object} placesById
	 */
	placesById: null,

	/**
	 * name -> place map.
	 * @var {Object} placesByName
	 */
	placesByName: null,

	/**
	 * Array of all the TextPlaces in the tour
	 * @var {Array} textPlaces
	 */
	textPlaces: null,

	/**
	 * Create a new VirtualTour.
	 * @param {Object} tourData Tour data
	 * @param {Array} htmlNodes Array of DOM nodes that store the HTML content
	 * @param {$Link} $localLinks jQuery collection containing all the links to
	 * tours in this page
	 */
	init: function( tourData, htmlElements, $localLinks ) {
		var that = this;
		this.htmlElements = htmlElements;
		this.placesById = {};
		this.placesByName = {};
		this.textPlaces = [];

		this.createNodesFromJSON( tourData );

		$localLinks.each( function() {
			var place, textlink;
			var $link = $( this );
			var inside = $link.data( 'vtour-textlink-in' ) == that.id;
			var position;
			var ii, currPlace;
			var linkParts = that.extractTextLinkParams( $link.attr( 'href' ), inside );
			if ( ( inside && linkParts.tour === null )
					|| linkParts.tour === that.id ) {
				place = that.findPlace( linkParts.place );
				if ( place ) {
					position = that.createPositionFromStrings( linkParts );		
					textlink = new TextLink( that, place, $link );
					textlink.setDestinationPosition( position );
					textlink.getHTML();
					if ( inside ) {
						for ( ii = 0; ii < that.textPlaces.length; ii++ ) {
							currPlace = that.textPlaces[ii];
							if ( currPlace.registerLinkIfInside( textlink ) ) {
								break;
							}
						}
					}
				} else {
					$link.attr( 'href', '#vtour-tour-' + that.id );
				}
			}
		} );
	},

	/**
	 * Start the VirtualTour, and display it on the given DOM nodes.
	 * @param {$HTML} main HTML node for the main panel
	 * @param {$HTML} secondary HTML node for the secondary panel
	 * @param {$HTML} map HTML node for the map panel
	 */
	start: function( main, secondary, map, error ) {
		var that = this;

		this.main = main;
		this.secondary = secondary;
		this.map = map;
		this.error = error;

		this.main.addClass( 'vtour-main' );

		this.move( that.initialNode );
	},

	/**
	 * Show an error message in the appropriate container.
	 * @param {Message} message MediaWiki message object
	 */
	showError: function( message ) {
		var errorContent = mw.message( 'vtour-warning', message.toString() ).toString();
		var errorHTML = mw.message( 'vtour-erroroutside', errorContent.toString() ).toString();
		this.error.append( errorHTML );
	},

	/**
	 * Take either a Place object or an id/name string and return the
	 * matching Place object.
	 * @param {String|Place} place Place object or id/name string
	 * @return Place|null Place object, or null if it doesn't exist in this tour
	 */
	normalizePlace: function( place ) {
		if ( place === null ) {
			return null;
		}
		if ( typeof place === 'string' ) {
			place = this.findPlace( place );
			if ( place ) {
				return place;
			}
			return null;
		}
		return place;
	},

	/**
	 * Change the current place.
	 * @param {Place|String} place New place (Place object or id/name)
	 */
	move: function( place ) {
		place = this.normalizePlace( place );
		if ( place === null ) {
			return;
		}

		if ( this.currentPlace !== place ) {
			var mapChanged = this.currentPlace === null
				|| this.currentPlace.map !== place.map;
			//Quitamos los viejos.
			if ( this.currentPlace !== null ) {
				this.currentPlace.end( this.main );
				if ( mapChanged ) {
					this.currentPlace.map.end( this.map );
				}
			}
			//Ponemos los nuevos.
			this.currentPlace = place;
			this.currentPlace.addTo( this.main );
			if ( this.currentPlace.map !== null ) {
				if ( mapChanged ) {
					this.currentPlace.map.addTo( this.map );
				}
				this.currentPlace.map.update();
			}
			this.secondary.children().detach();
			this.secondary.append( this.currentPlace.getInfo() );
		}
	},

	/**
	 * Create the virtual tour structure from the tour data.
	 * @param {Object} jsonTour Tour data
	 * @return Place Place where the tour will start
	 */
	createNodesFromJSON: function( jsonTour ) {
		var maps = [];
		var places = [];
		var that = this;
		this.id = jsonTour.id;

		//Crea los mapas.
		$.each( jsonTour.maps, function( i, jsonMap ) {
			var background = jsonMap.image;
			maps.push( new Map( that, jsonMap.name, background, jsonMap.location ) );
		} );

		//Crea los lugares.
		$.each( jsonTour.places, function( i, jsonPlace ) {
			var name = jsonPlace.name;
			var description = null;
			var visible = jsonPlace.visible;
			var location = jsonPlace.location;
			var map = null;
			var image, place;
			var initialPosition;

			if ( jsonPlace.description !== null ) {
				description = 
					new DescriptionTextPlace( that,
						that.getHTMLElement( jsonPlace.description ) );
				that.textPlaces.push( description );
			}

			if ( jsonPlace.map !== null ) {
				map = maps[jsonPlace.map];
			}

			switch (jsonPlace.type) {
				case 'image':
					image = jsonPlace.image;
					place = new ImagePlace
						( that, name, description, visible, location, map, image );
					break;
				case 'pano':
					image = jsonPlace.image;
					place = new PanoPlace
						( that, name, description, visible, location, map, image );
					break;
				case 'text':
					place = new TextPlace( that, name, description, visible,
						location, map, that.getHTMLElement( jsonPlace.text ) );
					that.textPlaces.push( place );
					break;
				default:
					throw new Error( 'Invalid place type: ' + jsonPlace.type );
			}

			if ( jsonPlace.angle !== null ) {
				place.setAngle( jsonPlace.angle );
			}

			initialPosition = {
				zoom: jsonPlace.zoom,
				center: jsonPlace.center
			};
			place.setInitialPosition( initialPosition );

			if ( jsonPlace.tooltip !== null ) {
				place.setTooltipsEnabled( jsonPlace.tooltip );
			}

			//Añade el sitio a su mapa.
			if ( map !== null && place.visible ) {
				map.addPlace( place );
			}

			if ( jsonPlace.id ) {
				that.placesById[ jsonPlace.id ] = place;
			}
			that.placesByName[ jsonPlace.name ] = place;
			places.push( place );
		} );

		//Añade los enlaces.
		$.each( jsonTour.places, function( i, jsonPlace ) {
			var place = places[i];
			place.links = that.createLinks( places, jsonPlace );
			$.each( ['up', 'down'], function( j, link ) {
				if ( jsonPlace[link] !== null ) {
					place[link] = places[jsonPlace[link]];
				}
			} );
		} );

		//Enlaza los mapas a lugares.
		$.each( jsonTour.maps, function( i, jsonMap ) {
			$.each( ['up', 'down'], function( j, link ) {
				if ( jsonMap[link] !== null ) {
					maps[i][link] = maps[jsonMap[link]];
				}
			} );
			if ( jsonMap.start !== null ) {
				maps[i].setDefault( places[jsonMap.start] );
			}
		} );

		this.initialNode = places[jsonTour.start];
	},

	setInitialPlace: function( place ) {
		this.initialNode = this.normalizePlace( place ) || this.initialNode;
	},

	/**
	 * Set the position in the current place.
	 * @param {Position} position Object: {center: Array ([x, y]), zoom: number}
	 */
	setPosition: function( position ) {
		this.currentPlace.setPosition( position );
	},

	/**
	 * Set the position in the current place from a position string.
	 * @param String strPosition Position string
	 */
	setPositionFromStrings: function( positionStrings ) {
		this.currentPlace.setPosition
			( this.createPositionFromStrings( positionStrings ) );
	},

	/**
	 * Create a position from a string.
	 * @param Object positionStrings Object that contains the position data
	 * as strings ({center: String, zoom: String})
	 * @return Object Created position object
	 * ({center: Array, zoom: Number})
	 */
	createPositionFromStrings: function( positionStrings ) {
		var centerArr;
		var position = {
			center: null,
			zoom: null
		};
		if ( positionStrings.center !== null ) {
			centerArr = positionStrings.center.split( ',' );
			if ( centerArr.length === 2 ) {
				centerArr[0] = parseFloat( centerArr[0] ) || 0;
				centerArr[1] = parseFloat( centerArr[1] ) || 0;
				position.center = centerArr;
			}
			if ( positionStrings.zoom !== null ) {
				position.zoom = parseFloat( positionStrings.zoom ) || 0;
			}
		}
		return position;
	},

	/**
	 * Create links for a given place.
	 * @param {Array} List of all created places
	 * @param {Object} jsonPlace Tour data
	 * @return Array Array of links from the place
	 */
	createLinks: function( places, jsonPlace ) {
		var jsonLinksArray = jsonPlace.links;
		var links = [];
		var that = this;
		$.each( jsonLinksArray, function( i, jsonLink ) {
			var destination = places[jsonLink.destination];
			var tooltipsEnabled, link, position;
			var location = jsonLink.location;
			if ( jsonLink.tooltip !== null ) {
				tooltipsEnabled = jsonLink.tooltip !== false;
			} else {
				tooltipsEnabled = destination.getTooltipsEnabled();
			}
			switch (jsonLink.type) {
				case 'point':
					link = new PointLink( that, destination, location );
					break;
				case 'area':
					link = new AreaLink( that, destination, location );
					break;
				default:
					throw new Error( 'Invalid link type: ' + jsonLink.type );
			}
			link.toggleTooltips( tooltipsEnabled );
				
			position = {
				zoom: jsonLink.zoom,
				center: jsonLink.center
			};
			link.setDestinationPosition( position );
			links.push( link );
		} );
		return links;
	},

	/**
	 * Extract the relevant parameters from a TextLink URL.
	 * @param {String} url URL from which the parameters will be extracted
	 * @param {Boolean} internal Whether the TextLink is inside the virtual tour
	 * @return Object An object with the following attributes:
	 * "tour": tour name
	 * "place": place in the tour
	 * "center": center position
	 * "zoom": zoom value
	 */
	extractTextLinkParams: function( url, internal ) {
		var tour = mw.util.getParamValue( 'vtourId', url );
		var place = mw.util.getParamValue( 'vtourPlace', url );
		var center = mw.util.getParamValue( 'vtourCenter', url );
		var zoom = mw.util.getParamValue( 'vtourZoom', url );
		var ambiguous = mw.util.getParamValue( 'vtourAmbiguous', url );
		// If the place wasn't explicitly defined (not even as null, as
		// in '[...]tour:') and the link is inside this tour, the id is
		// understood to be the place identifier.
		if ( ambiguous && internal ) {
			place = tour;
			tour = null;	
		}
		return {
			tour: tour,
			place: place,
			center: center,
			zoom: zoom
		};
	},

	/**
	 * Find a Place given its ID/name.
	 * @param {String} place ID or name of the Place
	 * @return Place Place with the given ID or name
	 */
	findPlace: function( place ) {
		return this.placesById[place] || this.placesByName[place];
	},

	/**
	 * Get one of the HTML elements contained in the tour.
	 * @param {Number} index Index of the element
	 */
	getHTMLElement: function( index ) {
		return $( this.htmlElements[index] );
	}
} );

