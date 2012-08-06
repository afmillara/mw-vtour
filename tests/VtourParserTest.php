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
		$this->assertEquals( 1, $vtourParser->getTourData()['start'],
			'When resolving name/id references, ids are checked first' );
	}

	public function testNeighbourSymmetry() {
		$vtourParser = $this->parseVtour(
			'<imageplace name="place" image="image.jpg"/>'
			. '<map name=a1 image=b up=a2/>'
			. '<map name=a2 image=b/>', array() );
		$vtourParser->parse();
		$this->assertEquals( 0, $vtourParser->getTourData()['maps'][1]['down'],
			'When a map doesn\'t specify neighbours, neighbours are set automatically'
			. ' for it based on references to it from other maps' );
	}

	public function testNeighbourAsymmetry() {
		$vtourParser = $this->parseVtour(
			'<imageplace name="place" image="image.jpg"/>'
			. '<map name=a1 image=b up=a2/>'
			. '<map name=a2 image=b down=""/>', array() );
		$vtourParser->parse();
		$this->assertEquals( null, $vtourParser->getTourData()['maps'][1]['down'],
			'When a map specifies a neighbour, even if it\'s null, it is not'
			. 'overwritten' );
	}

	/**
	 * @expectedException VtourParseException
	 */
	public function testUnexpectedContent() {
		$vtourParser = $this->parseVtour(
			'<imageplace name="place" image="image.jpg"/>'
			. 'This doesn\'t go here.', array() );
		$vtourParser->parse();
	}

	/**
	 * @expectedException VtourParseException
	 */
	public function testStartNotContained() {
		$vtourParser = $this->parseVtour(
			'<map name="Map 1" start="Image" image="image.jpg"/>'
			. '<map name="Map 2" image="image.png"/>'
			. '<imageplace name="Image" map="Mapa 2" image="imagen.gif"/>',
			array() );
		$vtourParser->parse();
	}

	public function testStartContained() {
		$vtourParser = $this->parseVtour(
			'<map name="Map 1" image="image.jpg"/>'
			. '<map name="Map 2" start="Image 2" image="image.png"/>'
			. '<imageplace name="Image 1" map="Map 2" image="image.gif"/>'
			. '<imageplace name="Image 2" map="Map 2" image="image.gif"/>',
			array() );
		$vtourParser->parse();
		$this->assertEquals( 1, $vtourParser->getTourData()['maps'][1]['start'],
			'The place specified in the start attribute is used as the start' );
	}

	public function testNoStart() {
		$vtourParser = $this->parseVtour(
			'<map name="Map 1" image="image.jpg"/>'
			. '<map name="Map 2" image="image.png"/>'
			. '<imageplace name="Image 1" map="Map 2" image="image.gif"/>'
			. '<imageplace name="Image 2" map="Map 2" image="image.gif"/>',
			array() );
		$vtourParser->parse();
		$this->assertEquals( 0, $vtourParser->getTourData()['maps'][1]['start'],
			'When no start attribute exists, the first place in the map is used' );
	}

	/**
	 * @expectedException VtourParseException
	 */
	public function testNoMandatoryProperty() {
		$vtourParser = $this->parseVtour(
			'<textplace name="aaa"/>', array() );
		$vtourParser->parse();
	}

	public function testMandatoryPropertyAttribute() {
		$vtourParser = $this->parseVtour(
			'<textplace name="aaa" text="aaa"/>', array() );
		$vtourParser->parse();
		$this->assertTrue( true,
			'No mandatory property exception occurs when a text attribute is present' );
	}

	public function testMandatoryPropertyElement() {
		$vtourParser = $this->parseVtour(
			'<textplace name="aaa"><text>aaa</text></textplace>', array() );
		$vtourParser->parse();
		$this->assertTrue( true,
			'No mandatory property exception occurs when a text element is present' );
	}

	public function testMandatoryPropertyBoth() {
		$vtourParser = $this->parseVtour(
			'<textplace name="aaa" text="aaa"><text>bbb</text></textplace>', array() );
		$vtourParser->parse();
		$this->assertTrue( true,
			'No mandatory property exception occurs when both a text element'
			. ' and a text attribute are present' );
	}

	/**
	 * @expectedException VtourParseException
	 */
	public function testInvalidAttribute() {
		$vtourParser = $this->parseVtour(
			'<imageplace name="Img" image="image.jpg" zoom="Inv!á!lido"/>',
			array() );
		$vtourParser->parse();
	}

	/**
	 * @expectedException VtourParseException
	 */
	public function testInvalidAttributeInLink() {
		$vtourParser = $this->parseVtour(
			'<imageplace name="Img" image="image.jpg">'
			. ' <pointlink location="!!!!!" destination="Img"/>'
			. ' </imageplace>',
			array() );
		$vtourParser->parse();
	}

	public function testInvalidAttributeNonStrict() {
		$vtourParser = $this->parseVtour(
			'<imageplace name="Img" image="image.jpg" zoom="Inv!á!lido"/>',
			array(), false );
		$vtourParser->parse();
		$this->assertTrue( true,
			'No exception occurs for invalid optional attributes when nonstrict' );
	}

	/**
	 * @expectedException VtourParseException
	 */
	public function testInvalidMandatoryAttributeNonStrict() {
		$vtourParser = $this->parseVtour(
			'<imageplace image="><>|||||"/>',
			array(), false );
		$vtourParser->parse();
	}

	/**
	 * @expectedException VtourParseException
	 */
	public function testDependencyError() {
		$vtourParser = $this->parseVtour(
			'<imageplace name="Img" image="image.jpg" location="123 456"/>',
			array() );
		$vtourParser->parse();
	}

	public function testDependencyNonStrict() {
		$vtourParser = $this->parseVtour(
			'<imageplace name="Img" image="image.jpg" location="123 456"/>',
			array(), false );
		$vtourParser->parse();
		$this->assertTrue( true,
			'No exception occurs for dependency errors when nonstrict' );
	}

	/**
	 * @expectedException VtourParseException
	 */
	public function testUnexpectedAttribute() {
		$vtourParser = $this->parseVtour(
			'<imageplace name="Img" image="image.jpg" attribute="unexpected"/>',
			array() );
		$vtourParser->parse();
	}

	/**
	 * @expectedException VtourParseException
	 */
	public function testUnexpectedElement() {
		$vtourParser = $this->parseVtour(
			'<imageplace name="Img" image="image.jpg">'
				. '<unexpected/>'
			. '</imageplace>', array() );
		$vtourParser->parse();
	}

	public function testUnexpectedAttributeNonStrict() {
		$vtourParser = $this->parseVtour(
			'<imageplace name="Img" image="image.jpg" attribute="unexpected"/>',
			array(), false );
		$vtourParser->parse();
		$this->assertTrue( true,
			'No exception occurs for unexpected attributes when nonstrict' );
	}

	public function testUnexpectedElementNonStrict() {
		$vtourParser = $this->parseVtour(
			'<imageplace name="Img" image="image.jpg">'
				. '<unexpected/>'
			. '</imageplace>', array(), false );
		$vtourParser->parse();
		$this->assertTrue( true,
			'No exception occurs for unexpected elements when nonstrict' );
	}

	/**
	 * @expectedException VtourParseException
	 */
	public function testIdMismatch() {
		$vtourParser = $this->parseVtour(
			'<map name="Map 1" image="image.jpg">'
				. '<imageplace name="Img" image="image.png"'
				. ' map="Map 2"/>'
			. '</map>'
			. '<map name="Map 2" image="image.gif">', array() );
		$vtourParser->parse();
	}

	public function testNoIdMismatch() {
		$vtourParser = $this->parseVtour(
			'<map name="Map 1" image="image.jpg">'
				. '<imageplace name="Img" image="image.png"'
				. ' map="Map 1"/>'
			. '</map>'
			. '<map name="Map 2" image="image.gif"/>', array() );
		$vtourParser->parse();
		$this->assertEquals( 0, $vtourParser->getTourData()['places'][0]['map'] );
	}

	/**
	 * @expectedException VtourParseException
	 */
	public function testDuplicate() {
		$vtourParser = $this->parseVtour(
			'<imageplace name="Img 1" id="Place" image="image.png"/>'
				. '<textplace name="Txt 1" id="Place" text="Lorem ipsum"/>',
			array() );
		$vtourParser->parse();
	}

	/**
	 * @expectedException VtourParseException
	 */
	public function testBrokenReference() {
		$vtourParser = $this->parseVtour(
			'<imageplace name="Image" image="image.jpg"'
				. ' map="broken"/>', array() );
		$vtourParser->parse();
	}

	/**
	 * @expectedException VtourParseException
	 */
	public function testEmptyTour() {
		$vtourParser = $this->parseVtour(
			'', array() );
		$vtourParser->parse();
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

