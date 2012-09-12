/**
 * Initialization code for Vtour.
 *
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 * 
 * @file
 */

$( document ).ready( function() {
	var vtour, tourId;
	var $main, $secondary, $map, $error;
	var $json, $html;
	var tourData, $htmlElements;
	var $vtourLinks;
	var position = null;
	var $content = mw.util.$content;

	// Collection of nodes whose ids start with 'vtour-tour-'
	$content.find( 'div[id^="vtour-tour-"]' ).each( function() {
		var $vtourNode = $( this );
		tourId = $vtourNode.attr( 'id' ).split( '-' )[2];

		// Finding all the containers for tour elements
		$main = $vtourNode.find( '#vtour-main-' + tourId );
		$secondary = $vtourNode.find( '#vtour-secondary-' + tourId );
		$map = $vtourNode.find( '#vtour-map-' + tourId );
		$error = $vtourNode.find( '#vtour-error-' + tourId );
		
		// Finding the tour data containers
		$json = $vtourNode.find( '#vtour-json-' + tourId );
		$html = $vtourNode.find( '#vtour-html-' + tourId );

		// Hiding warning messages and content for JavaScript-impaired browsers
		$vtourNode.find( '#vtour-nojs-' + tourId ).detach();
		$html.hide().children().not( '.vtour-htmlelement' ).detach();
		$vtourNode.find( '#vtour-frame-' + tourId ).show();

		// Extracting the tour data
		tourData = $.parseJSON( $json.html() );
		$htmlElements = $html.children();

		// Extracting all Vtour links to the same page
		$vtourLinks = $content.find( 'a.vtour-textlink-local' );

		// Marking the links that are directly inside this tour
		$vtourLinks.filter( function() {
			var closest = $( this ).closest( 'div[id^="vtour-tour-"]' ); 
			var thisTourId = $vtourNode.attr( 'id' );
			var closestId = closest.attr( 'id' ); 
			return thisTourId === closestId;
		} ).data( 'vtour-textlink-in', tourId );

		// Creating the tour
		vtour = new VirtualTour( tourData, $htmlElements, $vtourLinks );

		// Extracting the initial position from the url, and setting the
		// initial place
		if ( mw.util.getParamValue( 'vtourId' ) === tourId ) {
			vtour.setInitialPlace( mw.util.getParamValue( 'vtourPlace' ) );
			position = {
				'center': mw.util.getParamValue( 'vtourCenter' ),
				'zoom': mw.util.getParamValue( 'vtourZoom' )
			};
		}

		// Starting the tour
		vtour.start( $main, $secondary, $map, $error );

		// Setting the initial position
		if ( position !== null ) {
			vtour.setPositionFromStrings( position );
		}
	} );
} );

