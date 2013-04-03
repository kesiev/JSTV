/* Plays a YouTube video. This renderer handles the scene with native size (i.e. not CSS scaled) since YouTube videos are already scaled by the player */
/*
	SCENE SYNTAX:
	{
		renderer:"youtube",
		tag:["tag1","tag2","tag3"...],
		title:"<video title TEXT>",
		link:"<vide link URL>",
		videoId:"<YouTube video ID TEXT>"
	}

	NOTES:
	- Many mobile browsers (including the WiiU) disabled autoplay, so videos will be skipped if not manually played :(
	- An entry with the specified "title" and "url" is added to the channel schedule
	- The specified "tag" will be returned as scene tags

*/
JSTV.rendererLoaded("youtube", {
	configuration: {
		usePrepare: false, // Uses the prepare phase (false for compatibility :( )
		playerVars: { 'autoplay': 1, html5:1 } // HTML5 player seems better embeddable
	},
	avoidTransforOnRescale: true,
	/* Returns the schedule entry for the handled scene */
	getSchedules: function(scene) {
		return [{
			title: scene.title,
			link: scene.link
		}]
	},
	/* Retuns tags for the handled scene */
	getTags: function(scene) {
		return scene.tag;
	},
	/* Gets the music played when the handled scene is over */
	getClosingMusic: function(player, scene) {
		return {
			stop: true
		}; // No music when videos ends.
	},
	/* Triggered when the handled scene is on air */
	onAir: function(player, layer, scene) {
		var self = this;
		scene._failtimer = player.setTimeout(function() {
			self.embedFailed(player)
		}, 15000);
		if (this.configuration.usePrepare) {
			if (scene._ytplayer && scene._ytplayer.seekTo) {
				player.playMusic({
					stop: true
				});
				scene._ytplayer.seekTo(0);
				scene._ytplayer.playVideo();
			}
		} else {
			var container = this.makeYoutubeContainer(scene, layer);
			scene._ytplayer = new YT.Player(container.id, {
				height: "100%",
				width: "100%",
				videoId: scene.videoId,
				playerVars: this.configuration.playerVars,
				events: {
					'onReady': function(evt) {
						evt.target.setVolume(player.volume);
					},
					'onStateChange': function(evt) {
						if (evt.data == YT.PlayerState.ENDED) player.gotoNextProgram();
						else if (scene._failtimer && (evt.data == YT.PlayerState.PLAYING)) {
							clearTimeout(scene._failtimer);
							scene._failtimer = null;
						}
					}
				}
			});
		}
	},
	/* Triggered when the handled scene have to be prepared (not displayed on the screen) */
	prepare: function(player, layer, scene) {
		scene._failtimer = null;
		if (this.configuration.usePrepare) {
			var container = this.makeYoutubeContainer(scene, layer);
			scene._ytplayer = new YT.Player(container.id, {
				height: "100%",
				width: "100%",
				videoId: scene.videoId,
				playerVars: this.configuration.playerVars,
				events: {
					'onReady': function(evt) {
						evt.target.setVolume(player.volume);
						evt.target.playVideo();
						if (!scene.onAir) player.setTimeout(function() {
							evt.target.pauseVideo()
						}, 1);
					},
					'onStateChange': function(evt) {
						if (evt.data == YT.PlayerState.ENDED) player.gotoNextProgram();
						else if (scene._failtimer && (evt.data == YT.PlayerState.PLAYING)) {
							clearTimeout(scene._failtimer);
							scene._failtimer = null;
						}
					}
				}
			});
		}
	},
	/* Triggered when the scene is resized. If specified, the scene scaling is handled by the scene player. */
	onResize: function(player, layer, scene, newsize) {},
	/* Gets the focus getter size for this scene. */
	getGap: function(player, layer, scene, newsize) {
		return (player.guiStatus ? 0 : player.guiIsLarge ? 20 : 10);
	},
	/* Triggered when the volume is changed */
	setVolume: function(player, layer, scene, volume) {
		if (scene._ytplayer && scene._ytplayer.setVolume) scene._ytplayer.setVolume(volume);
	},
	/* Called when the scene renderer is loaded */
	initialize: function() {
		var tag = document.createElement('script');
		tag.src = "http://www.youtube.com/iframe_api";
		document.getElementsByTagName("head")[0].appendChild(tag);
		return true; // Wait for YouTube APIs to be loaded
	},
	/* (MISSING) onAbort: automatically handled by scene player */
	/* onAbort:function(player,layer,scene) { } */
	/* (CUSTOM) Player waited too much on starting playback... not embeddable video? */
	embedFailed: function(player) {
		player.gotoNextProgram();
	},
	/* (CUSTOM) Makes a YouTube container for embedding */
	makeYoutubeContainer: function(scene, layer) {
		var container = document.createElement("span");
		container.id = layer.id + "-video";
		layer.appendChild(container);
		return container;
	}
});

/* Automatically called by YouTube APIs when loaded */

function onYouTubeIframeAPIReady() {
	JSTV.rendererLoaded("youtube");
}