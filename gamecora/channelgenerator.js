/*
*
 * Gamecora TV Channel structure generator
 *
 * JSTVC converts from a channel structure to a channel contents descriptor that
 * will be played by JSTV.
 * That doesn't mean that you can't generate the channel structure via
 * Javascript, in order to apply similiar structures to different programs,
 * work with set of musics and... well... script your channel structure.
 *
 */

function makeMusicPlaylist(){
	return [
		{name:'intro',files:{"audio/mp3":"programs-common/music/Arnaldo_brenna_-_imho.mp3","audio/ogg":"programs-common/music/Arnaldo_brenna_-_imho.ogg"}},
		{name:'intro',files:{"audio/mp3":"programs-common/music/zabutom-statoil.mp3","audio/ogg":"programs-common/music/zabutom-statoil.ogg"}},
		{name:'intro',files:{"audio/mp3":"programs-common/music/antietam.mp3","audio/ogg":"programs-common/music/antietam.ogg"}},
		{name:'intro',files:{"audio/mp3":"programs-common/music/Plurabelle_-_06_-_Ropes.mp3","audio/ogg":"programs-common/music/Plurabelle_-_06_-_Ropes.ogg"}},
		{name:'intro',files:{"audio/mp3":"programs-common/music/Plurabelle_-_02_-_Athens_OH.mp3","audio/ogg":"programs-common/music/Plurabelle_-_02_-_Athens_OH.ogg"}},
		{name:'intro',files:{"audio/mp3":"programs-common/music/Foniqz_-_03_-_Spectrum_Subdiffusion_Mix.mp3","audio/ogg":"programs-common/music/Foniqz_-_03_-_Spectrum_Subdiffusion_Mix.ogg"}},
		{name:'intro',files:{"audio/mp3":"programs-common/music/Miro_Belle_-_01_-_In_Fielder.mp3","audio/ogg":"programs-common/music/Miro_Belle_-_01_-_In_Fielder.ogg"}}
	];
}

function makeGenericalFormat(programname,title,modifier,description,tag) {
	logo="programs/"+modifier+"/logo.png";
	var musicintros={
		pick:"randomly",
		fromSet:"intros", // This identifier ensure that items will not repeat
		oneOf:makeMusicPlaylist()
	};
	var resources=JSTVT.can.animate?[
		{type:"stylesheet",url:"programs/"+modifier+"/stylesheet.program"+modifier+".css"},
		{type:"stylesheet",url:"programs/"+modifier+"/font/stylesheet.font"+modifier+".css"}
	]:null;
	return {
		title:title,
		description:description,
		//times:1,
		scheme:[
			{
				scene:{
					resources:resources,
					musicIntro:musicintros,
					renderer:"simpleintro",
					type:"programintro program-"+modifier,
					program:title,
					description:description,
					logo:logo
				}
			},
			{
				tag:tag.concat(["type-video"]),
				times:[1,1],
				allowNoItems:true,
				beforeScene:{
					musicIntro:musicintros,
					musicOutro:{stop:true},
					renderer:"simpleintro",
					type:"sectionintro section-rollingstart program-"+modifier,
					showInSchedule:1,
					backgroundImage:{pick:"image"},
					program:title,
					title:"Rolling Start",
					subtitle:"Videos",
					image:"programs-common/sprites/rollingstart.png",
					logo:logo
				},
				scene:[
					{
						renderer:"youtube",
						tag:{pick:"tag"},
						title:{pick:"title"},
						videoId:{pick:"video.id"},
						link:{pick:"link"}
					},
					{
						renderer:"simpleintro",
						type:"videooutro program-"+modifier,
						program:title,
						source:{pick:"source"},
						logo:logo,
						title:{pick:"title"},
						link:{pick:"link"},
						date:{pick:"date"}						
					}
				]
			},
			{
				tag:tag.concat(["type-news"]),
				times:[1,5],
				allowNoItems:true,
				beforeScene:{
					musicIntro:musicintros,
					renderer:"simpleintro",
					type:"sectionintro program-"+modifier,
					showInSchedule:1,
					program:title,
					title:"The Feed",
					subtitle:"News",
					image:"programs-common/sprites/news.png",
					logo:logo
				},
				scene:{
					musicOutro:{stop:true},
					renderer:"textstream",
					type:"rssfeed program-"+modifier,
					title:"Newsfeed",
					program:title,
					logo:logo,
					items:{
						pick:{
							tag:{pick:"tag"},
							source:{pick:"source"},
							image:{pick:"image",or:logo},
							title:{pick:"title"},
							text:{pick:"content"},
							link:{pick:"link"},
							date:{pick:"date"}							
						}
					}
				}
			},
			{
				tag:tag.concat(["type-image"]),
				times:[1,5],
				allowNoItems:true,
				beforeScene:{
					musicIntro:musicintros,
					renderer:"simpleintro",
					type:"sectionintro program-"+modifier,
					showInSchedule:1,
					program:title,
					title:"Screen Shooter",
					subtitle:"Slideshow",
					image:"programs-common/sprites/slideshow.png",
					logo:logo
				},
				scene:{
					musicOutro:{stop:true},
					renderer:"textstream",
					type:"slideshow program-"+modifier,
					title:"Screen Shooter",
					program:title,
					logo:logo,
					items:{
						pick:{
							tag:{pick:"tag"},
							source:{pick:"source"},
							image:{pick:"image"},
							title:{pick:"title"},
							link:{pick:"link"},
							date:{pick:"date"}							
						}
					}
				}
			},
			{
				tag:tag.concat(["type-video"]),
				times:[1,3],
				allowNoItems:true,
				beforeScene:{
					musicIntro:musicintros,
					musicOutro:{stop:true},
					renderer:"simpleintro",
					type:"sectionintro program-"+modifier,
					showInSchedule:1,
					backgroundImage:{pick:"image"},
					program:title,
					title:"Cinema",
					subtitle:"Videos",
					image:"programs-common/sprites/video.png",
					logo:logo
				},
				scene:[
					{
						renderer:"youtube",
						tag:{pick:"tag"},
						title:{pick:"title"},
						videoId:{pick:"video.id"},
						link:{pick:"link"}
					},
					{
						renderer:"simpleintro",
						type:"videooutro program-"+modifier,
						program:title,
						source:{pick:"source"},
						logo:logo,
						title:{pick:"title"},
						link:{pick:"link"},
						date:{pick:"date"}						
					}
				]
			},
			{
				tag:tag.concat(["type-tweet"]),
				times:[1,5],
				allowNoItems:true,
				beforeScene:{
					musicIntro:musicintros,
					renderer:"simpleintro",
					type:"sectionintro program-"+modifier,
					showInSchedule:1,
					program:title,
					title:"Short/Live",
					subtitle:"Tweet",
					image:"programs-common/sprites/tweet.png",
					logo:logo
				},
				scene:{
					musicOutro:{stop:true},
					renderer:"textstream",
					type:"tweet program-"+modifier,
					title:"Short/Live",
					program:title,
					logo:logo,
					items:{
						pick:{
							tag:{pick:"tag"},
							source:{pick:"source"},
							image:{pick:"image",or:logo},
							title:{pick:"title"},
							text:{pick:"content"},
							link:{pick:"link"},
							date:{pick:"date"}							
						}
					}
				}
			},
			{
				scene:{
					musicOutro:{stop:true},
					renderer:"simpleintro",
					type:"programoutro program-"+modifier,
					program:title,
					logo:logo,
					description:description,
					title:{pick:"title"},
					subtitle:"Presented by "+programname
				}
			}
			
		]
	};
}

function makePeopleProgram(programname) {
	var title="IMHO";
	var description="Random thoughts from random people from gaming industry";
	var modifier="imho";
	var logo="programs/"+modifier+"/logo.png";
	var musicintros={
		pick:"randomly",
		oneOf:makeMusicPlaylist()
	};
	var resources=JSTVT.can.animate?[
		{type:"stylesheet",url:"programs/"+modifier+"/stylesheet.program"+modifier+".css"},
		{type:"stylesheet",url:"programs/"+modifier+"/font/stylesheet.font"+modifier+".css"}
	]:null;
	return {
		title:title,
		description:description,
		scheme:[	
			{
				scene:{
					resources:resources,
					renderer:"simpleintro",
					type:"programintro program-"+modifier,
					musicIntro:musicintros,
					program:title,
					description:description,
					logo:logo
				}
			},
			{
				tag:["people","type-tweet"],
				times:[1,5],
				allowNoItems:true,
				beforeScene:{
					renderer:"simpleintro",
					type:"sectionintro program-"+modifier,
					musicIntro:musicintros,
					showInSchedule:1,
					program:title,
					title:"Cicero",
					subtitle:"Tweet",
					image:"programs-common/sprites/tweet.png",
					logo:logo
				},
				scene:{
					renderer:"textstream",
					type:"tweet program-"+modifier,
					musicOutro:{stop:true},
					title:"Newsfeed",
					program:title,
					logo:logo,
					items:{
						pick:{
							tag:{pick:"tag"},
							source:{pick:"source"},
							image:{pick:"image",or:logo},
							title:{pick:"title"},
							text:{pick:"content"},
							link:{pick:"link"},
							date:{pick:"date"}
						}
					}
				}
			},
			{
				tag:["people","type-image"],
				times:[1,5],
				allowNoItems:true,
				beforeScene:{
					renderer:"simpleintro",
					type:"sectionintro program-"+modifier,
					musicIntro:musicintros,
					showInSchedule:1,
					program:title,
					title:"Still Life",
					subtitle:"Slideshow",
					image:"programs-common/sprites/slideshow.png",
					logo:logo
				},
				scene:{
					renderer:"textstream",
					type:"slideshow program-"+modifier,
					title:"Screen Shooter",
					musicOutro:{stop:true},
					program:"IMHO",
					logo:logo,
					items:{
						pick:{
							tag:{pick:"tag"},
							source:{pick:"source"},
							image:{pick:"image"},
							title:{pick:"title"},
							link:{pick:"link"},
							date:{pick:"date"}							
						}
					}
				}
			},
			{
				tag:["people","type-news"],
				times:[1,5],
				allowNoItems:true,
				beforeScene:{
					renderer:"simpleintro",
					type:"sectionintro program-"+modifier,
					musicIntro:musicintros,
					showInSchedule:1,
					program:title,
					title:"TL;DR",
					subtitle:"News",
					image:"programs-common/sprites/news.png",
					logo:logo
				},
				scene:{
					renderer:"textstream",
					type:"rssfeed program-"+modifier,
					musicOutro:{stop:true},
					title:"Newsfeed",
					program:title,
					logo:logo,
					items:{
						pick:{
							tag:{pick:"tag"},
							source:{pick:"source"},
							image:{pick:"image",or:logo},
							title:{pick:"title"},
							text:{pick:"content"},
							link:{pick:"link"},
							date:{pick:"date"}							
						}
					}
				}
			},
			{
				tag:["people","type-video"],
				times:[1,3],
				allowNoItems:true,
				beforeScene:{
					renderer:"simpleintro",
					type:"sectionintro program-"+modifier,
					musicIntro:musicintros,
					musicOutro:{stop:true},
					showInSchedule:1,
					backgroundImage:{pick:"image"},
					program:title,
					title:"Flipbook",
					subtitle:"Videos",
					image:"programs-common/sprites/video.png",
					logo:logo
				},
				scene:[
					{
						renderer:"youtube",
						tag:{pick:"tag"},
						title:{pick:"title"},
						videoId:{pick:"video.id"},
						link:{pick:"link"}
					},
					{
						renderer:"simpleintro",
						type:"videooutro program-"+modifier,
						program:title,
						source:{pick:"source"},
						logo:logo,
						title:{pick:"title"},
						link:{pick:"link"},
						date:{pick:"date"}						
					}
				]
			},
			{
				scene:{
					musicOutro:{stop:true},
					renderer:"simpleintro",
					type:"programoutro program-"+modifier,
					program:title,
					logo:logo,
					description:description,
					title:{pick:"title"},
					subtitle:"Presented by "+programname
				}
			}
		]
	};
}

function makeChannel() {
	var channelName="Gamecora TV";
	var channelDescription="Gaming info from their sources. Nobody in the middle.";
	return {
		name:channelName,
		description:channelDescription,
		logo:"GTV",
		width:640,
		height:390,
		path:"gamecora/",
		poster:"poster.png",
		posterButton:"posterbutton.png",
		sources:"sources/all.json",
		sourcesProcessor:{
			shuffle:true,
			count:50
			//tag:["nintendo"]
		},
		materialProcessor:{
			shuffle:true,
		},
		programProcessor:{
			shuffle:true
		},
		channelIntro:[
			{
				resources:JSTVT.can.animate?[
					{type:"stylesheet",url:"programs/gamecora/stylesheet.programgamecora.css"},
					{type:"stylesheet",url:"programs/gamecora/font/stylesheet.fontgamecora.css"}
				]:null,
				renderer:"simpleintro",
				type:"programintro program-gamecora",
				text1:"Game",
				text2:"Cora",
				text3:"TV",
				title:channelName,
				description:channelDescription
			}		
		],
		programModels:[			
			makeGenericalFormat(channelName,"Independents Day","independentsday","Random gaming news from independent studios",["independent"]),
			makeGenericalFormat(channelName,"Strawberry Roll","strawberryroll","Random gaming news from Nintendo",["nintendo"]),
			makeGenericalFormat(channelName,"Lime Roll","limeroll","Random gaming news from Microsoft",["microsoft"]),
			makeGenericalFormat(channelName,"Blueberry Roll","blueberryroll","Random gaming news from Sony",["sony"]),
			makeGenericalFormat(channelName,"The Old Continent","oldcontinent","Random news from European Studios",["europe"]),
			makeGenericalFormat(channelName,"Rising Sun","risingsun","Random news from Japan Studios",["japan"]),
			makeGenericalFormat(channelName,"Mr. Fogg","mrfogg","Random news from the rest of the world",["world"]),
			makeGenericalFormat(channelName,"Turtle Island","turtleisland","Random news from American Studios",["america"]),
			makeGenericalFormat(channelName,"Party Triple","partytriple","Random news from Misc Third Party companies",["thirdparty"]),
			makeGenericalFormat(channelName,"Sakana Scene","sakanascene","Random news from Indie scene",["indie"]),
			makePeopleProgram(channelName)
		]
	}
}