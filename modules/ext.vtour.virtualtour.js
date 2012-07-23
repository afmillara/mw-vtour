/**
 * @project VirtualTour-mw
 * @description Sistema de visitas virtuales en Javascript.
 * @author Álvaro Fernández Millara
 * @version N/A
 */

/**
 * Visita virtual.
 * @class VirtualTour
 */
var VirtualTour = Class.extend( {

	id: null,
	currentPlace: null,

	preloader: null,

	placesById: {},
	placesByName: {},

	/**
	 * Create a new VirtualTour.
	 * @param {JSON} tourData	tour data in JSON format
	 * @param {Node[]} htmlNodes	array of DOM nodes that store the HTML content
	 * @param {$A} $localLinks	jQuery element containing all the links to tours in this page
	 */
	init: function( tourData, htmlElements, $localLinks ) {
		this.htmlElements = htmlElements;

		this.preloader = new Preloader();

		var that = this;
		$( document ).bind( 'mouseup', function() {
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
		$( document ).bind( 'mousemove', function( event ) {
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
			var internal = $link.data( 'vtour-textlink-in' ) == that.id;
			var position;
			var linkParts = that.extractTextLinkParams( $link.attr( 'href' ), internal );
			if ( internal || linkParts.tour === that.id ) {
				place = that.findPlace( linkParts.place );
				if ( place ) {
					position = that.createPositionFromStrings( linkParts );		
					textlink = new TextLink( that, place, $link );
					textlink.setDestinationPosition( position );
					textlink.addToElement();
					// TODO: Attach textlink to origin element, if it exists.
				}
			}
		} );
	},

	/**
	 * Start the VirtualTour, and display it on the given DOM nodes.
	 * @param {$Node} main	HTML node for the main panel
	 * @param {$Node} secondary	HTML node for the secondary panel
	 * @param {$Node} map	HTML node for the map panel
	 */
	start: function( main, secondary, map, error ) {
		this.main = main;
		this.secondary = secondary;
		this.map = map;
		this.error = error;

		this.main.addClass( 'vtour-main' );
		this.map.addClass( 'vtour-map' );

		var that = this;

		this.preloader.start(
			function() {
    			that.move( that.initialNode );
				$( that ).trigger( 'load' );
			},
			function( $file ){
				$file.data( 'notFound', true );
				var description = mw.message( 'vtour-errordesc-filenotfound',
					imageNameFromPath( $file.attr( 'src' ) ) );
				that.showError( description );
			}
		);		
	},

	showError: function( message ) {
		var errorContent = mw.message( 'vtour-runtimeerror', message.toString() ).toString();
		var errorHTML = mw.message( 'vtour-erroroutside', errorContent.toString() ).toString();
		this.error.append( errorHTML );
	},

	/**
	 * Change the 'current place' displayed.
	 * @param {Place / String} place	new current place (Place object or id/name)
	 */
	move: function( place ) {
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
	 * Create the virtual tour structure from the data in JSON format.
	 * @param {JSON} jsonTour    tour data in JSON format
	 * @return {Place} place where the tour will start
	 */
	createNodesFromJSON: function( jsonTour ) {
		this.id = jsonTour.id;

		var maps = [];
		var places = [];

		var that = this;

		//Crea los mapas.
		$.each( jsonTour.maps, function( i, jsonMap ) {
			var background = that.preloader.add( jsonMap.image );
			maps.push( new Map( that, jsonMap.name, background, jsonMap.location ) );
		} );

		//Crea los lugares.
		$.each( jsonTour.places, function( i, jsonPlace ) {
			var name = jsonPlace.name;
			var description = null;
			if ( jsonPlace.description !== null ) {
				description = 
					new DescriptionTextPlace( that,
						that.getHTMLElement( jsonPlace.description ) );
			}
			var visible = jsonPlace.visible;
			var location = jsonPlace.location;
			var map = null;
			if ( jsonPlace.map !== null ) {
				map = maps[jsonPlace.map];
			}
			switch (jsonPlace.type) {
				case 'image':
					var image = that.preloader.add( jsonPlace.image );
					var place = new ImagePlace
							( that, name, description, visible, location, map, image );
					if (jsonPlace.angle !== null){
						place.setAngle(jsonPlace.angle);
					}
					break;
				case 'pano':
					var image = that.preloader.add( jsonPlace.image );
					var place;
					if ( supports2DCanvas() ) {
						place = new PanoPlace
							( that, name, description, visible, location, map, image );
						if (jsonPlace.baseangle !== null){
							place.setBaseAngle(jsonPlace.baseangle);
						}
					} else {
						place = new ImagePlace
							( that, name, description, visible, location, map, image );
						// TODO: Fix links.
						if ( jsonPlace.baseangle !== null ) {
							place.setAngle( jsonPlace.baseangle );
						}
					}
					break;
				case 'text':
					var place = new TextPlace( that, name, description, visible,
						location, map, that.getHTMLElement( jsonPlace.text ) );
					break;
				default:
					throw new Error( 'Invalid place type: ' + jsonPlace.type );
			}

			var initialPosition = {
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
		var that = this;
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

	setPosition: function( position ) {
		this.currentPlace.setPosition( position );
	},

	setPositionFromStrings: function( strPosition ) {
		this.currentPlace.setPosition
			( this.createPositionFromStrings( strPosition ) );
	},

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
	 * @param {Element[]}   list of all created places
	 * @param {JSON} jsonPlace  JSON data for an place
	 * @return {Link[]} array of links from the place
	 */
	createLinks: function( places, jsonPlace ) {
		var jsonLinksArray = jsonPlace.links;
		var links = [];
		var that = this;
		$.each( jsonLinksArray, function( i, jsonLink ) {
			var destination = places[jsonLink.destination];
			var tooltipsEnabled;
			if ( jsonLink.tooltip !== null ) {
				tooltipsEnabled = jsonLink.tooltip !== false;
			} else {
				tooltipsEnabled = destination.getTooltipsEnabled();
			}
			var location = jsonLink.location;
			var link;
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
				
			var position = {
				zoom: jsonLink.zoom,
				center: jsonLink.center
			};
			link.setDestinationPosition( position );
			links.push( link );
		} );
		return links;
	},

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

	findPlace: function( place ) {
		return this.placesById[place] || this.placesByName[place];
	},

	getHTMLElement: function( index ) {
		return $(this.htmlElements[index]);
	}
} );

