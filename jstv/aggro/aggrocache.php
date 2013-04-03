<?php

/* Aggro global cache handler */

class AggroCache {

	private static $downloadedItemsLimit = -1;
	private static $sessionDuration = 0;
	private static $persistentCache = false;
	private static $cachePath = "";
	private static $cacheLife = 0;
	private static $userAgent = "";
	private static $_resetted=false;
	private static $_sessionStarted=false;
	private static $salt="";

	/* Get config */
	function getCachePath() { return self::$cachePath; }
	
	/* Set config */
	function setSalt($value) { self::$salt=$value; }
	function setDownloadedItemsLimitPerSession($limit) { self::$downloadedItemsLimit=$limit; }
	function setSessionDuration($duration) { self::$sessionDuration=$duration; }
	function setPersistentCache($persistent) { self::$persistentCache=$persistent; }
	function setCachePath($path) { self::$cachePath=$path; }
	function setCacheLife($time) { self::$cacheLife=$time; }
	function setUserAgent($useragent) { self::$userAgent=$useragent; }

	/* Check if Aggro is allowed to download stuff */
	function canDownload($checkonly=false) {
		if (self::$downloadedItemsLimit == -1) return true; else
		if (self::$downloadedItemsLimit == 0) return false; else {
			if (!self::$_sessionStarted) {
				session_start();
				self::$_sessionStarted=true;
			}
			if (!isset($_SESSION["aggrocache_date"])||(!self::$_resetted&&(time()-$_SESSION["aggrocache_date"]>self::$sessionDuration))) {
				self::$_resetted=true;
				$_SESSION["aggrocache_date"]=time();
				$_SESSION["aggrocache_times"]=self::$downloadedItemsLimit;
			}
			if ($_SESSION["aggrocache_times"]) {
				if (!$checkonly) $_SESSION["aggrocache_times"]--;
				return true;
			} else return false;
		}
	}

	/* Check integrity */
	function checkIntegrity(){
		if (!is_dir(self::$cachePath)) AggroTools::kill("Cache path not found");
		return false;
	}

	/* Get URL id */
	function getUID($resource) {
		return md5(self::$salt.$resource);
	}

	/* Get uid from resource */
	function getFUID($resource,$type) {
		return self::$cachePath.self::getUID($resource).".".$type;
	}

	/* Returns if resource is cached */
	function isCached($resource,$type) {
		if (!self::$cachePath) return false;
		$file=self::getFUID($resource,$type);
		if (is_file($file))
			if (self::$persistentCache||!self::canDownload(true)||(time()-filemtime($file)<self::$cacheLife))
				return true;
			else {
				unlink($file);
				return false;
			}
		else
			return false;
	}

	/* Returns data from cache */
	function get($resource,$type) {
		if (self::isCached($resource,$type))
			return file_get_contents(self::getFUID($resource,$type));
		else
			return null;
	}

	/* Saves data to cache */
	function put($resource,$type,$data) {
		file_put_contents(self::getFUID($resource,$type), $data);
	}

	/* Changes file mdate in order to skip next update requests */
	function prepare($resource,$type) {
		touch(self::getFUID($resource,$type));
	}

	/* Download URL from web and/or cache */
	function download($url) {
		
		$out="";
		if (!is_null($out=self::get($url,"dldata"))) return $out;
		if (!self::canDownload()) return "";

		self::prepare($url,"dldata");

		$opts = array(
		  'http'=>array(
		    'method'=>"GET",
		    'header'=>
		    	"Content-Type: text/xml; charset=utf-8\r\n".
		    	"Accept-language: en\r\n" .
		        "User-Agent: ".self::$userAgent."\r\n"
		  )
		);
		$context = stream_context_create($opts);
		$fp = @fopen($url, 'r', false, $context);
		$out="";
		if($fp) {
			 while (!feof($fp)) { 
			    $out .= fread($fp, 1024);
			}
			fclose($fp);
		}

		self::put($url,"dldata",$out);
		
		return $out;
	}

}
	
?>
