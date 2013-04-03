<?php

	mb_internal_encoding("UTF-8"); 

	include_once("aggrocache.php");
	include_once("aggroitem.php");
	include_once("aggrorss.php");
	include_once("aggrojstv.php");
	include_once("aggroout.php");
	include_once("aggrotwitter.php");
	include_once("aggroverifier.php");
	include_once("aggroadmin.php");

	AggroVerifier::setCheckReferrer(false); // Check referrer at start

	AggroOut::setGZip(true); // Enables/disables GZIP compression of any output.
	AggroOut::setGZipThreshold(2048); // Don't compress data smaller than this threshold

	AggroCache::setCachePath("cache/"); // Cache folder

	AggroCache::setSalt("salted"); // URL hashes used for caching will be salted with this string
	AggroCache::setUserAgent("Mozilla/5.0 (Windows; U; Windows NT 6.0; en-US; rv:1.9.1.6) Gecko/20091201 Firefox/3.5.6"); // Downloader user agent
	AggroCache::setPersistentCache(false); // Never refresh the cached data
	AggroCache::setCacheLife(60*60*24); // Life of cached data
	AggroCache::setDownloadedItemsLimitPerSession(3); // Maximum number of external calls for session. -1 for no limit, 0 for no downloads
	AggroCache::setSessionDuration(60*60); // Duration of a user download session.

	AggroRSS::setEntryCount(4); // Number of extracted entries

	AggroTwitter::setEntryCount(4); // Number of extracted entries

	// Comment these lines in order to disable Twitter support
	AggroTwitter::setOAuthAccessToken("<Your oauth access token>");
	AggroTwitter::setOAuthAccessTokenSecret("<Your oauth access secret>");
	AggroTwitter::setConsumerKey("<Your consumer key>");
	AggroTwitter::setConsumerSecret("<Your consumer secret>");

	AggroJSTV::setVerifySources(true); // Check the sources listed into the specified sources path
	AggroJSTV::addSourcesPath("../../gamecora/sources/"); // Folder with authorized feeds (JSON)
	AggroJSTV::setMaxBundleSize(15); // Maximum items per bundle (-1 for unlimited)
	AggroJSTV::setMaxRequestSize(256*15); // Maximum request allowed to call JSTV - if you can't configure it from php.ini (-1 for unlimited)

	// Metaprotocols just convert URLs to standard RSS feeds, like in JSTVC.
	AggroJSTV::addMetaProtocol("facebook","https://www.facebook.com/feeds/page.php?id=**&format=rss20");
	AggroJSTV::addMetaProtocol("youtube","http://gdata.youtube.com/feeds/base/users/**/uploads?alt=rss&v=2");
	AggroJSTV::addMetaProtocol("flickr","http://api.flickr.com/services/feeds/photos_public.gne?id=**&lang=it-it&format=rss_200");
	AggroJSTV::addMetaProtocol("tumblr","http://**.tumblr.com/rss");

	// These are real protocols and must be linked to their handlers
	AggroJSTV::setProtocol("twitter","AggroTwitter");
	AggroJSTV::setProtocol("http","AggroRSS");
	AggroJSTV::setProtocol("https","AggroRSS");

	// Rename these two lines to disable AggroAdmin
	AggroAdmin::setUsername("admin"); // Username for admin
	AggroAdmin::setPassword("1a1dc91c907325c69271ddf0c944bc72"); // md5("pass") - replace with your own!

	// Put your development configuration overrides here - is not committed to GIT
	if (is_file("index-dev.php")) include_once("index-dev.php");

	/* INITIALIZE */

	AggroJSTV::checkIntegrity();
	AggroCache::checkIntegrity();
	AggroAdmin::checkIntegrity();

	if (isset($_GET["admin"])) {

		AggroAdmin::page($_GET["admin"]);

	} else {

		AggroVerifier::checkIntegrity();

		$callback=(isset($_GET["callback"])?$_GET["callback"]:"");
		$q=(isset($_GET["q"])?$_GET["q"]:"");
		$mode=(isset($_GET["mode"])?$_GET["mode"]:"");

		switch ($mode) {
			case 'bundle': {
				$bundle=file_get_contents("php://input");
				AggroJSTV::getBundle($bundle,$callback);
				break;
			}
			default: {
				AggroJSTV::get($q,$callback);
				break;
			}
		}

	}

?>