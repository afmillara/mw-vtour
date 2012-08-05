<?php
/**
 * Vtour extension - A virtual tour system for MediaWiki.
 *
 * @file
 * @ingroup Extensions
 *
 * @author Álvaro Fernández Millara, <afmillara@gmail.com>
 * @license GNU General Public License 2.0
 * @copyright © 2012 Álvaro Fernández Millara
 * @version 0
 */

if ( !defined( 'MEDIAWIKI' ) ) {
	die( 'This file is a MediaWiki extension. It is not a valid entry point' );
}

// Register the extension.

$wgExtensionCredits['parserhook'][] = array(
	'path' => __FILE__,
	'name' => 'Vtour',
	'descriptionmsg' => 'vtour-description',
	'version' => 0,
	'author' => 'Álvaro Fernández Millara',
	'url' => 'http://www.google.com'
);

// Default configuration.

/**
 * true if the vtour markup parser should throw an exception if unexpected or
 * invalid tags or attributes are found; false if they are to be ignored.
 * @var bool $wgVtourParseStrict
 */
$wgVtourParseStrict = true;

/**
 * true if the content of the message 'vtour-linkalias' should be used as an
 * alias for Special:Vtour/, so [[(content of vtour-linkalias)whatever]]
 * redirects to [[Special:Vtour/whatever]]; false to disable this feature.
 * If enabled, all actions other than 'read' (which will redirect to the
 * special page) on articles whose name starts with the content of
 * 'vtour-linkalias' will be prevented by this extension.
 * @var bool $wgVtourAllowLinkAlias
 */
$wgVtourAllowLinkAlias = true;

/**
 * true if the content of the message 'vtour-decimalseparator' should be considered
 * an alternative decimal separator; false if only dots may be used as separators. 
 * @var bool $wgVtourAllowNonStandardDecimalSeparator
 */
$wgVtourAllowNonStandardDecimalSeparator = true;

/**
 * Whether links to external images are allowed in ImagePlaces and PanoPlaces.
 * @var bool $wgVtourAllowExternalImages
 */
$wgVtourAllowExternalImages = false;

/**
 * true if the order of geographic coordinates, in both Vtour elements and links,
 * is latitude followed by longitude (the International Maritime Organization
 * standard); false if the order is longitude followed by latitude.
 * @var bool $wgVtourStandardLatLngOrder
 */
$wgVtourStandardLatLngOrder = true;

/**
 * Default dimensions of the tour div: first width, then height. The expected
 * format is that of the HTML length datatype (N, Npx or N%). These global
 * dimensions may be overriden by the "width" and "height" attributes in individual
 * tours.
 * @var array $wgVtourDefaultTourDimensions
 */
$wgVtourDefaultTourDimensions = array( '800px', '500px' );

/**
 * Name of the ExternalMap class that will be used, or null to disable external maps.
 * @var string $wgVtourExternalMap
 */
$wgVtourExternalMap = 'Google';

$wgVtourGoogleExternalMapAPIUrl = 'http://maps.google.com/maps/api/js?sensor=false';
$wgVtourGoogleExternalMapTimeout = 10000;

// Setup.

$wgVtourDir = dirname( __FILE__ ) . '/';

$wgExtensionMessagesFiles['Vtour'] = $wgVtourDir . 'Vtour.i18n.php';
$wgExtensionMessagesFiles['VtourAlias'] = $wgVtourDir . 'Vtour.alias.php';

$wgAutoloadClasses['VtourUtils'] = $wgVtourDir . 'VtourUtils.php';
$wgAutoloadClasses['VtourHooks'] = $wgVtourDir . 'Vtour.body.php';
$wgAutoloadClasses['SpecialVtour'] = $wgVtourDir . 'SpecialVtour.php';
$wgAutoloadClasses['VtourParser'] = $wgVtourDir . 'VtourParser.php';
$wgAutoloadClasses['VtourElement'] = $wgVtourDir . 'VtourElement.php';
$wgAutoloadClasses['VtourRoot'] = $wgVtourDir . 'VtourRoot.php';
$wgAutoloadClasses['VtourMap'] = $wgVtourDir . 'VtourMap.php';
$wgAutoloadClasses['VtourPlace'] = $wgVtourDir . 'VtourPlace.php';
$wgAutoloadClasses['VtourLink'] = $wgVtourDir . 'VtourLink.php';

$wgResourceModules['ext.vtour'] = array(
	'scripts' => array(
		'ext.vtour.utils.js',
		'ext.vtour.polygon.js',
		'ext.vtour.anglemarker.js',
		'ext.vtour.popup.js',
		'ext.vtour.externalmap.js',
		'ext.vtour.googleexternalmap.js',
		'ext.vtour.graphicview.js',
		'ext.vtour.imageview.js',
		'ext.vtour.mapimageview.js',
		'ext.vtour.panoview.js',
		'ext.vtour.element.js',
		'ext.vtour.map.js',
		'ext.vtour.place.js',
		'ext.vtour.imageplace.js',
		'ext.vtour.panoplace.js',
		'ext.vtour.textplace.js',
		'ext.vtour.descriptiontextplace.js',
		'ext.vtour.link.js',
		'ext.vtour.textlink.js',
		'ext.vtour.pointlink.js',
		'ext.vtour.arealink.js',
		'ext.vtour.maplink.js',
		'ext.vtour.virtualtour.js',
		'ext.vtour.js'
	),
	'styles' => 'ext.vtour.virtualtour.css',
	'messages' => array(
		'vtour-button-zoomin',
		'vtour-button-zoomout',
		'vtour-button-fitimage',
		'vtour-button-realsize',
		'vtour-button-up',
		'vtour-button-down',
		'vtour-loading',
		'vtour-loadingtext',
		'vtour-erroroutside',
		'vtour-errorinside',
		'vtour-warning',
		'vtour-errordesc-filenotfound',
		'vtour-errordesc-canvaserror',
		'vtour-errordesc-noexternalmap',
		'vtour-errordesc-externalmaperror',
		'vtour-thismap'
	),
	'dependencies' => array( 'ext.vtour.lib' ),
	'localBasePath' => $wgVtourDir . 'modules/',
	'remoteExtPath' => 'Vtour/modules'
);

$wgResourceModules['ext.vtour.links'] = array(
	'styles' => 'ext.vtour.links.css',
	'localBasePath' => $wgVtourDir . 'modules/',
	'remoteExtPath' => 'Vtour/modules'
);

$wgResourceModules['ext.vtour.lib'] = array(
	'scripts' => array(
		'ext.vtour.lib.inheritance.js',
		'jquery.mousewheel.js',
		'jquery.rotate.js'
	),
	'localBasePath' => $wgVtourDir . 'modules/lib/',
	'remoteExtPath' => 'Vtour/modules/lib'
);

$wgHooks['ParserFirstCallInit'][] = 'VtourHooks::setupParserHook';
$wgHooks['ParserClearState'][] = 'VtourHooks::addLinkStyle';
$wgHooks['LinkBegin'][] = 'VtourHooks::handleLink';
$wgHooks['getUserPermissionsErrors'][] = 'VtourHooks::disableLinkAliasPages';
$wgHooks['InitializeArticleMaybeRedirect'][] = 'VtourHooks::redirectAliasToSpecial';
$wgHooks['ResourceLoaderGetConfigVars'][] = 'VtourHooks::exportConfigVars';

$wgHooks['UnitTestsList'][] = 'VtourHooks::registerPHPTests';
$wgHooks['ResourceLoaderTestModules'][] = 'VtourHooks::registerJSTests';

$wgSpecialPages['Vtour'] = 'SpecialVtour';

