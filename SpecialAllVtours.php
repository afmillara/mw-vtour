<?php

class SpecialAllVtours extends QueryPage {

	public function __construct() {
		parent::__construct( 'vtour-all' );
	}

	function sortDescending() {
		return false;
	}

	function getQueryInfo() {
		return array(
			'tables' => array( 'virtualtour', 'page' ),
			'fields' => array( 'page_title', 'page_namespace', 'vtour_tourid' ),
			'conds' => 'page_id = vtour_pageid'
		);
	}

	function getOrderFields() {
		return array( 'page_title', 'vtour_tourid' );
	}

	function formatResult( $skin, $result ) {
		$title = Title::makeTitle( $result->page_namespace, $result->page_title );
		$titleWithFragment = Title::makeTitle( $result->page_namespace,
			$result->page_title, 'vtour-tour-' . $result->vtour_tourid );
		$tourLink = Linker::linkKnown( $titleWithFragment, $result->vtour_tourid );
		$articleLink = Linker::linkKnown( $title );
		return wfMessage( 'vtour-allvtourslink', $tourLink, $articleLink )->text();
	}
}

