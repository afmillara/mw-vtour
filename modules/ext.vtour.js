
/**
 * Initialization code for virtual tours.
 */
( function( mw, $, undefined ) {
	$( document ).ready( function() {
		var vtour, $vtourNode, tourId;
		var $main, $secondary, $map;
		var $json, jsonData, $htmlElements;
		var $error, $vtourLinks;
		var $content = mw.util.$content;
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
			
			$error = $( '<div id=eeee></div>' ); // TODO: Remove id.
			$vtourNode.before( $error );

			$vtourLinks = $content.find( 'a.vtour-textlink-local' );
			$vtourLinks.filter( function() {
				return $vtourNode.is( $( this ).closest( 'div[id^="vtour-tour-"]' ) );
			} ).data( 'vtour-textlink-in', tourId ).length;
			vtour = new VirtualTour( jsonData, $htmlElements, $vtourLinks );
			
			if ( mw.util.getParamValue( 'vtourId' ) === tourId ) {
				$( vtour ).on( 'load.vtour', function() {
					vtour.move( mw.util.getParamValue( 'vtourPlace' ) || '' );
					vtour.setPositionFromStrings( {
						'center': mw.util.getParamValue( 'vtourCenter' ),
						'zoom': mw.util.getParamValue( 'vtourZoom' )
					} );
				} );
			}
			
			vtour.start( $main, $secondary, $map, $error );
		});
	});
}( mediaWiki, jQuery ) );

