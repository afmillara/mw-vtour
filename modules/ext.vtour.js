
/**
 * Initialization code for virtual tours.
 */
( function( mw, $, undefined ) {
	$( document ).ready( function() {
		var vtour, $vtourNode, tourId;
		var $main, $secondary, $map;
		var $json, jsonData, $htmlElements;
		var $error, $vtourLinks;
		// mw.util.$content can be null somehow in 1.17.0
		var $content = mw.util.$content || $( document );
		var position = null;
		var $vtourNodes = $content.find( 'div[id^="vtour-tour-"]' );
		$vtourNodes.each( function() {
			$vtourNode = $( this );
			tourId = $vtourNode.attr( 'id' ).split( '-' )[2];

			$main = $vtourNode.find( '#vtour-main-' + tourId );
			$secondary = $vtourNode.find( '#vtour-secondary-' + tourId );
			$map = $vtourNode.find( '#vtour-map-' + tourId );
			
			$json = $vtourNode.find( '#vtour-json-' + tourId );
			jsonData = $.parseJSON( $json.html() );
			
			$htmlElements = $vtourNode.find( '#vtour-html-' + tourId ).children();
			
			$error = $vtourNode.find( '#vtour-error-' + tourId );

			$vtourLinks = $content.find( 'a.vtour-textlink-local' );
			$vtourLinks.filter( function() {
				var closest = $( this ).closest( 'div[id^="vtour-tour-"]' ); 
				var thisTourId = $vtourNode.attr( 'id' );
				var closestId = closest.attr( 'id' ); 
				return thisTourId === closestId;
			} ).data( 'vtour-textlink-in', tourId );

			vtour = new VirtualTour( jsonData, $htmlElements, $vtourLinks );

			if ( mw.util.getParamValue( 'vtourId' ) === tourId ) {
				vtour.setInitialPlace( mw.util.getParamValue( 'vtourPlace' ) );
				position = {
					'center': mw.util.getParamValue( 'vtourCenter' ),
					'zoom': mw.util.getParamValue( 'vtourZoom' )
				};
			}

			vtour.start( $main, $secondary, $map, $error );
			if ( position !== null ) {
				vtour.setPositionFromStrings( position );
			}
		});
	});
}( mediaWiki, jQuery ) );

