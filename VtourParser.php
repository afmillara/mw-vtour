<?php
/**
 * Main class of the Vtour markup parser.
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
	 * Create a new VtourParser.
	 * @param string $content Raw content of the Vtour element
	 * @param array $args Associative array of attributes of the Vtour element
	 * @param Parser $parser MediaWiki parser
	 * @param PPFrame $frame Frame for template substitutions
	 * @param bool $parseStrict Whether the Vtour markup parser should throw
	 * an exception if unexpected or invalid tags or attributes are found;
	 * false if they are to be ignored. The default value is $wgVtourParseStrict
	 * @param bool $allowExternalLinks Whether links to external images are
	 * allowed. The default value is $wgVtourAllowExternalLinks
	 */
	public function __construct( $content, array $args, Parser $parser, PPFrame $frame,
			$parseStrict = null, $allowExternalLinks = null ) {
		global $wgVtourParseStrict, $wgVtourAllowExternalLinks;
		$this->parser = $parser;
		$this->frame = $frame;
		$this->content = $content;
		$this->args = $args;

		if ( $parseStrict === null ) {
			$parseStrict = $wgVtourParseStrict;
		}
		$this->parseStrict = $parseStrict;

		if ( $allowExternalLinks === null ) {
			$allowExternalLinks = $wgVtourAllowExternalLinks;
		}
		$this->allowExternalLinks = $allowExternalLinks;
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
	 * @return bool Whether external links are allowed
	 */
	public function getAllowExternalLinks() {
		return $this->allowExternalLinks;
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
			// a reference to a name goes to the first element with that name.
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
			return -1; // Not found.
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
		$this->parser->getOutput()->addImage( $dbKey );
	}

	/**
	 * Parse wikitext, add the generated HTML to the list of HTML elements and return
	 * its index.
	 * @param string $text Wikitext to parse
	 * @return int Index of the HTML string
	 */
	public function addHTMLElement( $text ) {
		$index = count( $this->tourHTMLElements );
		$this->tourHTMLElements[] =
				$this->parser->recursiveTagParse( $text, $this->frame );
		return $index;
	}
}

/**
 * Exception that indicates a problem in an element of Vtour markup.
 */
class VtourParseException extends Exception {

	/**
	 * Create a VtourParseException.
	 * @param string $tourId Tour id
	 * @param string $elementIdText Human-readable identification information
	 * for the element
	 * @param string $description Description of the problem
	 */
	public function __construct( $tourId, $elementIdText, $description ) {
		if ( $tourId !== null ) {
			if ( $elementIdText !== null ) {
				$tourIdMsg = wfMessage( 'vtour-parseerror-idandelement', $tourId,
					$elementIdText );
			} else {
				$tourIdMsg = wfMessage( 'vtour-parseerror-idnoelement', $tourId );
			}
		} else {
			$tourIdMsg = wfMessage( 'vtour-parseerror-noid' );
		}

		$errorMessage = wfMessage( 'vtour-parseerror', $tourIdMsg->inContentLanguage()->text(),
			$description );
		parent::__construct( $errorMessage->inContentLanguage()->text() );
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
	 * Description of the problem.
	 * @var string $description
	 */
	protected $description;

	/**
	 * Create a new VtourNoIdParseException.
	 * @param String $elementType String describing the element type
	 * @param string $description Description
	 */
	public function __construct( $elementType, $description ) {
		$this->elementType = $elementType;
		$this->description = $description;
	}
	
	/**
	 * Get the type of the element.
	 * @return string Element type
	 */
	public function getElementType() {
		return $this->elementType;
	}
	
	/**
	 * Get the problem description.
	 * @return string Description of the problem
	 */
	public function getDescription() {
		return $this->description;
	}
}

