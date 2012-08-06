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
	 * Test correct Vtour markup.
	 */
	public function testCorrect() {
		$vtourParser = $this->parseVtour(
			'<map name="Prueba" image="fakeImage"/>
			<panoplace name="aaa" image="fakeImage"/>
			<imageplace name="bbb" id="aaa" image="fakeImage"/>',
			array( 'start' => 'aaa', 'id' => 'id' ) );
		$this->assertEquals( 1, $vtourParser->getTourData()['start'],
			'When resolving name/id references, ids are checked first' );

		$vtourParser = $this->parseVtour(
			'<imageplace name="place" image="image.jpg"/>'
			. '<map name=a1 image=b up=a2/>'
			. '<map name=a2 image=b/>', array() );
		$this->assertEquals( 0, $vtourParser->getTourData()['maps'][1]['down'],
			'When a map doesn\'t specify neighbours, neighbours are set automatically'
			. ' for it based on references to it from other maps' );

		$vtourParser = $this->parseVtour(
			'<imageplace name="place" image="image.jpg"/>'
			. '<map name=a1 image=b up=a2/>'
			. '<map name=a2 image=b down=""/>', array() );
		$this->assertEquals( null, $vtourParser->getTourData()['maps'][1]['down'],
			'When a map specifies a neighbour, even if it\'s null, it is not'
			. 'overwritten' );

		$vtourParser = $this->parseVtour(
			'<map name="Map 1" image="image.jpg"/>'
			. '<map name="Map 2" start="Image 2" image="image.png"/>'
			. '<imageplace name="Image 1" map="Map 2" image="image.gif"/>'
			. '<imageplace name="Image 2" map="Map 2" image="image.gif"/>',
			array() );
		$this->assertEquals( 1, $vtourParser->getTourData()['maps'][1]['start'],
			'The place specified in the start attribute is used as the start' );

		$vtourParser = $this->parseVtour(
			'<map name="Map 1" image="image.jpg"/>'
			. '<map name="Map 2" image="image.png"/>'
			. '<imageplace name="Image 1" map="Map 2" image="image.gif"/>'
			. '<imageplace name="Image 2" map="Map 2" image="image.gif"/>',
			array() );
		$this->assertEquals( 0, $vtourParser->getTourData()['maps'][1]['start'],
			'When no start attribute exists, the first place in the map is used' );

		$this->parseVtour(
			'<textplace name="aaa" text="aaa"/>', array() );
		$this->assertTrue( true,
			'No mandatory property exception occurs when a text attribute is present' );
		
		$this->parseVtour(
			'<textplace name="aaa"><text>aaa</text></textplace>', array() );
		$this->assertTrue( true,
			'No mandatory property exception occurs when a text element is present' );

		$this->parseVtour(
			'<textplace name="aaa" text="aaa"><text>bbb</text></textplace>', array() );
		$this->assertTrue( true,
			'No mandatory property exception occurs when both a text element'
			. ' and a text attribute are present' );

		$this->parseVtour(
			'<imageplace name="Img" image="image.jpg" zoom="wrong"/>',
			array(), false );
		$this->assertTrue( true,
			'No exception occurs for invalid optional attributes when nonstrict' );

		$this->parseVtour(
			'<imageplace name="Img" image="image.jpg" location="123 456"/>',
			array(), false );
		$this->assertTrue( true,
			'No exception occurs for dependency errors when nonstrict' );

		$this->parseVtour(
			'<imageplace name="Img" image="image.jpg" attribute="unexpected"/>',
			array(), false );
		$this->assertTrue( true,
			'No exception occurs for unexpected attributes when nonstrict' );

		$this->parseVtour(
			'<imageplace name="Img" image="image.jpg">'
			. '<unexpected/>'
			. '</imageplace>', array(), false );
		$this->assertTrue( true,
			'No exception occurs for unexpected elements when nonstrict' );

		$vtourParser = $this->parseVtour(
			'<map name="Map 1" image="image.jpg">'
			. '<imageplace name="Img" image="image.png"'
			. ' map="Map 1"/>'
			. '</map>'
			. '<map name="Map 2" image="image.gif"/>', array() );
		$this->assertEquals( 0, $vtourParser->getTourData()['places'][0]['map'],
			'Places can explicitly reference the map that contains them' );
	}

	/**
	 * Test incorrect Vtour markup.
	 */
	public function testIncorrect() {
		$this->assertEquals( 'vtour-errordesc-badcontent',
			$this->parseVtourExpectError(
				'<imageplace name="place" image="image.jpg"/>'
				. 'This doesn\'t go here.', array() ),
			'Invalid content in the root element is detected' );

		$this->assertEquals( 'vtour-errordesc-badstart',
			$this->parseVtourExpectError(
				'<map name="Map 1" start="Image" image="image.jpg"/>'
				. '<map name="Map 2" image="image.png"/>'
				. '<imageplace name="Image" map="Map 2" image="imagen.gif"/>',
				array() ),
			'A map cannot start in a place that is not contained in it' );

		$this->assertEquals( 'vtour-errordesc-notset',
			$this->parseVtourExpectError(
				'<textplace/>', array() ),
			'Mandatory attributes are enforced' );

		$this->assertEquals( 'vtour-errordesc-notsetorchild',
			$this->parseVtourExpectError(
				'<textplace name="aaa"/>', array() ),
			'Textplaces must define a text property' );

		$this->assertEquals( 'vtour-errordesc-invalid',
			$this->parseVtourExpectError(
				'<imageplace name="Img" image="image.jpg" zoom="Inv!á!lido"/>',
				array() ),
			'Invalid attributes are considered an error in strict mode' );

		$this->assertEquals( 'vtour-errordesc-invalid',
			$this->parseVtourExpectError(
				'<imageplace name="Img" image="image.jpg">'
				. ' <pointlink location="!!!!!" destination="Img"/>'
				. ' </imageplace>',
				array() ),
			'Invalid attributes in links are detected properly' );

		$this->assertEquals( 'vtour-errordesc-invalid',
			$this->parseVtourExpectError(
				'', array( 'id' => '!!!' ) ),
			'Invalid attributes in the root element are detected' );

		$this->assertEquals( 'vtour-errordesc-invalid',
			$this->parseVtourExpectError(
				'<imageplace name="aaa" image="|||"/>',
				array(), false ),
			'Invalid mandatory attributes are considered an error in nonstrict mode too' );

		$this->assertEquals( 'vtour-errordesc-attrdepends',
			$this->parseVtourExpectError(
				'<imageplace name="Img" image="image.jpg" location="123 456"/>',
				array() ),
			'Attribute dependency errors cause exceptions' );

		$this->assertEquals( 'vtour-errordesc-badattr',
			$this->parseVtourExpectError(
				'<imageplace name="Img" image="image.jpg" attribute="unexpected"/>',
				array() ),
			'Unexpected attributes are considered an error in strict mode' );

		$this->assertEquals( 'vtour-errordesc-badtag',
			$this->parseVtourExpectError(
				'<imageplace name="Img" image="image.jpg">'
				. '<unexpected/>'
				. '</imageplace>', array() ),
			'Unexpected tags are considered an error in strict mode' );

		$this->assertEquals( 'vtour-errordesc-idmismatch',
			$this->parseVtourExpectError(
				'<map name="Map 1" image="image.jpg">'
				. '<imageplace name="Img" image="image.png"'
				. ' map="Map 2"/>'
				. '</map>'
				. '<map name="Map 2" image="image.gif"/>', array() ),
			'Places cannot reference a different map than the one that contains them' );

		$this->assertEquals( 'vtour-errordesc-duplicate',
			$this->parseVtourExpectError(
				'<imageplace name="Img 1" id="Place" image="image.png"/>'
				. '<textplace name="Txt 1" id="Place" text="Lorem ipsum"/>',
				array() ),
			'There can\'t be more than one element of the same type with the same id' );

		$this->assertEquals( 'vtour-errordesc-refnotfound',
			$this->parseVtourExpectError(
				'<imageplace name="Image" image="image.jpg"'
				. ' map="broken"/>', array() ),
			'Broken references are detected' );

		$this->assertEquals( 'vtour-errordesc-noplaces',
			$this->parseVtourExpectError(
				'', array() ),
			'An empty tour cannot exist' );
	}

	private function parseVtour( $content, $args, $parseStrict = true ) {
		$parser = $this->getMock( 'Parser' );
		$parser->expects( $this->any() )
			->method( 'getOutput' )
			->will( $this->returnValue( 
				$this->getMock( 'OutputPage', array( 'addImage' ) )
			) );
		$frame = $this->getMock( 'PPFrame' );
		$vtourParser = new VtourParser( $content, $args,
			$parser, $frame, $parseStrict );
		$vtourParser->parse();
		return $vtourParser;
	}

	private function parseVtourExpectError( $content, $args, $parseStrict = true ) {
		try {
			$this->parseVtour( $content, $args, $parseStrict );
		} catch ( VtourParseException $e ) {
			return $e->getErrorKey();
		}
		return null;
	}
}

