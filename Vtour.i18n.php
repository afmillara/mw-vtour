<?php
/**
 * Internationalisation for Vtour.
 *
 * @file
 * @ingroup Extensions
 */

$messages = array();

/**
 * English.
 * @author Álvaro Fernández Millara
 */
$messages['en'] = array(
	'vtour' => 'Vtour',

	'vtour-description' => 'A virtual tour system for MediaWiki.',

	'vtour-thismap' => 'Vtour map',

	'vtour-decimalseparator' => '.',
	'vtour-linkalias' => '@@',

	'vtour-reservedpage' => 'This page is reserved for Vtour links.',

	'vtour-link-description' => 'This is the Vtour Special Page.', //TODO: Better message.
	'vtour-link-badformat' => 'Bad format.',

	'vtour-elementtype-root' => 'root',
	'vtour-elementtype-link' => 'link',
	'vtour-elementtype-place' => 'place',
	'vtour-elementtype-map' => 'map',

	'vtour-typename' => '$1 "$2"',
	'vtour-typenameid' => '$1 "$2" with id "$3"',
	'vtour-typenamefromchild' => '$1, element #$2 inside $3',

	'vtour-attributetype-id' => 'a sequence of letters and/or numbers',
	'vtour-attributetype-name' => 'a sequence of letters, numbers and/or other symbols',
	'vtour-attributetype-imagetitle' => 'the title of an image file available at this wiki',
	'vtour-attributetype-bool' => 'either true or false',
	'vtour-attributetype-number' => 'a number',
	'vtour-attributetype-natural' => 'a positive integer',
	'vtour-attributetype-length' => 'a positive number of pixels or a percentage',
	'vtour-attributetype-coordinatepair' => 'a pair of integers',
	'vtour-attributetype-twocoordinatepairs' => 'two pairs of integers',
	'vtour-attributetype-polygoncoordinates' => 'a list of pairs of integers',

	'vtour-erroroutside' => '<strong class="error">$1</strong>',
	'vtour-errorinside' => '<div class="vtour-error"><div class="vtour-errorimage"/>$1</div>',

	'vtour-parseerror' => 'Vtour parse error in $1: $2',
	'vtour-parseerror-idandelement' => '"$1" ($2)',
	'vtour-parseerror-idnoelement' => '"$1"',
	'vtour-parseerror-noid' => 'an unnamed tour',

	'vtour-warning' => 'Vtour warning: $1',

	'vtour-errordesc-badcontent' => 'The text "$1" was not expected in the content of the element.',
	'vtour-errordesc-badstart' => 'The starting place for the map, "$1", is not contained in it.',
	'vtour-errordesc-notset' => 'Mandatory attribute "$1" was not defined.',
	'vtour-errordesc-notsetorchild' => 'No attributes or child elements contained the mandatory property "$1".',
	'vtour-errordesc-invalid' => '"$2" is not a valid value for the attribute "$1" (expected: $3).',
	'vtour-errordesc-attrdepends' => 'The attribute "$1" cannot be used without the attribute "$2".',
	'vtour-errordesc-badattrs' => 'Unexpected attribute "$1" with value "$2".',
	'vtour-errordesc-badtag' => 'Unexpected element "$1".',
	'vtour-errordesc-unneededid' => 'A map is referenced explicitly despite the place being implicitly contained in "$1".',
	'vtour-errordesc-duplicate' => '{{ucfirst:$1}} identifier "$2" is used more than once.',
	'vtour-errordesc-refnotfound' => 'Referenced $1 "$2" was not found.',
	'vtour-errordesc-filenotfound' => 'File $1 couldn\'t be loaded.'
);

