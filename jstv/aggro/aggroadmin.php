<?php

/* A dead simple backend for Aggro */

include_once("aggrocache.php");

function ___sortby_date($a,$b) { return $a["date"]<$b["date"]; }
function ___sortby_size($a,$b) { return $a["size"]<$b["size"]; }
function ___sortby_name($a,$b) { return $a["name"]>$b["name"]; }

class AggroAdmin {

	private static $user=null;
	private static $password=null;
	private static $past=0;
	private static $future=0;
	private static $now=0;
	private static $day=0;

	function setUsername($user) { self::$user=$user;}
	function setPassword($password) { self::$password=$password;}

	/* Initializes common dates */
	function checkIntegrity(){
		self::$past=mktime(0,0,0,1,1,1980);
		self::$future=mktime(0,0,0,1,1,2038);
		self::$now=mktime();
		self::$day=60*60*24;
	}

	/* Get the JSTV sources index (for backend) */
	function getJSTVIndex($indexmode) {
		$index=Array();
		$path=AggroJSTV::getSourcesPath();
		$pathlength=strlen(AggroCache::getCachePath());
		for ($k=0;$k<count($path);$k++)
			if ($handle = opendir($path[$k])) {
		  		while (false !== ($entry = readdir($handle))) {
		  			if (strtolower(substr($entry,-5))==".json") {
		  				$json=json_decode(
		  					file_get_contents(
		  						$path[$k]."/".$entry
		  						)
		  					);
		  				if ($json) foreach ($json as $item) {
							$url=AggroJSTV::applyMetaProtocol($item->url);
							$files=AggroJSTV::getFileList($url);
							switch ($indexmode) {
								case "byfile":{
									for ($j=0;$j<count($files);$j++)
			  							$index[$files[$j]["file"]]=Array("type"=>$files[$j]["type"],"realurl"=>$url,"url"=>$item->url,"name"=>$item->description);
									break;
								}
								case "byresource":{
									$byresource=Array("realurl"=>$url,"url"=>$item->url,"name"=>$item->description,"files"=>Array(),"size"=>0,"date"=>null);
									for ($j=0;$j<count($files);$j++) {
										$sizefile=is_file($files[$j]["file"])?filesize($files[$j]["file"]):0;
										$mtimefile=is_file($files[$j]["file"])?filemtime($files[$j]["file"]):null;
										array_push($byresource["files"],Array("ext"=>$files[$j]["ext"],"filename"=>substr($files[$j]["file"],$pathlength),"file"=>$files[$j]["file"],"size"=>$sizefile,"date"=>$mtimefile));
										if (!$byresource["date"]||($mtimefile>$byresource["date"])) $byresource["date"]=$mtimefile;
										$byresource["size"]+=$sizefile;
									}
									array_push($index,$byresource);		  						
									break;
								}
								case "byid":{
									$index[AggroCache::getUID($url)]=$item->url;
									break;
								}
							}
		  				}	
		  			}
	  		}
	  		closedir($handle);
		}
		return $index;
	}

	/* Indexes cache files */
	function getIndex() {
		$jstvindex=self::getJSTVIndex("byfile");
		$keys=Array();
		$index=Array("size" => 0,"count"=>0,"byname"=>Array(),"byextension"=>Array());
		$path=AggroCache::getCachePath();
		if ($handle = opendir($path)) {
	  		while (false !== ($entry = readdir($handle))) 
	  			if (($entry!=".")&&($entry!="..")) {
	  				$fullfile=$path.$entry;
	  				$index["count"]++;
		  			$file=substr($entry,0,strpos($entry,"."));
		  			$extension=substr($entry,strpos($entry,".")+1);
		  			$mtime=filemtime($path.$entry);
		  			$size=filesize($path.$entry);
		  			if (!isset($keys[$file])) {
		  				array_push($index["byname"],Array("data"=>null,"file"=>$file,"name"=>"","ext"=>Array(),"date"=>$mtime,"size"=>0));
		  				$keys[$file]=count($index["byname"])-1;
		  			}
		  			$index["byname"][$keys[$file]]["size"]+=$size;
		  			$index["size"]+=$size;
		  			if (isset($jstvindex[$fullfile])&&!$index["byname"][$keys[$file]]["data"]) {
		  				$index["byname"][$keys[$file]]["data"]=$jstvindex[$fullfile];
		  				$index["byname"][$keys[$file]]["name"]=$jstvindex[$fullfile]["name"];
		  			}
		  			if ($index["byname"][$keys[$file]]["date"]<$mtime) $index["byname"][$keys[$file]]["date"]=$mtime;
		  			$item=Array("ext"=>$extension,"data"=>null,"fullfile"=>$fullfile,"date"=>$mtime,"size" => $size);
		  			if (isset($jstvindex[$fullfile])) $item["data"]=$jstvindex[$fullfile];
		  			array_push($index["byname"][$keys[$file]]["ext"],$item);
		  			if (!isset($index["byextension"][$extension])) $index["byextension"][$extension]=Array();
		  			array_push($index["byextension"][$extension],$file);
		  		}
	  		closedir($handle);
		}
		return $index;
	}

	/* Creates the side bar */
	function makeSidebar($selclass,$buttons) {
		$get=isset($_GET["sort"])?"&sort=".$_GET["sort"]:"";
		$out="";
		$out.="<div class='dock left'>";
		$out.="<h1>Aggro Admin</h1>";
		$out.="<p class='toolbox'><a href='?admin=logout'>Logout</a></p>";
		$out.="<p class='toolbox'><a href='?admin=cachelist&sort=".$get."'>Cache list</a></p>";
		$out.="<p class='toolbox'><a href='?admin=feedslist&sort=".$get."'>Feeds list</a></p>";
		$out.="<table>";
		foreach ($selclass as $id=>$label) {
			$out.="<tr><td class='row-".$id."'>".$label."</td><td><input type=button onclick=\"sl('".$id."',true)\" value='+'></td><td><input type=button onclick=\"sl('".$id."',false)\" value='-'></td></tr>";
		}
		$out.="</table>";
		$out.="<p>";
		for ($i=0;$i<count($buttons);$i++)
			$out.="<input type=submit name='go' value='".$buttons[$i][0]."' onclick=\"return cn('".$buttons[$i][1]."')\">";
		$out.="</p>";
		$out.="</div>";
		$out.="<script>function sl(cl,st){var a=document.getElementsByClassName(cl);for (var b in a) a[b].checked=st;}</script>";
		$out.="<script>function cn(st){var cnt=0,a=document.getElementsByTagName('input');for (var b in a) cnt+=a[b].className&&a[b].checked?1:0;return confirm(st+' '+cnt+' item(s)?')}</script>";
		return $out;
	}

	/* Process a set of data */
	function processFilelist($filelist,$action){
		$cnt=0;
		for ($i=0;$i<count($filelist);$i++) {
			$file=$filelist[$i];
			if (is_file($file)) {
				$cnt++;
				switch ($action) {
					case "Delete":{
						unlink($file);
						break;
					}
					case "Freeze":{
						touch($file,self::$future);
						break;
					}
					case "Expire":{
						touch($file,self::$past);
						break;
					}
					case "Now":{
						touch($file,self::$now);
						break;
					}
				}
			}
		}
		return $action." ".$cnt." file(s).";
	}

	/* Formats a filesize in human readable form */
	function humanReadableFilesize($bytes, $decimals = 2) {
		$sz = 'BKMGTP';
		$factor = floor((strlen($bytes) - 1) / 3);
		return sprintf("%.{$decimals}f", $bytes / pow(1024, $factor)) . @$sz[$factor];
	}
	
	/* Serves the admin GUI */
	function page($page){
		
		$html=true;
		$out="";
		
		if (!self::$password)
			$page="sorry";
		else {
			session_start();
			if (isset($_POST["login"]))
				if (isset($_POST["user"])&&($_POST["user"]==self::$user)&&isset($_POST["pass"])&&(md5($_POST["pass"])==self::$password))
					$_SESSION["auth"]=1;
			if (!isset($_SESSION["auth"])) {
				$page="login";
				session_destroy();
			}
		}
		switch ($page) {
			case "login":{
				$out="<form method='post'><div class='loginbox'><h1>Aggro Backend Login</h1><p>Login:<input type='text' name='user'></p><p>Pass:<input type='password' name='pass'></p><p><input type=submit name='login' value='Login'></p></div></form>";
				break;
			}
			case "sorry":{
				$out.="<div class='loginbox'>Sorry!</div>";
				break;
			}
			case "logout":{
				session_destroy();
				$host  = $_SERVER['HTTP_HOST'];
				$uri   = rtrim(dirname($_SERVER['PHP_SELF']), '/\\');
				$extra = 'index.php?admin=cachelist';
				header("Location: http://$host$uri/$extra");
				break;
			}
			case "getfile":{
				$html=false;
				$file=AggroCache::getCachePath().preg_replace("/[^0-9a-zA-Z.]*/","",$_GET["file"]);
				if (is_file($file))
					readfile($file);
				break;
			}
			case "process":
			case "refresh":{
				$html=false;
				if ($page=="refresh")
					AggroCache::setDownloadedItemsLimitPerSession(-1); // Ensure download
				else
					AggroCache::setDownloadedItemsLimitPerSession(0); // Ensure no download
				AggroCache::setPersistentCache(false); // Ensure overwrite
				AggroCache::setCacheLife(0); // Ensure expiration
				$url=AggroJSTV::applyMetaProtocol(file_get_contents("php://input"));
				$ret=json_decode(AggroJSTV::getData($url,true));
				echo htmlentities($url)." <span style='color:#f00'>".htmlentities($ret->responseDetails)."</span> (<b>".$ret->responseStatus."</b>)<br>";
				break;
			}
			case "feedslist":{
				$msg="";
				$skip=false;
				if (isset($_POST["go"]))
					if (($_POST["go"]=="Refresh")||($_POST["go"]=="Process")) {
						$action=$_POST["go"]=="Refresh"?"refresh":"process";
						$index=self::getJSTVIndex("byid");
						$queue=Array();
						foreach ($_POST as $key=>$value) if ($key!="go") {
							$spl=preg_replace("/\|.*/","",$key);
							if (isset($index[$spl])) array_push($queue,$index[$spl]);
						}
						$out.="<div class='dock right'>";
						$out.="<p id='end'>Working...</p>";
						$out.="<p id='log'></p>";
						$out.="</div>";
						$out.="<div class='dock left'>";
						$out.="<h1>Aggro Admin</h1>";
						$out.="<p>Doing ".$_POST["go"].".</p>";
						$out.="<p id='end2'>Working...</p>";
						$out.="</div>";
						$out.="<script>";
						$out.="var items=".json_encode($queue).",cur=0;";
						$out.="function msg(t){document.getElementById('end').innerHTML=t;document.getElementById('end2').innerHTML=t;}\n";
						$out.="function cb(){ if(this.readyState == 4) { document.getElementById('log').innerHTML+=this.responseText; cur++; donext(); } }\n";
						$out.="function donext(){if (items[cur]) { msg(cur+' of '+items.length+'...');var xmlhttp=new XMLHttpRequest();xmlhttp.onreadystatechange=cb;xmlhttp.open('post','?admin=".$action."',true);xmlhttp.send(items[cur]);} else msg(\"<a href='?admin=feedslist'>Done.</a>\"); }\n";
						$out.="window.onload=donext;\n";
						$out.="</script>";
						$skip=true;
					} else {
						$ids=self::getJSTVIndex("byid");
						$filelist=Array();
						foreach ($_POST as $key=>$value) if ($key!="go") {
							$id=preg_replace("/\|/","",$key);
							if (isset($ids[$id])) {
								$url=AggroJSTV::applyMetaProtocol($ids[$id]);
								$files=AggroJSTV::getFileList($url);
								for ($i=0;$i<count($files);$i++)
									array_push($filelist, $files[$i]["file"]);
							}
						}
						$msg=self::processFilelist(array_unique($filelist),$_POST["go"]);
					}
				if (!$skip) {
					$index=self::getJSTVIndex("byresource");
					$sortfn="___sortby_name";
					if (isset($_GET["sort"])) {
						switch ($_GET["sort"]) {
							case "date": { $sortfn="___sortby_date"; break;}
							case "size": { $sortfn="___sortby_size"; break;}
							case "name": { $sortfn="___sortby_name"; break;}
						}
					}
					usort($index,$sortfn);
					$selclass=Array(
						"all" => "All",
						"available" => "Data is available in cache",
						"not-available" => "Data is not available in cache",
						"frozen" => "Frozen file (in the future)",
						"expired" => "Expired (will be updated soon)",
						"today" => "Resources changed 24h past/future",
						"small" => "Files under 512b (errors)"
					);
					$out.="<div class='dock right'>";
					if ($msg) $out.="<div class='messagebox'>".$msg."</div>";
					$out.="<form method='post'>";
					$out.="<h1>Feeds</h1>";
					$out.="<table>";
					$out.="<tr class='tablehead'><td><a href='?admin=feedslist&sort=date'>Date</a></td><td><a href='?admin=feedslist&sort=size'>Size</a></td><td><a href='?admin=feedslist&sort=name'>Name</a></td></tr>";
					for ($i=0;$i<count($index);$i++) {
						$next="";
						$allclass="all ";
						$alldateclass="";
						for ($j=0;$j<count($index[$i]["files"]);$j++) {
							$dateclass="";
							$exists=true;
							if (is_null($index[$i]["files"][$j]["date"])) {
								$exists=false;
								$dateclass="row-not-available";
								if (!strpos($allclass,"not-available")) $allclass.="not-available ";
							} else {
								if (!strpos($allclass,"available")) $allclass.="available ";
								if ($index[$i]["files"][$j]["date"]==self::$future) {
									if (!strpos($allclass,"frozen")) $allclass.="frozen ";
									$dateclass.="row-frozen ";
								}
								if ($index[$i]["files"][$j]["date"]==self::$past) {
									if (!strpos($allclass,"expired")) $allclass.="expired ";
									$dateclass.="row-expired ";
								}
								if (abs($index[$i]["files"][$j]["date"]-self::$now)<self::$day) {
									if (!strpos($allclass,"today")) $allclass.="today ";
									$dateclass.="row-today ";
								}
								if ($index[$i]["files"][$j]["size"]<512)
									if (!strpos($allclass,"small")) $allclass.="small ";
							}
							if (!isset($selclass[$index[$i]["files"][$j]["ext"]]))
								$selclass["type-".$index[$i]["files"][$j]["ext"]]="File .".$index[$i]["files"][$j]["ext"];
							$allclass.="type-".$index[$i]["files"][$j]["ext"]." ";
							$next.="<td class='".$dateclass."'>".($exists?"<a href='?admin=getfile&file=".$index[$i]["files"][$j]["filename"]."' target='_blank'>":"").$index[$i]["files"][$j]["ext"].($exists?"</a> (".self::humanReadableFilesize($index[$i]["files"][$j]["size"]).")":"")."</td>";
						}
						$allexists=false;
						if (!is_null($index[$i]["date"])) {
							$allexists=true;
							if ($index[$i]["date"]==self::$future) $alldateclass.="row-frozen ";
							if ($index[$i]["date"]==self::$past) $alldateclass.="row-expired ";
							if (abs($index[$i]["date"]-self::$now)<self::$day) $alldateclass.="row-today ";
						}
						$out.="<tr>";
						$out.="<td class=\"".$alldateclass."\">".($allexists?date("Y-m-d H:i:s",$index[$i]["date"]):"N/A")."</td>";
						$out.="<td>".($allexists?self::humanReadableFilesize($index[$i]["size"]):"N/A")."</td>";
						$out.="<td>".(isset($index[$i]["files"][0])?"<input type=checkbox class='".$allclass."' name=\"".preg_replace("/\..*/","|",$index[$i]["files"][0]["filename"])."\">":"[!!!]");
						$out.="<a title='".$index[$i]["url"]."' href='".$index[$i]["realurl"]."' target=_blank>".htmlentities($index[$i]["name"])."</a>";
						$out.="</td>";
						$out.=$next."</tr>";
					}
					$out.="</table>";
					$out.="</div>";
					$out.=self::makeSidebar($selclass,Array(
						Array("Delete","Delete"),
						Array("Freeze","Freeze (set in the future)"),
						Array("Expire","Expire (set in the past)"),
						Array("Now","Set now"),
						Array("Refresh","Refresh files in cache"),
						Array("Process","Reprocess downloaded data")
					));
					$out.="</form>";
				}
				break;
			}
			default:{
				$msg="";
				if (isset($_POST["go"])) {
					$filelist=Array();
					foreach ($_POST as $key=>$value) if ($key!="go")
						array_push($filelist,AggroCache::getCachePath().preg_replace("/\|/",".",$key));
					$msg=self::processFilelist(array_unique($filelist),$_POST["go"]);
				}
				$selclass=Array(
					"all" => "All",
					"available" => "Description available",
					"not-available" => "Description not available",
					"frozen" => "Frozen file (in the future)",
					"expired" => "Expired (will be updated soon)",
					"resourcetoday" => "Resources changed 24h past/future",
					"today" => "Files changed 24h past/future",
					"small" => "Files under 512b (errors)"
				);

				$index=self::getIndex();
				$sortfn="___sortby_date";
				if (isset($_GET["sort"])) {
					switch ($_GET["sort"]) {
						case "date": { $sortfn="___sortby_date"; break;}
						case "size": { $sortfn="___sortby_size"; break;}
						case "name": { $sortfn="___sortby_name"; break;}
					}
				}
				usort($index["byname"],$sortfn);

				$out.="<div class='dock right'>";
				if ($msg) $out.="<div class='messagebox'>".$msg."</div>";
				$out.="<form method='post'>";
				$out.="<h1>By name</h1><table>";
				$out.="<tr class='tablehead'><td><a href='?admin=cachelist&sort=date'>Date</a></td><td><a href='?admin=cachelist&sort=size'>Size</a></td><td><a href='?admin=cachelist&sort=name'>Name</a></td></tr>";
				for ($i=0;$i<count($index["byname"]);$i++) {
					$rowclass="";
					$dateclass="";
					$filesclass="";
					$baseclass="all ";
					if (!$index["byname"][$i]["data"]) {
						$rowclass="row-not-available";
						$baseclass.="not-available ";
					} else $baseclass.="available ";
					if ($index["byname"][$i]["date"]==self::$past) $dateclass.="row-expired ";
					if ($index["byname"][$i]["date"]==self::$future) $dateclass.="row-frozen ";
					if (abs($index["byname"][$i]["date"]-self::$now)<self::$day) { $dateclass.="row-today "; $baseclass.="resourcetoday "; }
					$out.="<tr>";
					$out.="<td class=\"".$dateclass."\">".date("Y-m-d H:i:s",$index["byname"][$i]["date"])."</td>";
					$out.="<td>".self::humanReadableFilesize($index["byname"][$i]["size"])."</td>";
					$out.="<td class=\"".$rowclass."\">".($index["byname"][$i]["data"]?"<a title='".$index["byname"][$i]["data"]["url"]."' href='".$index["byname"][$i]["data"]["realurl"]."' target=_blank>".htmlentities($index["byname"][$i]["data"]["name"])."</a>":"<i>N/A</i>")."</td>";
					$out.="<td>".htmlentities($index["byname"][$i]["file"])."</td>";
					for ($j=0;$j<count($index["byname"][$i]["ext"]);$j++) {
						$dateclass="";
						$class="all ";
						if (!isset($selclass["type-".$index["byname"][$i]["ext"][$j]["ext"]])) 
							$selclass["type-".$index["byname"][$i]["ext"][$j]["ext"]]="File .".$index["byname"][$i]["ext"][$j]["ext"];
						if ($index["byname"][$i]["ext"][$j]["date"]==self::$future) {$class.="frozen ";$dateclass="row-frozen";}
						if ($index["byname"][$i]["ext"][$j]["date"]==self::$past) {$class.="expired ";$dateclass="row-expired";}
						if ($index["byname"][$i]["ext"][$j]["size"]<512) $class.="small ";
					
						if (abs($index["byname"][$i]["ext"][$j]["date"]-self::$now)<self::$day) { $class.="today "; $dateclass.="row-today "; }
						$class.="type-".$index["byname"][$i]["ext"][$j]["ext"]." ";
						$out.="<td class=\"".$dateclass."\"><input class='".$baseclass.$class."' type='checkbox' value='1' name='".$index["byname"][$i]["file"]."|".$index["byname"][$i]["ext"][$j]["ext"]."'><a href='?admin=getfile&file=".$index["byname"][$i]["file"].".".$index["byname"][$i]["ext"][$j]["ext"]."' target='_blank'>".htmlentities($index["byname"][$i]["ext"][$j]["ext"])."</a> (".self::humanReadableFilesize($index["byname"][$i]["ext"][$j]["size"]).")</td>";
					}
					$out.="</tr>";
				}
				$out.="</table>";
				$out.="<p>".count($index["byname"])." file names, ".$index["count"]." all, ".self::humanReadableFilesize($index["size"])."</p>";
				$out.="<h1>By extension</h1><table>";
				foreach ($index["byextension"] as $key=>$value)
					$out.="<tr><td>".htmlentities($key)."</td><td>".count($value)." item(s)</td></tr>";
				$out.="</table>";
				
				$out.=self::makeSidebar($selclass,Array(
					Array("Delete","Delete"),
					Array("Freeze","Freeze (set in the future)"),
					Array("Expire","Expire (set in the past)"),
					Array("Now","Set now")
				));
				$out.="</form>";
				break;
			}
		}
		if ($html) {
			echo "<html><head><style>";
			echo "BODY{font-family:sans-serif;background-color:#fff}\nH1,FORM,TR,TD{padding:0;margin:0;white-space:nowrap}\nH1,DIV{font-size:14px;padding:5px 0}\nTD,A,P{font-size:10px}\n.dock{top:0}\n.left{background-color:#fff;position:fixed;width:240px;padding-left:20px;left:0}\n.right{position:absolute;left:270px;border-left:1px solid #ccc;padding-left:20px}\n";
			echo ".tablehead{background-color:#ddd}\n.messagebox { padding:5px;margin:5px;border:1px solid red;background-color:#ff5}\n.loginbox{margin:10px}\n.toolbox{background-color:#eee;text-align:center;padding:5px;font-weight:bold;border-radius:5px}\n";
			echo ".row-not-available{background-color:#333;color:#fff}\n.row-expired{background-color:#990}\n.row-frozen{background-color:#dde}\n.row-today{background-color:#0d0}";
			echo "</style></head><body>".$out."</body></html>";
		}
	}
}

?>