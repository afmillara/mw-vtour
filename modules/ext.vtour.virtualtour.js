
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

	placesById: null,
	placesByName: null,

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
		$( document ).mouseup( function() {
			var current = that.currentPlace;
			if ( current !== null ){
				current.onMouseUp();
				$.each( [current.map, current.description], function( index, place) {
					if ( place !== null ) {
						place.onMouseUp();
					}
				} );
			}
		} );
		$( document ).mousemove( function( event ) {
			var current = that.currentPlace;
			if ( that.currentPlace !== null ){
				that.currentPlace.onMouseMove( event.pageX, event.pageY );
				$.each( [current.map, current.description], function( index, place) {
					if ( place !== null ) {
						place.onMouseMove( event.pageX, event.pageY );
					}
				} );
			}
		} );
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
							var currPlace = that.textPlaces[ii];
							if ( currPlace.registerLinkIfInside( textlink ) ) {
								break;
							}
						}
					}
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

    		that.move( that.initialNode );
		$( that ).trigger( 'load.vtour' );
	},

	showError: function( message ) {
		var errorContent = mw.message( 'vtour-warning', message.toString() ).toString();
		var errorHTML = mw.message( 'vtour-erroroutside', errorContent.toString() ).toString();
		this.error.append( errorHTML );
	},

	/**
	 * Change the 'current place' displayed.
	 * @param {Place|String} place New current place (Place object or id/name)
	 */
	move: function( place ) {
		if ( place === null ) {
			return;
		}
		if ( typeof place === 'string' ) {
			place = this.findPlace( place );
			if ( place ) {
				this.move( place );
			}
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
						( that, name, description, visible, location, map, image )
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
			}
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
			/*if ( place.description !== null ) {
				place.description.links =
						that.createLinks( places, jsonPlace['description'] );
			}
			*/
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

	/**
	 * Set the position in the current place.
	 * @param {Position} position Object: {"center": Array ([x, y]), "zoom": number}
	 */
	setPosition: function( position ) {
		this.currentPlace.setPosition( position );
	},

	/**
	 * Set the position in the current place from a position string.
	 * @param String strPosition Position string
	 */
	setPositionFromStrings: function( strPosition ) {
		this.currentPlace.setPosition
			( this.createPositionFromStrings( strPosition ) );
	},

	/**
	 * Create a position from a string.
	 * @param String strPosition Position string
	 * @return Position Created position object
	 */
	createPositionFromStrings: function( strPosition ) {
		var centerArr;
		var position = {
			center: null,
			zoom: null
		};
		if ( strPosition.center !== null ) {
			centerArr = strPosition.center.split( ',' );
			if ( centerArr.length === 2 ) {
				centerArr[0] = parseFloat( centerArr[0] ) || 0;
				centerArr[1] = parseFloat( centerArr[1] ) || 0;
				position.center = centerArr;
			}
			if ( strPosition.zoom !== null ) {
				position.zoom = parseFloat( strPosition.zoom ) || 0;
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

