<?php
/**
 * Map element in a Vtour tour.
 * 
 * Vtour - a virtual tour system for MediaWiki
 * Copyright (C) 2012 Álvaro Fernández Millara
 *
 * @file
 * @ingroup Extensions
 */

/**
 * Map element in a Vtour tour.
 */
class VtourMap extends VtourElement {

	protected $attributesTemplate = array(
		'name' => array( 'parseName', true ),
		'id' => 'parseId',
		'image' => array( 'parseImageTitle', true ),
		'start' => null,
		'up' => null,
		'down' => null,
		'location' => 'parseTwoCoordinatePairs'
	);

	/**
	 * Create a new VtourMap.
	 * @param string $content Raw content
	 * @param array $args Associative array of attributes
	 * @param VtourParser $vtourParser VtourParser that directs the parsing operation
	 */
	public function __construct( $content, array $args, VtourParser $vtourParser ) {
		parent::__construct( $content, $args, $vtourParser );

		$this->registerMap( $this );

		$mapSubtags = $this->getAllTags( $content );
		foreach ( $mapSubtags as $index => $mapSubtag ) {
			try {
				if ( !$this->vtourParser->tryAddPlace( $mapSubtag, $this ) ) {
					$this->throwBadTagIfStrict( $mapSubtag );
				}
			} catch ( VtourNoIdParseException $e ) {
				$this->rethrowExceptionFromChild( $e, $index );
			}
		}
	}

	protected function getGenericTypeMessage() {
		return wfMessage( 'vtour-elementtype-map' );
	}

	/**
	 * Resolve the reference to the starting place.
	 * @param int $mapIndex Index of this map
	 */
	public function resolveStart( $mapIndex ) {
		$start =& $this->result['start'];
		$start = $this->getPlaceIndex( $start );
		if ( $start !== null ) {
			$startPlace = $this->vtourParser->getPlace( $start );
			if ( $startPlace->result['map'] !== $mapIndex ) {
				$this->throwBadFormat( 'vtour-errordesc-badstart',
					$startPlace->result['name'] );
			}
		}
	}

	/**
	 * Resolve the references to the neighbours (up and down) of this map.
	 */
	public function resolveNeighbours() {
		foreach ( array( 'up', 'down' ) as $wayIndex => $mapReference ) {
			$neighbour =& $this->result[$mapReference];
			$neighbour = $this->getMapIndex( $neighbour );
		}
	}

	/**
	 * Link here, symmetrically, the neighbours (up and down) that don't have
	 * explicit neighbours yet.
	 * @param int $mapIndex Index of this map
	 */
	public function linkFromNeighbours( $mapIndex ) {
		$ways = array( 'up', 'down' );
		foreach ( $ways as $wayIndex => $way ) {
			$otherMapIndex = $this->getMapIndex( $this->result[$way] );
			if ( $otherMapIndex !== null ) {
				$otherMap = $this->vtourParser->getMap( $otherMapIndex );
				$otherWay = $ways[1 - $wayIndex];
				if ( $otherMap->result[$otherWay] === null ) {
					$otherMap->result[$otherWay] = $mapIndex;
				}
			}
		}
	}

	/**
	 * If this map has a geographic location, return its center.
	 * @return array Array of coordinates, or null if there is no location information
	 */
	public function getCenter() {
		$location = $this->result['location'];
		if ( $location !== null ) {
			return array(
				( $location[0][0] + $location[1][0] ) / 2,
				( $location[0][1] + $location[1][1] ) / 2
			);
		} else {
			return null;
		}	
	}

	/**
	 * Set a starting place for this map, if no starting place exists yet.
	 * @param VtourPlace $start Starting place
	 * @return bool Whether the place has been set as the start
	 */
	public function setStartIfNeeded( $start ) {
		// An empty 'start' attribute makes no sense,
		// so it is treated as if it were null.
		if ( $this->result['start'] === null
				|| $this->result['start'] === '' ) {
			$this->result['start'] = $start;
			return true;
		} else {
			return false;
		}
	}
}

