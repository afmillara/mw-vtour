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
		$this->assertEquals( array(), VtourUtils::getAllTags( '' ),
			'Empty string => empty tag array' );
		$this->assertEquals( array(), VtourUtils::getAllTags( '<!-- Comment -->' ),
			'Comments are ignored' );
		$this->assertEquals(
			array( array(
				'name' => 'aaa',
				'attributes' => array( 'a' => '1&', 'b' => '2', 'c' => '3' ),
				'content' => '&amp;Content'
			) ),
			VtourUtils::getAllTags( '<aaa a="1&amp;" b=2 c=\' 3 \'> &amp;Content</aaa>' ),
			'Complete elements are parsed correctly'
		);
		$this->assertEquals(
			array( array(
				'name' => 'aaa',
				'attributes' => array( 'e' => '>' ),
				'content' => ''
			) ),
			VtourUtils::getAllTags( '<aaa e="&gt;"/>' ),
			'Combined open and close tags count as elements'
		);
		$this->assertEquals(
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
			VtourUtils::getAllTags( '<a/><!-- Comment <faketag/> --><b/>' ),
			'Comments between elements are ignored, and so are elements inside comments'
		);
		$this->assertEquals( null, VtourUtils::getAllTags( 'b<a/>', true ),
			'With parseStrict enabled, garbage is not allowed in the input text' );
		$this->assertEquals(
			array( array(
				'name' => 'a',
				'attributes' => array(),
				'content' => ''
			) ),
			VtourUtils::getAllTags( 'b<a/>', false ),
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

		$this->assertEquals( $params, VtourUtils::parseTextLinkParams( '' ),
			'All link parts are null for empty links' );
		$this->assertEquals( $params, VtourUtils::parseTextLinkParams( '/:' ),
			'All link parts are null if they were left empty' );
		
		$params['article'] = 'Article';
		$this->assertEquals( $params, VtourUtils::parseTextLinkParams( 'Article/' ),
			'The article name is extracted when the tour and place identifiers are left empty' );

		$params['article'] = null;
		$params['tour'] = 'Tour';
		$this->assertEquals( $params, VtourUtils::parseTextLinkParams( 'Tour:' ),
			'The tour name is extracted when the article and place identifiers are left empty' );
	
			
		$params['ambiguous'] = true;
		$this->assertEquals( $params, VtourUtils::parseTextLinkParams( 'Tour' ),
			'The link is "ambiguous" if the place was is not set at all' );
	
		$params['article'] = null;
		$params['tour'] = null;
		$params['place'] = 'Place';
		$params['ambiguous'] = null;
		$this->assertEquals( $params, VtourUtils::parseTextLinkParams( ':Place' ),
			'The place id is extracted when the article and tour identifiers are left empty' );
		
		$params['tour'] = 'Tour';
		$this->assertEquals(
			$params, VtourUtils::parseTextLinkParams( 'Tour:Place' ),
			'The tour and place identifiers are extracted when the article name is left empty'
		);

		$params['article'] = 'A:B/C';
		$params['place'] = 'Pla::ce';
		$this->assertEquals(
			$params, VtourUtils::parseTextLinkParams( 'A:B/C/Tour:Pla::ce' ),
			'Only the last "/" and the first ":" are separators'
		);

		$this->assertEquals(
			$params, VtourUtils::parseTextLinkParams( 'A:B/C/Tour:Pla::ce?aaa:314!' ),
			'Garbage values for zoom and center are ignored'
		);

		$params['zoom'] = 314;
		$params['center'] = array( 1337, 616 );
		$this->assertEquals(
			$params, VtourUtils::parseTextLinkParams( 'A:B/C/Tour:Pla::ce?1337 616:314' ),
			'Center and zoom are parsed correctly' );
	}

	/**
	 * Parsing HTML lenghts.
	 */
	public function testParseHTMLLengths() {
		$this->assertEquals(
			'1px', VtourUtils::parseHTMLLength( '1.0' ),
			'Numbers are considered lengths in pixels' );
		$this->assertEquals(
			'1px', VtourUtils::parseHTMLLength( '1.0px' ),
			'The px syntax is supported' );
		$this->assertEquals(
			'1%', VtourUtils::parseHTMLLength( '1.0%' ),
			'Percentages are supported' );
		$this->assertEquals(
			null, VtourUtils::parseHTMLLength( '1a0px' ),
			'Garbage values are invalid' );
		$this->assertEquals(
			null, VtourUtils::parseHTMLLength( '10aaa' ),
			'Other suffixes are invalid' );
		$this->assertEquals(
			'10px', VtourUtils::parseHTMLLength( ' 10  px  ' ),
			'Spaces are ignored' );
	}
}

