
/**
 * Place with text content.
 * @class TextPlace
 */
var TextPlace = Place.extend( {

	spClass: 'vtour-textnode',
	useFx: true,

	/**
	 * Create a new TextPlace.
	 * @param {VirtualTour} tour VirtualTour to which this Place belongs
	 * @param {String} name Name of the place
	 * @param {String} description Description of the place
	 * @param {Boolean} visible Whether this place can be seen in a map
	 * @param {Number[]} location Location of the place in the map ([x, y])
	 * @param {Map} map Map that contains this place
	 * @param {$Element} content DOM node that contains the text that will be shown
	 */
	init: function( tour, name, description, visible, location, map, content ) {
		this._super( tour, name, description, visible, location, map );
		this.content = content;
	},

	generate: function() {
		return $( '<div></div>' );
	},

	move: function( movement ) {
		var absoluteMovement = [];
		var size = [ this.$html.width(), this.$html.height() ]; 
		var index;
		for ( index = 0; index < movement.length; index++ ) {
			absoluteMovement.push( movement[index] / 100 * size[index] );
		}
		scroll( this.$html.parent(), absoluteMovement, true );
	},

	addTo: function( parent ) {
		if ( this.$html === null ) {
			this.$html = this.generate();
			var element = this;
			$.each( this.links, function( i, link ) {
				link.addToElement( element );
			} );
		}
		this.$html.append(this.content.children());
		parent.append( this.$html );
		this._super( parent, !this.useFx );
	},

	cleanup: function( $parent ) {
		// Make the content stay attached to the document.
		// Some scripts might break otherwise.
		this.content.append(this.$html.children());
	}
} );

