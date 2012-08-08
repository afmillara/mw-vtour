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

	function __construct() {
		// No restrictions, not listed
		parent::__construct( 'Vtour', '', false ); 
	}

	function execute( $par ) {
		global $wgOut;
		if ( $par ) {
			$linkParts = VtourUtils::parseTextLinkParams( $par );
			if ( $linkParts['article'] === null || $linkParts['tour'] === null ) {
				$this->setHeaders();
				$wgOut->addWikiText( wfMessage( 'vtour-linkspecialpage-badformat' )
					->text() );
				$wgOut->addWikiText( wfMessage( 'vtour-linkspecialpage-linkinfo',
					$this->getTitle() )->text() );
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
			$wgOut->addWikiText( wfMessage( 'vtour-linkspecialpage-header' )->text() ); 
			$wgOut->addWikiText( wfMessage( 'vtour-linkspecialpage-linkinfo',
				$this->getTitle() )->text() );
			$alias = VtourUtils::getLinkAlias();
			if ( $alias !== null ) {
				$wgOut->addWikiText( wfMessage( 'vtour-linkspecialpage-aliasinfo',
					$alias )->text() );
			}
		}
	}
}

