<?php

/* JSTV related functions */

include_once("aggrocache.php");
include_once("aggrorss.php");
include_once("aggrotwitter.php");
include_once("aggrotools.php");
include_once("aggroout.php");

class AggroJSTV {
	private static $sourcesPath=Array();
	private static $metaProtocols=Array();
	private static $verifySources=false;
	private static $protocols=Array();
	private static $maxRequestSize=-1;
	private static $maxBundleSize=-1;

	function getSourcesPath() { return self::$sourcesPath; }

	function setVerifySources($enabled) { self::$verifySources=$enabled;}
	function addSourcesPath($path) { array_push(self::$sourcesPath,$path); }
	function setMaxRequestSize($size) { self::$maxRequestSize=$size; }
	function setMaxBundleSize($size) { self::$maxBundleSize=$size; }

	function setProtocol($protocol,$handler) { self::$protocols[$protocol]=$handler;}
	function addMetaProtocol($protocol,$mask) { self::$metaProtocols[$protocol]=$mask; }

	/* Applies metaprotocols to url */
	function applyMetaProtocol($url) {
		$protocol=strtolower(substr($url,0,strpos($url, ":")));
		$content=substr($url,strrpos($url, "/")+1);
		if (isset(self::$metaProtocols[$protocol]))
			$url=preg_replace("/\*\*/", $content,self::$metaProtocols[$protocol] );
		return $url;
	}

	/* Check if source is allowed to be served */
	function isSourceAllowed($url) {
		if (!self::$verifySources) return true;
		$valid=false;
		for ($i=0;$i<count(self::$sourcesPath);$i++) {
			if ($handle = opendir(self::$sourcesPath[$i])) {
		  		while (false !== ($entry = readdir($handle))) {
		  			if (strtolower(substr($entry,-5))==".json") {
		  				$json=json_decode(
		  					file_get_contents(
		  						self::$sourcesPath[$i]."/".$entry
		  						)
		  					);
		  				if ($json) foreach ($json as $item) 
		  					if (self::applyMetaProtocol($item->url)==$url) {
		  						$valid=true;
		  						break;
		  					}
		  			}
		  			if ($valid) break;
		  		}
		  		closedir($handle);
			}
			if ($valid) break;
		}
		return $valid;
	}

	function getFileList($url) {
		$protocol=AggroTools::getProtocol($url);
		if (isset(self::$protocols[$protocol])) {
			$handler=self::$protocols[$protocol];
			return call_user_func(array($handler, 'getFileList'), $url);
		} else
			return Array();
	}

	/* Get source data */
	function getData($url,$skipcache=false) {	
		if (!$skipcache&&(!is_null($out=AggroCache::get($url,"json")))) return $out;

		$protocol=AggroTools::getProtocol($url);
		if (self::isSourceAllowed($url)) {
			if (isset(self::$protocols[$protocol])) {
				$handler=self::$protocols[$protocol];
				return call_user_func(array($handler,"get"), $url);
			} else return AggroItem::error(400,"No handler for the specified protocol (missing '".$protocol."' meta-protocol in Aggro?)");
		} else
			return AggroItem::error(400,"The URL is not allowed (missing '".$protocol."' meta-protocol in Aggro?)");
	}

	/* Check integrity */
	function checkIntegrity(){
		for ($i=0;$i<count(self::$sourcesPath);$i++)
			if (!is_dir(self::$sourcesPath[$i])) AggroTools::kill("Sources path not found");
		return false;
	}

	/* Get single-feed results */
	function get($url,$callback) {
		if ((self::$maxRequestSize!=-1)&&(strlen($url)>self::$maxRequestSize))
			AggroTools::kill("Request too large, sorry.");

		$realcallback=AggroTools::clean($callback);

		$headers=Array(
			"Content-Type" => ($realcallback?"application/javascript":"application/json")
		);

		$out="";
		if ($callback==$realcallback)
			$out=self::getData($url);
		else $out=AggroItem::error(400,"bad or missing callback or context");
	
		AggroOut::send(($realcallback?$realcallback."(":"").$out.($realcallback?")":""),$headers);

	}

	/* Get a bundle of resources */
	function getBundle($list,$callback) {
		if ((self::$maxRequestSize!=-1)&&(strlen($list)>self::$maxRequestSize))
			AggroTools::kill("Request too large, sorry.");

		$realcallback=AggroTools::clean($callback);
		$list=trim($list);

		$headers=Array(
			"Content-Type" => ($realcallback?"application/javascript":"application/json")
		);

		$out="";
		if ($list&&($callback==$realcallback)) {
			$urls=preg_split("/\n/", $list);
			if (count($urls)>self::$maxBundleSize)
				AggroTools::kill("Requested bundle too large");

			$out=Array();
			for ($a=0;$a<count($urls);$a++)
				$out[$urls[$a]]=json_decode(self::getData($urls[$a]));
			
			$out=json_encode($out);

		} else $out=AggroItem::error(400,"bad or missing callback or context");

		AggroOut::send(($realcallback?$realcallback."(":"").$out.($realcallback?")":""),$headers);
	}

}

?>