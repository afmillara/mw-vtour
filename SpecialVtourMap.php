<?php
/**
 * Special page Special:VtourMap.
 *
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 * 
 * @file
 * @ingroup Extensions
 */

/**
 * Special page that displays Vtours on a map.
 */
class SpecialVtourMap extends SpecialPage {

	/**
	 * Create a new instance of Special:VtourMap.
	 */
	public function __construct() {
		parent::__construct( 'vtour-vtourmap' );
	}

	/**
	 * Process a request and generate output.
	 * @param string Special page parameters
	 */
	public function execute( $par ) {
		global $wgVtourKeepTourList, $wgVtourDisplayTourMap, $wgVtourExternalMap;
		if ( !$wgVtourKeepTourList || !$wgVtourDisplayTourMap
				|| $wgVtourExternalMap === null ) {
			$this->executeDisabled();	
		} elseif ( strcasecmp( $par, 'kml' ) == 0 ) {
			$this->executeRaw( 'application/vnd.google-earth.kml+xml', 'generateKML' );
		} elseif ( strcasecmp( $par, 'json' ) == 0 ) {
			$this->executeRaw( 'application/json', 'generateJSON' );
		} else {
			$this->executeMain();
		}
	}

	/**
	 * Show a 'disabled' message.
	 */
	protected function executeDisabled() {
		global $wgOut;
		$this->setHeaders();
		$wgOut->addHTML( wfMessage( 'vtour-vtourmap-disabled' )->parse() );
	}

	/**
	 * Show the virtual tour map.
	 */
	protected function executeMain() {
		global $wgOut, $wgVtourTourMapDimensions;
		$mapDimensions = $wgVtourTourMapDimensions;

		$this->setHeaders();
		$wgOut->addHTML( wfMessage( 'vtour-vtourmap-header' )->parse() );
		$wgOut->addHTML( Html::element( 'div', array( 'id' => 'vtour-vtourmap',
			'style' => "width: $mapDimensions[0]; height: $mapDimensions[1]" ) ) );
		$wgOut->addModules( 'ext.vtour.specialvtourmap' );
	}

	/**
	 * Show the tour location data as a raw data file.
	 * @param string $type Internet content type
	 * @param string $method Name of the method that will generate the file
	 */
	protected function executeRaw( $type, $method ) {
		global $wgOut;
		$wgOut->disable();

		$request = $this->getRequest();
		if ( !$request ) {
			global $wgRequest;
			$request = $wgRequest;
		}

		$response = $request->response();

		$response->header( "Content-type: $type; charset=UTF-8" );
	
		$tours = $this->selectTours();	
		echo $this->$method( $tours );
		$tours->free();
	}

	/**
	 * Output the tour location information as a JSON string.
	 * @param ResultWrapper $tours Tour location data from the database
	 * @return string Data in JSON format
	 */
	protected function generateJSON( $tours ) {
		$markerData = array();
		foreach ( $tours as $tour ) {
			$markerData[] = array(
				'name' => $this->getFullTourName( $tour ),
				'url' => $this->getURL( $tour ),
				'coords' => array( $tour->vtour_coord0, $tour->vtour_coord1 )
			);
		}
		return FormatJson::encode( $markerData );
	}

	/**
	 * Output the tour location information as a KML document.
	 * @param ResultWrapper $tours Tour location data from the database
	 * @return string Data in KML format
	 */
	protected function generateKML( $tours ) {
		$content = '<?xml version="1.0" encoding="UTF-8"?>';
		$content .= Xml::openElement( 'kml',
			array( 'xmlns' => 'http://www.opengis.net/kml/2.2' ) );
		foreach ( $tours as $tour ) {
			$name = $this->getFullTourName( $tour );
			$description = Html::element( 'a',
				array( 'href' => $this->getURL( $tour ) ), $name );

			$coordinates = array( $tour->vtour_coord0, $tour->vtour_coord1 );
			global $wgVtourStandardLatLngOrder;
			if ( $wgVtourStandardLatLngOrder ) {
				$coordinates = array_reverse( $coordinates );
			}
			$coordinateStr = $coordinates[0] . ',' . $coordinates[1];

			$content .= Xml::openElement( 'Placemark' );
			$content .= Xml::element( 'name', null, $name );
			$content .= Xml::tags( 'description', null, $description );
			$content .= Xml::openElement( 'Point' );
			$content .= Xml::element( 'coordinates', null, $coordinateStr );
			$content .= Xml::closeElement( 'Point' );
			$content .= Xml::closeElement( 'Placemark' );
		}
		$content .= Xml::closeElement( 'kml' );
		return $content;
	}

	/**
	 * Return the URL to a given tour.
	 * @param object $tour Row from the database (see selectTours)
	 * @return string URL
	 */
	protected function getURL( $tour ) {
		$titleWithFragment = Title::makeTitle( $tour->page_namespace,
			$tour->page_title, "vtour-tour-$tour->vtour_tourid" );
		return $titleWithFragment->escapeFullURL();
	}

	/**
	 * Return the name of a tour and the page that contains it.
	 * @param object $tour Row from the database (see selectTours)
	 * @return string Human-readable name
	 */
	protected function getFullTourName( $tour ) {
		$title = Title::makeTitle( $tour->page_namespace, $tour->page_title );
		return wfMessage( 'vtour-vtourmap-name', $tour->vtour_tourid,
			$title->getFullText() )->text();
	}

	/**
	 * Select the tours with location information in the database.
	 * @return ResultWrapper Tours with location information (fields:
	 * page_namespace, page_title, vtour_tourid, vtour_coord0, vtour_coord1 )
	 */
	protected function selectTours() {
		$dbr = wfGetDB( DB_SLAVE );
		return $dbr->select( array( 'virtualtour', 'page' ),
			array( 'page_namespace', 'page_title', 'vtour_tourid',
			'vtour_coord0', 'vtour_coord1' ), array(
				'vtour_pageid = page_id',
				'vtour_coord0 IS NOT NULL',
				'vtour_coord1 IS NOT NULL'
			), __METHOD__ );
	}
}

