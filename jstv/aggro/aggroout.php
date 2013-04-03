<?php

/* Handles data output, including gzipping */

class AggroOut {

	private static $useGZip=false;
	private static $useGZipThreshold=-1;

	function setGZip($value) { self::$useGZip=$value;}
	function setGZipThreshold($value) { self::$useGZipThreshold=$value;}

	function send($contents,$headers=Array()) {

		$HTTP_ACCEPT_ENCODING = $_SERVER["HTTP_ACCEPT_ENCODING"]; 
		$gzip=false;
	    $size = strlen($contents);
		
		if (self::$useGZip  && ((self::$useGZipThreshold==-1)||($size>=self::$useGZipThreshold))) {
			$gzip=true;
			if( strstr($HTTP_ACCEPT_ENCODING, 'x-gzip') !== false ) $headers["Content-Encoding"] = "x-gzip";
	   		elseif( strstr($HTTP_ACCEPT_ENCODING,'gzip') !== false ) $headers["Content-Encoding"] = "gzip";
	   		else $gzip=false;
	   	}

   		foreach ($headers as $key => $value)
    		header($key.": ".$value);

    	if( $gzip ) print(gzencode($contents,9));
	    else print($contents);

	}

}

?>