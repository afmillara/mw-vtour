<?php
/**
 * Compatibility layer that acts as a (limited) MW 1.19 QueryPage.
 * This should only affect obsolete MediaWiki versions with unusable
 * QueryPage implementations.
 *
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 * 
 * @file
 * @ingroup Extensions
 */

/**
 * Compatibility layer that implements some MW 1.19 SpecialPage and QueryPage
 * methods, as QueryPage from 1.17 doesn't even extend SpecialPage.
 */
abstract class VtourBCQueryPage extends QueryPage {

	/**
	 * Whether an old MediaWiki version (with an unusable QueryPage class)
	 * is being used. Otherwise, calls are just redirected to the actual QueryPage.
	 * @var bool $usingOldMW
	 */
	private $usingOldMW;

	/**
	 * Name of the special page. MediaWiki 1.17 expects this attribute to be
	 * visible from the outside.
	 * @var string $mName
	 */
	public $mName;

	/**
	 * Create a new VtourBCQueryPage.
	 * @param string $name Name of the special page.
	 */
	public function __construct( $name ) {
		$this->usingOldMW = !method_exists( 'QueryPage', '__construct' );
		if ( !$this->usingOldMW ) {
			parent::__construct( $name );
		} else {
			$this->mName = $name;
		}
	}

	/**
	 * Magic method that calls compatibility methods (with a 'bc' prefix) when
	 * the actual MW methods are unavailable.
	 * @param string Method name
	 * @param array Method arguments
	 */
	function __call( $name, $arguments ) {
		$bcMethod = "bc$name";
		if ( $this->usingOldMW && method_exists( $this, $bcMethod ) ) {
			return call_user_func_array( array( $this, $bcMethod ), $arguments );
		}
		trigger_error( "Inaccesible method: VtourBCQueryPage::$name", E_USER_ERROR );	
	}

	/**
	 * Get the page this page redirects to, if any. Otherwise, return false.
	 * @param $subpage
	 * @return Title|bool false because the page is not a redirect
	 */
	function bcgetRedirect( $subPage ) {
		return false;
	}

	/**
	 * Return the local name of the page.
	 * @return string Local name
	 */
	function bcgetLocalName() {
		return SpecialPage::getLocalNameFor( $this->mName );
	}

	/**
	 * Return the description of the page.
	 * @return string Page description
	 */
	function bcgetDescription() {
		$descriptionMessage = wfMessage( $this->mName );
		return $descriptionMessage->text();
	}

	/**
	 * Return whether this page can be included as a template.
	 * @return bool Whether it is includable
	 */
	function bcincludable() {
		return false;
	}

	/**
	 * Get the Request object.
	 * @return Request Request object
	 */
	function bcgetRequest() {
		global $wgRequest;
		return $wgRequest;
	}

	/**
	 * Return whether this page appears in the Special Page list.
	 * @return bool Whether the page is listed
	 */
	function bcisListed() {
		return true;
	}

	/**
	 * Return whether the page is restricted.
	 * @return bool Whether the page is restricted
	 */
	function bcisRestricted() {
		return false;
	}

	/**
	 * Show the special page.
	 * @param string $par Parameters for the special page
	 */
	function bcexecute( $par ) {
		global $wgOut;
		$wgOut->setArticleRelated( false );
		$wgOut->setRobotPolicy( 'noindex,nofollow' );
		$wgOut->setPageTitle( $this->getDescription() );

		list( $limit, $offset ) = wfCheckLimits();
		$this->doQuery( $offset, $limit );
	}

	/**
	 * This method is very poorly documented in SpecialPage.php.
	 * It is here in order for this to work in MW 1.17.
	 * @param bool $x No idea
	 * @return bool false because this isn't being included. Or maybe it is,
	 * but this seems to be good enough anyway
	 */
	function bcincluding( $x = null ) {
		return false;
	}

	/**
	 * This method is very poorly documented in SpecialPage.php.
	 * It is here in order for this to work in MW 1.17.
	 * @param string $x No idea
	 * @return string The name of the page. Maybe that's what the callers
	 * are looking for
	 */
	function bcname( $x = null ) {
		return $this->mName;
	}

	/**
	 * Get the page name.
	 * @return string Page name
	 */
	function getName() {
		if ( !$this->usingOldMW ) {
			return parent::getName();
		}
		return $this->mName;
	}

	/**
	 * Get the string of SQL code that will be used for the query in this QueryPage.
	 */
	function getSQL() {
		if ( !$this->usingOldMW ) {
			return parent::getSQL();
		}
		$dbr = wfGetDB( DB_SLAVE );
		$queryInfo = $this->getQueryInfo();
		return call_user_func_array( array( $dbr, 'selectSQLText' ), $queryInfo );
	}

	/**
	 * Get the order of the fields for the query.
	 * return string SQL ORDER BY clause
	 */
	function getOrder() {
		if ( !$this->usingOldMW ) {
			return parent::getOrder();
		}
		$fields = $this->getOrderFields();
		$fieldText = implode( ',', $fields );
		return " ORDER BY $fieldText " .
			( $this->sortDescending() ? 'DESC' : '' );
	}
}

