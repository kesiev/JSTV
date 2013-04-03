<?php

/* Standardize RSS feeds to JSON a-la Google */
/* http://ajax.googleapis.com/ajax/services/feed/load?&q=<feed>&v=1.0&callback=<JSONP callback function name> */

include_once("aggroitem.php");
include_once("aggrocache.php");
include_once("aggrotools.php");

class AggroRSS {

	private static $entryCount=0;

	function setEntryCount($count) { self::$entryCount=$count; }

	function getTagKeyValue($node,$tag,$key,$value){
		$sub=$node->$tag;
		if (method_exists($sub,"count")) {
			for ($i=0;$i<$sub->count();$i++)
				if (isset($sub[$i][$key])&&($sub[$i][$key]==$value))
					return $sub[$i];
		} else {
			if (isset($sub[$key])&&($sub[$key]==$value))
				return $sub;
		}
		return "";
	}

	function setRSSHead($item,$node) {
		$link=strval($node->link);
		if (!$link) $link=strval($node->channel->link);
		if (!$link) {
			$linknode=self::getTagKeyValue($node,"link","rel","self");
			if ($linknode) $link=strval($linknode["href"]);
		}
		if (!$link) {
			$linknode=self::getTagKeyValue($node,"link","rel","alternate");
			if ($linknode) $link=strval($linknode["href"]);
		}

		$title=strval($node->title);
		if (!$title) $title=strval($node->channel->title);

		$generator=strval($node->generator);
		if (!$generator) $generator=strval($node->channel->generator);

		$language=strval($node->language);
		if (!$language) $language=strval($node->channel->language);

		$author=strval($node->author);
		if (!$author) $author=strval($node->channel->author);
		if (!$author) $author=strval($node->author->name);

		$description=strval($node->description);
		if (!$description) $description=strval($node->channel->description);
		if (!$description) $description=strval($node->subtitle);

		$item->setItemData("title",$title);
		$item->setItemData("description",$description);
		$item->setItemData("link",$link,true);
		$item->setItemData("author",$author,true);
		$item->setItemData("generator",$generator,true);
		$item->setItemData("language",$language,true);
		$item->setItemData("type","rss20",true); // TODO get this
	}


	function getNodeAttribute($node,$attr) {
		$ret=$node->children($attr,true);
		if (!$ret) $ret=$node->$attr;
		return $ret;
	}

	function addRSSItem($item,$node) {

		$author=strval(self::getNodeAttribute($node,"creator"));
		if (!$author) $author=strval(self::getNodeAttribute($node,"author"));
		if (!$author) $author=strval($node->author->name);

		$content=trim(strval(self::getNodeAttribute($node,"content")));
		if (!$content) $content=trim(strval(self::getNodeAttribute($node,"description")));
	
		$categories=Array();
		$nodecategory=self::getNodeAttribute($node,"category",true);
		if ($nodecategory)
			foreach ($nodecategory as $cat)
				array_push($categories,strval($cat));

		$date=self::getNodeAttribute($node,"pubDate");
		if (!$date) $date=self::getNodeAttribute($node,"updated");
		if (!$date) $date=self::getNodeAttribute($node,"published");
		if (!$date) $date=self::getNodeAttribute($node,"date");
		if ($date) {
			$date=preg_replace("/::/", "12:00:00", $date); // Some feed forget to add time :(
			$date=strtotime($date);
		}

		$link=strval(self::getNodeAttribute($node,"link"));
		if (!$link) {
			$linknode=self::getTagKeyValue($node,"link","rel","self");
			if ($linknode) $link=strval($linknode["href"]);
		}
		if (!$link) {
			$linknode=self::getTagKeyValue($node,"link","rel","alternate");
			if ($linknode) $link=strval($linknode["href"]);
		}

		$item->setEntryData("title",strval($node->title));
		$item->setEntryData("content",$content);
		$item->setEntryData("contentSnippet",AggroTools::snippet($content));
		$item->setEntryData("link",$link);
		$item->setEntryData("author",$author,true);
		if ($date) $item->setEntryData("publishedDate",date("r",$date),true);
		$item->setEntryData("language",strval(self::getNodeAttribute($node,"language")),true);
		$item->setEntryData("categories",$categories,true);
		$item->next();
	}

	/* Try to get entries from RSS */
	function getEntries($data) {
		$entries=null;
	    if ($data) {
	    	$entries=$data->channel->item;
	    	if (!$entries) $entries=$data->item;
	    	if (!$entries) $entries=$data->entry;
	    }
	    return $entries;
	}

	/* Try to get feed content */
	function getData($xml) {
		$xml=trim($xml);
		$try=0;
		$data=null;
		while (!$data) {
			switch ($try) {
				case 0:{
					$data=@simplexml_load_string($xml);
					break;
				}
				case 1:{
					$data=@simplexml_load_string(preg_replace ('/[^\x{0009}\x{000a}\x{000d}\x{0020}-\x{D7FF}\x{E000}-\x{FFFD}]+/u', ' ', $xml));
					break;
				}
				case 2:{
					$data=@simplexml_load_string(utf8_encode($xml));
					break;
				}
				default:{ break; }
			}
			$try++;
		}
		return $data;
	}

	/* (AggroAdmin interface) Get files list */
	function getFileList($url) {
		return Array(
			Array( "file" => AggroCache::getFUID($url,"json"), "ext"=>"json","type" => "RSS Processed data"),
			Array( "file" => AggroCache::getFUID($url,"dldata"), "ext"=>"dldata", "type" => "Original RSS XML")
		);
	}

	/* (AggroJSTV interface) Data parsing action */
	function get($url) {
		
		$xml=AggroCache::download($url);

		if ($xml) {
			
			$xml= str_replace('&rsquo;', '&#8217;', $xml);
			$feed=new AggroItem($url,"json");
			$feed->prepare();

			$data=self::getData($xml);
			$entries=$data?self::getEntries($data):null;


			if ($data&&$entries) {
				self::setRSSHead($feed,$data);
				
				$pick=count($entries->children());
				
				if (self::$entryCount&&($pick>self::$entryCount)) $pick=self::$entryCount;
				foreach ($entries as $item)
					if ($item&&($item->title||$item->content)) {
						self::addRSSItem($feed,$item);
						$pick--;
						if (!$pick) break;
					}

			} else $feed->invalidate(400,"The specified feed URL has no data");

			return $feed->save();

		} else return AggroItem::error(400,"RSS feed will be refreshed ASAP.");

	}

}


?>