<?php
/**
 * Vtour unit tests.
 *
 * @file
 * @ingroup Extensions
 */

/**
 * Static class for Vtour unit tests.
 *
 */
class VtourTest extends MediaWikiTestCase {

	/**
	 * Text link parsing tests.
	 */
	public function testVtourTextLink() {
		$this->assertEquals( Vtour::parseTextLinkParams( '' ),
				array( 'article' => null, 'tour' => null, 'place' => null ),
				'All link parts are null for empty links' );
		$this->assertEquals( Vtour::parseTextLinkParams( '/:' ),
				array( 'article' => null, 'tour' => null, 'place' => null ),
				'All link parts are null if they were left empty' );
		$this->assertEquals( Vtour::parseTextLinkParams( 'Article/' ),
				array( 'article' => 'Article', 'tour' => null, 'place' => null ),
				'The article name is extracted when the tour and place identifiers are left empty' );
		$this->assertEquals( Vtour::parseTextLinkParams( 'Tour' ),
				array( 'article' => null, 'tour' => 'Tour', 'place' => null ),
				'The tour name is extracted when the article and place identifiers are left empty' );
		$this->assertEquals( Vtour::parseTextLinkParams( ':Place' ),
				array( 'article' => null, 'tour' => null, 'place' => 'Place' ),
				'The place id is extracted when the article and tour identifiers are left empty' );
		$this->assertEquals( Vtour::parseTextLinkParams( 'Article/Tour' ),
				array( 'article' => 'Article', 'tour' => 'Tour', 'place' => null ),
				'The article and tour identifiers are extracted when the place name is left empty' );
		$this->assertEquals( Vtour::parseTextLinkParams( 'Tour:Place' ),
				array( 'article' => null, 'tour' => 'Tour', 'place' => 'Place' ),
				'The tour and place identifiers are extracted when the article name is left empty' );
		$this->assertEquals( Vtour::parseTextLinkParams( 'A:B/C/Tour:Pla::ce' ),
				array( 'article' => 'A:B/C', 'tour' => 'Tour', 'place' => 'Pla::ce' ),
				'Only the last "/" and the first ":" are separators' );
	}
}
