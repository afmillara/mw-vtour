<?php
/**
 * Hooks for Vtour.
 *
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 * 
 * @file
 * @ingroup Extensions
 */

/**
 * Hooks to parse Vtour tours and store, return and display those tours.
 */
class VtourTourHooks {

	/**
	 * Vtour page instance for the page that is currently being parsed.
	 * @var VtourPage $vtourPage
	 */
	protected static $vtourPage = null;

	/**
	 * Add the tag extension when the parser is initialized
	 * (ParserFirstCallInit hook).
	 * @param Parser $parser Parser object
	 * @return bool Return true in order to continue hook processing
	 */
	public static function setupParserHook( Parser $parser ) {
		$parser->setHook( 'vtour', 'VtourTourHooks::handleTag' );
		self::$vtourPage = new VtourPage( $parser->getTitle() );
		return true;
	}

	/**
	 * Transform Vtour tags to HTML and inject the output in the page
	 * (tag extension).
	 * @param string $input Content of the vtour tag
	 * @param array $args Arguments for Vtour
	 * @param Parser $parser Parser object
	 * @param PPFrame $frame Frame
	 * @return string Output of the tag extension
	 */
	public static function handleTag( $input, array $args, Parser $parser, PPFrame $frame ) {
		return self::$vtourPage->transformTag( $input, $args, $parser, $frame );
	}

	/**
	 * End the current Vtour page (ArticleSaveComplete).
	 * @return bool Return true in order to continue hook processing
	 */
	public static function endVtourPage( $article ) {
		// TODO: Make this update the table after rollback, undelete or
		// any other change that doesn't 'save' the page.
		if ( self::$vtourPage !== null ) {
			self::$vtourPage->endPage( $article->getId() );
		}
		return true;
	}

	/**
	 * Delete all the virtualtour entries for an article after it is deleted
	 * (ArticleDeleteComplete).
	 * @param Article $article Article
	 * @param User $user User that deleted the article
	 * @param string $reason Reason
	 * @param int $id Article id
	 */
	public static function deleteDBTours( $article, $user, $reason, $id ) {
		global $wgVtourKeepTourList;
		if ( $wgVtourKeepTourList ) {
			$dbw = wfGetDB( DB_MASTER );
			$dbw->delete( 'virtualtour', array(
				'vtour_pageid' => $id
			), __METHOD__ );
		}
		return true;
	}

	/**
	 * Make certain configuration variables visible from the client side
	 * (ResourceLoaderGetConfigVars).
	 * @param array &$vars Associative array: variable name => value
	 * @return bool Return true in order to continue hook processing
	 */
	public static function exportConfigVars( &$vars ) {
		global $wgVtourStandardLatLngOrder, $wgVtourExternalMap,
			$wgVtourGoogleExternalMapAPIUrl, $wgVtourGoogleExternalMapTimeout;
		$vars['wgVtourStandardLatLngOrder'] = $wgVtourStandardLatLngOrder;
		$vars['wgVtourExternalMap'] = $wgVtourExternalMap;
		$vars['wgVtourGoogleExternalMapAPIUrl'] = $wgVtourGoogleExternalMapAPIUrl; 
		$vars['wgVtourGoogleExternalMapTimeout'] = $wgVtourGoogleExternalMapTimeout; 
		return true;
	}

	/**
	 * Add the virtualtour table to the database.
	 * @param DatabaseUpdater $updater Updater
	 */
	public static function addTourTable( DatabaseUpdater $updater ) {
		$updater->addExtensionUpdate( array( 'addTable', 'virtualtour',
			dirname( __FILE__ ) . '/virtualtour.sql', true ) );
		return true;
	}
}

/**
 * Hooks that transform links to virtual tours and create the necessary infrastructure.
 */
class VtourLinkHooks {

	/**
	 * Transform Vtour links so they point to the correct page (no need to visit
	 * Special:Vtour) and add some CSS classes.
	 * @param $skin
	 * @param Title $target Target page
	 * @param string &$text Text content of the HTML anchor
	 * @param array &$customAttribs Attributes of the HTML anchor
	 * @param array &$query Parameters for the URL
	 * @param array &$options Array of options for Linker::link
	 * @param string &$ret HTML to display instead of the link
	 * @return bool Whether to display a normal link or the contents of &$ret
	 */
	public static function handleLink( $skin, $target, &$text, &$customAttribs, &$query,
			&$options, &$ret ) {
		$paramText = null;

		// Extract the link components
		if ( $target->isSpecial( 'Vtour' ) ) {
			$firstSlash = strpos( $target->getText(), '/' );
			if ( $firstSlash !== false ) {
				$paramText = substr( $content, $firstSlash + 1 );
			}
		} else {
			$paramText = VtourUtils::extractParamsFromPrefixed( $target );
		}

		// It's either a valid Vtour link or an empty link (which goes to
		// Special:Vtour)
		if ( $paramText !== null ) {
			$options = array( 'known', 'noclasses' );
		}
		
		// It's not a Vtour link or it's a link to Special:Vtour
		if ( $paramText === null || strlen( $paramText ) === 0 ) {
			// These are not the links we are looking for
			return true;
		}

		// It's an invalid Vtour link
		$linkParts = VtourUtils::parseTextLinkParams( $paramText );
		if ( $linkParts['tour'] === null && $linkParts['place'] === null ) {
			return true;
		}

		// The title is generated here
		global $wgOut;
		$pageTitle = $wgOut->getTitle();
		if ( $linkParts['article'] !== null ) {
			$articleTitle = Title::newFromText( $linkParts['article'] );
		} elseif ( $pageTitle ) {
			$articleTitle = $pageTitle;
		} else {
			// There is no page title in maintenance scripts: use a dummy title instead
			$articleTitle = Title::newFromText( 'Vtour dummy link' );
		}
		if ( $linkParts['tour'] !== null ) {
			$articleTitle = Title::makeTitle( $articleTitle->getNamespace(),
				$articleTitle->getDBKey(), 'vtour-tour-' . $linkParts['tour'] );
		}
		
		// If the text doesn't match the target page (which means that a different
		// text has been specified), keep it. Otherwise, change it to the title of
		// the new target page
		$text = preg_replace( '/\s+/', ' ', $text );
		if ( $text === $target->getText() ) {
			if ( $linkParts['place'] !== null ) {
				$text = $linkParts['place'];
			} else if ( $linkParts['tour'] !== null ) {
				$text = $linkParts['tour'];
			} else {
				$text = $articleTitle->getFullText();
			}
		}

		// Add the textlink classes and the title attribute
		$classes = 'vtour-textlink';
		if ( !$articleTitle->exists() ) {
			$classes .= ' vtour-textlink-new';
		} elseif ( $articleTitle->equals( $pageTitle ) ) {
			$classes .= ' vtour-textlink-local';
		}
		$customAttribs = array(
			'class' => $classes,
			'title' => $paramText
		);

		// Generate the GET parameters from parts of the link
		$query = VtourUtils::linkPartsToParams( $linkParts );

		// Create the link (BC with 1.17)
		$linker = class_exists( 'DummyLinker' ) ? new DummyLinker() : new Linker();
		$ret = $linker->link( $articleTitle, $text, $customAttribs, $query, $options );
		return false;
	}

	/**
	 * If the page name starts with the prefix for Vtour links, redirect
	 * to the special page that deals with them (InitializeArticlesMaybeRedirect hook).
	 * @param Title $title Title object for the page
	 * @param $request
	 * @param &$ignoreRedirect
	 * @param string &$target Target for the redirection
	 * @return bool True when hook processing should continue, false to stop and redirect
	 */
	public static function redirectAliasToSpecial( $title, $request,
			&$ignoreRedirect, &$target ) {
		$subpage = VtourUtils::extractParamsFromPrefixed( $title );
		if ( $subpage !== null ) {
			$specialPageTitle = SpecialPage::getTitleFor( 'Vtour', $subpage );
			$target = $specialPageTitle->getFullURL();
			return false;
		} else {
			return true;
		}
	}

	/**
	 * Prevent MediaWiki users from accessing articles that start with the
	 * prefix for Vtour links (getUserPermissionsErrors hook).
	 * @param Title $title Page title
	 * @param $user
	 * @param string $action Action that the user is trying to perform
	 * @param string &$result In case of error, message name for it
	 * @return bool true to continue, false to stop and show a error page
	 */
	public static function disableLinkAliasPages( $title, $user, $action, &$result ) {
		if ( $action === 'read' ) {
			// redirectAliasToSpecial will handle it
			return true;
		}
		if ( VtourUtils::extractParamsFromPrefixed( $title ) !== null ) {
			$result = 'vtour-reservedpage';
			return false;
		} else {
			return true;
		}
	}

	/**
	 * Make the parser load the stylesheet for Vtour links
	 * (ParserCleanState hook).
	 * @param Parser $parser Parser object
	 * @return bool Return true in order to continue hook processing
	 */
	public static function addLinkStyle( Parser $parser ) {
		$parserOutput = $parser->getOutput();
		// BC with 1.17
		if ( method_exists( $parserOutput, 'addModuleStyles' ) ) {
			// addModuleStyles is preferred because (at the moment,
			// 1.19) it loads the CSS from HTML, which is faster than
			// using JS. Otherwise, the user might see the HTML before
			// the styles are applied
			$parserOutput->addModuleStyles( 'ext.vtour.links' );
		} else {
			$parserOutput->addModules( 'ext.vtour.links' );
		}
		return true;
	}
}

/**
 * Hooks for unit tests.
 */
class VtourTestHooks {
	
	/**
	 * Register PHP unit tests for Vtour (UnitTestsList hook).
	 * @param array &$files Array of files containing tests
	 * @return bool Return true in order to continue hook processing
	 */
	public static function registerPHPTests( &$files ) {
		global $wgVtourDir;
		$files[] = $wgVtourDir . 'tests/VtourTest.php';
		return true;
	}

	/**
	 * Register Javascript unit tests for Vtour (ResourceLoaderTestModules hook).
	 * @param array &$testModules Array of modules containing tests
	 * @param ResourceLoader &$resourceLoader ResourceLoader object
	 * @return bool Return true in order to continue hook processing
	 */
	public static function registerJSTests( array &$testModules,
			ResourceLoader &$resourceLoader ) {
		global $wgVtourDir;
		$testModules['qunit']['ext.vtour.test'] = array(
			'scripts' => 'ext.vtour.test.js',
			'dependencies' => array( 'ext.vtour' ),
			'localBasePath' => $wgVtourDir . 'tests/',
			'remoteExtPath' => 'Vtour/tests'
		);
		return true;
	}
}

