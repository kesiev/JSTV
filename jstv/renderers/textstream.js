/* Renders a stream of items - images, tweets, news etc. animable via CSS. Is used for news, tweets and slideshows in Ganmecora TV. */
/*
	SCENE SYNTAX:
	{
		renderer:"textstream",
		logo:"<logo image URL>",
		title:"<section title TEXT>",
		program:"<program name TEXT",
		musicIntro:{name:"<music category TEXT>",files:{"<audio MIME type>":"<audio URL>", ...}},
		musicOutro:{name:"<music category TEXT>",files:{"<audio MIME type>":"<audio URL>", ...}},
		items:[
			{
				tag:["tag1","tag2","tag3"...],
				image:"<item image URL>",
				text:"<item TEXT>",
				author:"<item author TEXT>",
				source:"<item source TEXT>",
				date:"<item date TEXT>"
			}, ...
		]
	}

	NOTES:
	- if the music played by the previous scene has the same music category, the new musicIntro is not played.
	- each entry into the "item" section will generate a new channel schedule entry with the specified "title" and "link"
	- a unique selection of all of the tags specified by all of the items is returned as scene tags

*/
JSTV.rendererLoaded("textstream",{
	configuration:{
		isOldThreshold:180 // Distance in days from today for marking items as old
	},
	classes:{
		main:{
			className:"main",
			elements:{
				logo:{as:"image"},
				title:{as:"text"},
				program:{as:"text"}
			}
		},
		item:{
			className:"item",
			elements:{
				image:{as:"image"},
				title:{as:"html"},
				text:{as:"html"},
				author:{as:"text"},
				source:{as:"text"},
				date:{as:"text"}
			}
		}
	},
	/* Returns the schedule entry for the handled scene */
	getSchedules:function(scene) {
		var sched=[];
		for (var i=0;i<scene.items.length;i++)
			sched.push({title:scene.items[i].title,link:scene.items[i].link});
		return sched;
	},
	/* Retuns tags for the handled scene */
	getTags:function(scene){
		var tags=JSTVT.makeStatsTool();
		for (var i=0;i<scene.items.length;i++)
			if (scene.items[i].tag)
				for (var j=0;j<scene.items[i].tag.length;j++)
					tags.add(scene.items[i].tag[j]);
		tags.close();
		return tags.keys;
	},
	/* Gets the music played when the handled scene is over */
	getClosingMusic:function(player,scene){
		return scene.musicOutro ? scene.musicOutro : scene.musicIntro;
	},
	/* Triggered when the handled scene is on air */
	onAir:function(player,layer,scene){
		if (scene.musicIntro) player.playMusic(scene.musicIntro);
		this.nextItem(this,player,scene);
	},
	/* Triggered when the handled scene have to be prepared (not displayed on the screen) */
	prepare:function(player,layer,scene){
		var item,isold,now=new Date();
		layer.className+=" textstream "+scene.type;
		scene.divitems=[];
		scene.currentItem=-2;
		JSTVT.objToScene(scene,layer,this.classes.main,player.channel.path);
		for (var i=0;i<scene.items.length;i++) {
			isold=!scene.items[i].date?false:(now-JSTVT.simpleDateToDate(scene.items[i].date))>(this.configuration.isOldThreshold*86400000);
			item=document.createElement("div");
			item.className="streamitem item-"+i+(isold?" old":"")+" hidden";
			JSTVT.objToScene(scene.items[i],item,this.classes.item,player.channel.path);
			scene.divitems.push(item);
			layer.appendChild(item);
		}
	},
	/* (MISSING) onResize: automatically handled by the scene player */
	/* onResize:function(player,layer,scene,newsize) { } */
	/* (MISSING) getGap: automatically decided by the scene player */
	/* getGap:function(player,layer,scene,newsize) { } */
	/* (MISSING) setVolume: automatically handled by scene player */
	/* setVolume:function(player,layer,scene,volume) { } */
	/* (MISSING) initialize: the scene renderer is already initialized when loaded */
	/* initialize:function() { } */
	/* (MISSING) onAbort: automatically handled by scene player */
	/* onAbort:function(player,layer,scene) { } */
	/* (CUSTOM) shows the next element of the textstream */
	nextItem:function(item,player,scene){
		var ended=true;
		if (scene.currentItem<scene.items.length) {
			var ci;
			for (var i=0;i<scene.items.length;i++) {
				ci=scene.divitems[i];
				if (i==scene.currentItem-1) ci.className=ci.className.replace(/ previous/,"")+" hidden";
				if (i==scene.currentItem) ci.className=ci.className.replace(/ current/,"")+" previous";
				if (i==scene.currentItem+1) ci.className=ci.className.replace(/ next/,"").replace(/ hidden/,"")+" current";
				if (i==scene.currentItem+2) ci.className=ci.className.replace(/ hidden/,"")+" next";
			}
			scene.currentItem++;
			if (scene.currentItem<scene.items.length) ended=false;
		}	
		if (ended) {
			if (scene.musicOutro) player.playMusic(scene.musicOutro);
			player.defer(function(){
				player.gotoNextProgram();
			},null,1200);
		} else {
			player.defer(function(){
				item.nextItem(item,player,scene); 
			},null,scene.currentItem==-1?10:10000);
		}
	}
});