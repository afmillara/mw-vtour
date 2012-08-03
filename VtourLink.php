<?php
/**
 * Link elements in Vtour tours: PointLink and AreaLink.
 *
 * @file
 * @ingroup Extensions
 */

/**
 * Base class for link elements.
 */
abstract class VtourLink extends VtourElement {

	protected $attributesTemplate = array(
		'destination' => array( null, true ),
		'center' => 'parseCoordinatePair',
		'zoom' => 'parseNatural',
		'tooltip' => 'parseBool'
	);

	/**
	 * Create a new VtourLink.
	 * @param string $content Raw content
	 * @param array $args Associative array of attributes
	 * @param VtourParser $vtourParser VtourParser that directs the parsing operation
	 */
	public function __construct( $content, array $args, VtourParser $vtourParser ) {
		parent::__construct( $content, $args, $vtourParser );

		if ( $this->vtourParser->getParseStrict() ) {
			$tags = $this->getAllTags( $content );
			if ( count( $tags ) !== 0 ) {
				$this->throwBadTagIfStrict( $tags[0] );
			}
		}
	}

	/**
	 * Try to parse an element as a link.
	 * @param array $tag Element data, as returned by VtourUtils::getAllTags
	 * @param VtourParser $vtourParser VtourParser that is directing the parsing operation
	 * @return VtourLink|null Created link, or null if no link was created
	 */
	public static function tryCreateLink( $tag, $vtourParser ) {
		switch ( $tag['name'] ) {
			case 'pointlink':
				return new VtourPointLink( $tag['content'],
					$tag['attributes'], $vtourParser );
			case 'arealink':
				return new VtourAreaLink( $tag['content'],
					$tag['attributes'], $vtourParser );
			default:
				return null;
		}
	}

	protected function getGenericTypeMessage() {
		return wfMessage( 'vtour-elementtype-link' );
	}

	/**
	 * Resolve the reference contained in this link.
	 */
	public function resolveReferences() {
		$destination =& $this->result['destination'];
		$destination = $this->getPlaceIndex( $destination );
		if ( $destination === null ) {
			// Empty reference
			$placeType = wfMessage( 'vtour-elementtype-place' )
				->inContentLanguage()->text();
			$this->throwRefNotFound( $placeType, $destination );
		}
	}
}

/**
 * PointLink element in a Vtour tour.
 */
class VtourPointLink extends VtourLink {

	public function __construct( $content, array $args, VtourParser $vtourParser ) {
		$this->attributesTemplate += array(
			'location' => array( 'parseCoordinatePair', true )
		);
		parent::__construct( $content, $args, $vtourParser );
		$this->result['type'] = 'point';
	}
}

/**
 * AreaLink element in a Vtour tour.
 */
class VtourAreaLink extends VtourLink {

	public function __construct( $content, array $args, VtourParser $vtourParser ) {
		$this->attributesTemplate += array(
			'location' => array( 'parsePolygonCoordinates', true )
		);
		parent::__construct( $content, $args, $vtourParser );
		$this->result['type'] = 'area';
	}
}

