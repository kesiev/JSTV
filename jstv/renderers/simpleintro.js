/* Renders a simple intro screen, animable via CSS. Is used for all of the intros in Gamecora TV. */
/*
	SCENE SYNTAX:
	{
		renderer:"simpleintro",
		tag:["tag1","tag2","tag3"...],
		logo:"<logo IMAGE URL>",
		title:"<program title TEXT>",
		subtitle:"<program subtitle TEXT>",
		program:"<program name TEXT>",
		source:"<program source TEXT>",
		description:"<prrogram description TEXT>",
		date:"<program date TEXT>",
		text1:"<text decoration 1 TEXT>",
		text2:"<text decoration 2 TEXT>",
		text3:"<text decoration 3 TEXT>",
		showInSchedule:1|0,
		musicIntro:{name:"<music category TEXT>",files:{"<audio MIME type>":"<audio URL>", ...}},
		musicOutro:{name:"<music category TEXT>",files:{"<audio MIME type>":"<audio URL>", ...}}
	}
	
	NOTES:
	- if the music played by the previous scene has the same music category, the new musicIntro is not played
	- if showInSchedule is "1" an "heading" entry with the specified "title" is added to the channel schedule
	- the specified "tag" will be returned as scene tags

*/
JSTV.rendererLoaded("simpleintro",{
	configuration:{
		isOldThreshold:180 // Distance in days from today for marking items as old
	},
	classes:{
		className:"main",
		elements:{
			image:{as:"image"},
			logo:{as:"image"},
			title:{as:"text"},
			subtitle:{as:"text"},
			program:{as:"text"},
			source:{as:"text"},
			description:{as:"text"},
			date:{as:"text"},
			text1:{as:"text"},
			text2:{as:"text"},
			text3:{as:"text"}
		}
	},
	/* Returns the schedule entry for the handled scene */
	getSchedules:function(scene) {
		if (scene.showInSchedule)
			return [{priority:scene.showInSchedule,title:scene.title}]
	},
	/* (MISSING) getTags: intros and outros usually doesn't have any tag */
	/* Gets the music played when the handled scene is over */
	getClosingMusic:function(player,scene){
		return scene.musicOutro ? scene.musicOutro : scene.musicIntro;
	},
	/* Triggered when the handled scene is on air */
	onAir:function(player,layer,scene){
		if (scene.musicIntro) player.playMusic(scene.musicIntro);
		player.defer(function(){
			layer.className+=" closing";
			if (scene.musicOutro) player.playMusic(scene.musicOutro);
			player.defer(function(){
				player.gotoNextProgram()
			},null,1600);
		},null,7000);
	},
	/* Triggered when the handled scene have to be prepared (not displayed on the screen) */
	prepare:function(player,layer,scene){
		var now=new Date();
		isold=!scene.date?false:(now-JSTVT.simpleDateToDate(scene.date))>(this.configuration.isOldThreshold*86400000);
		layer.className+=" simpleintro "+(isold?"old ":"")+scene.type;
		JSTVT.objToScene(scene,layer,this.classes,player.channel.path);
	}
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
});