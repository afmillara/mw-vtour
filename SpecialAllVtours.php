<?php
/**
 * Special page Special:AllVtours.
 *
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 * 
 * @file
 * @ingroup Extensions
 */

/**
 * Special page that lists all Vtours.
 */
class SpecialAllVtours extends VtourBCQueryPage {

	/**
	 * Title object that contains the page prefix.
	 * @var Title $pagePrefixTitle
	 */
	protected $pagePrefixTitle = null;

	/**
	 * Tour id prefix.
	 * @var string $tourPrefix
	 */
	protected $tourPrefix = '';

	/**
	 * Create a new instance of Special:AllVtours.
	 */
	public function __construct() {
		parent::__construct( 'vtour-allvtours' );
	}

	/**
	 * Process a request and generate output (actually QueryPage does most
	 * of the hard work).
	 * @param string Special page parameters
	 */
	public function execute( $par ) {
		global $wgVtourKeepTourList, $wgOut;
		if ( !$wgVtourKeepTourList ) {
			$this->setHeaders();
			$wgOut->addWikiText( wfMessage( 'vtour-allvtours-disabled' )
				->parse() );
			return;
		}

		$request = $this->getRequest();

		$rawPagePrefix = $request->getVal( 'pagePrefix', $par );
		$this->pagePrefixTitle = Title::newFromText( $rawPagePrefix );

		$this->tourPrefix = $request->getVal( 'tourPrefix', '' );

		parent::execute( $par );
	}

	/**
	 * Get the query object.
	 * @return array Query info (see DatabaseBase in core MediaWiki)
	 */
	function getQueryInfo() {
		$dbr = wfGetDB( DB_SLAVE );

		$query = array(
			'tables' => array( 'virtualtour', 'page' ),
			'fields' => array( 'page_title', 'page_namespace', 'vtour_tourid' ),
			'conds' => array( 'page_id = vtour_pageid' )
		);
		
		if ( $this->pagePrefixTitle !== null ) {
			$namespace = $this->pagePrefixTitle->getNamespace();
			$query['conds']['page_namespace'] = $namespace;

			$prefixString = $this->pagePrefixTitle->getDBkey();
			$query['conds'][] = 'page_title ' .
				$dbr->buildLike( $prefixString, $dbr->anyString() );
		}

		if ( $this->tourPrefix !== '' ) {
			$query['conds'][] = 'vtour_tourid ' .
				$dbr->buildLike( $this->tourPrefix, $dbr->anyString() );
		}

		return $query;
	}

	/**
	 * Generate the page header.
	 * @return string Page header
	 */
	function getPageHeader() {
		$headerMessage = wfMessage( 'vtour-allvtours-header' );
		$header = $headerMessage->parse();
		
		if ( $this->isCached() ) {
			return $header;
		}

		$prefixLegendMsg = wfMessage( 'vtour-allvtours-prefixlegend' );
		$pagePrefixLabelMsg = wfMessage( 'vtour-allvtours-pageprefix' );
		$tourPrefixLabelMsg = wfMessage( 'vtour-allvtours-tourprefix' );
		$prefixSubmitMsg = wfMessage( 'vtour-allvtours-prefixsubmit' );

		global $wgScript;
		$allVtoursTitle = $this->getTitle();
		$pagePrefix = '';
		if ( $this->pagePrefixTitle !== null ) {
			$pagePrefix = $this->pagePrefixTitle->getFullText();
		}
		$tourPrefix = $this->tourPrefix;

		$header .= 
			Html::openElement( 'form', array( 'method' => 'get', 'action' => $wgScript ) )
			. Html::openElement( 'fieldset' )
			. Html::element( 'legend', null, $prefixLegendMsg->text() )
			. Html::hidden( 'title', $allVtoursTitle->getPrefixedText() )
			. Html::element( 'label', array( 'for' => 'vtour-pageprefix' ),
				$pagePrefixLabelMsg->text() )
			. Xml::input( 'pagePrefix', '20', $pagePrefix, array( 'id' => 'vtour-pageprefix' ) )
			. Html::element( 'label', array( 'for' => 'vtour-tourprefix' ),
				$tourPrefixLabelMsg->text() )
			. Xml::input( 'tourPrefix', '20', $tourPrefix, array( 'id', 'vtour-tourprefix' ) )
			. Xml::submitButton( $prefixSubmitMsg->text() )
			. Html::closeElement( 'fieldset' )
			. Html::closeElement( 'form' );

		return $header;
	}

	/**
	 * Return the fields to order by.
	 * @return array Array of fields
	 */
	function getOrderFields() {
		return array( 'page_title', 'vtour_tourid' );
	}

	/**
	 * Return whether to sort in descending order.
	 * @return bool false to sort in ascending order
	 */
	function sortDescending() {
		return false;
	}

	/**
	 * Whether a feed is available.
	 * @return bool false to disable feeds
	 */
	function isSyndicated() {
		return false;
	}

	/**
	 * Format the query result in a human-readable way.
	 * @param Skin $skin Skin
	 * @param object $result Result row
	 * @return string Formatted row
	 */
	function formatResult( $skin, $result ) {
		$title = Title::makeTitle( $result->page_namespace, $result->page_title );
		$titleWithFragment = Title::makeTitle( $result->page_namespace,
			$result->page_title, 'vtour-tour-' . $result->vtour_tourid );
		
		$linker = class_exists( 'DummyLinker' ) ? new DummyLinker() : new Linker();	
		$tourLink = $linker->linkKnown( $titleWithFragment, $result->vtour_tourid );
		$articleLink = $linker->linkKnown( $title );

		$message = wfMessage( 'vtour-allvtours-link', $tourLink, $articleLink );
		return $message->text();
	}
}

