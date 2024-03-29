<?php
/**
 * Base class for all the tags used in Vtour markup.
 * 
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 *
 * @file
 * @ingroup Extensions
 */

/**
 * Base class for Vtour tags.
 */
abstract class VtourElement {

	/**
	 * VtourParser that will resolve any references that appear in this element.
	 * @var string $vtourParser
	 */
	protected $vtourParser;
	
	/**
	 * Raw content of the element (anything contained between the tags).
	 * @var string $content
	 */
	protected $content;
	
	/**
	 * Associative array of attributes for this tag.
	 * @var array $args
	 */
	protected $args;
	
	/**
	 * Associative array that stores the half-processed attributes for the element.
	 * @var array $result
	 */
	protected $result = array();

	/**
	 * Associative array of expected attributes for this element type:
	 * attributeName => methodName or
	 * attributeName => array( methodName, mandatory ),
	 * where attributeName is a string that contains the name of the attribute,
	 * methodName is the name of a method in this class that will be called to
	 * parse and/or check the validity of the attribute and mandatory indicates
	 * whether the element is invalid if it doesn't contain the attribute
	 * (false by default).
	 * @var array $attributesTemplate
	 */
	protected $attributesTemplate = array();

	/**
	 * Associative array that pairs the names of methods that may be called to parse
	 * an attribute and the names of the messages that hold descriptions of the
	 * expected values: methodName => messageName. Used in error messages.
	 * @var array $parseFunctionDescriptions
	 */
	protected $parseFunctionDescriptions = array(
		'parseId' => 'vtour-attributetype-id',
		'parseName' => 'vtour-attributetype-name',
		'parseImageTitle' => 'vtour-attributetype-imagetitle',
		'parseBool' => 'vtour-attributetype-bool',
		'parseNumber' => 'vtour-attributetype-number',
		'parseNatural' => 'vtour-attributetype-natural',
		'parseHTMLLength' => 'vtour-attributetype-length',
		'parseCoordinatePair' => 'vtour-attributetype-coordinatepair',
		'parseTwoCoordinatePairs' => 'vtour-attributetype-twocoordinatepairs',
		'parsePolygonCoordinates' => 'vtour-attributetype-polygoncoordinates'
	);

	/**
	 * Create a VtourElement.
	 * @param string $content Raw content of the element.
	 * @param array $args Associative array of attributes
	 * @param VtourParser $vtourParser Parent VtourParser
	 * @param bool $autocreate Whether to parse the args immediately
	 * @throws VtourParseException If the element can't be parsed but it can be identified
	 * @throws VtourNoIdParseException If the element can't be parsed and it isn't identiable
	 */
	public function __construct( $content, array $args, VtourParser $vtourParser,
			$autocreate = true ) {
		$this->content = $content;
		$this->args = $args;
		$this->vtourParser = $vtourParser;
		if ( $autocreate ) {
			$this->parseAttributes();
		}
	}

	/**
	 * Return the content of the element in a useful format, provided that
	 * it has been fully processed.
	 * @return array Associative array that contains the expected attributes
	 * and properties of this type of element, with the values that were found
	 * in the arguments and content
	 */
	public function getResult() {
		return $this->result;
	}

	/**
	 * Return the currently stored content of the element. Only basic attribute
	 * parsing is guaranteed to have occurred.
	 * @return array Associative array
	 */
	public function getPartialResult() {
		return $this->result;
	}

	/**
	 * Determine whether the element contains information that may be used by an human 
	 * to identify it, such as a name. Unless getFullId is overriden, this requires a
	 * 'name' attribute in the result and an optional 'id' attribute.
	 * @return bool Whether the element can be identified
	 */
	protected function hasIdInfo() {
		return isset( $this->result['name'] );
	}

	/**
	 * If the element can be identified, generate a human-readable string that contains
	 * the available identification information. Used in error messages.
	 * @return string|null Human-readable string, or null if the element contains no
	 * identification data
	 */
	public function getFullId() {
		if ( $this->hasIdInfo() ) {
			$type = $this->getGenericType();
			$name = $this->result['name'];
			$id = isset( $this->result['id'] ) ? $this->result['id'] : null;
			if ( $id ) {
				$idMsg = wfMessage( 'vtour-typenameid', $type, $name, $id );
			} else {
				$idMsg = wfMessage( 'vtour-typename', $type, $name );
			}
			return VtourUtils::getContLangText( $idMsg );
		} else {
			return null;
		}
	}

	/**
	 * Return the name of the element, if it exists. If it doesn't, the type
	 * will be good enough.
	 * @return string Human-readable short string naming the element
	 */
	public function getName() {
		if ( isset( $this->result['name'] ) ) {
			return $this->result['name'];
		} else {
			return $this->getGenericType();
		}
	}

	/**
	 * Extract the tags from a given string (using VtourUtils::getAllTags),
	 * and throw an appropriate exception if an error occurs.
	 * @param string $text Raw text
	 * @return array Array of tags
	 */
	protected function getAllTags( $text ) {
		$badContent = null;
		$parseStrict = $this->vtourParser->getParseStrict();
		$result = VtourUtils::getAllTags( $text, $parseStrict, $badContent );
		if ( $result === null ) {
			$this->throwBadFormat( 'vtour-errordesc-badcontent', $badContent );
		} else {
			return $result;
		}
	}

	/**
	 * Return a Message object that identifies the type of the element.
	 * @return Message Message object for the element type
	 */
	protected abstract function getGenericTypeMessage();

	/**
	 * Return a string that contains the type of this element in the content
	 * language.
	 * @return string Type string
	 */
	protected function getGenericType() {
		return VtourUtils::getContLangText( $this->getGenericTypeMessage() );
	}

	/**
	 * Validate and parse the arguments contained in this element.
	 */
	protected function parseAttributes() {
		foreach ( $this->attributesTemplate as $attributeName => $validation ) {
			if ( is_array( $validation ) ) {
				$parseFunction = $validation[0];
				$mandatory = $validation[1];
			} else {
				$parseFunction = $validation;
				$mandatory = false;
			}
			$this->result[$attributeName] = $this->validateAndParseAttribute
				( $attributeName, $parseFunction, $mandatory );
		}

		/*
		 * Check for unexpected attributes only after parsing the expected ones,
		 * so the element has a name (for error messages) as soon as possible.
		 */
		$this->checkValidAttributes( $this->args, $this->attributesTemplate );
	}

	/**
	 * Validate and parse a single argument.
	 * @param string $attrName Name of the argument
	 * @param string $parseFunction Function that will be used to parse the
	 * attribute, if it exists
	 * @param bool $mandatory Whether an error should be thrown if the attribute
	 * is not found
	 * @return value|null Value of the attribute, or null if it was not found (for
	 * optional attributes)
	 */
	protected function validateAndParseAttribute( $attrName,
			$parseFunction = null, $mandatory = true ) {
		$strValue = isset( $this->args[$attrName] ) ? $this->args[$attrName]: null;
		if ( $strValue === null ) {
			if ( $mandatory ) {
				$this->throwBadFormat( 'vtour-errordesc-notset', $attrName );
			} else {
				return null;
			}
		} elseif ( $parseFunction !== null ) {
			if ( method_exists( $this, $parseFunction ) ) {
				$attrValue = $this->$parseFunction( $strValue );
			} else {
				$attrValue = VtourUtils::$parseFunction( $strValue );
			}
			if ( $attrValue === null 
					&& ( $mandatory || $this->vtourParser->getParseStrict() ) ) {
				$errorDescription = $this->parseFunctionDescriptions[$parseFunction];
				$typeMessage = wfMessage( $errorDescription );
				$this->throwBadFormat( 'vtour-errordesc-invalid', $attrName,
					$strValue, VtourUtils::getContLangText( $typeMessage ) );
			} else {
				return $attrValue;
			}
		} else {
			return $strValue;
		}
	}

	/**
	 * Validate the title of an image and get its URL.
	 * @param string $title Title of the image
	 * @return string|null URL of the image file (whether it actually exists
	 * or not), or null if the title is not valid
	 */
	protected function parseImageTitle( $title ) {
		if ( $this->vtourParser->getAllowExternalImages()
				&& strpos( $title, '//' ) ) {
			// Link to an external image (external image names are
			// URLs, so they have to contain the substring '//', and
			// MediaWiki image names can't contain that substring, so
			// this should be enough
			return htmlspecialchars( $title );
		}
		$title = Title::newFromText( $title, NS_FILE );
		$repoGroup = RepoGroup::singleton();

		// If the file exists, find it
		$file = $repoGroup->findFile( $title );
		if ( !$file ) {
			// The file doesn't exist. Assume local repo
			$repo = $repoGroup->getLocalRepo();
			$file = $repo->newFile( $title );
		}

		if ( $file === null ) {
			// Invalid title
			return null;
		} else {
			// Invalidate the page when the file is uploaded or deleted,
			// so we get the correct path if it exists
			$this->vtourParser->registerImage( $title );
			return $file->getURL();
		}
	}

	/**
	 * Parse wiki text and store the generated HTML.
	 * @param string $text Text to parse
	 * @return int Index of the HTML element created.
	 */
	protected function parseWiki( $text ) {
		return $this->vtourParser->addHTMLElement( $this, $text );
	}

	/**
	 * Throw a exception that describes a problem in this element
	 * and includes human-readable identification information for it.
	 * @param string $errorKey Name of the error message. Any number of
	 * parameters for the message may follow this argument
	 * @throws VtourParseException If this element can be identified by itself
	 * @throws VtourNoIdParseException If this element can't be identified by itself
	 */
	protected function throwBadFormat( $errorKey /* ... */ ) {
		$params = func_get_args();
		array_shift( $params );
		$tourId = $this->vtourParser->getTourId();
		if ( $this->hasIdInfo() ) {
			$elementIdText = $this->getFullId();
			throw new VtourParseException( $tourId, $elementIdText, $errorKey, $params );
		} else {
			throw new VtourNoIdParseException( $this->getGenericType(), $errorKey, $params );
		}
	}

	/**
	 * Throw a exception that indicates a problem in a child element that didn't have
	 * identification information.
	 * @param VtourNoIdParseException $exception Exception that was thrown by the child element
	 * @param int $childIndex Index of the child in the content of the parent element, so it can
	 * be identified in the error message
	 * @throws VtourParseException Exception that contains both the problem description from the
	 * $exception argument and identification information for the element where the error
	 * originated
	 */
	protected function rethrowExceptionFromChild( VtourNoIdParseException $exception,
			$childIndex ) {
		$tourId = $this->vtourParser->getTourId();
		$childType = $exception->getElementType();
		$errorKey = $exception->getErrorKey();
		$params = $exception->getParams();
		$elementIdMessage = wfMessage( 'vtour-typenamefromchild', $childType,
			$childIndex + 1, $this->getFullId() );
		$elementIdText = VtourUtils::getContLangText( $elementIdMessage );
		throw new VtourParseException( $tourId, $elementIdText, $errorKey, $params );
	}

	/**
	 * Throw a VtourParseException complaining about an unexpected tag if the VtourParser
	 * is in strict mode.
	 * @param string $tag Name of the tag
	 */
	protected function throwBadTagIfStrict( $tag ) {
		if ( $this->vtourParser->getParseStrict() ) {
			$this->throwBadFormat( 'vtour-errordesc-badtag', $tag['name'] );
		}
	}

	/**
	 * If the VtourParser is in strict mode, check a list of attributes and throw an error
	 * if any of them wasn't expected.
	 * @param array $tagAttrs Associative array of attributes (name => value)
	 * @param array $validAttrs Associative array whose keys are expected attribute names
	 */
	protected function checkValidAttributes( $tagAttrs, $validAttrs ) {
		if ( $this->vtourParser->getParseStrict() ) {
			foreach ( $tagAttrs as $key => $value ) {
				if ( !array_key_exists( $key, $validAttrs ) ) {
					$this->throwBadFormat( 'vtour-errordesc-badattr',
						$key, $value );
				}
			}
		}
	}

	/**
	 * Register a map in the VtourParser.
	 * @param VtourMap $map Map that will be registered
	 */
	protected function registerMap( $map ) {
		if ( !$this->vtourParser->registerMap( $map ) ) {
			$this->throwDuplicateId();	
		}
	}

	/**
	 * Register a place in the VtourParser.
	 * @param VtourMap $place Place that will be registered
	 */
	protected function registerPlace( $place ) {
		if ( !$this->vtourParser->registerPlace( $place ) ) {
			$this->throwDuplicateId();	
		}
	}

	/**
	 * Get the index of a map.
	 * @param string $idOrName Name or id of the map
	 * @return int|null Index of the map, or null if the reference was null or empty
	 */
	protected function getMapIndex( $idOrName ) {
		$ret = $this->vtourParser->getMapIndex( $idOrName );
		if ( $ret === -1 ) {
			$mapType = VtourUtils::getContLangText( 'vtour-elementtype-map' );
			$this->throwRefNotFound( $mapType, $idOrName );
		} else {
			return $ret;
		}
	}

	/**
	 * Get the index of a place.
	 * @param string $idOrName Name or id of the place
	 * @return int|null Index of the place, or null if the reference was null or empty
	 */
	protected function getPlaceIndex( $idOrName ) {
		$ret = $this->vtourParser->getPlaceIndex( $idOrName );
		if ( $ret === -1 ) {
			$placeType = VtourUtils::getContLangText( 'vtour-elementtype-place' );
			$this->throwRefNotFound( $placeType, $idOrName );	
		} else {
			return $ret;
		}
	}
	
	/**
	 * Throw an exception to indicate that the id of this element already exists.
	 */
	protected function throwDuplicateId() {
		$this->throwBadFormat( 'vtour-errordesc-duplicate', $this->getGenericType(),
			$this->result['id'] );
	}

	/**
	 * Throw an exception to indicate that a given reference couldn't be resolved.
	 * @param string $type Reference type
	 * @param string $idOrName Reference: id or name
	 */
	protected function throwRefNotFound( $type, $idOrName ) {
		$this->throwBadFormat( 'vtour-errordesc-refnotfound',
			$type, $idOrName );
	}
}

