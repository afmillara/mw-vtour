<?php
/**
 * Main class of the Vtour markup parser.
 * 
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 *
 * @file
 * @ingroup Extensions
 */

/**
 * Main class of the Vtour markup parser.
 */
class VtourParser {

	/**
	 * MediaWiki parser.
	 * @var Parser $parser
	 */
	protected $parser;
	
	/**
	 * Frame for template substitutions.
	 * @var PPFrame $frame
	 */
	protected $frame;
	
	/**
	 * Raw content of the Vtour element.
	 * @var string $content
	 */
	protected $content;
	
	/**
	 * Associative array of attributes of the Vtour element.
	 * @var array $args
	 */
	protected $args;

	/**
	 * Root element.
	 * @var VtourRoot $root
	 */
	protected $root;
	
	/**
	 * Array of strings that store the HTML code that was generated from wikitext
	 * found inside the Vtour element.
	 * @var array $tourHTMLElements 
	 */
	protected $tourHTMLElements = array();

	/**
	 * true if the vtour markup parser should throw an exception if
	 * unexpected or invalid tags or attributes are found; false if
	 * they are to be ignored.
	 * @var bool $parseStrict
	 */
	protected $parseStrict;

	/**
	 * Associative array of identifiers, divided by types:
	 * {map: {id: ..., name: ...}, place: {id: ..., name:...}
	 * @var array $identifiers
	 */
	protected $identifiers;

	/**
	 * Create a new VtourParser.
	 * @param string $content Raw content of the Vtour element
	 * @param array $args Associative array of attributes of the Vtour element
	 * @param Parser $parser MediaWiki parser
	 * @param PPFrame $frame Frame for template substitutions
	 * @param bool $parseStrict Whether the Vtour markup parser should throw
	 * an exception if unexpected or invalid tags or attributes are found;
	 * false if they are to be ignored. The default value is $wgVtourParseStrict
	 * @param bool $allowExternalImages Whether links to external images are
	 * allowed. The default value is $wgVtourAllowExternalImages
	 */
	public function __construct( $content, array $args, Parser $parser, PPFrame $frame,
			$parseStrict = null, $allowExternalImages = null ) {
		global $wgVtourParseStrict, $wgVtourAllowExternalImages;

		$this->parser = $parser;
		$this->frame = $frame;
		$this->content = $content;
		$this->args = $args;

		$this->identifiers = array(
			'map' => array(
				'id' => array(),
				'name' => array()
			),
			'place' => array(
				'id' => array(),
				'name' => array()
			)
		);

		if ( $parseStrict === null ) {
			$parseStrict = $wgVtourParseStrict;
		}
		$this->parseStrict = $parseStrict;

		if ( $allowExternalImages === null ) {
			$allowExternalImages = $wgVtourAllowExternalImages;
		}
		$this->allowExternalImages = $allowExternalImages;
	}

	/**
	 * Return whether the Vtour markup parser should throw an exception if
	 * unexpected or invalid tags or attributes are found; false if they
	 * are to be ignored.
	 * @return bool true if in strict mode, false otherwise
	 */
	public function getParseStrict() {
		return $this->parseStrict;
	}

	/**
	 * Return whether links to external images are allowed in ImagePlaces
	 * and PanoPlaces.
	 * @return bool Whether external images are allowed
	 */
	public function getAllowExternalImages() {
		return $this->allowExternalImages;
	}

	/**
	 * Return the tour id.
	 * @return string|null Tour id, if defined. Otherwise, null.
	 */
	public function getTourId() {
		return $this->root ? $this->root->getTourId() : null;
	}

	/**
	 * Start parsing the content of the Vtour element.
	 */
	public function parse() {
		$this->root = new VtourRoot( $this->content, $this->args, $this );
		$this->root->parse();
	}
	
	/**
	 * If the content has been parsed, return the tour data as an associative
	 * array.
	 * @return array Result
	 */
	public function getTourData() {
		return $this->root->getResult();
	}

	/**
	 * Return the HTML elements that appear in the tour.
	 * @return array Array of strings of HTML code
	 */
	public function getTourHTMLElements() {
		return $this->tourHTMLElements;
	}

	/**
	 * Register the id and name of an element that defines such fields,
	 * making it possible to reference it by them.
	 * @param int $pos Index of the element in the array of elements of this type
	 * @param VtourElement $element Element
	 * @param string $elementType Type of the element: either 'map' or 'place'
	 * @return bool true if the element was registered successfully, false otherwise
	 */
	protected function registerIdAndName( $pos, $element, $elementType ) {
		$ids =& $this->identifiers[$elementType]['id'];
		$names =& $this->identifiers[$elementType]['name'];

		$result = $element->getPartialResult();
		$id = $result['id'];
		if ( $id !== null ) {
			if ( isset( $ids[$id] ) ) {
				return false;
			}
			$ids[$id] = $pos;
		}

		$name = $result['name'];
		if ( !isset( $names[$name] ) ) {
			// A reference to a name goes to the first element with that name
			$names[$name] = $pos;
		}

		return true;
	}

	/**
	 * Get the index of an element in the array of elements of its type.
	 * @param string $idOrName Id or name of the element
	 * @param string $elementType Either 'map' or 'place'
	 * @return int|null The index of the element, if it exists, -1 if no
	 * element of the specified type exists with that id or name, null
	 * if $idOrName was null or empty
	 */
	protected function getIndexForIdOrName( $idOrName, $elementType ) {
		$ids = $this->identifiers[$elementType]['id'];
		$names = $this->identifiers[$elementType]['name'];

		if ( $idOrName === null || strlen( $idOrName ) === 0 ) {
			return null;
		} elseif ( is_int( $idOrName ) ) {
			return $idOrName;
		} elseif ( isset( $ids[$idOrName] ) ) {
			return $ids[$idOrName];
		} elseif ( isset( $names[$idOrName] ) ) {
			return $names[$idOrName];
		} else {
			return -1; // Not found
		}
	}

	/**
	 * Return the index of a map, given its id or name.
	 * @param string $idOrName Id or name
	 * @return int|null The index of the map, if it exists, -1 if no
	 * map exists with that id or name, null if $idOrName was null
	 * or empty
	 */
	public function getMapIndex( $idOrName ) {
		return $this->getIndexForIdOrName( $idOrName, 'map' );
	}

	/**
	 * Return the index of a place, given its id or name.
	 * @param string $idOrName Id or name
	 * @return int|null The index of the place, if it exists, -1 if no
	 * place exists with that id or name, null if $idOrName was null
	 * or empty
	 */
	public function getPlaceIndex( $idOrName ) {
		return $this->getIndexForIdOrName( $idOrName, 'place' );
	}

	/**
	 * Return a map object, given its index.
	 * @param int $index Index of the map
	 * @return VtourMap Map object
	 */
	public function getMap( $index ) {
		return $this->root->getMap( $index );
	}

	/**
	 * Find the index of a map.
	 * @param VtourMap $map Map object
	 * @return int Index of the map
	 */
	public function findMap( $map ) {
		return $this->root->findMap( $map );
	}

	/**
	 * Return a place object, given its index.
	 * @param int $index Index of the place
	 * @return VtourPlace Place object
	 */
	public function getPlace( $index ) {
		return $this->root->getPlace( $index );
	}

	/**
	 * Register the id and name of a new map, making it possible to reference it.
	 * @param VtourElement $map Map
	 * @return bool true if the map was registered successfully, false otherwise
	 */
	public function registerMap( $map ) {
		return $this->registerIdAndName( $this->root->getNumberOfMaps(), $map, 'map' );
	}

	/**
	 * Register the id and name of a new place, making it possible to reference it.
	 * @param VtourElement $place Place
	 * @return bool true if the place was registered successfully, false otherwise
	 */
	public function registerPlace( $place ) {
		return $this->registerIdAndName( $this->root->getNumberOfPlaces(), $place, 'place' );
	}

	/**
	 * Try to add a new place.
	 * @param string $tagText Raw text of the element.
	 * @param VtourMap $implicitMap Map that contains this place
	 * @return bool Whether the place could be created and added
	 */
	public function tryAddPlace( $tagText, $implicitMap ) {
		return $this->root->tryAddPlace( $tagText, $implicitMap );
	}

	/**
	 * Register a dependency to an image so the cache is invalidates when it changes.
	 * @param Title $title Image title
	 */
	public function registerImage( $title ) {
		$dbKey = $title->getDBkey();
		$parserOutput = $this->parser->getOutput();
		$parserOutput->addImage( $dbKey );
	}

	/**
	 * Parse wikitext, add the generated HTML to the list of HTML elements and return
	 * its index.
	 * @param VtourElement $parent VtourElement that contains the HTML
	 * @param string $text Wikitext to parse
	 * @return int Index of the HTML string
	 */
	public function addHTMLElement( $parent, $text ) {
		$index = count( $this->tourHTMLElements );
		$this->tourHTMLElements[] = array(
			'parent' => $parent,
			'html' => $this->parser->recursiveTagParse( $text, $this->frame )
		);
		return $index;
	}
}

/**
 * Exception that indicates a problem in an element of Vtour markup.
 */
class VtourParseException extends Exception {

	/**
	 * Error key
	 * @var string $errorKey
	 */
	protected $errorKey;

	/**
	 * Create a VtourParseException.
	 * @param string $tourId Tour id
	 * @param string $elementIdText Human-readable identification information
	 * for the element
	 * @param string $errorKey Name of the error
	 * @param array $params Error message parameters
	 */
	public function __construct( $tourId, $elementIdText, $errorKey, $params ) {
		if ( $tourId !== null ) {
			$tourIdMsg = wfMessage( 'vtour-parseerror-idformat', $tourId );
		} else {
			$tourIdMsg = wfMessage( 'vtour-parseerror-noid' );
		}
		$tourIdStr = VtourUtils::getContLangText( $tourIdMsg );

		if ( $elementIdText !== null ) {
			$fullIdMsg = wfMessage( 'vtour-parseerror-inelement', $tourIdStr,
				$elementIdText );
		} else {
			$fullIdMsg = wfMessage( 'vtour-parseerror-notinelement', $tourIdStr );
		}

		$description = VtourUtils::getContLangText( wfMessage( $errorKey, $params ) );
		$errorMessage = wfMessage( 'vtour-parseerror', VtourUtils::getContLangText( $fullIdMsg ),
			$description );

		parent::__construct( VtourUtils::getContLangText( $errorMessage ) );
		$this->errorKey = $errorKey;
	}

	/**
	 * Return the error key of the particular problem.
	 * @return string Error key
	 */
	public function getErrorKey() {
		return $this->errorKey;
	}
}

/**
 * Exception that indicates a problem in an element of Vtour markup that doesn't contain
 * identification information and needs additional data from its parent element.
 */
class VtourNoIdParseException extends Exception {

	/**
	 * Human-readable string that describes the type of the element.
	 * @var string $elementType
	 */
	protected $elementType;
	
	/**
	 * Error key.
	 * @var string $errorKey
	 */
	protected $errorKey;

	/**
	 * Error message parameters.
	 * @var array $params
	 */
	protected $params;

	/**
	 * Create a new VtourNoIdParseException.
	 * @param string $errorKey Name of the error
	 * @param array $params Error message parameters
	 */
	public function __construct( $elementType, $errorKey, $params ) {
		$this->elementType = $elementType;
		$this->errorKey = $errorKey;
		$this->params = $params;
	}
	
	/**
	 * Get the type of the element.
	 * @return string Element type
	 */
	public function getElementType() {
		return $this->elementType;
	}
	
	/**
	 * Return the error key of the particular problem.
	 * @return string Error key
	 */
	public function getErrorKey() {
		return $this->errorKey;
	}

	/**
	 * Return the error message parameters.
	 * @return array Parameters
	 */
	public function getParams() {
		return $this->params;
	}
}

