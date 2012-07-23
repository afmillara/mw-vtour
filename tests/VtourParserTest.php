<?php
/**
 * Unit tests for the Vtour parser.
 *
 * @file
 * @ingroup Extensions
 */

/**
 * Static class for Vtour parser unit tests.
 */
class VtourParserTest extends MediaWikiTestCase {

	/**
	 * Parsing correct Vtours.
	 */
	public function testCorrect() {
		$vtourParser = $this->parseVtour(
			'<map name="Prueba" image="fakeImage"/>
			<panoplace name="aaa" image="fakeImage"/>
			<imageplace name="bbb" id="aaa" image="fakeImage"/>',
			array( 'start' => 'aaa', 'id' => 'id' ) );
		$vtourParser->parse();
		$this->assertEquals( $vtourParser->getTourData()['start'], 1,
			'When resolving name/id references, ids are checked first' );
	}

	private function parseVtour( $content, $args, $parseStrict = true ) {
		$parser = $this->getMock( 'Parser' );
		$parser->expects( $this->any() )
			->method( 'getOutput' )
			->will( $this->returnValue( 
				$this->getMock( 'OutputPage', array( 'addImage' ) )
			) );
		$frame = $this->getMock( 'PPFrame' );
		return new VtourParser( $content, $args,
			$parser, $frame, $parseStrict );
	}
}

