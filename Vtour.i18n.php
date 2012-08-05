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
	'vtour-attributetype-imagetitle' => 'the title of an available image file',
	'vtour-attributetype-bool' => 'either true or false',
	'vtour-attributetype-number' => 'a number',
	'vtour-attributetype-natural' => 'a positive integer',
	'vtour-attributetype-length' => 'a positive number of pixels or a percentage',
	'vtour-attributetype-coordinatepair' => 'a pair of integers',
	'vtour-attributetype-twocoordinatepairs' => 'two pairs of integers',
	'vtour-attributetype-polygoncoordinates' => 'a list of pairs of integers',

	'vtour-loading' => '<div class="vtour-loading"><div class="vtour-loadingimage"/>$1</div>',
	'vtour-loadingtext' => 'Loading...',

	'vtour-erroroutside' => '<div><strong class="error">$1</strong></div>',
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
	'vtour-errordesc-idmismatch' => 'The place cannot belong to both the map "$1" and the map "$2", referenced here.',
	'vtour-errordesc-duplicate' => '{{ucfirst:$1}} identifier "$2" is used more than once.',
	'vtour-errordesc-refnotfound' => 'Referenced $1 "$2" was not found.',
	'vtour-errordesc-noplaces' => 'The virtual tour doesn\'t contain any places.',
	'vtour-errordesc-filenotfound' => 'File $1 couldn\'t be loaded.',
	'vtour-errordesc-canvaserror' => 'An error occurred when trying to read data from the image $1.',
	'vtour-errordesc-noexternalmap' => 'There are no external map systems available.',
	'vtour-errordesc-externalmaperror' => 'The external map failed to load.'
);

/**
 * Spanish.
 * @author Álvaro Fernández Millara
 */
$messages['es'] = array(
	'vtour' => 'Vtour',

	'vtour-description' => 'Un sistema de visitas virtuales para MediaWiki.',

	'vtour-thismap' => 'Mapa de Vtour',

	'vtour-decimalseparator' => '.',
	'vtour-linkalias' => '@@',

	'vtour-reservedpage' => 'Esta página está reservada para enlaces de Vtour.',

	'vtour-link-description' => 'Esta es la página especial de Vtour.', //TODO: Better message.
	'vtour-link-badformat' => 'Formato inválido.',

	'vtour-elementtype-root' => 'raíz',
	'vtour-elementtype-link' => 'enlace',
	'vtour-elementtype-place' => 'lugar',
	'vtour-elementtype-map' => 'mapa',

	'vtour-typename' => '$1 "$2"',
	'vtour-typenameid' => '$1 "$2" con el id "$3"',
	'vtour-typenamefromchild' => '$1, elemento número $2 dentro de $3',

	'vtour-attributetype-id' => 'una secuencia de letras o números',
	'vtour-attributetype-name' => 'una secuencia de letras, números u otros símbolos',
	'vtour-attributetype-imagetitle' => 'el nombre de un fichero de imagen',
	'vtour-attributetype-bool' => 'o "true" o "false"',
	'vtour-attributetype-number' => 'un número',
	'vtour-attributetype-natural' => 'un entero positivo',
	'vtour-attributetype-length' => 'un número de píxeles o un porcentaje',
	'vtour-attributetype-coordinatepair' => 'un par de números enteros',
	'vtour-attributetype-twocoordinatepairs' => 'dos pares de números enteros',
	'vtour-attributetype-polygoncoordinates' => 'una lista de pares de enteros',

	'vtour-loading' => '<div class="vtour-loading"><div class="vtour-loadingimage"/>$1</div>',
	'vtour-loadingtext' => 'Cargando...',

	'vtour-erroroutside' => '<div><strong class="error">$1</strong></div>',
	'vtour-errorinside' => '<div class="vtour-error"><div class="vtour-errorimage"/>$1</div>',

	'vtour-parseerror' => 'Error de Vtour en $1: $2',
	'vtour-parseerror-idandelement' => '"$1" ($2)',
	'vtour-parseerror-idnoelement' => '"$1"',
	'vtour-parseerror-noid' => 'una visita virtual sin nombre',

	'vtour-warning' => 'Advertencia de Vtour: $1',

	'vtour-errordesc-badcontent' => 'El texto "$1" no se esperaba en el contenido del elemento.',
	'vtour-errordesc-badstart' => 'El lugar de inicio del mapa, "$1", no está contenido en él.',
	'vtour-errordesc-notset' => 'El atributo obligatorio "$1" no está definido.',
	'vtour-errordesc-notsetorchild' => 'Ningún atributo o elemento hijo contiene la propiedad obligatoria "$1".',
	'vtour-errordesc-invalid' => '"$2" no es un valor válido para el atributo "$1" (se esperaba: $3).',
	'vtour-errordesc-attrdepends' => 'El atributo "$1" no puede usarse sin el atributo "$2".',
	'vtour-errordesc-badattrs' => 'Atributo inesperado "$1" con valor "$2".',
	'vtour-errordesc-badtag' => 'Elemento inesperado "$1".',
	'vtour-errordesc-idmismatch' => 'El lugar no puede pertenecer al mismo tiempo al mapa "$1" y al mapa "$2", referenciado aquí.',
	'vtour-errordesc-duplicate' => 'El identificador de {{ucfirst:$1}} "$2" se usa más de una vez.',
	'vtour-errordesc-refnotfound' => 'El $1 "$2", al que se hace referencia, no se ha encontrado.',
	'vtour-errordesc-noplaces' => 'La visita virtual no contiene ningún lugar.',
	'vtour-errordesc-filenotfound' => 'El fichero $1 no pudo cargarse.',
	'vtour-errordesc-canvaserror' => 'Ocurrió un error al intentar leer datos de la imagen $1.',
	'vtour-errordesc-noexternalmap' => 'No hay ningún sistema de mapas externos disponible.',
	'vtour-errordesc-externalmaperror' => 'No pudo cargarse el mapa externo.'
);

