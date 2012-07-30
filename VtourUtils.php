<?php
/**
 * Utility functions for Vtour.
 *
 * @file
 * @ingroup Extensions
 */

/**
 * Static class that contains utility functions used by Vtour, mostly for parsing.
 */
class VtourUtils {

	/**
	 * Extract XML-like tags from raw text.
	 * <nowiki></nowiki> and friends are ignored, so '</foo>' cannot be escaped and
	 * something like '&amp;lt;/foo>'<!--(actually, '&lt;/foo>', but it had to be
	 * escaped for Doxygen)--> must be used instead.
	 * Also, this regex can't handle nested elements with the same name, but we
	 * won't need them anyway.
	 * @param string $text Raw text
	 * @param bool $parseStrict Whether it is an error for the text to contain anything
	 * other than tags and comments
	 * @param string $badContent If an error occurs, part of the string that caused the error
	 * @return array Array of associative arrays
	 * ('name' => string, 'attributes' => array, 'content' => string), or null if an error
	 * occurs
	 */
	public static function getAllTags( $text, $parseStrict = true, &$badContent = null ) {
		$tagRegex = '/ \s*? < \s* ( \w+? ) # Open tag
			( (?: [^"\'>] | (?: " [^"]* " ) | (?: \' [^\']* \' ) )* ) # Attributes
			(?: > ( .* ) <\/ \s* \\1 \s* > | \/> ) \s*? # Optional content, close tag
			/ixsuU';
		$pos = 0;
		$length = strlen( $text );
		$tags = array();
		while ( $pos < $length ) {
			$matches = array();
			$found = preg_match( $tagRegex, substr( $text, $pos ), $matches,
				PREG_OFFSET_CAPTURE );
			if ( $found === 0 || $matches[0][1] !== 0 ) {
				if ( $found === 0 ) {
					$badContent = substr( $text, $pos );
				} else {
					$badContent = substr( $text, $pos, $matches[0][1] );
				}
				if ( preg_match( '/^ \s* <!-- /xs', $badContent ) ) {
					if ( preg_match( '/ --> \s* /xs', substr( $text, $pos ),
							$matches, PREG_OFFSET_CAPTURE ) ) {
						$pos += $matches[0][1] + strlen( $matches[0][0] );
						continue;
					}
				}
				if ( $parseStrict ) {
					$badContent = preg_replace( '/\s+/', ' ', $badContent ); 
					$badContent = trim( $badContent );
					return null;
				} else {
					if ( $found === 0 ) {
						break;
					}
				}
			}
			$tag = array();
			$tag['name'] = strtolower( $matches[1][0] );
			$tag['attributes'] = Sanitizer::decodeTagAttributes( $matches[2][0] );
			$tag['content'] = count( $matches ) > 3 ?
				html_entity_decode( trim( $matches[3][0] ) ) : '';
			$tags[] = $tag;
			$pos += strlen( $matches[0][0] );
		}
		return $tags;
	}

	/**
	 * Take a page title, possibly starting with the Vtour link prefix,
	 * and extract the Vtour link parameters if they exist.
	 * @param Title $title Page title
	 * @return string|null Vtour parameters part of the page title, or
	 * null if it doesn't containt parameters
	 */
	public static function extractParamsFromPrefixed( $title ) {
		$linkAlias = wfMessage( 'vtour-linkalias' )->inContentLanguage()->text();
		$lenAlias = strlen( $linkAlias );
		$titleText = $title->getText();
		if ( $lenAlias !== 0
				&& substr( $titleText, 0, $lenAlias ) === $linkAlias ) {
			return substr( $titleText, $lenAlias );
		}
		return null;
	}
	
	/**
	 * Parse the parameters of a Vtour link and extract the article name,
	 * the tour id and the place id/name:
	 * [article/]tour[:place][?center[:zoom]]
	 * where '/' is the last slash in the string, ':' is the first
	 * colon after the last slash and '?' is the last question mark
	 * in the string
	 * @param string $linkParamsText Vtour link parameters
	 * @return array An associative array:
	 * 'article' => article title,
	 * 'tour' => tour id,
	 * 'place' => place name/id,
	 * 'zoom' => zoom value (number),
	 * 'center' => center (pair of coordinates),
	 * 'ambiguous' => whether the tour name would be understood as the place name
	 * if the link were inside a tour: whether the 'place' was not set at all
	 * where all the values are either strings or null (if empty or not defined)
	 */
	public static function parseTextLinkParams( $linkParamsText ) {
		$lastSlash = strrpos( $linkParamsText, '/' );

		if ( $lastSlash !== false ) {
			$article = substr( $linkParamsText, 0, $lastSlash );
		} else {
			$article = null;
			$lastSlash = -1;
		}

		$lastQuestionMark = strrpos( $linkParamsText, '?' );
		$center = null;
		$zoom = null;
		if ( $lastQuestionMark !== false ) {
			$vtourIdentifiers = substr( $linkParamsText, $lastSlash + 1,
				$lastQuestionMark - $lastSlash - 1 );
			$positionText = substr( $linkParamsText, $lastQuestionMark + 1);
			$positionColon = strpos( $positionText, ':' );
			if ( $positionColon === false ) {
				$center = VtourUtils::parseCoordinatePair( $positionText );
			} else {
				$center = VtourUtils::parseCoordinatePair
					( substr( $positionText, 0, $positionColon ) );
				$zoom = VtourUtils::parseNumber
					( substr( $positionText, $positionColon + 1 ) );
			}
		} else {
			$vtourIdentifiers = substr( $linkParamsText, $lastSlash + 1 );
		}

		$firstColon = strpos( $vtourIdentifiers, ':' );

		$tour = null;
		$place = null;
		$ambiguous = null;
		if ( $vtourIdentifiers ) {
			if ( $firstColon === false ) {
				$tour = $vtourIdentifiers;
				$ambiguous = true;
			} else {
				$tour = substr( $vtourIdentifiers, 0, $firstColon );
				$place = substr( $vtourIdentifiers, $firstColon + 1 );
			}
		}

		return array(
			'article' => $article ? $article : null,
			'tour' => $tour ? $tour : null,
			'place' => $place ? $place : null,
			'zoom' => $zoom,
			'center' => $center,
			'ambiguous' => $ambiguous
		);
	}

	/**
	 * Create an associative array of URL parameters from link parts as
	 * returned from VtourUtils::parseTextLinkParams.
	 * @param array $linkParts Link parts
	 * @return array Associative array of parameters 
	 */ 
	public static function linkPartsToParams( $linkParts ) {
		return array(
			'vtourId' => $linkParts['tour'],
			'vtourPlace' => $linkParts['place'],
			'vtourCenter' => $linkParts['center'] ?
				implode( ',', $linkParts['center'] ) : null,
			'vtourZoom' => $linkParts['zoom'],
			'vtourAmbiguous' => $linkParts['ambiguous']
		);
	}

	/**
	 * Validate an id: a single alphanumeric word.
	 * @param string $id String to validate
	 * @return string|null The id, if it is valid; null otherwise
	 */
	public static function parseId( $id ) {
		if ( preg_match( '/^\w+$/u', $id ) === 1 ) {
			return $id;
		} else {
			return null;
		}
	}

	/**
	 * Validate a name: a string with nonzero length.
	 * @param string $name String to validate
	 * @return string|null The name, if it is valid; null otherwise
	 */
	public static function parseName( $name ) {
		if ( strlen( $name ) !== 0 ) {
			return $name;
		} else {
			return null;
		}
	}

	/**
	 * Parse a boolean: either 'true' or 'false'.
	 * @param string $strBool String to validate
	 * @return bool|null true if the string was 'true', false if the string
	 * was 'false', null in any other case
	 */
	public static function parseBool( $strBool ) {
		$strBool = strtolower( $strBool );
		if ( $strBool === 'true' ) {
			return true;
		} elseif ( $strBool === 'false' ) {
			return false;
		} else {
			return null;
		}
	}

	/**
	 * Parse two coordinates: two numbers separated by any number of spaces,
	 * commas, colons and/or semicolons.
	 * @param string $strCoordinates String to validate
	 * @return array|null An array containing the coordinates if they are valid,
	 * null otherwise
	 */
	public static function parseCoordinatePair( $strCoordinates ) {
		$coordinates = self::parseCoordinates( $strCoordinates );
		if ( count( $coordinates ) !== 2 ) {
			return null;
		} else {
			return $coordinates;
		}
	}

	/**
	 * Parse two pairs of coordinates: four numbers separated by any number of spaces,
	 * commas, colons and/or semicolons.
	 * @param string $strCoordinates String to validate
	 * @return array|null An array containing two arrays containing pairs of coordinates
	 * if they are valid, null otherwise
	 */
	public static function parseTwoCoordinatePairs( $strCoordinates ) {
		$coordinatePairs = self::parseCoordinatePairs( $strCoordinates );
		if ( count( $coordinatePairs ) !== 2 ) {
			return null;
		} else {
			return $coordinatePairs;
		}
	}

	/**
	 * Parse at least three pairs of coordinates.
	 * @param string $strCoordinates String to validate
	 * @return array|null An array containing arrays containing pairs of coordinates
	 * if they are valid, null otherwise
	 */
	public static function parsePolygonCoordinates( $strCoordinates ) {
		$pairs = self::parseCoordinatePairs( $strCoordinates );
		if ( $pairs === null || count( $pairs ) < 3 ) {
			return null;
		}
		return $pairs;
	}

	/**
	 * Parse any number of pairs of coordinates: a sequence of numbers of even length.
	 * @param string $strCoordinates String to validate
	 * @return array|null An array containing arrays containing pairs of coordinates
	 * if they are valid, null otherwise
	 */
	public static function parseCoordinatePairs( $strCoordinates ) {
		$coordinateArr = self::parseCoordinates( $strCoordinates );
		if ( $coordinateArr === null || count( $coordinateArr ) % 2 !== 0 ) {
			return null;
		}
		$pairs = array();
		for ( $i = 0; $i < count( $coordinateArr ); $i += 2 ) {
			$pairs[] = array( $coordinateArr[$i], $coordinateArr[$i + 1] );
		}
		return $pairs;
	}

	/**
	 * Parse a series of numbers, separated by spaces, commas, colons and/or semicolons.
	 * @param string $strCoordinates String to validate
	 * @return array|null An array of numbers if the string is valid, null otherwise
	 */
	public static function parseCoordinates( $strCoordinates ) {
		$strCoordinates = str_replace( VtourUtils::getDecimalSeparator(),
			'.', $strCoordinates );
		$coordinateArr = preg_split( '/[\s,;:]+/', $strCoordinates, null,
			PREG_SPLIT_NO_EMPTY );

		for ( $i = 0; $i < count( $coordinateArr ); $i++ ) {
			$coordinateArr[$i] = self::parseNumber( $coordinateArr[$i] );
			if ( $coordinateArr[$i] === null ) {
				return null;
			}
		}

		return $coordinateArr;
	}

	/**
	 * Validate and parse a positive integer.
	 * @param string $strNaturalNumber String to validate
	 * @return int|null The parsed integer, if valid; null otherwise
	 */
	public static function parseNatural( $strNaturalNumber ) {
		$naturalNumber = self::parseNumber( $strNaturalNumber );
		if ( $naturalNumber === null || $naturalNumber <= 0
				|| round( $naturalNumber ) !== $naturalNumber ) {
			return null;
		} else {
			return $naturalNumber;
		}
	}

	/**
	 * Validate and parse a number.
	 * @param string $strNumber String to validate
	 * @return float|null The parsed number, if valid; null otherwise
	 */
	public static function parseNumber( $strNumber ) {
		$strNumber = str_replace( VtourUtils::getDecimalSeparator(), '.', $strNumber );
		if ( is_numeric( $strNumber ) ) {
			return floatval( $strNumber );
		} else {
			return null;
		}
	}

	/**
	 * Validate and parse a nonnegative number.
	 * @param string $strNumber String to validate
	 * @return float|null The parsed number, if valid; null otherwise
	 */
	public static function parseNonNegative( $strNumber ) {
		$number = self::parseNumber( $strNumber );
		if ( $number !== null && $number >= 0 ) {
			return $number;
		} else {
			return null;
		}
	}

	/**
	 * Validate and sanitize a length string (nn|nnpx|nn%, where nn is a
	 * positive number or 0).
	 * @param string $strLength String to validate
	 * @return string|null The sanitized string, if valid; null otherwise
	 */
	public static function parseHTMLLength( $strLength ) {
		$strLength = trim( $strLength );
		$pxPrefix = self::getPrefix( $strLength, 'px' );
		if ( $pxPrefix === null ) {
			$pxPrefix = $strLength;
		}
		$number = self::parseNonNegative( trim( $pxPrefix ) );
		if ( $number !== null ) {
			return $number . 'px';
		} else {
			$perPrefix = self::getPrefix( $strLength, '%' );
			if ( $perPrefix !== null ) {
				$number = self::parseNonNegative( trim( $perPrefix ) );
				if ( $number !== null ) {
					return $number . '%';
				}
			}
		}
		return null;
	}

	/**
	 * @return string|null $decimalSeparator String that will be used to separate
	 * the whole part from the fractional part in numbers. Regardless of this value,
	 * '.' is always considered a valid decimal separator
	 */	
	public static function getDecimalSeparator() {
		global $wgVtourAllowNonStandardDecimalSeparator;
		if ( $wgVtourAllowNonStandardDecimalSeparator ) {
			$decimalSeparatorMessage = wfMessage( 'vtour-decimalseparator' );
			return $decimalSeparatorMessage->inContentLanguage()->text();
		} else {
			return '.';
		}
	}
	
	/**
	 * If a string ends with a given suffix, return the rest of string.
	 * @param string $word String from which the prefix will be extracted
	 * @param string $suffix Suffix to search for
	 * @return string|null Prefix, if the string ends with the suffix;
	 * otherwise, null
	 */
	public static function getPrefix( $word, $suffix ) {
		$limit = -strlen( $suffix );
		if ( $limit === 0 ) {
			return $word;
		}
		if ( substr( $word, -strlen( $suffix ) ) === $suffix ) {
			return substr( $word, 0, $limit );
		} else {
			return null;
		}
	}
}

