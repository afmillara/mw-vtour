
var Popup = Class.extend( {

	place: null,
	visible: false,
	fadeoutTime: 'fast',
	$popup: null,

	maxInfoWidth: 1000,
	maxInfoHeight: 200,

	init: function( place ) {
		this.place = place;
	},

	show: function( location ) {
		var that = this;
		this.visible = true;
		var $popup = this.$popup = $( '<div></div>' ).addClass( 'vtour-popup' );
		var $infoContainer = $( '<div></div>' ).addClass( 'vtour-popupinfo' )
			.append( this.place.getInfo() );
 		/*
		$popup.hover( function() {
			$( that ).trigger( 'popupHover' );
		}, function() {
			$( that ).trigger( 'popupNoHover' );
		} );
		*/

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

	setLocation: function( location ) {
		this.$popup.offset( {
			'left': location[0],
			'top': location[1] - this.$popup.height()
		} );
	},

	fadeOut: function() {
		var that = this;
		this.$popup.fadeOut( this.fadeoutTime, function() {
			that.destroy();
		} );
	},

	destroy: function() {
		this.$popup.detach();
		this.visible = false;
	}
} );

Popup.currentPopup = null;

Popup.show = function( place, location ) {
	if ( Popup.currentPopup !== null
			&& Popup.currentPopup.visible ) {
		if ( Popup.currentPopup.place === place ) {
			return Popup.currentPopup;
		} else {
			Popup.currentPopup.destroy();
		}
	}
	Popup.currentPopup = new Popup( place );
	Popup.currentPopup.show( location );

	return Popup.currentPopup;
};

