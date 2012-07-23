<?php
/**
 * Root element of a Vtour tour.
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
		'id' => array( 'parseId', true ),
		'start' => array( null, true )
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

		$tags = VtourUtils::getAllTags( $this->content );
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
		$possiblePlace = VtourPlace::tryCreatePlace( $tagText, $this->vtourParser );

		if ( $possiblePlace !== null ) {
			$referencedMap = $possiblePlace->getPartialResult()['map'];
			if ( $referencedMap === null ) {
				$mapName = $implicitMap->getPartialResult()['name'];
				$mapIndex = $this->getMapIndex( $mapName ); 
				$possiblePlace->setMap( $mapIndex );
			} else {
				// the place references a map despite being in this one implicitly
				$this->throwBadFormat( 'vtour-errordesc-unneededid',
						$implicitMap->getPartialResult()['name'] );
			}

			$this->places[] = $possiblePlace;
			return true;
		}
		return false;
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
		return $this->getGenericTypeMessage()
				->inContentLanguage()->text();
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

