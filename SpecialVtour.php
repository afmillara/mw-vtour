<?php
/**
 * Special page Special:Vtour.
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
			$error = null;
			$linkParts = VtourUtils::parseTextLinkParams( $par );
			if ( $linkParts['article'] === null || $linkParts['tour'] === null ) {
				$error = wfMessage( 'vtour-link-badformat' )->text();
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

			if ( $error !== null ) {
				$this->setHeaders();
				$wgOut->addWikiText( $error );
			}
		} else {
			$this->setHeaders();
			$description = wfMessage( 'vtour-link-description' )->text();
			$wgOut->addWikiText( $description );
		}
	}
}

