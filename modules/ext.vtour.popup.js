/**
 * "Tooltip" popup.
 *
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 * 
 * @file
 */

/**
 * "Tooltip" popup describing a Place.
 * @class Popup
 */
//* class Popup {
var Popup = Class.extend( {

	/**
	 * Place that is described in this popup.
	 * @var {Place} place
	 */
	//* protected Place place;
	place: null,

	/**
	 * Whether the Popup can be seen.
	 * @var {Boolean} visible
	 */
	//* protected Boolean visible;
	visible: false,

	/**
	 * How long (milliseconds or "slow" or "fast") the fading out animation will run.
	 * @var {Number|String} fadeoutTime
	 */
	//* protected String fadeoutTime;
	fadeoutTime: 'fast',

	/**
	 * HTML for the popup.
	 * @var {$HTML} $popup
	 */
	//* protected $HTML $popup;
	$popup: null,

	/**
	 * Maximum width of the information box (in pixels).
	 * @var {Number} maxInfoWidth
	 */
	//* protected Number maxInfoWidth;
	maxInfoWidth: 1000,

	/**
	 * Maximum height of the information box (in pixels).
	 * @var {Number} maxInfoHeight
	 */
	//* protected Number maxInfoHeight;
	maxInfoHeight: 200,

	/**
 	 * Create a new Popup.
 	 * @param {Place} place Place whose name and description will be shown
 	 * @constructor
 	 */
	//* public void init( Place place );
	init: function( place ) {
		this.place = place;
	},

	/**
	 * Show the popup.
	 * @param {Number[]} location Lower left corner of the popup ([x, y])
	 */
	//* public void show( Number[] location );
	show: function( location ) {
		var that = this;
		var $popup = this.$popup = $( '<div></div>' ).addClass( 'vtour-popup' );
		var $infoContainer = $( '<div></div>' ).addClass( 'vtour-popupinfo' )
			.append( this.place.getInfo() );

		$popup.append( $infoContainer );
		$( mw.util.$content ).append( $popup );

		if ( $infoContainer.width() > this.maxInfoWidth ) {
			$infoContainer.width( this.maxInfoWidth );
		}
		if ( $infoContainer.height() > this.maxInfoHeight ) {
			$infoContainer.height( this.maxInfoHeight );
			$popup.addClass( 'vtour-incompletepopup' );
		}
		this.setLocation( location );
	},

	/**
	 * Set the location of the popup.
	 * @param {Number[]} location Upper left corner of the popup ([x, y])
	 */
	//* public void setLocation( Number[] location );
	setLocation: function( location ) {
		this.$popup.offset( {
			'left': location[0],
			'top': location[1]
		} );
	},

	/**
	 * Hide the popup after a fading animation.
	 */
	//* public void fadeOut();
	fadeOut: function() {
		var that = this;
		this.$popup.fadeOut( this.fadeoutTime, function() {
			that.destroy();
		} );
	},

	/**
	 * Hide the popup.
	 */
	//* public void destroy();
	destroy: function() {
		this.$popup.detach();
		this.visible = false;
	}
} );

/**
 * Popup that is currently being displayed.
 * @var {Popup} currentPopup
 */
//* protected static Popup currentPopup;
Popup.currentPopup = null;

/**
 * Show a new popup and hide the old one, if it is being displayed.
 * @param {Place} place Place from which the information to display will be extracted
 * @param {Number[]} location Lower left corner of the popup ([x, y])
 */
//* public static Popup show( Place place, Number[] location );
Popup.show = function( place, location ) {
	if ( Popup.currentPopup !== null ) {
		Popup.currentPopup.destroy();
	}
	Popup.currentPopup = new Popup( place );
	Popup.currentPopup.show( location );
	return Popup.currentPopup;
};

//* }

