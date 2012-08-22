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
			var ii, markerData, coordinates, $link, linkText;
			for ( ii = 0; ii < tourData.length; ii++ ) {
				markerData = tourData[ii];
				coordinates = translateGeographicCoordinates( markerData.coords );
				$link = $( '<a></a>' ).text( markerData.name )
					.attr( 'href', markerData.url );
				linkText = $( '<div></div>' ).append( $link ).html();
				map.addMarker( markerData.name, linkText, coordinates );
			}
		} );
	}, $.noop, true );
} );

