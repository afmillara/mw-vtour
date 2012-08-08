<?php
/**
 * Place elements in Vtour tours: ImagePlace, PanoPlace and TextPlace.
 * 
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 *
 * @file
 * @ingroup Extensions
 */

/**
 * Base class for place elements.
 */
abstract class VtourPlace extends VtourElement {

	/**
	 * Map where this place belongs implicitly.
	 * @var VtourMap $implicitMap
	 */
	protected $implicitMap = null;

	/**
	 * List of links from this place.
	 * @var array $links
	 */
	protected $links = array();

	protected $attributesTemplate = array(
		'name' => array( 'parseName', true ),
		'id' => 'parseId',
		'visible' => 'parseBool',
		'description' => null,
		'map' => null,
		'location' => 'parseCoordinatePair',
		'up' => null,
		'down' => null,
		'center' => 'parseCoordinatePair',
		'zoom' => 'parseNatural',
		'angle' => 'parseNumber',
		'tooltip' => 'parseBool'
	);

	/**
	 * Create a new VtourPlace.
	 * @param string $content Raw content
	 * @param array $args Associative array of attributes
	 * @param VtourParser $vtourParser VtourParser that directs the parsing operation
	 */
	public function __construct( $content, array $args, VtourParser $vtourParser ) {
		parent::__construct( $content, $args, $vtourParser );

		$this->registerPlace( $this );
		$this->result['visible'] = 
			( $this->result['visible'] === null
				|| $this->result['visible'] )
			&& $this->result['location'] !== null;

		$placeSubtags = $this->getAllTags( $this->content );
		foreach ( $placeSubtags as $index => $placeSubtag ) {
			try {
				$this->parseSinglePlaceSubtag( $placeSubtag );
			} catch ( VtourNoIdParseException $e ) {
				$this->rethrowExceptionFromChild( $e, $index );
			}
		}

		$description = $this->result['description']; 
		if ( $description !== null ) {
			$this->result['description'] = $this->parseWiki( $description );
		}
	}
	
	/**
	 * Try to parse an element as a place.
	 * @param array $tag Element data, as returned by VtourUtils::getAllTags
	 * @param VtourParser $vtourParser VtourParser that is directing the parsing operation
	 * @param int $implicitMapIndex Index of the map where this place belongs implicitly
	 * @return VtourPlace|null Created place, or null if no place was created
	 */
	public static function tryCreatePlace( $tag, $vtourParser, $implicitMap = null ) {
		switch ( $tag['name'] ) {
			case 'imageplace':
				$place = new VtourImagePlace( $tag['content'], $tag['attributes'],
					$vtourParser );
				break;
			case 'panoplace':
				$place = new VtourPanoPlace( $tag['content'], $tag['attributes'],
					$vtourParser );
				break;
			case 'textplace':
				$place = new VtourTextPlace( $tag['content'], $tag['attributes'],
					$vtourParser );
				break;
			default:
				return null;
		}
		$place->implicitMap = $implicitMap;
		return $place;
	}

	protected function getGenericTypeMessage() {
		return wfMessage( 'vtour-elementtype-place' );
	}

	/**
	 * Parse a single child element.
	 * @param array $placeSubtag Element data, as returned by VtourUtils::getAllTags.
	 */
	protected function parseSinglePlaceSubtag( $placeSubtag ) {
		$content = html_entity_decode( $placeSubtag['content'] );
		if ( $placeSubtag['name'] === 'description' ) {
			$this->result['description'] = $content;
		} else if ( !$this->tryAddLink( $placeSubtag ) ) {
			$this->throwBadTagIfStrict( $placeSubtag );
		}
	}

	/**
	 * Try to create a link element from this place.
	 * @param array $tag Element data, as returned by VtourUtils::getAllTags
	 * @return bool Whether the tag was added as a valid link
	 */
	protected function tryAddLink( $tag ) {
		$possibleLink = VtourLink::tryCreateLink( $tag, $this->vtourParser );
		if ( $possibleLink !== null ) {
			$this->links[] = $possibleLink;
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Link here, symmetrically, the neighbours (up and down) that don't have
	 * explicit neighbours yet.
	 * @param int $placeIndex Index of this place
	 */
	public function linkFromNeighbours( $placeIndex ) {
		// FIXME: Shouldn't 'way = ""' override the map settings and not just the neighbours'?
		$ways = array( 'up', 'down' );
		foreach ( $ways as $wayIndex => $way ) {
			$otherPlaceIndex = $this->getPlaceIndex( $this->result[$way] );
			if ( $otherPlaceIndex !== null ) {
				$otherPlace = $this->vtourParser->getPlace( $otherPlaceIndex );
				$otherWay = $ways[1 - $wayIndex];
				if ( $otherPlace->result[$otherWay] === null ) {
					$otherPlace->result[$otherWay] = $placeIndex;
				}
			}
		}
	}

	/**
	 * Resolve all the references contained in this place and the links from here.
	 * @param int $index Index of this place
	 */
	public function resolveReferences( $index ) {
		$original = $this->result['map'];
		$this->result['map'] = $this->getMapIndex( $this->result['map'] );

		if ( $this->implicitMap ) {
			// The place is in a map implicitly
			$implicitMapIndex = $this->vtourParser->findMap( $this->implicitMap );
			if ( $this->result['map'] === null && $original !== '' ) {
				// The place doesn't reference any maps explicitly
				$this->result['map'] = $implicitMapIndex;
			} elseif ( $this->result['map'] !== $implicitMapIndex ) {
				// The place references a different map
				$implicitMapName = $this->implicitMap->getPartialResult()['name'];
				$this->throwBadFormat( 'vtour-errordesc-idmismatch',
					$implicitMapName, $original );
			}
		}

		// if the map has no 'start' place, use this one.
		if ( $this->result['map'] !== null ) {
			$this->vtourParser->getMap( $this->result['map'] )->setStartIfNeeded( $index );
		}

		$this->checkDependency( 'location', 'map' );
		$this->checkDependency( 'angle', 'location' );

		foreach ( array( 'up', 'down' ) as $placeReference ) {
			$neighbour = $this->result[$placeReference];
			$this->result[$placeReference] = $this->getPlaceIndex( $neighbour );
		}

		foreach ( $this->links as $index => $link ) {
			try {
				$link->resolveReferences();
			} catch ( VtourNoIdParseException $e ) {
				$this->rethrowExceptionFromChild( $e, $index );
			}
		}
	}

	public function getResult() {
		$linkArrays = array();
		$this->result['links'] =& $linkArrays;
		foreach ( $this->links as $link ) {
			$linkArrays[] = $link->getResult();
		}
		return $this->result;
	}

	/**
	 * Throw a VtourParseException if an attribute has been set but another attribute
	 * on which it depends hasn't. 
	 * @param string $possibleAttribute Attribute that might be present
	 * @param string $dependency Attribute that must be present if the first one is
	 */
	protected function checkDependency( $possibleAttribute, $dependency ) {
		if ( $this->vtourParser->getParseStrict()
				&& $this->result[$possibleAttribute] !== null
				&& $this->result[$dependency] === null ) {
			$this->throwBadFormat( 'vtour-errordesc-attrdepends',
				$possibleAttribute, $dependency );
		}
	}
}

/**
 * TextPlace element in a Vtour tour.
 */
class VtourTextPlace extends VtourPlace {

	public function __construct( $content, array $args, VtourParser $vtourParser ) {
		// 'text' is not a mandatory attribute because it can also be a child element
		$this->attributesTemplate += array(
			'text' => null
		);

		parent::__construct( $content, $args, $vtourParser );
		$this->result['type'] = 'text';

		if ( $this->result['text'] === null ) {
			$this->throwBadFormat( 'vtour-errordesc-notsetorchild', 'text' );
		} else {
			$this->result['text'] = $this->parseWiki( $this->result['text'] );
		}
	}

	protected function parseSinglePlaceSubtag( $placeSubtag ) {
		$content = html_entity_decode( $placeSubtag['content']);
		if ( $placeSubtag['name'] === 'description' ) {
			$this->result['description'] = $content;
		} else if ( $placeSubtag['name'] === 'text' ) {
			$this->result['text'] = $content;
		} else {
			$this->throwBadTagIfStrict( $placeSubtag );
		}
	}
}

/**
 * PanoPlace element in a Vtour tour.
 */
class VtourPanoPlace extends VtourPlace {

	public function __construct( $content, array $args, VtourParser $vtourParser ) {
		$this->attributesTemplate += array(
			'image' => array( 'parseImageTitle', true )
		);

		parent::__construct( $content, $args, $vtourParser );
		$this->result['type'] = 'pano';
	}
}

/**
 * ImagePlace element in a Vtour tour.
 */
class VtourImagePlace extends VtourPlace {

	public function __construct( $content, array $args, VtourParser $vtourParser ) {
		$this->attributesTemplate += array(
			'image' => array( 'parseImageTitle', true )
		);

		parent::__construct( $content, $args, $vtourParser );
		$this->result['type'] = 'image';
	}
}

