<?php
/**
 * Special page Special:Vtour.
 *
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 * 
 * @file
 * @ingroup Extensions
 */

/**
 * Code for Special:Vtour. This special page redirects the user to the article,
 * place and tour specified in its parameters: Special:Vtour/article/tour[:place]
 * redirects to Article?vtourId=tour&vtourPlace=place.
 * All valid links to this page that appear in a wiki page are automatically
 * rewritten by VtourHooks::handleLink, so this is largely useless, but it exists
 * for the sake of consistency.
 */
class SpecialVtour extends SpecialPage {

	/**
	 * Create a new instance of Special:Vtour.
	 */
	function __construct() {
		// No restrictions, not listed
		parent::__construct( 'vtour-link', '', false ); 
	}

	/**
	 * Generate output.
	 * @param string $par Special page arguments
	 */
	function execute( $par ) {
		global $wgOut;
		if ( $par ) {
			$linkParts = VtourUtils::parseTextLinkParams( $par );
			if ( $linkParts['article'] === null || $linkParts['tour'] === null ) {
				$this->setHeaders();
				$badFormatMessage =  wfMessage( 'vtour-linkspecialpage-badformat' );
				$linkInfoMessage = wfMessage( 'vtour-linkspecialpage-linkinfo',
					$this->getTitle() );
				$wgOut->addWikiText( $badFormatMessage->text() );
				$wgOut->addWikiText( $linkInfoMessage->text() );
			} else {
				$title = Title::newFromText( $linkParts['article'] . '#vtour-tour-'
					. $linkParts['tour'] );
				$query = array();
				if ( $linkParts['place'] !== null ) {
					$query = VtourUtils::linkPartsToParams( $linkParts ); 
				}
				$url = $title->getLinkURL( $query );
				$wgOut->redirect( $url );
			}
		} else {
			$this->setHeaders();
			$headerMessage = wfMessage( 'vtour-linkspecialpage-header' );
			$pageTitle = $this->getTitle();
			$linkInfo = wfMessage( 'vtour-linkspecialpage-linkinfo', $pageTitle->getFullText() );
			$wgOut->addWikiText( $headerMessage->text() ); 
			$wgOut->addWikiText( $linkInfo->text() );
			$alias = VtourUtils::getLinkAlias();
			if ( $alias !== null ) {
				$aliasInfo = wfMessage( 'vtour-linkspecialpage-aliasinfo', $alias );
				$wgOut->addWikiText( $aliasInfo->text() );
			}
		}
	}
}

