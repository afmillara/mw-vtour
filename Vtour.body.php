<?php
/**
 * Hooks for Vtour.
 *
 * @file
 * @ingroup Extensions
 */

/**
 * Static class that contains all the hooks used by the Vtour extension.
 */
class VtourHooks {

	/**
	 * Vtour page instance for the page that is currently being parsed.
	 * @var VtourPage $vtourPage
	 */
	protected static $vtourPage;

	/**
	 * Add the tag extension when the parser is initialized
	 * (ParserFirstCallInit hook).
	 * @param Parser $parser Parser object
	 * @return bool Return true in order to continue hook processing
	 */
	public static function setupParserHook( Parser $parser ) {
		$parser->setHook( 'vtour', 'VtourHooks::handleTag' );
		self::$vtourPage = new VtourPage();
		return true;
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
			// the styles are applied.
			$parserOutput->addModuleStyles( 'ext.vtour.links' );
		} else {
			$parserOutput->addModules( 'ext.vtour.links' );
		}
		return true;
	}

	/**
	 * Make certain configuration variables visible from the client side.
	 * @param array &$vars Associative array: variable name => value
	 * @return bool Return true in order to continue hook processing
	 */
	public static function exportConfigVars( &$vars ) {
		global $wgVtourStandardLatLngOrder;
		$vars['wgVtourStandardLatLngOrder'] = $wgVtourStandardLatLngOrder;
		return true;
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
		global $wgVtourAllowLinkAlias;
		if ( $wgVtourAllowLinkAlias ) {
			$subpage = VtourUtils::extractParamsFromPrefixed( $title );
			if ( $subpage !== null ) {
				$specialPageTitle = SpecialPage::getTitleFor( 'Vtour', $subpage );
				$target = $specialPageTitle->getFullURL();
				return false;
			}
		}
		return true;
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
		global $wgVtourAllowLinkAlias;
		if ( !$wgVtourAllowLinkAlias ) {
			return true;
		}
		if ( $action === 'read' ) {
			// redirectAliasToSpecial will handle it.
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
		global $wgOut, $wgVtourAllowLinkAlias;

		$paramText = null;

		if ( $target->isSpecial( 'Vtour' ) ) {
			$firstSlash = strpos( $target->getText(), '/' );
			if ( $firstSlash !== false ) {
				$paramText = substr( $content, $firstSlash + 1 );
			}
		} else {
			$paramText = VtourUtils::extractParamsFromPrefixed( $target );
		}

		if ( $paramText !== null ) {
			$options = array( 'known', 'noclasses' );
		}
		
		if ( $paramText === null || strlen( $paramText ) === 0 ) {
			// These are not the links we are looking for.
			return true;
		}
		$linkParts = VtourUtils::parseTextLinkParams( $paramText );
		if ( $linkParts['tour'] === null && $linkParts['place'] === null ) {
			return true;
		}

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

		$classes = 'vtour-textlink';
		if ( $pageTitle->equals( $articleTitle ) ) {
			$classes .= ' vtour-textlink-local';
		}
		$customAttribs = array(
			'class' => $classes,
			'title' => $paramText
		);

		$query = VtourUtils::linkPartsToParams( $linkParts );

		// Compatibility with 1.17
		$linker = class_exists( 'DummyLinker' ) ? new DummyLinker() : new Linker();
		$ret = $linker->link( $articleTitle, $text, $customAttribs, $query, $options );
		return false;
	}
	
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
 * Vtour "page" for the page that is currently being parsed.
 * Tours must have unique ids in an article, so ids are stored
 * here.
 */
class VtourPage {

	/**
	 * Associative array of tours (id -> tour).
	 * @var array ids
	 */
	protected $tours = array();

	/**
	 * Transform a Vtour tag to HTML and JSON data.
	 * @param string $input Content of the Vtour tag
	 * @param array $args Arguments for Vtour
	 * @param Parser $parser Parser object
	 * @param PPFrame $frame Frame
	 * @return string HTML output
	 */
	public function transformTag( $input, array $args, Parser $parser, PPFrame $frame ) {
		global $wgVtourDefaultTourDimensions;
		// if (!$frame->getTitle()->equals($parser->getTitle())){

		$tour = new VtourParser( $input, $args, $parser, $frame );
		try {
			$tour->parse();
		} catch ( VtourParseException $e ) {
			$error = htmlspecialchars( $e->getMessage() );
			return $this->generateErrorString( $error );
		}

		// Changing the parser output like this might not be a good idea.
		// Is there a better way?
		$parser->getOutput()->addModules( 'ext.vtour' );

		$tourData = $tour->getTourData();
		$tourHTMLElements = $tour->getTourHTMLElements();
		$tourId =& $tourData['id'];

		$warningHTML = '';
		if ( $tourId === null ) {
			$tourId = $this->generateUniqueId();
		} elseif ( isset( $this->tours[$tourId] ) ) {
			$warningHTML .= $this->warnDuplicateTourId( $tourId );
			$tourId = $this->generateUniqueId();
		}
		$this->tours[$tourId] = $tourData;

		list( $width, $height ) = $this->calculateDimensions( $tourData );

		// As the output is going to be partially parsed, the JSON tour data must
		// not contain line breaks. Otherwise, the MediaWiki parser would add HTML
		// tags everywhere with hilarious results.
		$tourJSON = FormatJson::encode( $tourData );
	
		$tourElementString = '';
		foreach ( $tourHTMLElements as $index => $element ) {
			$tourElementString .=
				"<div id='vtour-html-$tourId-$index'><div>$element</div></div>";
		}


		return "<div id='vtour-tour-$tourId'>
		<div id='vtour-error-$tourId'>
			$warningHTML
		</div>
		<div class='vtour-frame' style='width: $width; height: $height;'>
			<div class='vtour-descriptionmapcolumn'>
				<div id='vtour-secondary-$tourId' class='vtour-description'>
				</div>
				<div id='vtour-map-$tourId' class='vtour-map'>
				</div>
			</div>
			<div id='vtour-main-$tourId' class='vtour-main'>
			</div>
			<div id='vtour-html-$tourId' style='display: none;'>
				$tourElementString
			</div>
			<div>
				<script id='vtour-json-$tourId' type='application/json'>
					$tourJSON
				</script>
			</div>
		</div>
		</div>";
	}

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
	 * @return string Unique tour id outside the set of valid user-specified
	 * tour ids
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

