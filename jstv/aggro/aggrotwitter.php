<?php

/* Standardize Twitter feeds to JSON a-la Google */
/* http://ajax.googleapis.com/ajax/services/feed/load?&q=<feed>&v=1.0&callback=<JSONP callback function name> */

include_once("aggroitem.php");
include_once("aggrocache.php");
include_once("aggrotools.php");

class AggroTwitter {

	private static $oauth_access_token = "";
	private static $oauth_access_token_secret = "";
	private static $consumer_key = "";
	private static $consumer_secret = "";
	private static $entryCount=0;

	function setEntryCount($count) { self::$entryCount=$count; }
	function setOAuthAccessToken($str) { self::$oauth_access_token=$str;}
	function setOAuthAccessTokenSecret($str) { self::$oauth_access_token_secret=$str;}
	function setConsumerKey($str) { self::$consumer_key=$str;}
	function setConsumerSecret($str) { self::$consumer_secret=$str;}

	function buildBaseString($baseURI, $method, $params) {
	    $r = array();
	    ksort($params);
	    foreach($params as $key=>$value){
	        $r[] = "$key=" . rawurlencode($value);
	    }
	    return $method."&" . rawurlencode($baseURI) . '&' . rawurlencode(implode('&', $r));
	}

	function buildAuthorizationHeader($oauth) {
	    $r = 'Authorization: OAuth ';
	    $values = array();
	    foreach($oauth as $key=>$value)
	        $values[] = "$key=\"" . rawurlencode($value) . "\"";
	    $r .= implode(', ', $values);
	    return $r;
	}
	
	/* Get timeline JSON from url twitter://<screenname>/ */
	function getTimeline($url) {

		if (!is_null($out=AggroCache::get($url,"twitter"))) return $out;

		if (!AggroCache::canDownload()) return "";
		if (!self::$oauth_access_token) return "";

		AggroCache::prepare($url,"twitter");
		$screenname=substr($url,strpos($url, "/")+2);

		$serviceurl = "https://api.twitter.com/1.1/statuses/user_timeline.json";

		$oauth = array( 
						'screen_name' => $screenname,
						'count' => self::$entryCount,
						'oauth_consumer_key' => self::$consumer_key,
		                'oauth_nonce' => time(),
		                'oauth_signature_method' => 'HMAC-SHA1',
		                'oauth_token' => self::$oauth_access_token,
		                'oauth_timestamp' => time(),
		                'oauth_version' => '1.0');

		$base_info = self::buildBaseString($serviceurl, 'GET', $oauth);
		$composite_key = rawurlencode(self::$consumer_secret) . '&' . rawurlencode(self::$oauth_access_token_secret);
		$oauth_signature = base64_encode(hash_hmac('sha1', $base_info, $composite_key, true));
		$oauth['oauth_signature'] = $oauth_signature;

		// Make Requests
		$header = array(self::buildAuthorizationHeader($oauth), 'Expect:');
		$options = array( CURLOPT_HTTPHEADER => $header,
		                  //CURLOPT_POSTFIELDS => $postfields,
		                  CURLOPT_HEADER => false,
		                  CURLOPT_URL => $serviceurl."?screen_name=".$screenname."&count=".self::$entryCount,
		                  CURLOPT_RETURNTRANSFER => true,
		                  CURLOPT_SSL_VERIFYPEER => false);

		$feed = curl_init();
		curl_setopt_array($feed, $options);
		$out = curl_exec($feed);
		curl_close($feed);

		AggroCache::put($url,"twitter",$out);
		
		return $out;

	}

	/* (AggroAdmin interface) Get files list */
	function getFileList($url) {
		return Array(
			Array( "file" => AggroCache::getFUID($url,"json"), "ext"=>"json","type" => "Twitter processed data"),
			Array( "file" => AggroCache::getFUID($url,"twitter"), "ext"=>"twitter","type" => "Original Twitter data")
		);
	}

	/* Data parsing action */
	function get($url) {

		$screenname=substr($url,strpos($url, "/")+2);
		$data=self::getTimeline($url);

		if ($data) {
			$data=json_decode($data);

			if (is_object($data)&&(property_exists($data,"errors")||property_exists($data,"error")))
				return AggroItem::error(400,"Twitter feed will be refreshed ASAP.");

			$feed=new AggroItem($url,"json");
			$feed->prepare();

			$author=null;

			for ($i=0;$i<count($data);$i++) {
				$tw=$data[$i];
				if (!$author&&$tw->user) $author=$tw->user->name;
				$content=$screenname.": ".$tw->text;
				$feed->setEntryData("title",$tw->text,true);
				$feed->setEntryData("link","http://www.twitter.com/".$screenname."/status/".$tw->id_str,true);
				$feed->setEntryData("publishedDate",date("r",strtotime($tw->created_at)),true);
				$feed->setEntryData("contentSnippet",AggroTools::snippet($content),true);
				$feed->setEntryData("content",$content,true);
				$feed->setEntryData("categories",Array());
				$feed->next();
			}

			if (!$author) $author=$screenname;
			$feed->setItemData("feedUrl","http://www.twitter.com/".$screenname);
			$feed->setItemData("title","Twitter / ".$author);
			$feed->setItemData("link","http://www.twitter.com/".$screenname);
			$feed->setItemData("description","Twitter updates from ".$author);
			$feed->setItemData("generator","AggroTwitter");

			return $feed->save();
		} else return AggroItem::error(400,"Twitter feed will be refreshed ASAP.");
	}
}


?>