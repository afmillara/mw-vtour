
/**
 * Base class for links inside a Vtour. Implementations must define getHTML
 * and updatePosition.
 *
 * @class Link
 */
var Link = Class.extend({

	/**
	 * Whether the mouse pointer is currently over the link.
	 * @var {Boolean} hovering
	 */
	hovering: false,

	/**
	 * Timestamp of the last time the mouse crossed the link border.
	 * @var {Number} lastTime
	 */
	lastTime: null,

	/**
	 * Absolute location ([x, y]) of the "tooltip" popup in the page.
	 * @var {Array} popupLocation
	 */
	popupLocation: null,

	/**
	 * Popup object currently being shown.
	 * @var {Popup} popup
	 */
	popup: null,

	/**
	 * Object containing values for initial "center" and "zoom" at the destination.
	 * @var {Position} destinationPosition
	 */
	destinationPosition: null,

	/**
	 * Callback function that translates link coordinates (either a pair of numbers or
	 * an array containing pairs of numbers) to coordinates relative to the parent element
	 * @var {function(Array): Array} posCallback
	 */
	posCallback: null,

	/**
	 * Whether a "tooltip" popup should be shown when the mouse pointer is over the link.
	 * @var {Boolean} tooltipsEnabled
	 */
	tooltipsEnabled: true,

	/**
	 * X and Y coordinates of the "tooltip" popup relative to the mouse pointer.
	 * @var {Array} distanceToPointer
	 */
	distanceToPointer: [12, 5],

	/**
	 * Time, in milliseconds since the hovering started, before the "tooltip" appears.
	 * @var {Number} waitToShow
	 */
	waitToShow: 300,

	/**
	 * Time, in milliseconds since the hovering ended, before the "tooltip" disappears.
	 * @var {Number} waitToHide
	 */
	waitToHide: 100,


	// "Public" methods

	/**
	 * Create a new Link.
	 * @constructor
	 * @param {VirtualTour} tour Tour to which this link belongs
	 * @param {Place} destination Place to which this links points
	 */
	init: function( tour, destination ) {
		this.tour = tour;
		this.destination = destination;
	},

	/**
	 * Set the position at the destination where the link will take the user.
	 * @param {Position} destinationPosition Initial position when following this link.
	 */
	setDestinationPosition: function( destinationPosition ) {
		this.destinationPosition = destinationPosition;
	},

	/**
	 * Generate and return a DOM node that acts as a link.
	 * @return {$Element|Array} jQuery collection containing a DOM node, or array of jQuery
	 * collections containing DOM nodes
	 */
	getHTML: function() {
		throw new Error( 'Not implemented: getHTML' );
	},

	/**
	 * Enable or disable the "tooltip" popup.
	 * @param {Boolean} tooltipsEnabled Whether tooltips should be enabled.
	 */
	toggleTooltips: function( tooltipsEnabled ) {
		this.tooltipsEnabled = tooltipsEnabled;
	},

	/**
	 * Set the callback function to translate link coordinates to coordinates for
	 * the HTML node.
	 * @param {function([x, y]): [x, y]} callback    function to translate
	 * link coordinates to coordinates for the HTML node
	 */
	setPosCallback: function( callback ) {
		this.posCallback = callback;
	},


	// "Protected" methods

	/**
	 * Update the location of this element in the HTML node where it is installed.
	 * @param {function([x, y]): [x, y]} posCallback    function to translate
	 * link coordinates to coordinates for the HTML node
	 */
	updatePosition: function() {
		throw new Error( 'Not implemented: updatePosition');
	},

	/**
	 * Follow this link.
	 */
	follow: function() {
		this.destroyPopup();
		if ( this.destinationPosition !== null ) {
			this.destination.setPosition( this.destinationPosition );
		}
		this.tour.move( this.destination );
	},

	/**
	 * Show the popup, if enabled. Implementations must call this method when appropriate.
	 * @param {Array} location Absolute coordinates of the mouse
	 */
	hover: function( location ) {
		if ( !this.tooltipsEnabled ) {
			return;
		}
		this.popupLocation = sum( location, this.distanceToPointer );
		this.hovering = true;
		if ( this.popup ) {

			this.popup.setLocation( this.popupLocation );
		}
		this.checkHover();

	},

	/**
	 * Hide the popup, if enabled. Implementations must call this method when appropriate.
	 * @param {Array} location Absolute coordinates of the mouse
	 */
	noHover: function() {
		if ( !this.tooltipsEnabled ) {
			return;
		}
		this.hovering = false;
		this.checkHover();
	},


	// "Private" methods

	/**
	 * Check whether the "tooltip" popup should be shown or hidden
	 * and start the timeout to do so.
	 */
	checkHover: function() {
		var that = this;
		var shouldChange = this.hovering !== !!this.popup;
		var changeAfterWaiting, wait;
		if ( shouldChange ) {
			if ( this.lastTime === null ) {
				this.lastTime = new Date().getTime();
				wait = this.popup ? this.waitToHide : this.waitToShow;
				changeAfterWaiting = function() {
					var currTime = new Date().getTime(); 
					if ( that.lastTime ) {
						if ( currTime - that.lastTime >= wait ) {
							that.changePopupState();
						} else {
							setTimeout( changeAfterWaiting, wait );
						}
					}
				};
				setTimeout( changeAfterWaiting, wait );
			}
		} else {
			this.lastTime = null;
		}
	},

	/**
	 * Show the "tooltip" popup if it isn't visible; hide it if it is.
	 */
	changePopupState: function() {
		if ( this.popup ) {
			this.destroyPopup();
		} else {
			this.createPopup();
		}
	},

	/**
	 * Create the "tooltip" popup.
	 */
	createPopup: function() {
		var that = this;
		var $popup;
		if ( !this.popup && this.destination !== this.tour.currentPlace ) {
			this.popup = Popup.show( this.destination, this.popupLocation );
			this.lastTime = null;
		}
	},

	/**
	 * Hide the "tooltip" popup.
	 */
	destroyPopup: function() {
		if ( this.popup ) {
			this.popup.fadeOut();
			this.popup = null;
			this.lastTime = null;
		}
	}
});

