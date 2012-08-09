/**
 * Place inside a tour.
 *
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 * 
 * @file
 */

/**
 * Place that is part of a VirtualTour.
 * @class Place
 */
var Place = Element.extend( {

	/**
	 * Initial position of the Place.
	 * @var {Position} initialPosition
	 */
	initialPosition: {
		zoom: 1,
		center: [0, 0]
	},

	/**
	 * Whether the angle in the map can be changed.
	 * @var {Boolean} variableAngle
	 */
	variableAngle: false,

	/**
	 * Current angle of the place, in radians.
	 * @var {Number|null} angle
	 */
	angle: null,

	/**
	 * CSS class with the icon for this place.
	 * @var {String} iconClass
	 */
	iconClass: null,

	/**
	 * CSS class that will be applied to the parent element.
	 * @var {String|null} spClass
	 */
	spClass: null,

	/**
	 * Link to this place in the map.
	 * @var {MapLink} mapLink
	 */
	mapLink: null,

	/**
	 * Whether the Place is currently visible.
	 * @var {Boolean} installed
	 */
	installed: false,

	/**
	 * New position (center and zoom) for this place that will replace the current one.
	 * @var {Position|null} movePending
	 */
	movePending: null,

	/**
	 * jQuery collection wrapping the DOM elements that contain the title and
	 * description of the place.
	 * @var {$HTML} $infoNode
	 */
	$infoNode: null,

	/**
	 * jQuery collection wrapping the DOM elements that contain the place.
	 * @var {$HTML} $html
	 */
	$html: null,
	
	/**
	 * Whether tooltips are enabled for this Place.
	 * @var {Boolean} tooltipsEnabled
	 */
	tooltipsEnabled: true,

	/**
	 * Duration of the fadein and fadeout.
	 * @var {Number|String} transitionTime
	 */
	transitionTime: 'slow',

	/**
	 * Create a new Place.
	 * @param {VirtualTour} tour VirtualTour to which this Place belongs
	 * @param {String} name Name of the place
	 * @param {String} description Description of the place
	 * @param {Boolean} visible Whether this place can be seen in a map
	 * @param {Number[]} location location of the place in the map ([x, y])
	 * @param {Map} map map that contains this place
	 */
	init: function( tour, name, description, visible, location, map ) {
		this._super( tour, name );
		this.initialPosition = clone( this.initialPosition );
		this.description = description;
		this.visible = visible;
		this.location = location;
		this.map = map;
	},
	
	setTooltipsEnabled: function( tooltipsEnabled ) {
		this.tooltipsEnabled = tooltipsEnabled;
	},

	getTooltipsEnabled: function() {
		return this.tooltipsEnabled;	
	},

	/**
	 * Return human-readable information for this Place.
	 * @return $HTML jQuery collection containing a DOM node with the title,
	 * description and related information for this Place
	 */
	getInfo: function() {
		var $descriptionNode;
		if ( this.$infoNode === null ) {
			this.$infoNode = $( '<div></div>' ).addClass( 'vtour-infonode' ).append(
				$( '<strong></strong>' ).text( this.elementName
					+ ( ( this.map !== null ) ?
						' (' + this.map.elementName + ')' : '' ) ) );
			if ( this.description !== null ) {
				this.description.addTo( this.$infoNode );
			}
		}
		return this.$infoNode;
	},

	/**
	 * Set the initial position of this place.
	 * @param {Object} position Object: {'zoom': zoom level or null, 
	 * 'center': position of the center of the view or null
	 */
	setInitialPosition: function( position ) {
		this.initialPosition = this.mergePositions
			( position, this.initialPosition );
	},

	/**
	 * Change the position shown in this place.
	 * @param {Object} position Object: {'zoom': zoom level or null, 
	 * 'center': position of the center of the view or null
	 */
	setPosition: function( position ) {
		position = this.mergePositions( position, this.initialPosition );
		if ( this.installed ) {
			this.applyPosition( position );	
		} else {
			this.movePending = position;
		}
	},

	/**
	 * Merge two position objects, generating a position where the parameters that
	 * are present in the first one are taken from it and the rest are taken from
	 * the second one.
	 * @param {Object} newPosition First position
	 * @param {Object} basePosition Second position
	 * @return Object Merged positions
	 */
	mergePositions: function( newPosition, basePosition ) {
		newPosition = clone( newPosition );
		if ( newPosition.zoom === null ) {
			newPosition.zoom = basePosition.zoom;
		}
		if ( newPosition.center === null ) {
			newPosition.center = basePosition.center;
		}
		return newPosition;
	},

	/**
	 * Apply a position to the place now.
	 * @param {Object} position Position to apply
	 */
	applyPosition: function( position ) {
		if ( position.zoom !== null ) {
			this.changeZoom( position.zoom );
		}
		if ( position.center !== null ) {
			this.move( position.center );
		}
	},

	/**
	 * Change the zoom level.
	 * @param {Number} zoom Zoom level
	 */
	changeZoom: function( zoom ) {
	},

	/**
	 * Change the center of the view.
	 * @param center Center of the view
	 */
	move: function( center ) {
	},

	/**
	 * Set the orientation of the place. It is not displayed inside it,
	 * but it can be used by map links. In places whose orientation may
	 * change, the angleChanged.vtour event is triggered when it does,
	 * passing the angle as an additional parameter.
	 * @param {Number} Angle in degrees
	 */
	setAngle: function( angle ){
		this.angle = angle*DEG2RAD;
	},

	/**
	 * Return the HTML class for the icons that represent this place.
	 * @return {String} icon class
	 */
	getIconClass: function() {
		return this.iconClass;
	},

	/**
	 * Add this HTML code for this Place to a given node.
	 * @param {$Element} $parent    HTML node to which this Place will be added
	 */
	addTo: function( $parent, nofx ) {
		if ( this.spClass !== null ) {
			$parent.addClass( this.spClass );
		}

		this.installed = true;
		if ( this.movePending !== null ) {
			this.applyPosition( this.movePending );
			this.movePending = null;
		} else if ( this.initialPosition !== null ) {
			this.applyPosition( this.initialPosition );
		}
	
		if ( !nofx ) {	
			var html = $.isArray( this.$html ) ? this.$html: [this.$html];
			for ( var i = 0; i < html.length; i++ ) {
				html[i].fadeOut( 0 ).fadeIn( this.transitionTime );
			}
		}
	},

	end: function( $parent ) {
		var that = this;
		var $content = $parent.children();
		$content.addClass( 'vtour-fading' ).fadeOut( this.transitionTime, function() {
			that.cleanup();
			//.empty() also destroys the event handlers
			$content.detach();
			$content.fadeIn( 0 );
			$content.removeClass( 'vtour-fading' );
		} );
		if ( this.spClass ) {
			$parent.removeClass( this.spClass );
		}
		this.installed = false;
	},
 
	/**
	 * Get a MapLink to this Place.
	 * @return {MapLink} MapLink to this Place
	 */
	getMapLink: function() {
		if ( this.mapLink === null ) {
			this.mapLink = new MapLink( this.tour, this, this.location );
			this.mapLink.toggleTooltips( this.tooltipsEnabled );
		}
		return this.mapLink;
	},

	/**
	 * Clean after hiding this place.
	 * @param {$HTML} $parent Parent element
	 */
	cleanup: function( $parent ) {
	}
} );
