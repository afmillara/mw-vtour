<?php
/**
 * Unit tests for Vtour utility functions.
 *
 * @file
 * @ingroup Extensions
 */

/**
 * Static class for Vtour utils unit tests.
 */
class VtourUtilsTest extends MediaWikiTestCase {

	/**
	 * Parsing tags.
	 */
	public function testGetAllTags() {
		$this->assertEquals( VtourUtils::getAllTags( '' ), array(),
			'Empty string => empty tag array' );
		$this->assertEquals( VtourUtils::getAllTags( '<!-- Comment -->' ), array(),
			'Comments are ignored' );
		$this->assertEquals(
			VtourUtils::getAllTags( '<aaa a="1&amp;" b=2 c=\' 3 \'> &amp;Content</aaa>' ),
			array( array(
				'name' => 'aaa',
				'attributes' => array( 'a' => '1&', 'b' => '2', 'c' => '3' ),
				'content' => '&Content'
			) ),
			'Complete elements are parsed correctly'
		);
		$this->assertEquals(
			VtourUtils::getAllTags( '<aaa e="&gt;"/>' ),
			array( array(
				'name' => 'aaa',
				'attributes' => array( 'e' => '>' ),
				'content' => ''
			) ),
			'Combined open and close tags count as elements'
		);
		$this->assertEquals(
			VtourUtils::getAllTags( '<a/><!-- Comment <faketag/> --><b/>' ),
			array(
				array(
					'name' => 'a',
					'attributes' => array(),
					'content' => ''
				),
				array(
					'name' => 'b',
					'attributes' => array(),
					'content' => ''
				)
			),
			'Comments between elements are ignored, and so are elements inside comments'
		);
		$this->assertEquals( VtourUtils::getAllTags( 'b<a/>', true ), null,
			'With parseStrict enabled, garbage is not allowed in the input text' );
		$this->assertEquals( VtourUtils::getAllTags( 'b<a/>', false ),
			array( array(
				'name' => 'a',
				'attributes' => array(),
				'content' => ''
			) ),
			'With parseStrict disabled, garbage in the input text is ignored'
		);
	}

	/**
	 * Parsing text links.
	 */
	public function testVtourTextLink() {
		$params = array(
			'article' => null,
			'tour' => null,
			'place' => null,
			'zoom' => null,
			'center' => null,
			'ambiguous' => null
		);

		$this->assertEquals( VtourUtils::parseTextLinkParams( '' ), $params,
			'All link parts are null for empty links' );
		$this->assertEquals( VtourUtils::parseTextLinkParams( '/:' ), $params,
			'All link parts are null if they were left empty' );
		
		$params['article'] = 'Article';
		$this->assertEquals( VtourUtils::parseTextLinkParams( 'Article/' ), $params,
			'The article name is extracted when the tour and place identifiers are left empty' );

		$params['article'] = null;
		$params['tour'] = 'Tour';
		$this->assertEquals( VtourUtils::parseTextLinkParams( 'Tour:' ), $params,
			'The tour name is extracted when the article and place identifiers are left empty' );
	
			
		$params['ambiguous'] = true;
		$this->assertEquals( VtourUtils::parseTextLinkParams( 'Tour' ), $params,
			'The link is "ambiguous" if the place was is not set at all' );
	
		$params['article'] = null;
		$params['tour'] = null;
		$params['place'] = 'Place';
		$params['ambiguous'] = null;
		$this->assertEquals( VtourUtils::parseTextLinkParams( ':Place' ), $params,
			'The place id is extracted when the article and tour identifiers are left empty' );
		
		$params['tour'] = 'Tour';
		$this->assertEquals(
			VtourUtils::parseTextLinkParams( 'Tour:Place' ), $params,
			'The tour and place identifiers are extracted when the article name is left empty'
		);

		$params['article'] = 'A:B/C';
		$params['place'] = 'Pla::ce';
		$this->assertEquals(
			VtourUtils::parseTextLinkParams( 'A:B/C/Tour:Pla::ce' ), $params,
			'Only the last "/" and the first ":" are separators'
		);

		$this->assertEquals(
			VtourUtils::parseTextLinkParams( 'A:B/C/Tour:Pla::ce?aaa:314!' ), $params,
			'Garbage values for zoom and center are ignored'
		);

		$params['zoom'] = 314;
		$params['center'] = array( 1337, 616 );
		$this->assertEquals(
			VtourUtils::parseTextLinkParams( 'A:B/C/Tour:Pla::ce?1337 616:314' ), $params,
			'Center and zoom are parsed correctly' );
	}
}

