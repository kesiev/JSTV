<?php

/* Data standardization layer a-la Google */
/* http://ajax.googleapis.com/ajax/services/feed/load?&q=<feed>&v=1.0&callback=<JSONP callback function name> */

include_once("aggrocache.php");

class Aggroitem {

	public $dirty=false;
	public $resource=null;
	public $type=null;
	public $data=null;
	public $nextentry=null;

	function __construct($resource,$type) {
		$this->resource=$resource;
		$this->type=$type;
		$this->validate($resource);
		$this->next();
   	}

	/* Set invalid feed */
	function invalidate($errorcode,$message) {
	    $this->data=Array(
		 "responseData" => null,
		 "responseDetails" => $message,
		 "responseStatus" => $errorcode
	    );
	}

	/* Set feed attributes */
	function setItemData($key,$value,$skipifempty=false) {
		if (!$skipifempty||$value)
			$this->data["responseData"]["feed"][$key]=$value;
	}

	/* Set a valid feed answer */
	function validate($source) {
		$this->data=Array(
			"responseData" => Array(
			 	"feed" => Array(
			 		"feedUrl" => $source,
			 		"entries" => Array()
			 	)
			 ),
			"responseDetails" => NULL,
			"responseStatus" => 200
		);
	}

	/* Stores and set up a new item */
	function next(){
		if ($this->dirty) array_push($this->data["responseData"]["feed"]["entries"],$this->nextentry);
		$this->dirty=false;
		$this->nextentry=Array();
	}

	/* Set item data */
	function setEntryData($key,$value,$skipifempty=false){
		$this->dirty=true;
		if (!$skipifempty||$value)
			if ($key) $this->nextentry[$key]=$value;
	}

	/* Prepare data */
	function prepare(){
		AggroCache::prepare($this->resource,$this->type);
	}

	/* Saves data */
	function save(){
		$this->next();
		$text=$this->getString();
		AggroCache::put($this->resource,$this->type,$text);
		return $text;
	}

	/* get string */
	function getString() {
		return json_encode($this->data);
	}

	/* Load data */
	function load(){
		if (is_null($out=AggroCache::get($this->resource,$this->type)))
			$this->data=json_decode($out);
	}

	/* Quickly returns a JSON formatter error */
	static function error($errorcode,$message){
		$feed=new self("","json");
		$feed->invalidate($errorcode,$message);
		return $feed->getString();
	}

}

?>