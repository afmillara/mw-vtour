<?php
/**
 * Collection of tours in a page.
 *
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 * 
 * @file
 * @ingroup Extensions
 */

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

		// As the output is going to be partially parsed, the JSON tour data must
		// not contain line breaks. Otherwise, the MediaWiki parser would add HTML
		// tags everywhere with hilarious results
		$tourJSON = FormatJson::encode( $tourData );

		// We need the JSON string now in order to calculate a hash before a possible
		// id change.
		$tourHash = sha1( $tourJSON, true );

		$warningHTML = '';
		if ( isset( $this->tours[$tourId] ) ) {
			$warningHTML = $this->warnDuplicateTourId( $tourId );
			$tourId = null;
		}

		if ( $tourId === null ) {
			$tourId = $this->generateUniqueId();
			// The id has changed, so the tour data has to be encoded again
			$tourJSON = FormatJson::encode( $tourData );
		}

		list( $width, $height ) = $this->calculateDimensions( $tourData );

		$tourData['hash'] = $tourHash;
		$tourData['page'] = $frame->getTitle()->getArticleId();

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
		$oldTours->free();
		
		$newTourIds = array();
		foreach( $this->tours as $tourId => $tour ) {
			$tourPage = $tour['page'];
			$tourHash = $tour['hash'];
			if ( $pageId === $tourPage || !$this->hashExists( $tourPage, $tourHash ) ) {
				$newTourIds[] = $tourId;
			}
		}

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
	 * Check whether there is a tour with a given hash in a given place.
	 * @param int $pageId Id of the page
	 * @param string $tourHash Hash of the tour
	 * @return bool true if a tour exists in the page with that hash, false otherwise
	 */
	protected function hashExists( $pageId, $tourHash ) {
		$dbr = wfGetDB( DB_SLAVE );
		$result = $dbr->select( 'virtualtour', 'vtour_tourid',
			array(
				'vtour_pageid' => $pageId,
				'vtour_hash' => $tourHash
			), __METHOD__ );
		$exists = $result->numRows() !== 0;
		$result->free();
		return $exists;
	}

	/**
	 * Generate all non-key fields of a vitualtour table row.
	 * @param string $tourId Id of the tour
	 * @return array Row
	 */
	protected function getTourDBInfoArray( $tourId ) {
		$tour = $this->tours[$tourId];
		$location = $tour['location'];
		return array(
			'vtour_hash' => $tour['hash'],
			'vtour_coord0' => $location !== null ? $location[0] : null,
			'vtour_coord1' => $location !== null ? $location[1] : null
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
		return "tour_$nTours";
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

