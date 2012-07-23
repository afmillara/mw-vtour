
/**
 * Element that can be added to or removed from a Vtour view.
 * @class Element
 */
var Element = Class.extend( {

	/**
	 * Whether an error has occurred.
	 * @var {Boolean} error
	 */
	error: false,

	/**
	 * Create an Element.
	 * @constructor
	 * @param {VirtualTour} tour VirtualTour to which this Element will belong
	 * @param {String} name Name of the new Element
	 */
	init: function( tour, name ) {
		this.tour = tour;
		this.elementName = name;
	},

	/**
	 * Removes this Element from a parent node and performs cleanup.
	 * @param {$Node} $parent  parent node
	 */
	end: function( $parent ) {
		//.empty() also destroys the event handlers
		$parent.children().detach();
	},

	/**
	 * Check whether an image has been loaded correctly, and show an error
	 * message if it hasn't.
	 * @param {$Image} $image $image object created by a Preloader
	 * @param {$HTML} $parent Parent element
	 * @return Boolean true if the image has been loaded, false otherwise
	 */
	checkImage: function( $image, $parent ) {
		if ( $image.data( 'notFound' ) ) {
			var message = mw.message( 'vtour-errordesc-filenotfound',
				imageNameFromPath( $image.attr( 'src' ) ) );
			this.showError( message, $parent );
			return false;
		} else {
			return true;
		}
	},

	/**
	 * Show an error message.
	 * @param {Message} message MediaWiki message object
	 * @param {$HTML} parent Parent element where the error message
	 * will be shown
	 */
	showError: function( message, $parent ) {
		var $description = mw.message( 'vtour-errorinside', message.toString() ).toString(); 
		var $errorHTML = $( $description );
		$parent.append( $errorHTML );
		center( $errorHTML, $parent );	
		this.error = true;
	},

	onMouseUp: function() {
	},

	onMouseMove: function( x, y ) {
	}
} );

