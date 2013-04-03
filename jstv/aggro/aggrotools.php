<?php

include_once("aggroitem.php");

class AggroTools {
	function textLimit($string, $length, $replacer = '...') {
		if(mb_strlen($string) > $length) {
			return (preg_match('/^(.*)\W.*$/u', mb_substr($string, 0, $length+1), $matches) ? $matches[1] : mb_substr($string, 0, $length)) . $replacer;
		}
		return $string;
	}

	function snippet($text,$limit=100) {
		return self::textLimit(trim(preg_replace("/\t|\n/"," ",strip_tags($text))),$limit);
	}

	function clean($string) {
		return preg_replace("/[^a-zA-Z0-9_.]*/", "", $string);
	}

	/* Abort script execution with error */
	function kill($error) {
		print_r(AggroItem::error(400,$error));
		die();
	}

	/* Solve entities in get data if needed */
	function stripQuotes($value) {
		if (get_magic_quotes_gpc()) return stripslashes($value); else return $value;
	}

	/* Gets url protocol */
	function getProtocol($url) {
		return strtolower(substr($url,0,strpos($url,":")));
	}

}

?>