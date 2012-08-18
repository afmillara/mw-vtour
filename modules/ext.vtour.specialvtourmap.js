/**
 * Initialization code for Special:VtourMap.
 *
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 * 
 * @file
 */

$( document ).ready( function() {
	var $content = mw.util.$content || $( document );
	var externalMapClassName = mw.config.get( 'wgVtourExternalMap' );
	var ExternalMapImplementation = ExternalMap.classes[externalMapClassName];
	var pageName = mw.config.get( 'wgPageName' ).split( '/', 1 )[0];
	var jsonPath = mw.config.get( 'wgArticlePath' ).replace( '$1', pageName + '/json' );

	$vtourMap = $content.find( '.vtour-specialvtourmap' );
	new ExternalMapImplementation( $vtourMap, function( map ) {
		$.getJSON( jsonPath, function( tourData ) {
			var ii, markerData, coordinates, link;
			for ( ii = 0; ii < tourData.length; ii++ ) {
				markerData = tourData[ii];
				coordinates = translateGeographicCoordinates( markerData.coords );
				map.addMarker( markerData.name, null, coordinates, function() {
					window.location.href = markerData.url;
				} );
			}
		} );
	}, $.noop, true );
} );

