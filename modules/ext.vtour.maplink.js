/**
 * Special link for places in a map.
 *
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 * 
 * @file
 */

/**
 * Link from a single point in a Map to a Place contained in it.
 */
var MapLink = PointLink.extend( {

	rotationAngle: 0,

	/**
	 * Angle marker of the map link, if an angle has been set.
	 * @var {AngleMarker} angleMarker
	 */
	angleMarker: null,

	/**
	 * Create a new MapLink.
	 * @param {VirtualTour} tour Tour to which the link belongs
	 * @param {Place} destination Destination of the link
	 * @param {Number[]} location Location of the link ([x, y]) on the map
	 */
	init: function( tour, destination, location ) {
		this._super( tour, destination, location );
	},

	setRotationAngle: function( rotationAngle ) {
		this.rotationAngle = rotationAngle;
	},

	/**
	 * Get the HTML for the icon.
	 * @return {$Element} icon HTML node for the icon
	 */
	getIconNode: function() {
		var markerLeft, markerTop;
		var $icon = $('<div></div>').addClass(this.destination.getIconClass()).css( {
			'top' : 0,
			'left' : 0
		} );
		this.$currentPlaceMarker = $('<div></div>')
			.addClass('vtour-currentplacemarker').hide();
		markerLeft = ( this.$currentPlaceMarker.width() - $icon.width() ) / 2;
		markerTop = ( this.$currentPlaceMarker.height() - $icon.height() ) / 2;
		this.$currentPlaceMarker.css( {
			'position' : 'absolute',
			'left' : -markerLeft,
			'top' : -markerTop
		} );
		if (this.destination.angle !== null){
			var that = this;
			/*
			$icon.mouseenter(function(){
				if (!that.isSelected()){
					that.$angleIcon.fadeTo('fast', 0.5);
				}
			});
			$icon.mouseleave(function(){
				if (!that.isSelected()){
					that.$angleIcon.fadeTo('slow', 0, function(){
						if (!that.isSelected()){
							that.$angleIcon.hide();
						}
					});
				}
			});
			*/
		}
		return $( '<div></div>' ).css( {
			'position': 'absolute',
			'z-index': 1
		} ).append( $icon, this.$currentPlaceMarker );
	},

	isSelected: function(){
		return this.tour.currentPlace === this.destination;
	},

	updatePosition : function() {
		if ( this._super() ) {
			this.$currentPlaceMarker.toggle( this.isSelected() );
			if (this.angleMarker !== null){
				this.angleMarker.toggle( this.isSelected() );
				this.updateAngleMarker();
				//this.$angleIcon.fadeTo(0, 1);
			}
			return true;
		} else {
			if ( this.angleMarker !== null ) {
				this.angleMarker.toggle( false );
			}
			return false;
		}
	},

	updateAngleMarker: function() {
		var htmlLocation = this.posCallback( this.location );
		if ( htmlLocation !== null ) {
			this.angleMarker.setLocation( htmlLocation );
			this.angleMarker.setAngle( this.destination.angle - this.rotationAngle );
			this.angleMarker.show();
		}
	},

	getHTML: function( element ) {
		var that = this;
		var AngleMarkerToUse;
		var ret;
		this.$nodeIcon = this.generate();
		ret = [this.$nodeIcon];

		if ( this.destination.angle !== null ) {
			this.angleMarker = new AngleMarker( this.destination.variableAngle );
			this.updateAngleMarker();
			$( this.angleMarker ).bind( 'press.vtour', function() {
				that.follow();
			} );
			$( this.angleMarker ).bind( 'angleChanged.vtour', function( e, angle ) {
				that.destination.changeAngle( ( angle + that.rotationAngle ) / DEG2RAD );
			} );
			$( this.destination ).bind( 'angleChanged.vtour', function() {
				that.updateAngleMarker();
			} );
			ret.push( this.angleMarker.getHTML() );
		}
		return ret;
	}
} );

