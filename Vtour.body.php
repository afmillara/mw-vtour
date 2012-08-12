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
		// TODO: Make this update the table after rollback or undelete.
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
		global $wgVtourDir;
		$updater->addExtensionUpdate( array( 'addTable', 'virtualtour',
			$wgVtourDir . 'virtualtour.sql', true ) );
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
		} else {
			$articleTitle = $pageTitle;
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
		} elseif ( $pageTitle->equals( $articleTitle ) ) {
			$classes .= ' vtour-textlink-local';
		}
		$customAttribs = array(
			'class' => $classes,
			'title' => $paramText
		);

		// Generate the GET parameters from parts of the link
		$query = VtourUtils::linkPartsToParams( $linkParts );

		// Create the link (compatibility with 1.17)
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
		// Compatibility with 1.17
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

/**
 * Collection of tours for the page that is currently being parsed.
 * Tours must have unique ids in an article, so ids are stored
 * here.
 */
class VtourPage {
	
	/**
	 * Title of the page being processed.
	 * @var Title $title
	 */
	protected $title;

	/**
	 * Associative array of tours (id -> tour).
	 * @var array ids
	 */
	protected $tours = array();

	/**
	 * Create a new VtourPage.
	 * @param Title $title Title of the page
	 */
	public function __construct( $title ) {
		$this->title = $title;
	}

	/**
	 * Transform a Vtour tag to HTML and JSON data.
	 * @param string $input Content of the Vtour tag
	 * @param array $args Arguments for Vtour
	 * @param Parser $parser Parser object
	 * @param PPFrame $frame Frame
	 * @return string HTML output
	 */
	public function transformTag( $input, array $args, Parser $parser, PPFrame $frame ) {
		$tour = new VtourParser( $input, $args, $parser, $frame );
		try {
			$tour->parse();
		} catch ( VtourParseException $e ) {
			$error = htmlspecialchars( $e->getMessage() );
			return $this->generateErrorString( $error );
		}

		$tourData = $tour->getTourData();
		$tourHTMLElements = $tour->getTourHTMLElements();
		$tourId =& $tourData['id'];

		$warningHTML = '';
		if ( $tourId === null ) {
			$tourId = $this->generateUniqueId();
		} elseif ( isset( $this->tours[$tourId] ) ) {
			$warningHTML = $this->warnDuplicateTourId( $tourId );
			$tourId = $this->generateUniqueId();
		}

		list( $width, $height ) = $this->calculateDimensions( $tourData );

		// As the output is going to be partially parsed, the JSON tour data must
		// not contain line breaks. Otherwise, the MediaWiki parser would add HTML
		// tags everywhere with hilarious results
		$tourJSON = FormatJson::encode( $tourData );
		$tourData['hash'] = sha1( $tourJSON );

		$this->tours[$tourId] = $tourData;

		// Changing the parser output like this might not be a good idea.
		// Is there a better way?
		$parser->getOutput()->addModules( 'ext.vtour' );

		return $this->generateOutput( $tourId, $tourJSON, $tourHTMLElements,
			$width, $height, $warningHTML );
	}

	/**
	 * Save the tours to the database.
	 */
	public function endPage( $pageId ) {
		global $wgVtourKeepTourList;
		if ( !$wgVtourKeepTourList ) {
			return;
		}

		if ( !$this->title || $pageId !== $this->title->getArticleId() ) {
			return;
		}

		$dbr = wfGetDB( DB_SLAVE );
		$oldTours = $dbr->select( 'virtualtour', 'vtour_tourid',
			array( 'vtour_pageid' => $pageId ), __METHOD__ );

		$oldTourIds = array();
		foreach ( $oldTours as $row ) {
			$oldTourIds[] = $row->vtour_tourid;
		}
		
		$newTourIds = array_keys( $this->tours );

		$updateIds = array_intersect( $newTourIds, $oldTourIds );
		$insertIds = array_diff( $newTourIds, $oldTourIds );
		$deleteIds = array_diff( $oldTourIds, $newTourIds );

		$dbw = wfGetDB( DB_MASTER );

		foreach ( $updateIds as $tourId ) {
			$dbw->update( 'virtualtour',
				$this->getTourDBInfoArray( $tourId ),
				array(
					'vtour_pageid' => $pageId,
					'vtour_tourid' => $tourId
				), __METHOD__, array( 'IGNORE' ) );
		}

		$rowsToInsert = [];
		foreach ( $insertIds as $tourId ) {
			$rowToInsert = $this->getTourDBInfoArray( $tourId );
			$rowToInsert['vtour_pageid'] = $pageId;
			$rowToInsert['vtour_tourid'] = $tourId;
			$rowsToInsert[] = $rowToInsert;
		}
		$dbw->insert( 'virtualtour', $rowsToInsert, __METHOD__, array( 'IGNORE' ) );
		
		if ( count( $deleteIds ) ) {
			$dbw->delete( 'virtualtour', array(
				'vtour_pageid' => $pageId,
				'vtour_tourid' => $deleteIds
			), __METHOD__ );
		}
	}

	/**
	 * Generate all non-key fields of a vitualtour table row.
	 * @param string $tourId Id of the tour
	 * @return array Row
	 */
	protected function getTourDBInfoArray( $tourId ) {
		$tour = $this->tours[$tourId];
		return array(
			'vtour_hash' => $tour['hash'],
			'vtour_longitude' => null,
			'vtour_latitude' => null	
		);
	}

	/**
	 * Generate the virtual tour HTML.
	 * @param string $tourId Id of the tour
	 * @param string $tourJSON Tour data in JSON format
	 * @param string $tourHTMLElements HTML elements contained in the tour
	 * @param string $width Width of the virtual tour element
	 * @param string $height Height of the virtual tour element
	 * @param string $warningHTML Warning message that will be included
	 */
	protected function generateOutput( $tourId, $tourJSON, $tourHTMLElements,
			$width, $height, $warningHTML ) {
		global $wgVtourWarnNoJS, $wgVtourDisplayElementsNoJS;
		// Warning message for users whose browsers don't have JavaScript support
		$noJSHeader = '';
		if ( $wgVtourWarnNoJS ) {
			$noJSText = wfMessage( 'vtour-nojs' )->inContentLanguage()->text();
			if ( count( $tourHTMLElements ) !== 0 && $wgVtourDisplayElementsNoJS ) {
				$noJSText .= wfMessage( 'vtour-nojs-htmlfollows' )
					->inContentLanguage()->text();
			}
			$noJSHeader = "<div id='vtour-nojs-$tourId'>$noJSText</div>";
		}

		$HTMLElementString = $this->getHTMLContent( $tourId, $tourHTMLElements,
			$wgVtourDisplayElementsNoJS );

		return Html::openElement( 'div', array( 'id' => "vtour-tour-$tourId",
				'class' => 'vtour-tour' ) )
			. Html::rawElement( 'div', array( 'id' => "vtour-error-$tourId" ),
				$warningHTML )
			. Html::openElement( 'div', array( 'id' => "vtour-frame-$tourId", 
				'style' => "width: $width; height: $height; display: none;",
				'class' => 'vtour-frame' ) )
			. Html::openElement( 'div', array( 'class' => 'vtour-descriptionmapcolumn' ) )
			. Html::element( 'div', array( 'id' => "vtour-secondary-$tourId",
				'class' => 'vtour-description' ) )
			. Html::element( 'div', array( 'id' => "vtour-map-$tourId", 'class' => 'vtour-map' ) )
			. Html::closeElement( 'div' )
			. Html::element( 'div', array( 'id' => "vtour-main-$tourId", 'class' => 'vtour-main' ) )
			. Html::closeElement( 'div' )
			. $noJSHeader
			. $HTMLElementString
			. Html::openElement( 'div' )
			. Html::rawElement( 'script', array( 'id' => "vtour-json-$tourId",
				'type' => 'application/json' ), $tourJSON )
			. Html::closeElement( 'div' )
			. Html::closeElement( 'div' );
	}

	/**
	 * Join the HTML nodes contained in the tour and add some additional elements to
	 * make it readable for users whose browsers don't support JavaScript.
	 * @param string $tourId Id of the tour
	 * @param array $tourHTMLElements Array of arrays ('parent' => Vtour element that
	 * contains the HTML, 'html' => HTML content as a string
	 * @param bool $displayElements Whether the resulting HTML should be visible and
	 * human-readable
	 * @return string HTML content
	 */
	protected function getHTMLContent( $tourId, $tourHTMLElements, $displayElements ) {
		$lastElement = null;
		$contentString = '';
		$HTMLElementsDisplay = $displayElements ? array() : array( 'style' => 'display: none;' );
		foreach ( $tourHTMLElements as $index => $element ) {
			if ( $displayElements ) {
				$elementParent = $element['parent'];
				if ( $lastElement !== null ) {
					$contentString .= wfMessage( 'vtour-nojs-elementseparator' )
						->inContentLanguage()->text();
				}
				if ( $elementParent !== $lastElement ) {
					$title = htmlspecialchars( $elementParent->getName() );
					$contentString .= wfMessage( 'vtour-nojs-placetitle', $title )
						->inContentLanguage()->text();
				}
				$lastElement = $elementParent;
			}
			$elementHTML = $element['html'];
			$contentString .=
				Html::openElement( 'div', array( 'id' => "vtour-html-$tourId-$index",
					'class' => 'vtour-htmlelement' ) )
				. Html::rawElement( 'div', array(), $elementHTML ) 
				. Html::closeElement( 'div' );
		}
		return Html::rawElement( 'div', array_merge( array( 'id' => "vtour-html-$tourId" ),
			$HTMLElementsDisplay ), $contentString );
	}

	/**
	 * Calculate the dimensions of an Vtour HTML element, based on the tour
	 * attributes or the defaults.
	 * @param array $tourData Tour data
	 * @return array Tour width and height (width, height)
	 */
	protected function calculateDimensions( $tourData ) {
		global $wgVtourDefaultTourDimensions;
		if ( $tourData['width'] !== null ) {
			$width = $tourData['width'];
		} else {
			$width = $wgVtourDefaultTourDimensions[0];
		}
		if ( $tourData['height'] !== null ) {
			$height = $tourData['height'];
		} else {
			$height = $wgVtourDefaultTourDimensions[1];
		}
		return array( $width, $height );
	}

	/**
	 * Generate an id for a tour that doesn't have one.
	 * @return string Unique tour id (outside the set of valid user-specified
	 * tour ids)
	 */ 
	protected function generateUniqueId() {
		$nTours = count( $this->tours );
		return "_$nTours";
	}

	/**
	 * Warn about a duplicate tour id.
	 * @param string $tourId Duplicate tour id
	 * @return string Warning HTML
	 */
	protected function warnDuplicateTourId( $tourId ) {
		$type = wfMessage( 'vtour' )->inContentLanguage()->text();
		$contentMessage = wfMessage( 'vtour-errordesc-duplicate', $type, $tourId );
		$content = $contentMessage->inContentLanguage()->text();
		$warningMessage = wfMessage( 'vtour-warning', $content );
		$warning = $warningMessage->inContentLanguage()->text();
		return $this->generateErrorString( $warning );
	}

	/**
	 * Generate the error HTML.
	 * @param string $error Error string
	 * @return string Error HTML
	 */
	protected function generateErrorString( $error ) {
		return wfMessage( 'vtour-erroroutside', $error )->inContentLanguage()->text();
	}
}

