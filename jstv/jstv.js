/* JSTV embeds and handles JSTV channel */
var JSTV={
	configuration: {
		/* Project name - shown on menu screen */
		name: "JSTV",
		/* Project version - shown on menu screen */
		version: "0.1b",
		/* Project URL - shown on menu screen */
		url: "http://www.kesiev.com/gamecoratv/index-jstv.html",
		/* Disclaimer - is shown in every JSTV screen */
		disclaimer: "JSTV is still in beta. Video playback could be limited by your browser vendor and/or video publisher. Medias are owned by their original publisher and not endorsed with this site."
	},
	/* Player loader state machine states */
	readyStates: {
		ERROR: -100,
		LOADCHANNEL: 1,
		LOADFEEDS: 2,
		LOADSCENES: 3,
		READY: 4,
		GO: 100
	},
	readyStateLabels: {
		"-100": "Error while starting up.",
		"1": "Loading channels...",
		"2": "Loading feeds...",
		"3": "Loading scenes...",
		"4": "Ready!",
		"1000": "Running!"
	},
	/* GUI elements - described as JSON. Are applied online in order to avoid CSS clash */
	models:{
		touch:{
			/* Focus getter */
			tvfocusgetter:{type:"div",style:{display:"none",zIndex:999999,position:"absolute",left:0,right:0,bottom:0,height:"60px",padding:0,margin:0,border:"0 none"}},
			/* Toolbar */
			toolbar:{type:"div",style:{zIndex:9999999,VendorTransition:"all 0.3s",position:"absolute",left:0,right:0,bottom:"-60px",height:"60px",fontFamily:"sans-serif",fontSize:"12px"}},
			toolbarprogram:{type:"div",style:{position:"absolute",left:0,right:0,top:0,height:"20px",backgroundColor:"#333",color:"#eee",padding:"5px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",lineHeight:"10px",borderTop:"1px solid #000"}},
			toolbarknobs:{type:"div",style:{VendorTransition:"all 0.3s",position:"absolute",left:0,right:0,bottom:0,height:"40px",backgroundColor:"#333",color:"#fff"}},
			/* Knob components */
			position:{type:"div",style:{position:"absolute",left:0,top:"5px",height:"1px",width:"1px"}},
			knob:{type:"div",style:{cursor:"pointer",position:"absolute",left:"100%",top:"-12px",left:"-12px",height:"25px",width:"25px",VendorBorderRadius:"16px",backgroundColor:"#ddd",VendorBoxShadow:"0 0px 5px #000"}},
			positionbar:{type:"div",style:{VendorTransition:"all 0.5s",position:"absolute",left:"110px",top:"14px",height:"10px",backgroundColor:"#999",VendorBorderRadius:"8px",VendorBoxShadow:"inset 0 2px 10px #000"}},
			positionbarsmall:{type:"div",style:{right:"220px"}},
			positionbarbig:{type:"div",style:{right:"70px"}},			
			volumebar:{type:"div",style:{VendorTransition:"all 0.5s",position:"absolute",right:"70px",top:"14px",height:"10px",backgroundColor:"#f00",VendorBorderRadius:"8px",VendorBoxShadow:"inset 0 2px 10px #000"}},
			volumebarsmall:{type:"div",style:{width:0,overflow:"hidden"}},
			volumebarbig:{type:"div",style:{width:"110px",overflow:"visible"}},
			/* Buttons */
			volumebutton:{type:"div",style:{cursor:"pointer",position:"absolute",right:0,top:0,bottom:0,width:"41px",backgroundPosition:"center",backgroundRepeat:"no-repeat"},set:{title:"Volume"}},
			fullscreenbutton:{type:"div",style:{cursor:"pointer",position:"absolute",left:0,top:0,bottom:0,width:"41px",backgroundPosition:"center",backgroundRepeat:"no-repeat"},set:{title:"Toggle fullscreen"}},
			menubutton:{type:"div",style:{cursor:"pointer",position:"absolute",left:"42px",top:0,bottom:0,width:"41px",backgroundPosition:"center",backgroundRepeat:"no-repeat"},set:{title:"Menu"}}
		},
		classic:{
			/* Focus getter */
			tvfocusgetter:{display:"none",zIndex:999999,type:"div",style:{position:"absolute",left:0,right:0,bottom:0,height:"30px",padding:0,margin:0,border:"0 none"}},
			/* Toolbar */
			toolbar:{type:"div",style:{zIndex:9999999,VendorTransition:"all 0.3s",position:"absolute",left:0,right:0,bottom:"-60px",height:"50px",fontFamily:"sans-serif",fontSize:"12px"}},
			toolbarprogram:{type:"div",style:{position:"absolute",left:0,right:0,top:0,height:"20px",backgroundColor:"#333",color:"#eee",padding:"5px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",lineHeight:"10px",borderTop:"1px solid #000"}},
			toolbarknobs:{type:"div",style:{VendorTransition:"all 0.3s",position:"absolute",left:0,right:0,bottom:0,height:"30px",backgroundColor:"#333",color:"#fff"}},
			/* Knob components */
			position:{type:"div",style:{position:"absolute",left:0,top:"4px",height:"1px",width:"1px"}},
			knob:{type:"div",style:{cursor:"pointer",position:"absolute",left:"100%",top:"-8px",left:"-8px",height:"16px",width:"16px",VendorBorderRadius:"16px",backgroundColor:"#ddd",VendorBoxShadow:"0 0px 5px #000"}},
			positionbar:{type:"div",style:{VendorTransition:"all 0.5s",position:"absolute",left:"80px",top:"11px",height:"8px",backgroundColor:"#999",VendorBorderRadius:"8px",VendorBoxShadow:"inset 0 2px 10px #000"}},
			positionbarsmall:{type:"div",style:{right:"200px"}},
			positionbarbig:{type:"div",style:{right:"50px"}},
			volumebar:{type:"div",style:{VendorTransition:"all 0.5s",position:"absolute",right:"45px",top:"11px",height:"8px",backgroundColor:"#f00",VendorBorderRadius:"8px",VendorBoxShadow:"inset 0 2px 10px #000"}},
			volumebarsmall:{type:"div",style:{width:0,overflow:"hidden"}},
			volumebarbig:{type:"div",style:{width:"130px",overflow:"visible"}},
			/* Buttons */
			volumebutton:{type:"div",style:{cursor:"pointer",position:"absolute",right:0,top:0,bottom:0,width:"31px",backgroundPosition:"center",backgroundRepeat:"no-repeat"},set:{title:"Volume"}},
			fullscreenbutton:{type:"div",style:{cursor:"pointer",position:"absolute",left:0,top:0,bottom:0,width:"31px",backgroundPosition:"center",backgroundRepeat:"no-repeat"},set:{title:"Toggle fullscreen"}},
			menubutton:{type:"div",style:{cursor:"pointer",position:"absolute",left:"32px",top:0,bottom:0,width:"31px",backgroundPosition:"center",backgroundRepeat:"no-repeat"},set:{title:"Menu"}}
		},
		/* General */
		centerVertically:{type:"div",style:{position:"absolute",width:"100%",height:"50%"}},
		/* TV and scene stuff */
		tvcontainer:{type:"div",style:{position:"relative",top:"auto",width:"100%",height:"100%",VendorTouchCallout:"none",VendorUserSelect:"none",VendorUserSelect:"none",left:"auto",backgroundColor:"#000",overflow:"hidden",fontSize:"12px",padding:0,margin:0,border:"0 none"}},
		tv:{type:"div",style:{VendorTransformOrigin:"left top",backgroundColor:"#000",overflow:"hidden",position:"absolute"}},
		scene:{type:"div",style:{position:"absolute",left:0,top:"100%",width:"100%",height:"100%",color:"#fff",backgroundColor:"#000",overflow:"hidden"},set:{innerHTML:"",className:"scene"}},
		channelLogo:{type:"div",style:{VendorOpacity:"0.8",position:"absolute",zIndex:9999999,right:0,bottom:"15px",color:"#909090",padding:"2px 10px 2px 2px",backgroundColor:"#fff",fontSize:"18px",fontFamily:"sans-serif",letterSpacing:"-1px"}},
		/* Menu screen */
		menu:{type:"div",style:{zIndex:9999999,position:"absolute",left:0,top:0,right:0,bottom:0,backgroundColor:"#333",color:"#fff",fontFamily:"sans-serif",fontSize:"12px",padding:"10px"}},
		menuheader:{type:"div",style:{left:"5px",top:"5px",lineHeight:"20px",color:"#777",fontWeight:"bold",VendorTextShadow:"-1px -1px 1px #000",marginBottom:"10px",paddingBottom:"5px",borderBottom:"1px solid #777"},set:{innerHTML:"Settings"}},
		menuitem:{type:"div",style:{left:"5px",right:"5px",lineHeight:"20px",whiteSpace:"nowrap",overflow:"hidden"}},
		menulabel:{type:"span",style:{marginLeft:"5px"}},
		menucheckbox:{type:"input",attrs:{type:"checkbox"}},
		menuconfirm:{type:"div",style:{cursor:"pointer",position:"absolute",right:"10px",width:"60px",bottom:"50px",height:"30px",backgroundColor:"#d00",color:"#fff",textAlign:"center",lineHeight:"30px",fontWeight:"bold"},set:{innerHTML:"OK"}},
		menucredits:{type:"div",style:{position:"absolute",overflow:"hidden",left:"10px",right:"70px",bottom:"50px",fontSize:"12px"}},
		/* Splash and loading screens */
		loadingScene:{type:"div",style:{zIndex:3,position:"absolute",left:0,top:0,width:"100%",height:"100%",color:"#fff",backgroundColor:"#333",fontFamily:"sans-serif",overflow:"hidden",fontSize:"12px"}},
		loadingGauge:{type:"div",style:{position:"absolute",bottom:"-10px",height:"20px",left:"10px",right:"10px",backgroundColor:"#222",VendorBoxShadow:"-1px -1px 1px #000"}},
		loadingGaugeValue:{type:"div",style:{height:"100%",width:"0%",backgroundColor:"#d00",VendorBoxShadow:"inset 0 -2px 2px #800"}},
		loadingGaugeValueError:{type:"div",style:{backgroundColor:"#777",VendorBoxShadow:"inset 0 -2px 2px #333"}},
		loadingLabel:{type:"div",style:{position:"absolute",bottom:"20px",left:"10px",right:"10px",textAlign:"center",color:"#777",fontWeight:"bold",VendorTextShadow:"-1px -1px 1px #000",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}},
		disclaimer:{type:"div",style:{position:"absolute",left:"10px",bottom:"10px",right:"10px",fontSize:"12px",maxHeight:"24px",color:"#777",textAlign:"center",lineHeight:"12px",overflow:"hidden"}},
		standByScene:{type:"div",style:{width:"100%",height:"100%",backgroundColor:"#333"}},
		standByName:{type:"div",style:{VendorTransition:"all 4s ease 0s",VendorOpacity:0,position:"absolute",left:"10px",right:"10px",bottom:"10px",fontSize:"18px",fontWeight:"bold",color:"#eee",textAlign:"center",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",fontFamily:"sans-serif"}},
		standByLabel:{type:"div",style:{VendorTransition:"all 2s ease 0s",VendorOpacity:0,position:"absolute",left:"10px",right:"10px",bottom:"-10px",fontSize:"12px",color:"#eee",textAlign:"center",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",fontFamily:"sans-serif"},set:{innerHTML:"Please stand by"}},
		standByAnimation:{style:{VendorOpacity:"1"}},
		pressPlayScene:{type:"div",style:{zIndex:3,cursor:"pointer",position:"absolute",left:0,top:0,width:"100%",height:"100%",color:"#000",backgroundColor:"#000",overflow:"hidden"},set:{innerHTML:""}},
		pressPlayPosterButton:{type:"div",style:{position:"absolute",width:"100%",height:"100%",left:0,top:0,backgroundPosition:"center",backgroundRepeat:"no-repeat"}},		
		pressPlayPoster:{type:"div",style:{position:"absolute",width:"100%",height:"100%",left:0,top:0,backgroundPosition:"center",backgroundSize:"cover",VendorOpacity:"0.4"}},		
		pressPlayLabel:{type:"div",style:{position:"absolute",textDecoration:"underline",left:"10px",right:"10px",top:"10px",color:"#fff",lineHeight:"30px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontSize:"18px",fontWeight:"bold",fontFamily:"sans-serif"}},		
		pressPlaySublabel:{type:"div",style:{position:"absolute",left:"10px",right:"10px",top:"40px",color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontSize:"12px",fontFamily:"sans-serif"}}
	},
	initializationQueue: [],
	renderers: {},
	resources: {},
	playerJs: {
		/* ---
		 * PUBLIC API
		 * ---
		 */
		/* (PUBLIC) Generate stats data from loaded channel */
		getStatsData: function() {
			if (!this.cachedStats) {
				var ret = {
					schedule: [],
					sources: [],
					statsbytag: ["tag"],
					bytag: {
						tag: JSTVT.makeStatsTool()
					},
					logs: {}
				}, ne, endat, sceneentry, scene, tags, sect, val;
				// SCHEDULE
				for (var i = 0; i < this.channel.programs.length; i++) {
					ne = {
						tag: JSTVT.makeStatsTool()
					};
					for (var j in this.channel.programs[i]) ne[j] = this.channel.programs[i][j];
					ne.scenes = [];
					endat = this.channel.programs[i + 1] ? this.channel.programs[i + 1].startAt : this.channel.scenes.length;
					for (var j = this.channel.programs[i].startAt; j < endat; j++) {
						scene = this.channel.scenes[j];
						if (this.JSTV.renderers[scene.renderer] && this.JSTV.renderers[scene.renderer].getSchedules) {
							sceneentry = this.JSTV.renderers[scene.renderer].getSchedules(scene);
							if (sceneentry) ne.scenes = ne.scenes.concat(sceneentry);
						}
						if (this.JSTV.renderers[scene.renderer].getTags) {
							tags = this.JSTV.renderers[scene.renderer].getTags(scene);
							if (tags) for (var z = 0; z < tags.length; z++) {
								sect = tags[z].indexOf("-") == -1 ? "tag" : tags[z].substr(0, tags[z].indexOf("-"));
								val = tags[z].indexOf("-") == -1 ? tags[z] : tags[z].substr(tags[z].indexOf("-") + 1);
								if (!ret.bytag[sect]) {
									ret.bytag[sect] = JSTVT.makeStatsTool();
									ret.statsbytag.push(sect);
								}
								ret.bytag[sect].add(val);
								if (sect == "tag") ne.tag.add(val);
							}
						}
					}
					ne.tag.close();
					ret.schedule.push(ne);
				}
				for (var a in ret.bytag) ret.bytag[a].close();
				// SOURCES
				ret.sources = this.channel.sources;
				// REPORTER STATS
				if (window.JSTVC && JSTVC.reporter && JSTVC.reporter.logs.length) {
					ret.logs.reporter = {};
					for (var j = 0; j < JSTVC.reporter.logs.length; j++) {
						if (!ret.logs.reporter[JSTVC.reporter.logs[j].src]) ret.logs.reporter[JSTVC.reporter.logs[j].src] = {};
						if (!ret.logs.reporter[JSTVC.reporter.logs[j].src][JSTVC.reporter.logs[j].message]) ret.logs.reporter[JSTVC.reporter.logs[j].src][JSTVC.reporter.logs[j].message] = [];
						ret.logs.reporter[JSTVC.reporter.logs[j].src][JSTVC.reporter.logs[j].message].push(JSTVC.reporter.logs[j].value);
					}
				}
				// SOURCES STATS
				if (this.channel.logs && this.channel.logs.sources) {
					ret.logs.sources = {
						unused: []
					};
					for (var a in this.channel.logs.sources.unused) ret.logs.sources.unused.push(this.channel.logs.sources.unused[a]);
				}
				// FINALIZER STATS
				if (this.channel.logs && this.channel.logs.finalizer) {
					ret.logs.finalizer = {
						unused: {},
						unusedstats: JSTVT.makeStatsTool(),
						repeated: this.channel.logs.finalizer.repeated,
						worker: this.channel.logs.finalizer.worker
					};
					var cache = [];
					var idx = this.channel.logs.finalizer.unused;
					for (var a in idx.index) {
						for (var j = 0; j < idx.index[a].length; j++)
						if (cache.indexOf(idx.index[a][j]) == -1) {
							cache.push(idx.index[a][j]);
							if (idx.index[a][j].tag) for (var k = 0; k < idx.index[a][j].tag.length; k++)
							if (idx.index[a][j].tag[k].indexOf("-") == -1) ret.logs.finalizer.unusedstats.add(idx.index[a][j].tag[k]);
							if (!ret.logs.finalizer.unused[idx.index[a][j].type]) ret.logs.finalizer.unused[idx.index[a][j].type] = [];
							ret.logs.finalizer.unused[idx.index[a][j].type].push(idx.index[a][j].title)
						}
					}
					ret.logs.finalizer.unusedstats.close();
				}
				this.cachedStats = ret;
			}
			return this.cachedStats;
		},
		/* (PUBLIC) Generate HTML version of stats */
		getStats: function(withlink) {
			var stats = this.getStatsData();
			var link, out = {
				schedule: "<span class='jstv-schedule'>",
				sources: "<span class='jstv-sources'>",
				stats: "<span class='jstv-misc'>"
			};
			// SCHEDULE
			out.schedule += "<h1 class='jstv-channel-title'>" + JSTVT.htmlEntities(this.channel.name) + "</h1>";
			out.schedule += "<p class='jstv-channel-description'>" + JSTVT.htmlEntities(this.channel.description) + "</p>";
			out.schedule += "<p class='jstv-channel-subdescription'>" + this.channel.programs.length + " program" + (this.channel.programs.length == 1 ? "" : "s") + ( this.channel.sources ? " from " + this.channel.sources.length + " source" + (this.channel.sources.length == 1 ? "" : "s") + (this.channel.sourcesAvailable ? " picked from " + this.channel.sourcesAvailable : "") : "" ) + ".</p>";
			for (var i = 0; i < stats.schedule.length; i++) {
				link = "<a href=\"#" + this.node.id + "\" onclick=\"document.getElementById('" + this.node.id + "').js.seekAtScene(" + stats.schedule[i].startAt + ")\">";
				out.schedule += "<h2 class='jstv-program-title'>" + (withlink ? link : "") + JSTVT.htmlEntities(stats.schedule[i].title) + (withlink ? "</a>" : "") + "</h2>";
				if (stats.schedule[i].description) out.schedule += "<p class='jstv-program-description'>" + JSTVT.htmlEntities(stats.schedule[i].description) + "</p>";
				if (stats.schedule[i].tag.items.length) out.schedule += stats.schedule[i].tag.getCloud("jstv-tags jstv-program-tag", "jstv-tagsize-");
				if (stats.schedule[i].scenes.length) {
					for (var j = 0; j < stats.schedule[i].scenes.length; j++)
					out.schedule += "<div class='jstv-scene-priority-" + (stats.schedule[i].scenes[j].priority || 0) + "'>" + (stats.schedule[i].scenes[j].link ? "<a target='_blank' href='" + stats.schedule[i].scenes[j].link + "'>" : "") + JSTVT.htmlEntities(stats.schedule[i].scenes[j].title) + (stats.schedule[i].scenes[j].link ? "</a>" : "") + "</div>";
				}
			}
			out.schedule += "</span>";
			// SOURCES
			if ( stats.sources ) {
				out.sources += "<h2 class='jstv-program-sources'>Sources</h2><ul class='jstv-list'>";
				for (var i = 0; i < stats.sources.length; i++) {
					out.sources += "<li class='jstv-scene-source'><a target='_blank' href='" + stats.sources[i].url + "'>" + JSTVT.htmlEntities(stats.sources[i].description) + "</a>";
					if (stats.sources[i].notes) out.sources += "<br><span class='jstv-scene-source-notes'>"+JSTVT.htmlEntities(stats.sources[i].notes)+"</span>";
					if (stats.sources[i].about) out.sources += "<br>(<a target='_blank' href='" + stats.sources[i].about + "'>About...</a>)";				
					out.sources += "</li>";
				}
				out.sources += "</ul></span>";
			}
			// MISC
			var set;
			for (var i = 0; i < stats.statsbytag.length; i++) {
				set = stats.bytag[stats.statsbytag[i]];
				out.stats += "<h2 class='jstv-stat'>" + JSTVT.capitalize(stats.statsbytag[i]) + "</h2>";
				out.stats += "<ul class='jstv-tags jstv-stat-" + stats.statsbytag[i] + "'>";
				for (var j = 0; j < set.items.length; j++)
				out.stats += "<li class='jstv-tagsize-" + set.perten[set.items[j]] + "'>" + JSTVT.htmlEntities(set.items[j]) + "</li>";
				out.stats += "</ul>";
			}
			if (stats.logs && stats.logs.sources) {
				out.stats += "<h2 class='jstv-stat'>Sources Logs (unused sources)</h2>";
				out.stats += "<ul class='jstv-list'>";
				for (var i = 0; i < stats.logs.sources.unused.length; i++)
				out.stats += "<li><a target='_blank' href='" + stats.logs.sources.unused[i].url + "'>" + JSTVT.htmlEntities(stats.logs.sources.unused[i].description) + "</a></li>"
				out.stats += "</ul>";
			}
			if (stats.logs && stats.logs.finalizer) {
				out.stats += "<h2 class='jstv-stat'>Finalizer Logs (worker mode)</h2>";
				out.stats += "<p>" + (stats.logs.finalizer.worker ? "Yes" : "No");
				out.stats += "<h2 class='jstv-stat'>Finalizer Logs (unused material)</h2>";
				out.stats += stats.logs.finalizer.unusedstats.getCloud("jstv-tags jstv-unusedstats-tag", "jstv-tagsize-");
				out.stats += "<ul class='jstv-list'>";
				for (var i in stats.logs.finalizer.unused) {
					out.stats += "<li>" + JSTVT.htmlEntities(i);
					out.stats += "<ul class='jstv-list'>"
					for (var j = 0; j < stats.logs.finalizer.unused[i].length; j++)
					out.stats += "<li>" + JSTVT.htmlEntities(stats.logs.finalizer.unused[i][j]) + "</li>";
					out.stats += "</ul>";
					out.stats += "</li>";
				}
				out.stats += "</ul>";
				out.stats += "<h2 class='jstv-stat'>Finalizer Logs (repeated material)</h2>";
				out.stats += "<ul class='jstv-list'>";
				for (var i in stats.logs.finalizer.repeated) {
					out.stats += "<li><a target='_blank' href='" + stats.logs.finalizer.repeated[i].from.url + "'>" + JSTVT.htmlEntities(stats.logs.finalizer.repeated[i].from.name) + "</a> (";
					for (var j in stats.logs.finalizer.repeated[i].type) out.stats += j + ": " + stats.logs.finalizer.repeated[i].type[j] + " ";
					out.stats = out.stats.substr(0, out.stats.length - 1) + ")";
					out.stats += "<ul class='jstv-list'>"
					for (var j in stats.logs.finalizer.repeated[i].alike)
					out.stats += "<li><a target='_blank' href='" + stats.logs.finalizer.repeated[i].alike[j].url + "'>" + JSTVT.htmlEntities(stats.logs.finalizer.repeated[i].alike[j].name) + "</a>";
					out.stats += "</ul>";
					out.stats += "</li>";
				}
				out.stats += "</ul>";
			}
			if (stats.logs && stats.logs.reporter) {
				out.stats += "<h2 class='jstv-stat'>Reporter Logs</h2>"
				out.stats += "<ul class='jstv-list'>";
				for (var i in stats.logs.reporter) {
					out.stats += "<li>" + JSTVT.htmlEntities(i);
					out.stats += "<ul class='jstv-list'>"
					for (var j in stats.logs.reporter[i]) {
						out.stats += "<li>" + JSTVT.htmlEntities(j) + " (" + stats.logs.reporter[i][j].length + " log)";
						out.stats += "<ul class='jstv-list'>"
						for (var k = 0; k < stats.logs.reporter[i][j].length; k++)
						out.stats += "<li>" + JSTVT.htmlEntities(stats.logs.reporter[i][j][k]) + "</li>";
						out.stats += "</ul>";
						out.stats += "</li>";
					}
					out.stats += "</ul>";
					out.stats += "</li>";
				}
				out.stats += "</ul>";
			}
			out.stats += "</span>";
			return out;
		},
		/* ---
		 * SCENE RENDERER API (renderers/*.js)
		 * ---
		 */
		/* (SCENE RENDERER TOOLS) Calls a callback contextualized on the current player after a while */
		defer: function(cb, args, time) {
			var self = this;
			if (!args) args = [];
			return this.setTimeout(function() {
				cb.apply(self, args)
			}, time ? time : 1);
		},
		/* (SCENE RENDERER TOOLS) Replaces document setTimeout. Is automatically resetted on stop/seek */
		setTimeout: function(cb, time) {
			var id = setTimeout(cb, time);
			this.timeoutPool.push(id);
			return id;
		},
		/* (SCENE RENDERER TOOLS) Plays a music object {name:<logic name>,files:{<mime>:<file>,...}} or {stop:true} */
		playMusic: function(music) {
			this.musicPlayer.play(music);
		},
		/* (SCENE RENDERER TOOLS) Set player global volume */
		setVolume: function(volume, skipkonb) {
			volume = Math.floor(volume);
			if (volume < 0) volume = 0;
			if (volume > 100) volume = 100;
			this.volume = volume;
			if (!skipkonb) this.volumeKnob.setAt(volume);
			if (this.currentScene && this.currentScene.renderer && this.JSTV.renderers[this.currentScene.renderer].setVolume) this.JSTV.renderers[this.currentScene.renderer].setVolume(this, this.currentLayer, this.currentScene, volume);
			if (this.nextScene && this.nextScene.renderer && this.JSTV.renderers[this.nextScene.renderer].setVolume) this.JSTV.renderers[this.nextScene.renderer].setVolume(this, this.nextLayer, this.nextScene, volume);
			this.musicPlayer.setVolume(volume);
			this.JSTV.settingsManager.values.volume = volume;
			this.JSTV.settingsManager.save();
		},
		/* (PRIVATE) Resize the scene depending on GUI status */
		resizeTv: function(animated, forcescaled) {
			var scale, newsize;
			if (!this.guiIsAnimated) animated = false;
			var gap = this.actualGuiStatus ? this.toolbar.offsetHeight : 0;
			if (forcescaled) {
				handleresize = false;
				ensuregap = 0;
			} else {
				var handleresize = this.currentScene && this.currentScene.renderer && this.JSTV.renderers[this.currentScene.renderer].onResize;
				var ensuregap = this.currentScene && this.currentScene.renderer && this.JSTV.renderers[this.currentScene.renderer].getGap && this.JSTV.renderers[this.currentScene.renderer].getGap(this, this.currentLayer, this.currentScene);
			}
			if (gap < ensuregap) gap = ensuregap;
			if (handleresize || (this.screenIsScalable && JSTVT.can.transform)) {
				scale = this.node.offsetWidth / this.channel.width;
				var yscale = (this.node.offsetHeight - gap) / this.channel.height;
				if (yscale < scale) scale = yscale;
				newsize = {
					top: 0,
					width: this.channel.width * scale,
					height: this.channel.height * scale
				};
			} else {
				scale = 1;
				newsize = {
					top: -gap,
					width: this.channel.width,
					height: this.channel.height
				};
			}
			if (handleresize) {
				JSTVT.reset({
					style: {
						display: "block",
						VendorTransition: "none",
						width: newsize.width + "px",
						height: newsize.height + "px",
						top: newsize.top + "px",
						VendorTransform: "none",
						left: ((this.node.offsetWidth - newsize.width) / 2) + "px",
						top: ((this.node.offsetHeight - gap - newsize.height) / 2) + "px"
					}
				}, this.tv);
				this.JSTV.renderers[this.currentScene.renderer].onResize(this, this.currentLayer, this.currentScene, newsize);
			} else JSTVT.reset({
				style: {
					display: "block",
					VendorTransition: (animated ? "all 0.5s" : "none"),
					top: newsize.top + "px",
					width: this.channel.width + "px",
					height: this.channel.height + "px",
					VendorTransform: "scale(" + scale + ")",
					left: ((this.node.offsetWidth - newsize.width) / 2) + "px",
					top: ((this.node.offsetHeight - gap - newsize.height) / 2) + "px"
				}
			}, this.tv);
		},
		/* ---
		 * PRIVATE API - GUI
		 * ---
		 */
		/* (PRIVATE) Schedule a screen resize. Used to avoid screen resize flapping. */
		scheduleResizeTv: function() {
			if (this.ready == this.JSTV.readyStates.GO) {
				var self = this;
				this.tv.style.display = "none";
				if (this._resizetvtimeout) clearTimeout(this._resizetvtimeout);
				this._resizetvtimeout = setTimeout(function() {
					this._resizetvtimeout = null;
					self.resizeTv()
				}, 1500);
			}
		},
		/* (PRIVATE) Put the player in fullscreen state */
		gotoFullscreen: function() {
			if (this.fullScreenManager.isFullscreen()) this.fullScreenManager.cancelFullscreen()
			else this.fullScreenManager.setFullscreen(this.node);
		},
		/* (PRIVATE) Triggered when the player goes fullscreen */
		fullScreenStateChanged: function() {
			if (this.fullScreenManager.getFullscreenElement()) this.fullScreenManager.applyFullscreen(this.node);
			else this.fullScreenManager.unapplyFullscreen(this.node);
			this.scheduleResizeTv();
		},
		/* (PRIVATE) Show/Hide gui. Avoid flapping. */
		setGui: function(status) {
			this.guiStatus = status;
			if (!this.seekKnob.isKnobDragging && !this.volumeKnob.isKnobDragging) {
				if (this._pulseguitimeout) {
					clearTimeout(this._pulseguitimeout);
					this._pulseguitimeout = null;
				}
				this.actualGuiStatus = status;
				this.resizeTv(true);
				JSTVT.reset(this.guiModels.positionbarbig, this.positionBar, !this.guiIsAnimated);
				JSTVT.reset(this.guiModels.volumebarsmall, this.volumeBar, !this.guiIsAnimated);
				JSTVT.reset({
					style: {
						bottom: (status ? 0 : -this.toolbar.offsetHeight) + "px"
					}
				}, this.toolbar);
			}
		},
		/* (PRIVATE) Shows the GUI for a while. Can be called multiple times - the show timer is resetted. */
		pulseGui: function() {
			if (this.ready == this.JSTV.readyStates.GO) {
				var self = this;
				if (this._pulseguitimeout) {
					clearTimeout(this._pulseguitimeout);
					this._pulseguitimeout = null;
				} else this.setGui(true);
				this._pulseguitimeout = setTimeout(function() {
					self.setGui(false);
					self._pulseguitimeout = null;
				}, 2000)
			}
		},
		/* (PRIVATE) Sets, apply and saves the screen scale option */
		setScreenIsScalable: function(scalable) {
			scalable = scalable && JSTVT.can.transform;
			this.screenIsScalable = scalable;
			JSTV.settingsManager.values.screenIsScalable = scalable;
		},
		/* (PRIVATE) Sets, apply and saves the animated GUI */
		setGuiIsAnimated: function(animated) {
			animated = animated && JSTVT.can.animate;
			this.guiIsAnimated = animated;
			JSTV.settingsManager.values.guiIsAnimated = animated;
		},
		/* (PRIVATE) Sets, apply and saves the size of the GUI */
		setGuiIsLarge: function(size, apply) {
			this.guiIsLarge = size;
			JSTV.settingsManager.values.guiIsLarge = size;
			this.guiModels = size ? this.JSTV.models.touch : this.JSTV.models.classic;
			JSTVT.reset(this.guiModels.position, this.seekKnobPosition, !this.guiIsAnimated);
			JSTVT.reset(this.guiModels.tvfocusgetter, this.tvfocusgetter, !this.guiIsAnimated);
			JSTVT.reset(this.guiModels.toolbar, this.toolbar, !this.guiIsAnimated);
			JSTVT.reset(this.guiModels.toolbarprogram, this.toolbarProgram, !this.guiIsAnimated);
			JSTVT.reset(this.guiModels.toolbarknobs, this.toolbarKnobs, !this.guiIsAnimated);
			JSTVT.reset(this.guiModels.positionbar, this.positionBar, !this.guiIsAnimated);
			JSTVT.reset(this.guiModels.knob, this.seekKnob, !this.guiIsAnimated);
			JSTVT.reset(this.guiModels.knob, this.volumeKnob, !this.guiIsAnimated);
			JSTVT.reset(this.guiModels.volumebar, this.volumeBar, !this.guiIsAnimated);
			JSTVT.reset(this.guiModels.position, this.volumeKnobPosition, !this.guiIsAnimated);
			JSTVT.reset(this.guiModels.volumebutton, this.volumeButton, !this.guiIsAnimated);
			JSTVT.reset(this.guiModels.menubutton, this.menuButton, !this.guiIsAnimated);
			JSTVT.reset(this.guiModels.fullscreenbutton, this.fullscreenButton, !this.guiIsAnimated);
		},
		/* (PRIVATE) Sets, apply and saves the fullscreen mode */
		setNativeFullscreen: function(mode) {
			var self = this;
			mode = mode && JSTVT.can.fullscreen;
			this.fullScreenManager.offFullscreen(this);
			JSTV.settingsManager.values.nativeFullscreen = mode;
			this.fullScreenManager.nativeFullscreen = mode;
			this.fullScreenManager.onFullscreen(function(e) {
				self.fullScreenStateChanged()
			}, this);
		},
		/* (PRIVATE) Shows and handle the settings/stop screen */
		menu: function() {
			var menuitem, self = this;
			this.ready = this.JSTV.readyStates.MENU;
			this.setGui(false);
			this.stopScene();
			this.menupanel = JSTVT.make(this.JSTV.models.menu, this.node);
			JSTVT.make(this.JSTV.models.disclaimer, this.menupanel).innerHTML = this.JSTV.configuration.disclaimer;
			JSTVT.make(this.JSTV.models.menucredits, this.menupanel).innerHTML = "<a target='_blank' style='color:#fff' href='" + this.JSTV.configuration.url + "'><b>" + this.JSTV.configuration.name + "</b></a> " + this.JSTV.configuration.version;
			JSTVT.make(this.JSTV.models.menuheader, this.menupanel);
			// Larger controls
			menuitem = JSTVT.make(this.JSTV.models.menuitem, this.menupanel);
			var largercontrols = JSTVT.make(this.JSTV.models.menucheckbox, menuitem);
			largercontrols.checked = this.guiIsLarge;
			JSTVT.make(this.JSTV.models.menulabel, menuitem).innerHTML = "Use larger controls";
			// Native fullscreen
			menuitem = JSTVT.make(this.JSTV.models.menuitem, this.menupanel);
			var nativefullscreen = JSTVT.make(this.JSTV.models.menucheckbox, menuitem);
			var nativefullscreendisabled = this.fullScreenManager.isFullscreen() || !JSTVT.can.fullscreen;
			nativefullscreen.checked = this.fullScreenManager.nativeFullscreen;
			nativefullscreen.disabled = nativefullscreendisabled;
			JSTVT.make(this.JSTV.models.menulabel, menuitem).innerHTML = "Use HTML5 fullscreen";
			// GUI Animation
			menuitem = JSTVT.make(this.JSTV.models.menuitem, this.menupanel);
			var animatedgui = JSTVT.make(this.JSTV.models.menucheckbox, menuitem);
			var animatedguidisabled = !JSTVT.can.animate;
			animatedgui.checked = this.guiIsAnimated;
			animatedgui.disabled = animatedguidisabled;
			JSTVT.make(this.JSTV.models.menulabel, menuitem).innerHTML = "Use CSS3 animated GUI";
			// Transform on scene
			menuitem = JSTVT.make(this.JSTV.models.menuitem, this.menupanel);
			var screenscalable = JSTVT.make(this.JSTV.models.menucheckbox, menuitem);
			var screenscalabledisabled = !JSTVT.can.transform;
			screenscalable.checked = this.screenIsScalable;
			screenscalable.disabled = screenscalabledisabled;
			JSTVT.make(this.JSTV.models.menulabel, menuitem).innerHTML = "Scale scenes with CSS3 transformations";
			// Close
			var menuitem = JSTVT.make(this.JSTV.models.menuconfirm, this.menupanel);
			JSTVT.registerEvent(menuitem, JSTVT.configuration.interaction.events.start, function() {
				self.closeMenu();
				if (!nativefullscreendisabled) self.setNativeFullscreen(JSTVT.can.fullscreen && nativefullscreen.checked)
				if (!animatedguidisabled) self.setGuiIsAnimated(animatedgui.checked);
				if (!screenscalabledisabled) self.setScreenIsScalable(screenscalable.checked);
				self.setGuiIsLarge(largercontrols.checked, true);
				JSTV.settingsManager.save();
				self.run();
			});
		},
		/* (PRIVATE) Closes menu */
		closeMenu: function() {
			if (this.menupanel) this.node.removeChild(this.menupanel);
			this.menupanel=null;
		},
		/* ---
		 * PRIVATE API - SCENE/PROGRAM FLOW
		 * ---
		 */
		/* (PRIVATE) Get a pointer to a program by a scene index */
		getProgramByScene: function(scene) {
			for (var i = this.channel.programs.length - 1; i >= 0; i--)
			if (scene >= this.channel.programs[i].startAt) return this.channel.programs[i];
			return null;
		},
		/* (PRIVATE) Prepares the scene status for the next scene to be played */
		prepareNextScene: function() {
			this.nextScene.onAir = false;
			JSTVT.reset(this.JSTV.models.scene, this.nextLayer);
			this.nextLayer.id = "scene-" + Math.floor(Math.random() * 100000);
			if (this.nextScene && this.nextScene.renderer) this.JSTV.renderers[this.nextScene.renderer].prepare(this, this.nextLayer, this.nextScene);
		},
		/* (PRIVATE) Reset all of the timers registerd with local setTimeout command. */
		resetProgramTimers: function() {
			for (var i = 0; i < this.timeoutPool.length; i++) clearTimeout(this.timeoutPool[i]);
			this.timeoutPool = [];
		},
		/* (PRIVATE) Ends the current progam and starts the next one */
		gotoNextProgram: function() {
			var sw;
			delete this._startprogram;
			// Show toolbar picker
			this.tvfocusgetter.style.display = "block";
			// Unregister timers
			this.resetProgramTimers();
			// Next program
			this.currentSceneId = (this.currentSceneId + 1) % this.channel.scenes.length;
			this.currentScene = this.channel.scenes[this.currentSceneId];
			this.nextScene = this.channel.scenes[(this.currentSceneId + 1) % this.channel.scenes.length];
			// Swap programs
			sw = this.currentLayer;
			this.currentLayer = this.nextLayer;
			this.nextLayer = sw;
			// Wait next program
			this.currentSceneDuration = null;
			var durationcb = this.JSTV.renderers[this.currentScene.renderer].getDuration;
			if (durationcb) if (typeof duration == "function") this.currentSceneDuration = this.JSTV.renderers[this.currentScene.renderer].getDuration(this.currentScene);
			else this.currentSceneDuration = durationcb;
			if (this.currentSceneDuration) this.defer(this.gotoNextProgram, null, this.currentSceneDuration);
			// Place knob
			if (!this.seekKnob.isKnobDragging) this.seekKnob.setAt(this.currentSceneId);
			if (!this.volumeKnob.isKnobDragging) this.volumeKnob.setAt(this.volume);
			this.updateToolbarProgram(this.currentSceneId);
			// Prepare/start programs
			this.prepareNextScene();
			// Starts the current program
			this.currentProgram = this.getProgramByScene(this.currentSceneId);
			this.currentLayer.style.top = 0;
			this.currentScene.onAir = true;
			this.resizeTv();
			if (this.currentScene.renderer && this.JSTV.renderers[this.currentScene.renderer].onAir) this.JSTV.renderers[this.currentScene.renderer].onAir(this, this.currentLayer, this.currentScene);
			this.defer(function() {
				this.currentLayer.className += " onair"
			});
		},
		/* (PRIVATE) Updates the small textbar with scene details on the tool bar depending on a particular scene ID */
		updateToolbarProgram: function(scene) {
			var title = this.channel.scenes[scene].title;
			var link = this.channel.scenes[scene].link;
			if (!title) title = "";
			else title = "<span style='color:#999'>" + JSTVT.htmlEntities(title) + "</a>";
			var program = this.getProgramByScene(scene);
			if (program) this.toolbarProgram.innerHTML = "<b>" + JSTVT.htmlEntities(program.title) + "</b> - " + program.description + (title ? " " + title : "");
			else this.toolbarProgram.innerHTML = title;
		},
		/* (PRIVATE) Calculates the music played before the specified scene, using the "getClosingMusic" on scene renderers. */
		getPreviousMusic: function(scene) {
			var first = true,
				music = null,
				name = null,
				nextmusic = null,
				renderer;
			scene--;
			for (var i = scene; i >= 0; i--) {
				renderer = this.JSTV.renderers[this.channel.scenes[i].renderer];
				if (renderer.getClosingMusic && (nextmusic = renderer.getClosingMusic(this, this.channel.scenes[i]))) if (first || (nextmusic.name == name)) {
					first = false;
					music = nextmusic;
					name = music.name;
				} else break;
			}
			return music;
		},
		/* (PRIVATE) Stop the current scene. */
		stopScene: function() {
			// Hide toolbar picker
			this.tvfocusgetter.style.display = "none";
			// Send "onAbort" events on renderers
			if (this.currentScene && this.currentScene.renderer && this.JSTV.renderers[this.currentScene.renderer].onAbort) this.JSTV.renderers[this.currentScene.renderer].onAbort(this, this.currentLayer, this.currentScene);
			if (this.nextScene && this.nextScene.renderer && this.JSTV.renderers[this.nextScene.renderer].onAbort) this.JSTV.renderers[this.nextScene.renderer].onAbort(this, this.nextLayer, this.nextScene);
			// Remove loading screen
			if (this.loadingContainer) {
				this.node.removeChild(this.loadingContainer);
				delete this.loadingContainer;
			}
			// Stop timers
			this.resetProgramTimers();
			// Stop music
			this.musicPlayer.forceStop();
			// Reset scene
			JSTVT.reset(this.JSTV.models.scene, this.nextLayer);
			JSTVT.reset(this.JSTV.models.scene, this.currentLayer);
			this.currentLayer.style.top = 0;
		},
		/* (PRIVATE) Jumps to a particular scene */
		seekAtScene: function(scene) {
			if ((this.ready == this.JSTV.readyStates.READY) || (this.ready == this.JSTV.readyStates.MENU)) {
				if (this.ready == this.JSTV.readyStates.MENU) this.closeMenu();
				this.currentSceneId = scene;
				this.run();
			} else if (this.ready == this.JSTV.readyStates.GO) {
				this.stopScene();
				if (scene < 0) scene = 0;
				scene = scene % this.channel.scenes.length;
				// Update knob
				this.seekKnob.setAt(scene);
				this.updateToolbarProgram(scene);
				// Void current scene
				this.currentSceneId = scene - 1;
				this.currentScene = {};
				// Set next sceene
				this.nextScene = this.channel.scenes[scene];
				// Show seek screen
				this.resizeTv(false, true);
				var waitscreen = JSTVT.make(this.JSTV.models.standByScene, this.currentLayer);
				var center = JSTVT.make(this.JSTV.models.centerVertically, waitscreen);
				var name = JSTVT.make(this.JSTV.models.standByName, center);
				name.innerHTML = this.channel.name;
				var label = JSTVT.make(this.JSTV.models.standByLabel, center);
				this.defer(function() {
					JSTVT.reset(this.JSTV.models.standByAnimation, name);
					JSTVT.reset(this.JSTV.models.standByAnimation, label);
				}, null, 1);
				// Prepare seek
				this.defer(this.prepareSeek, null, 1000);
			}
		},
		/* (PRIVATE) Prepares the program jump */
		prepareSeek: function() {
			var previousmusic = this.getPreviousMusic(this.currentSceneId + 1);
			this.defer(function() {
				if (previousmusic && !previousmusic.stop) this.musicPlayer.play(previousmusic);
				this.prepareNextScene(previousmusic);
				this.defer(this.gotoNextProgram, null, 2000);
			}, null, 1000);
		},
		/* ---
		 * PRIVATE API - LOADING PHASE
		 * ---
		 */
		/* (PRIVATE) Shows an error message and stops the player */
		loadErrorMessage: function(message) {
			this.loadingContainer.loadingLabel.innerHTML = message;
			JSTVT.reset(this.JSTV.models.loadingGaugeValueError, this.loadingGaugeValue);
			this.ready = this.JSTV.readyStates.ERROR;
		},
		/* (PRIVATE) Shows a loading progress update */
		loadMessage: function() {
			this.loadingContainer.loadingLabel.innerHTML = this.JSTV.readyStateLabels[this.ready];
			this.loadingGaugeValue.style.width = ((this.filesLoaded / this.filesToLoad) * 100) + "%";
		},
		/* (PRIVATE) Triggered externally on load error */
		onError: function(type, resource, resourcedata) {
			this.loadErrorMessage("Error loading " + type + " " + resource);
		},
		/* (PRIVATE) Triggered externally when a resource started to load */
		onStartedLoading: function(type, resource, resourcedata) {
			this.filesToLoad++;
			this.loadMessage();
		},
		/* (PRIVATE) Triggered externally when the current status is pending (time undefined) */
		onPending: function(msg, pc) {
			this.loadingContainer.loadingLabel.innerHTML = this.JSTV.readyStateLabels[this.ready] + " - " + msg;
			this.loadingGaugeValue.style.width = (pc * 100) + "%";
		},
		/* (PRIVATE) Triggered externally when a resource was loaded */
		onLoad: function(type, resource, resourcedata) {
			if (this.ready != this.JSTV.readyStates.ERROR) {
				this.filesLoaded++;
				this.loadMessage();
				switch (this.ready) {
					case this.JSTV.readyStates.LOADCHANNEL:
						{
							if (type == "channel") {
								var orgpath = JSTVT.getPath(this.channel);
								this.channel = JSTVT.jsonParse(resourcedata.data);
								if (!this.channel.path) this.channel.path = orgpath;
							}
							break;
						}
				}
				if (this.filesToLoad == this.filesLoaded) this.initializePhase(true);
			}
		},
		/* (PRIVATE) Starts the player */
		run: function() {
			this.ready = this.JSTV.readyStates.GO;
			this.channelLogo.innerHTML = this.channel.logo;
			this.seekKnob.setScale(this.channel.scenes.length - 1);
			this.seekAtScene(this.currentSceneId);
			var self = this;
			setTimeout(function() {
				self.pulseGui();
			}, 1);
		},
		/* (PRIVATE) Handles the state machine guiding the initialization progress */
		initializePhase: function(next) {
			if (next) this.ready++;
			this.filesLoaded = 0;
			this.filesToLoad = 0;
			var done = true;
			this.onStartedLoading("phase");
			switch (this.ready) {
				case this.JSTV.readyStates.LOADCHANNEL:
					{
						if (typeof this.channel == "string") {
							JSTV.resourcesManager.load("data", this.channel, this, "channel");
						}
						break;
					}
				case this.JSTV.readyStates.LOADFEEDS:
					{
						if (!this.channel.path) this.channel.path = "";
						if (this.channel.programModels) {
							if (window.JSTVC) JSTVC.fetch(this.channel, this);
							else this.loadErrorMessage("Can't show the specified channel. JSTVC missing.");
						}
						break;
					}
				case this.JSTV.readyStates.LOADSCENES:
					{
						var scene;
						for (var i = 0; i < this.channel.scenes.length; i++) {
							scene = this.channel.scenes[i];
							this.JSTV.loadRenderer(scene.renderer, this);
							if (scene.resources) for (var j = 0; j < scene.resources.length; j++)
							JSTV.resourcesManager.load(scene.resources[j].type, this.channel.path + scene.resources[j].url, this);
						}
						break;
					}
				case this.JSTV.readyStates.READY:
					{
						var self = this;
						if (this.callback) {
							this.callback.apply(this);
							this.callback = null;
						}
						if (this.channel.scenes.length) {
							JSTVT.reset(this.JSTV.models.pressPlayScene, this.loadingContainer);
							if (this.channel.poster) JSTVT.make(this.JSTV.models.pressPlayPoster, this.loadingContainer).style.backgroundImage = "url('" + JSTVT.applyPath(this.channel.poster, this.channel.path) + "')";
							if (this.channel.posterButton) JSTVT.make(this.JSTV.models.pressPlayPosterButton, this.loadingContainer).style.backgroundImage = "url('" + JSTVT.applyPath(this.channel.posterButton, this.channel.path) + "')";
							JSTVT.make(this.JSTV.models.disclaimer, this.loadingContainer).innerHTML = this.JSTV.configuration.disclaimer;
							JSTVT.make(this.JSTV.models.pressPlayLabel, this.loadingContainer).innerHTML = this.channel.name;
							JSTVT.make(this.JSTV.models.pressPlaySublabel, this.loadingContainer).innerHTML = this.channel.description;
							JSTVT.registerEvent(this.loadingContainer, "click", function() {
								self.run()
							});
							done = false;
						} else this.loadErrorMessage("Nothing to see today. :(");
						break;
					}
			}
			if (done) this.onLoad("phase");
		},
		/* ---
		 * PRIVATE API - INITIALIZATION
		 * ---
		 */
		/* (PRIVATE) Initializes the player and starts loading */
		initialize: function(channel, callback) {
			var self = this;
			this.currentSceneId = 0;
			this.guiIsAnimated = JSTV.settingsManager.values.guiIsAnimated;
			this.guiStatus = false;
			this.actualGuiStatus = false;
			this.filesToLoad = 0;
			this.filesLoaded = 0;
			this.volume = JSTV.settingsManager.values.volume;
			this.channel = channel;
			this.callback = callback;
			this.currentMusic = null;
			this.ready = this.JSTV.readyStates.LOADCHANNEL;
			this.timeoutPool = [];
			// TV LAYERS
			this.tv = JSTVT.make(this.JSTV.models.tv, this.node);
			this.currentLayer = JSTVT.make(this.JSTV.models.scene, this.tv);
			this.nextLayer = JSTVT.make(this.JSTV.models.scene, this.tv);
			this.channelLogo = JSTVT.make(this.JSTV.models.channelLogo, this.tv);
			// BARS
			this.tvfocusgetter = JSTVT.make(this.JSTV.models.classic.tvfocusgetter, this.node);
			this.toolbar = JSTVT.make(this.JSTV.models.classic.toolbar, this.node);
			this.toolbarProgram = JSTVT.make(this.JSTV.models.classic.toolbarprogram, this.toolbar);
			this.toolbarKnobs = JSTVT.make(this.JSTV.models.classic.toolbarknobs, this.toolbar);
			JSTVT.registerEvent(this.tvfocusgetter, JSTVT.configuration.interaction.events.hover, function(e) {
				self.pulseGui()
			});
			JSTVT.registerEvent(this.toolbar, JSTVT.configuration.interaction.events.hover, function(e) {
				self.pulseGui()
			});
			// POSITION BAR
			this.positionBar = JSTVT.make(this.JSTV.models.classic.positionbar, this.toolbarKnobs);
			JSTVT.reset(this.JSTV.models.classic.positionbarbig, this.positionBar);
			this.seekKnobPosition = JSTVT.make(this.JSTV.models.classic.position, this.positionBar);
			this.seekKnob = JSTVT.make(this.JSTV.models.classic.knob, this.seekKnobPosition);
			JSTVT.makeKnob(this.seekKnob, 0, this,
			null,

			function(position) {
				self.updateToolbarProgram(Math.floor(position));
			},

			function(position) {
				this.seekAtScene(Math.floor(position));
				self.pulseGui();
			});
			// VOLUME BAR
			this.volumeBar = JSTVT.make(this.JSTV.models.classic.volumebar, this.toolbarKnobs);
			JSTVT.reset(this.JSTV.models.classic.volumebarsmall, this.volumeBar);
			this.volumeKnobPosition = JSTVT.make(this.JSTV.models.classic.position, this.volumeBar);
			this.volumeKnob = JSTVT.make(this.JSTV.models.classic.knob, this.volumeKnobPosition);
			JSTVT.makeKnob(this.volumeKnob, 100, this,
			null,

			function(position) {
				self.setVolume(position, false);
			},

			function(position) {
				self.setVolume(position);
				self.pulseGui();
			});
			// VOLUME BUTTON
			this.volumeButton = JSTVT.make(this.JSTV.models.classic.volumebutton, this.toolbarKnobs);
			this.volumeButton.style.backgroundImage = "url(" + this.JSTV.relativePath + "icons/volume.png)";
			JSTVT.registerEvent(this.volumeButton, JSTVT.configuration.interaction.events.hover, function() {
				if (!self.seekKnob.isKnobDragging && !self.volumeKnob.isKnobDragging) {
					JSTVT.reset(self.guiModels.positionbarsmall, self.positionBar);
					JSTVT.reset(self.guiModels.volumebarbig, self.volumeBar);
				}
			})
			// MENU BUTTON
			this.menuButton = JSTVT.make(this.JSTV.models.classic.menubutton, this.toolbarKnobs);
			this.menuButton.style.backgroundImage = "url(" + this.JSTV.relativePath + "icons/menu.png)";
			JSTVT.registerEvent(this.menuButton, JSTVT.configuration.interaction.events.start, function(e) {
				self.menu();
				return JSTVT.cancelEvent(e)
			});
			// FULLSCREEN BUTTON
			this.fullScreenManager = JSTVT.makeFullscreenManager();
			this.fullscreenButton = JSTVT.make(this.JSTV.models.classic.fullscreenbutton, this.toolbarKnobs);
			this.fullscreenButton.style.backgroundImage = "url(" + this.JSTV.relativePath + "icons/fullscreen.png)";
			JSTVT.registerEvent(this.fullscreenButton, JSTVT.configuration.interaction.events.start, function(e) {
				self.gotoFullscreen();
				return JSTVT.cancelEvent(e)
			});
			JSTVT.registerEvent(window, "resize", function(e) {
				self.scheduleResizeTv()
			});
			this.setNativeFullscreen(JSTV.settingsManager.values.nativeFullscreen);
			// Set GUI Size
			this.setScreenIsScalable(JSTV.settingsManager.values.screenIsScalable);
			this.setGuiIsAnimated(JSTV.settingsManager.values.guiIsAnimated);
			this.setGuiIsLarge(JSTV.settingsManager.values.guiIsLarge);
			// MUSIC PLAYER
			this.musicPlayer = JSTVT.makeMusicPlayer(document.body, channel.path);
			this.setVolume(this.volume);
			// Loading scenes
			this.loadingContainer = JSTVT.make(this.JSTV.models.loadingScene, this.node);
			JSTVT.make(this.JSTV.models.disclaimer, this.loadingContainer).innerHTML = this.JSTV.configuration.disclaimer;
			var center = JSTVT.make(this.JSTV.models.centerVertically, this.loadingContainer);
			var gauge = JSTVT.make(this.JSTV.models.loadingGauge, center);
			this.loadingGaugeValue = JSTVT.make(this.JSTV.models.loadingGaugeValue, gauge);
			this.loadingContainer.loadingLabel = JSTVT.make(this.JSTV.models.loadingLabel, center);
			// Resize TV
			this.resizeTv();
			// Prepare to load
			this.initializePhase();
		}
	},
	/* ---
	 * PRIVATE API - RENDERER LOADER (common for all the loaded JSTV players)
	 * ---
	 */
	/* (PRIVATE) Loads a renderer (renderers/*) */
	loadRenderer: function(renderer, from) {
		this.resourcesManager.load(
			"javascript", this.relativePath + "renderers/" + renderer + ".js", from,
			"renderer", renderer, function() {}, null);
		this.resourcesManager.load("stylesheet", this.relativePath + "renderers/" + renderer + "." + renderer + ".css", from);
	},
	/* (PRIVATE) Called by a loaded renderer */
	rendererLoaded: function(name, code) {
		var resource = this.relativePath + "renderers/" + name + ".js";
		if (this.resourcesManager.isLoading(resource)) {
			if (code) {
				this.renderers[name] = code;
				this.renderers[name].JSTV = this;
				this.resourcesManager.setLoading(resource, this.renderers[name].initialize ? this.renderers[name].initialize() : false, true);
			} else this.resourcesManager.setLoading(resource, false, true);
		}
	},
	/* ---
	 * PUBLIC API
	 * ---
	 */
	/* (PUBLIC) Embeds a player on a specified DOM node ID with the specified channel data. A callback is called when the player is ready */
	embed: function(id, channel, callback) {
		if (!this.resourcesManager) {
			this.relativePath = JSTVT.getScriptRelativePath("jstv.js");
			this.resourcesManager = JSTVT.makeResourcesManager();
			this.settingsManager = JSTVT.makeSettingsManager("JSTV", {
				nativeFullscreen: {
					type: "flag",
					defaultValue: JSTVT.can.fullscreen ? true : false
				},
				screenIsScalable: {
					type: "flag",
					defaultValue: JSTVT.can.transform ? true : false
				},
				guiIsAnimated: {
					type: "flag",
					defaultValue: JSTVT.can.animate ? true : false
				},
				guiIsLarge: {
					type: "flag",
					defaultValue: JSTVT.configuration.interaction.isTouch
				},
				volume: {
					type: "number",
					defaultValue: 100
				},
			});
		}
		var renderer, loading = false;
		var player = JSTVT.make(this.models.tvcontainer, document.getElementById(id));
		player.id = id + "_player";
		player.js = {
			node: player,
			JSTV: this
		};
		for (var a in this.playerJs) player.js[a] = this.playerJs[a];
		player.js.initialize(channel, callback);
	}
}