
/**
 * Link from a single point in a graphic Place to another Place.
 */
var PointLink = Link.extend( {

	/**
	 * Create a new PlaceLink.
	 * @param {VirtualTour} tour Tour to which the link belongs
	 * @param {Place} destination Destination of the link
	 * @param {Array} location Location of the link ([x, y]) on the origin Place
	 */
	init: function( tour, destination, location ) {
		this._super( tour, destination );
		this.location = location;
	},

	$nodeIcon: null,

	/**
	 * Get the HTML for the icon.
	 * @return $HTML icon HTML node for the icon
	 */
	getIconNode: function() {
		return $('<div></div>').addClass(this.destination.getIconClass());
	},

	/**
	 * Generate an HTML link.
	 * @return $HTML jQuery object wrapping the link
	 */
	generate: function() {
		var that = this;
		var $nodeIcon = this.getIconNode();
		$nodeIcon.css('cursor', 'pointer');
		$nodeIcon.click( function() {
			that.follow();
		} );
		$nodeIcon.bind( 'mouseenter mousemove', function( event ) {
			that.hover( [event.pageX, event.pageY] );
		} ).bind( 'mouseleave', function() {
			that.noHover();
		} );
		return $nodeIcon;
	},

	getHTML: function() {
		if ( this.$nodeIcon === null ) {
			this.$nodeIcon = this.generate();
		}
		return this.$nodeIcon;
	},
	
	updatePosition: function() {
		var htmlPos = this.posCallback( this.location );
		this.$nodeIcon.toggle( htmlPos !== null );
		if ( htmlPos !== null ) {
			setPosition( this.$nodeIcon, htmlPos);
		}
	}
} );

