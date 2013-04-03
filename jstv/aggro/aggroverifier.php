<?php

/* Aggro global cache handler */

class AggroVerifier {

	private static $checkReferrer=false;

	function setCheckReferrer($switch) { self::$checkReferrer=$switch; }

	/* Check integrity */
	function checkIntegrity(){
		if(self::$checkReferrer&&(!isset($_SERVER["HTTP_REFERER"])||!(preg_match("/".str_replace("www.", "",$_SERVER["HTTP_HOST"])."/i", str_replace("www.", "", strtolower($_SERVER["HTTP_REFERER"])))))) {
			exit();
		}
	}

}
	
?>
