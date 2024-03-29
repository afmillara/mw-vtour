<?php
/**
 * Root element of a Vtour tour.
 * 
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 *
 * @file
 * @ingroup Extensions
 */

/**
 * Root element of a Vtour tour.
 */
class VtourRoot extends VtourElement {

	/**
	 * List of places in this tour.
	 * @var array $places
	 */
	protected $places = array();
	
	/**
	 * List of maps in this tour.
	 * @var array $maps
	 */
	protected $maps = array();

	protected $attributesTemplate = array(
		'id' => 'parseId',
		'start' => null,
		'visible' => 'parseBool',
		'location' => 'parseCoordinatePair',
		'width' => 'parseHTMLLength',
		'height' => 'parseHTMLLength'
	);

	/**
	 * Create a new VtourRoot.
	 * @param string $content Raw content
	 * @param array $args Associative array of attributes
	 * @param VtourParser $vtourParser VtourParser that directs the parsing operation.
	 */
	public function __construct( $content, array $args, VtourParser $vtourParser ) {
		parent::__construct( $content, $args, $vtourParser, false );
	}

	/**
	 * Process the whole tour.
	 */
	public function parse() {
		$this->parseAttributes();

		$tags = $this->getAllTags( $this->content );
		foreach ( $tags as $index => $tag ) {
			try {
				if ( $tag['name'] === 'map' ) {
					$this->maps[] = new VtourMap( $tag['content'],
						$tag['attributes'], $this->vtourParser );
				} else {
					$possiblePlace = VtourPlace::tryCreatePlace( $tag,
						$this->vtourParser );
					if ( $possiblePlace !== null ) {
						$this->places[] = $possiblePlace;
					} else {
						$this->throwBadTagIfStrict( $tag );
					}
				}
			} catch ( VtourNoIdParseException $e ) {
				$this->rethrowExceptionFromChild( $e, $index );
			}
		}

		$this->result['start'] = $this->getPlaceIndex( $this->result['start'] );
		if ( $this->result['start'] === null ) {
			if ( $this->getNumberOfPlaces() > 0 ) {
				$this->result['start'] = 0;
			} else {
				$this->throwBadFormat( 'vtour-errordesc-noplaces' );
			}
		}

		$visible =& $this->result['visible'];
		$location =& $this->result['location'];
		// true or null -> true
		if ( $visible !== false && $location === null ) {
			$accumulator = array( 0, 0 );
			$mapsWithLocation = 0;
			foreach ( $this->maps as $map ) {
				$center = $map->getCenter();
				if ( $center !== null ) {
					$accumulator[0] += $center[0];
					$accumulator[1] += $center[1];
					$mapsWithLocation++;
				}
			}
			if ( $mapsWithLocation > 0 ) {
				$location = array(
					$accumulator[0] / $mapsWithLocation,
					$accumulator[1] / $mapsWithLocation
				);
			}
		}
		$visible = $visible !== false && $location !== null;

		$this->finishPlaces();
		$this->finishMaps();
	}

	/**
	 * Return the tour id.
	 * @return string|null Tour id, or null if it has not been set
	 */
	public function getTourId() {
		return isset( $this->result['id'] ) ? $this->result['id'] : null;
	}

	/**
	 * Return a single map.
	 * @param int $index Index of the map
	 * @return VtourMap Map object
	 */
	public function getMap( $index ) {
		return $this->maps[$index];
	}

	/**
	 * Find the index of a map.
	 * @param VtourMap $map Map object
	 * @return int Index of the map
	 */
	public function findMap( $map ) {
		return array_search( $map, $this->maps );
	}

	/**
	 * Return the current number of maps.
	 * @return int Number of maps
	 */
	public function getNumberOfMaps() {
		return count( $this->maps );
	}

	/**
	 * Return a single place.
	 * @param int $index Index of the place
	 * @return VtourPlace Place object
	 */
	public function getPlace( $index ) {
		return $this->places[$index];
	}

	/**
	 * Return the current number of places.
	 * @return int Number of places
	 */
	public function getNumberOfPlaces() {
		return count( $this->places );
	}

	/**
	 * Try to create a place from raw text.
	 * @param string $tagText Raw text of the element
	 * @param VtourMap $implicitMap VtourMap where this place belongs
	 */
	public function tryAddPlace( $tagText, $implicitMap ) {
		$possiblePlace = VtourPlace::tryCreatePlace( $tagText,
			$this->vtourParser, $implicitMap );
		if ( $possiblePlace !== null ) {
			$this->places[] = $possiblePlace;
			return true;
		} else {
			return false;
		}

	}

	/**
	 * After parsing all the elements, resolve the references contained in the places.
	 */
	protected function finishPlaces() {
		foreach ( $this->places as $placeIndex => $place ) {
			$place->linkFromNeighbours( $placeIndex );
		}
		foreach ( $this->places as $placeIndex => $place ) {
			$place->resolveReferences( $placeIndex );
		}
	}
	
	/**
	 * After parsing all the elements and resolving the references contained
	 * in the places, resolve the references contained in the maps.
	 */
	protected function finishMaps() {
		foreach ( $this->maps as $mapIndex => $map ) {
			$map->resolveStart( $mapIndex );

			// If the other map has no better plans, link it here. This is
			// done before the maps link themselves to their neighbours
			// (in resolveNeighbours()), so references to "" (explicitly
			// setting a null neighbour) are treated correctly.
			$map->linkFromNeighbours( $mapIndex );
		}

		foreach ( $this->maps as $mapIndex => $map ) {
			$map->resolveNeighbours();
		}
	}
	
	protected function getGenericTypeMessage() {
		return wfMessage( 'vtour-elementtype-root' );
	}

	public function hasIdInfo() {
		return true;
	}

	public function getFullId() {
		return VtourUtils::getContLangText( $this->getGenericTypeMessage() );
	}

	public function getResult() {
		$mapsArray = array();
		$placesArray = array();

		$this->result['maps'] =& $mapsArray;
		$this->result['places'] =& $placesArray;

		foreach ( $this->maps as $map ) {
			$mapsArray[] = $map->getResult();
		}
		foreach ( $this->places as $place ) {
			$placesArray[] = $place->getResult();
		}

		return $this->result;
	}
}

