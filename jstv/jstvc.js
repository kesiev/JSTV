/* JSTVC handles different sources, parses data and converts them in a JSTV compatible channel */
var JSTVC = {
	/* ---
	 * REPORTER - Downloads data, parses them and standardizes assets
	 * ---
	 */
	reporter: {
		configuration: {
			/* Enables logging. Produced channels will have additional data of unused data/sources */
			logging: false,
			/* Number of feeds requested for bundle calls - only for URL managers that can handle URL bundles */
			maxBundleSize: 10, //-1 for unlimited
			/* A list of servers that can handle sources data */
			urlManagers: [
			/* Aggro histances can be used for retriving data - Remove this block if you don't want to host an Aggro server */
			{
				label: "Local Aggro Server",
				protocols: ["http", "https", "twitter"],
				contacts: {
					"bundle": "aggro/?mode=bundle&%RANDOM%",
					"ajax": "aggro/?q=%FEED%&%RANDOM%",
					"jsonp": "aggro/?q=%FEED%&v=1.0&callback=**&%RANDOM%"
				}
			},
			/* JSTVC is also compatible with the Google's feed-to-JSONP service. Can be used instead of Aggro for some protocols */
			{
				label: "Google RSS Proxy",
				protocols: ["http", "https"],
				contacts: {
					"jsonp": "http://ajax.googleapis.com/ajax/services/feed/load?&q=%FEED%&v=1.0&callback=**"
				}
			}],
			/* A list of meta-protocols. Will be converted to other URLs pointing standardad RSS */
			metaProtocols: {
				facebook: "https://www.facebook.com/feeds/page.php?id=**&format=rss20",
				youtube: "http://gdata.youtube.com/feeds/base/users/**/uploads?alt=rss&v=2",
				flickr: "http://api.flickr.com/services/feeds/photos_public.gne?id=**&lang=it-it&format=rss_200",
				tumblr: "http://**.tumblr.com/rss"				
			},
			/* Used for breaking cached data */
			random: Math.floor(Math.random() * 10000)
		},
		/* Available processing queues usable for sources */
		queues: {
			tweets: ["getFeed", "parseTweets", "crawl", "finalize"],
			rss: ["getFeed", "parseNews", "crawl", "finalize"],
			youtube: ["getFeed", "parseYoutube", "uniquize", "findImage", "finalize"],
			flickr: ["getFeed", "parseNews", "labelAsImage", "findImage", "finalize"]
		},
		/* Cache for local logs */
		logs: [],
		log: function(log) {
			if (this.configuration.logging) this.logs.push(log);
		},
		/* Cached parsed assets */
		material: {},
		/* Misc data parsers - mostly used in the processing queues */
		fetchers: {
			/* (DOWNLOADER) Downloads a feed - eventually handles URL bundles */
			getFeed: function(material, handler) {
				if (!material._rawdata && !material._error) {
					var url = JSTVT.applyPath(material.handler.contact.url.replace("%RANDOM%", this.configuration.random), JSTVC.relativePath);
					switch (material.handler.contact.envelope) {
						case "bundle":
							{
								var bundle = this.bundleManager.pickBundleByTicket(material.uid);
								var request = "";
								for (var i = 0; i < bundle.content.length; i++)
								request += this.material[bundle.content[i]].url + "\n";
								request = request.substr(0, request.length - 1);
								JSTVT.ajax(
									"post",
								request,
								url,
								this,

								function(data) {
									data = JSTVT.jsonParse(data);
									for (var a = 0; a < bundle.content.length; a++) {
										if (data[this.material[bundle.content[a]].url]) this.material[bundle.content[a]]._rawdata = data[this.material[bundle.content[a]].url];
										else this.material[bundle.content[a]]._error = true;
									}
									JSTVC.queue.done();
								},

								function() {
									for (var a = 0; a < bundle.content.length; a++)
									this.material[bundle.content[a]]._error = true;
									JSTVC.queue.done();
								});
								break;
							}
						case "jsonp":
							{
								JSTVT.jsonp(
								url.replace("%FEED%", escape(material.url)),
								this,

								function(data) {
									material._rawdata = data;
									JSTVC.queue.done();
								},

								function() {
									material._error = true;
									JSTVC.queue.done();
								},
								material.callback);
								break;
							}
						case "ajax":
							{
								JSTVT.ajax(
									"get",
								null,
								url.replace("%FEED%", escape(material.url)),
								this,

								function(data) {
									material._rawdata = JSTVT.jsonParse(data);
									JSTVC.queue.done();
								},

								function() {
									material._error = true;
									JSTVC.queue.done();
								});
								break;
							}
					}
					return true;
				}
			},
			/* (PARSER) Parses a Twitter RSS feed */
			parseTweets: function(material) {
				if (material._error) return false;
				var data = material._rawdata,
					text, parsedtext, item;
				if (data && data.responseData && data.responseData.feed) {
					var posttitle = JSTVT.htmlUnentities(JSTVT.textize(data.responseData.feed.title));
					var title = posttitle.replace(/^[^\/]*\/ /, "");
					var author = posttitle.substr(posttitle.indexOf(" / ") + 3);
					if (data.responseData.feed.entries) {
						var fetch = data.responseData.feed.entries;
						for (var i = 0; i < fetch.length; i++) {
							parsedtext = JSTVT.htmlUnentities(JSTVT.textize(fetch[i].content));
							text = parsedtext.substr(parsedtext.indexOf(": ") + 2);
							item = JSTVC.reporter.makeItem();
							item.setSource(material);
							item.setDate(fetch[i].publishedDate);
							item.set("type", "tweet");
							item.set("title", title);
							item.set("rawContent", text);
							item.set("content", text);
							item.set("simpleContent", text);
							item.set("author", author);
							item.set("link", fetch[i].link || data.responseData.feed.link);
							if (text.match(/^RT[^a-zA-Z0-9]*/)) {
								item.set("tag", "retweet");
								text = text.substr(text.match(/^RT[^a-zA-Z0-9]*/)[0].length);
							} else while (text.substr(0, 1) == "@") {
								dest = text.match(/@[A-Za-z0-9]*/)[0];
								item.set("tag", "to-" + JSTVT.tagize(dest));
								item.set("destination", dest);
								text = text.substr(dest.length + 1);
							}
							material.items.push(item);
						}
					}
				}
			},
			/* (PARSER) Parses a YouTube RSS feed */
			parseYoutube: function(material) {
				if (material._error) return false;
				var data = material._rawdata,
					text, found, item;
				if (data && data.responseData && data.responseData.feed) {
					if (data.responseData.feed.entries) {
						var fetch = data.responseData.feed.entries;
						for (var i = 0; i < fetch.length; i++) {
							found = fetch[i].link.match(/\?v=([^&]*)/);
							if (found) {
								item = JSTVC.reporter.makeItem();
								item.setSource(material);
								item.setDate(fetch[i].publishedDate);
								item.set("type", "video");
								item.set("title", JSTVT.htmlUnentities(JSTVT.textize(fetch[i].title)));
								item.set("rawContent", fetch[i].content);
								item.set("content", JSTVT.htmlUnentities(JSTVT.textize(fetch[i].content)));
								item.set("simpleContent", JSTVT.htmlUnentities(JSTVT.textize(fetch[i].contentSnippet)));
								item.set("author", fetch[i].author);
								item.set("link", fetch[i].link || data.responseData.feed.link);
								item.set("video", {
									type: "youtube",
									id: found[1]
								});
								if (fetch[i].categories) for (var j = 0; j < fetch[i].categories.length; j++)
								item.set("tag", "feed-" + JSTVT.tagize(fetch[i].categories[j].match(/#([^#]*)/)[1]));
								material.items.push(item);
							}
						}
					}
				}
			},
			/* (PARSER) Parses a standard RSS feed */
			parseNews: function(material) {
				if (material._error) return false;
				var data = material._rawdata,
					text, item, alt;
				if (data && data.responseData && data.responseData.feed) {
					if (data.responseData.feed.entries) {
						var fetch = data.responseData.feed.entries;
						for (var i = 0; i < fetch.length; i++) {
							// No content feed will use just their title.
							alt = !fetch[i].content || !JSTVT.trim(fetch[i].content) ? JSTVT.textize(fetch[i].title) : "";
							item = JSTVC.reporter.makeItem();
							item.setSource(material);
							item.setDate(fetch[i].publishedDate);
							item.set("type", "news");
							item.set("title", JSTVT.htmlUnentities(JSTVT.textize(fetch[i].title)));
							item.set("rawContent", fetch[i].content);
							item.set("content", JSTVT.htmlUnentities(JSTVT.textize(fetch[i].content)) || alt);
							item.set("simpleContent", JSTVT.htmlUnentities(JSTVT.textize(fetch[i].contentSnippet)) || alt);
							item.set("author", fetch[i].author);
							item.set("link", fetch[i].link);
							if (fetch[i].categories) for (var j = 0; j < fetch[i].categories.length; j++)
							item.set("tag", "feed-" + JSTVT.tagize(fetch[i].categories[j]));
							material.items.push(item);
						}
					}
				}
			},
			/* (CRAWL) Reparses parsed data mining images and videos */
			crawl: function(material) {
				if (material._error) return false;
				var itm, item, toadd, limit = material.items.length;
				for (var i = 0; i < limit; i++) {
					itm = material.items[i];
					toadd = JSTVT.mineLinks(itm.rawContent, material.url);
					if (this.configuration.logging) for (var j = 0; j < toadd.logs.length; j++) this.log(toadd.logs[j]);
					for (var j = 0; j < toadd.youtube.length; j++) {
						item = JSTVC.reporter.makeItem();
						item.merge(itm);
						item.set("type", "video");
						item.set("video", {
							type: "youtube",
							id: toadd.youtube[j]
						});
						itm.setIfEmpty("video", {
							type: "youtube",
							id: toadd.youtube[j]
						});
						material.items.push(item);
					}
					for (var j = 0; j < toadd.images.length; j++) {
						item = JSTVC.reporter.makeItem();
						item.merge(itm);
						item.set("type", "image");
						item.set("image", toadd.images[j]);
						itm.setIfEmpty("image", toadd.images[j]);
						material.items.push(item);
					}
				}
			},
			/* (LABELER) Labels all material as image (for flickr and similiar) */
			labelAsImage: function(material) {
				if (material._error) return false;
				for (var i = 0; i < material.items.length; i++)
				material.items[i].set("type", "image");
			},
			/* (CRAWL) Applies an image to all found assets, if any */
			findImage: function(material) {
				if (material._error) return false;
				var found;
				for (var i = 0; i < material.items.length; i++) {
					found = JSTVT.mineLinks(material.items[i].rawContent, material.url);
					if (this.configuration.logging) for (var j = 0; j < found.logs.length; j++) this.log(found.logs[j]);
					if (found.images.length) material.items[i].setIfEmpty("image", found.images[0]);
				}
			},
			/* (FINALIZE) Removes assets with the same or similar name */
			uniquize: function(material) {
				if (material._error) return false;
				var key, index = {}, i = 0;
				while (i < material.items.length)
				if (material.items[i].title) {
					key = JSTVT.tagize(material.items[i].title);
					if (index[key]) material.items.splice(i, 1);
					else {
						index[key] = 1;
						i++;
					}
				}
			},
			/* (FINALIZE) Applies feed and data type related tags, cleanup */
			finalize: function(material) {
				if (material._error) return false;
				var authortag, skip, i = 0;
				if (material._rawdata.responseData) {
					material.feedUrl= material._rawdata.responseData.feed.feedUrl;
					material.feedLink= material._rawdata.responseData.feed.link;
				}
				while (i < material.items.length) {
					skip = false;
					if ((material.items[i].type == "news") && !material.items[i].content) skip = true; // Delete empty news
					if ((material.items[i].type == "tweet") && !material.items[i].content) skip = true; // Delete empty tweets
					if ((material.items[i].type == "image") && !material.items[i].image) skip = true; // Delete empty images
					if (skip) material.items.splice(i, 1);
					else {
						if (!material.items[i].title) material.items[i].set("title", "No title");
						authortag = JSTVT.tagize(JSTVT.htmlUnentities(JSTVT.textize(material.items[i].author)));
						if (authortag) material.items[i].set("tag", authortag);
						material.items[i].set("tag", "type-" + material.items[i].type);
						material.items[i].remove("rawContent");
						this.closeItem(material.items[i]);
						i++;
					}
				}
				JSTVT.cleanObject(material, ["handler", "queue", "tag", "uid", "url", "description", "_rawdata"]);
			},
			/* (FINALIZE) Triggers onLoad callbacks on source requester */
			triggerOnLoad: function(material) {
				if (material._error) this.log({
					message: "Source not found",
					value: "(feed)",
					src: material.url
				});
				for (var i = 0; i < material._waiting.length; i++)
				material._waiting[i].onLoad.apply(material._waiting[i], ["feed", material.url]);
				delete material._waiting;
			}
		},
		/* Creates an empty standardized asset - used by fetchers */
		makeItem: function() {
			return {
				sourceuid: "",
				sourceurl: "",
				source: "",
				type: "",
				tag: [],
				destination: [],
				link: "",
				video: {},
				image: "",
				title: "",
				rawContent: "",
				content: "",
				simpleContent: "",
				author: "",
				date: null,
				setSource: function(source) {
					this.sourceuid = source.uid;
					this.sourceurl = source.url;
					this.source = source.description;
				},
				remove: function(key) {
					delete this[key];
				},
				setDate: function(date) {
					if (date) {
						date = date.split(" ");
						this.date = date[1] + " " + date[2] + " " + date[3];
					}
				},
				set: function(key, value) {
					if (value && (this[key] != undefined)) if (typeof this[key] == "string") {
						this[key] = JSTVT.trim(value);
					} else if (this[key] instanceof Array) {
						if (this[key].indexOf(value) == -1) this[key].push(value);
					} else this[key] = value;
				},
				setIfEmpty: function(key, value) {
					if (!this[key]) this.set(key, value);
				},
				merge: function(item) {
					for (var key in this)
					if (item[key] && (typeof this[key] != "function")) {
						if (typeof this[key] == "string") {
							this[key] = item[key];
						} else if (this[key] instanceof Array) {
							this[key] = item[key].slice(0);
						} else this[key] = item[key];
					}
				}
			}
		},
		/* Removes everthing unneeded from a standardized item */
		closeItem: function(item) {
			var del;
			for (var key in item)
			if (typeof item[key] == "function") delete item[key];
			else if ((item[key] instanceof Array) || (typeof this[key] == "string")) {
				if (item[key].length == 0) delete item[key];
			} else {
				var del = true;
				for (var a in item[key]) {
					del = false;
					break;
				}
				if (del) delete item[key];
			}
		},
		/* Clones a standardized item */
		cloneItem: function(item, raw) {
			var n = JSTVC.reporter.makeItem();
			if (raw) for (var a in item) n[a] = item[a];
			else n.merge(item);
			return n;
		},
		/* Adds a processing queue to the local operations queue */
		fetchMaterial: function(material, handler) {
			var queue = this.queues[material.queue];
			for (var i = 0; i < queue.length; i++)
			JSTVC.queue.add([{
				context: this,
				method: this.fetchers[queue[i]],
				args: [material, handler]
			}]);
			JSTVC.queue.add([{
				context: this,
				method: this.fetchers.triggerOnLoad,
				args: [material]
			}]);
		},
		/* Converts a meta-protocol URL to an RSS url */
		convertMetaProtocols: function(url) {
			var protocol = url.substr(0, url.indexOf(":")).toLowerCase();
			var content = url.substr(url.lastIndexOf("/") + 1);
			if (this.configuration.metaProtocols[protocol]) url = this.configuration.metaProtocols[protocol].replace("**", content);
			return url;
		},
		/* Gets an URL manager for the specified URL */
		getUrlManager: function(url) {
			var protocol = url.substr(0, url.indexOf(":")).toLowerCase();
			var contact = null,
				csv = null;
			for (var i = 0; i < this.configuration.urlManagers.length; i++) {
				csv = this.configuration.urlManagers[i];
				if (csv.protocols.indexOf(protocol) != -1) {
					if (csv.contacts.bundle) contact = {
						envelope: "bundle",
						url: csv.contacts.bundle
					};
					else if (csv.contacts.ajax) contact = {
						envelope: "ajax",
						url: csv.contacts.ajax
					};
					else if (csv.contacts.jsonp) contact = {
						envelope: "jsonp",
						url: csv.contacts.jsonp
					};
					if (contact) break;
				}
			}
			if (contact) return {
				handler: csv,
				contact: contact
			};
			else return null;
		},
		/* Adds a source to the processing queue */
		addSource: function(data, from) {
			if (!this.bundleManager) this.bundleManager = JSTVT.makeBundleManager(this.configuration.maxBundleSize);
			data.url = this.convertMetaProtocols(data.url);
			var uid = data.url + "*" + data.queue;
			data.uid = uid;
			if (!this.material[uid]) {
				var handler = this.getUrlManager(data.url);
				if (handler && this.queues[data.queue]) {
					var nc = {
						handler: handler,
						items: [],
						path: JSTVT.getPath(data.url),
						_waiting: [from]
					};
					for (var a in data) if (!nc[a]) nc[a] = data[a];
					this.material[uid] = nc;
					nc.handler = handler;
					JSTVC.queue.add([{
						context: this,
						method: this.fetchMaterial,
						args: [nc]
					}]);
					if (handler.contact.envelope == "bundle") this.bundleManager.add(uid, handler.contact.url)
				} else from.onLoad("feed", data.url); // Can't handle the specified sources
			} else if (this.material[uid]._waiting && this.material[uid]._waiting.indexOf(from) == -1) this.material[uid]._waiting.push(from);
			else from.onLoad("feed", data.url); // Already loaded
		}
	},
	/* ---
	 * FINALIZER - Picks data from REPORTER and creates a sequence of scenes.
	 * ---
	 */
	finalizer: {
		configuration: {
			/* Enables logging. Produced channels will have additional data of unused programs/assets */
			logging: false
		},
		/* States of a filling program */
		status: {
			UNPROCESSABLE: 1,
			READY: 2,
			IGNORED: 3,
			FILLED: 4
		},
		/* Creates a tag indexer */
		getTagIndex: function(items) {
			var tagindex = {
				count: 0,
				index: {},
				put: function(itm) {
					for (var j = 0; j < itm.tag.length; j++) {
						if (!this.index[itm.tag[j]]) this.index[itm.tag[j]] = [];
						this.index[itm.tag[j]].push(itm);
					}
					if (itm.tag.length) this.count++;
				},
				pick: function(itm) {
					var found = false;
					for (var j = 0; j < itm.tag.length; j++)
					if (this.index[itm.tag[j]].indexOf(itm) != -1) {
						this.index[itm.tag[j]].splice(this.index[itm.tag[j]].indexOf(itm), 1);
						found = true;
					}
					if (found) this.count--;
				},
				getByTags: function(tags) {
					var results = null,
						j;
					for (var i = 0; i < tags.length; i++)
					if (!this.index[tags[i]] || (results && !results.length)) return [];
					else if (!results) results = this.index[tags[i]].slice(0);
					else {
						j = 0;
						while (j < results.length)
						if (this.index[tags[i]].indexOf(results[j]) == -1) results.splice(j, 1);
						else j++;
					}
					results.sort(function(a, b) {
						return a.tag.length == b.tag.length ? 0 : a.tag.length > b.tag.length ? 1 : -1
					});
					return results;
				}
			};
			for (var i = 0; i < items.length; i++) tagindex.put(items[i]);
			return tagindex;
		},
		/* Tries to fill a program histance with assets. Cache is used in order to avoid feed repeating. */
		fillProgram: function(program, index, fpcache) {
			if (program.status == this.status.UNPROCESSABLE) return program;
			if (!program.status) program.status = this.status.READY;
			switch (program.status) {
				case this.status.READY:
					{
						var i = 0,
							j;
						while (i < program.scheme.length) {
							cur = program.scheme[i];
							if (cur.tag) {
								var first = false;
								if (!cur.items) cur.items = [];
								if (!cur.status) {
									cur.status = this.status.READY;
									first = true;
								}
								switch (cur.status) {
									case this.status.READY:
										{
											var res, times, pick;
											res = index.getByTags(cur.tag);
											times = !cur.items.length ? (cur.times[0] ? cur.times[0] : (first ? 1 : 0)) : 1;
											for (var j = 0; j < times; j++) {
												if (res.length) {
													pick = null;
													for (var q = 0; q < res.length; q++)
													if (!fpcache[res[q].type] || !fpcache[res[q].type][res[q].sourceuid]) {
														pick = q;
														break;
													}
													if (pick == null) {
														pick = 0;
														delete fpcache[res[pick].type];
													}
													pick = res.splice(pick, 1)[0];
													if (!fpcache[pick.type]) fpcache[pick.type] = {};
													fpcache[pick.type][pick.sourceuid] = 1;
													index.pick(pick);
													cur.items.push(pick);
												} else {
													if (cur.items.length < cur.times[0]) {
														if (cur.allowNoItems) {
															cur.status = this.status.IGNORED;
															for (var k = 0; k < cur.items.length; k++) index.put(cur.items[k]);
															cur.items = [];
														} else {
															cur.status = this.status.UNPROCESSABLE;
															program.status = this.status.UNPROCESSABLE;
														}
													} else cur.status = this.status.FILLED;
													break;
												}
											}
											if (cur.items.length == cur.times[1]) cur.status = this.status.FILLED;
											break;
										}
								}
							} else cur.status = this.status.FILLED;
							if (cur.status == this.status.IGNORED) program.scheme.splice(i, 1);
							else i++;
						}
						break;
					}
			}
			if (program.status == this.status.UNPROCESSABLE) {
				for (var i = 0; i < program.scheme.length; i++) {
					cur = program.scheme[i];
					if (cur.items) {
						for (var j = 0; j < cur.items.length; j++) index.put(cur.items[j]);
						delete cur.items;
					}
					delete cur.status;
				}
			} else {
				var filled = true;
				for (var i = 0; i < program.scheme.length; i++)
				if ((program.scheme[i].status != this.status.FILLED) && (program.scheme[i].status != this.status.IGNORED)) {
					filled = false;
					break;
				}
				if (filled) program.status = this.status.FILLED;
			}
			return program;
		},
		/* Creates an unique key for the specified material item */
		makeItemKey: function(item) {
			var ret = item.type + "*";
			switch (item.type) {
				case "video":
					{
						ret += item.video.type + "*" + item.video.id;
						break;
					}
				case "image":
					{
						ret += item.image;
						break;
					}
				default:
					{
						ret += (item.content || "").replace(/ /g, "");
						break;
					}
			}
			return ret.toLowerCase();
		},
		/* Sends a log message from the worker to the main thread (Worker mode only) */
		workerLog: function(text, obj, from) {
			if (from) console.log(text, obj);
			else postMessage(JSON.stringify({
				__log: text + " (" + JSON.stringify(obj) + ")"
			}));
		},
		/* Changes the current progrss bar value from the worker */
		workerProgress: function(message, pc, from) {
			if (from) from.onPending(message, pc);
			else postMessage(JSON.stringify({
				__msg: message,
				__pc: pc
			}));
		},
		/* Executes a finalization phase */
		finalizePhase: function(channel, from, isworker) {
			var next = 3;

			switch (channel.process.phase) {
				case 0:
					{ // Initialize material
						this.workerProgress("Picking stuff...", 1, from);
						if (isworker) {
							for (var i = 0; i < channel.process.bucket.length; i++)
							channel.process.bucket[i] = JSTVC.reporter.cloneItem(channel.process.bucket[i], true);
							channel.process.randomGenerator = JSTVT.makeRandomGenerator(channel.process.randomGenerator.seed);
						} else {
							var mat = channel.sources,
								rcheck = {}, key, rvalue, rfrom, rto, itms, itm;
							channel.scenes = channel.channelIntro?channel.channelIntro.concat():[];
							// Prepare bucket
							for (var i = 0; i < mat.length; i++) if (JSTVC.reporter.material[mat[i].uid]) {
								itms = JSTVC.reporter.material[mat[i].uid].items;
								for (var j = 0; j < itms.length; j++) {
									key = this.makeItemKey(itms[j]);
									rvalue = {
										url: mat[i].url,
										name: mat[i].description
									};
									if (!rcheck[key] || (rcheck[key].url == rvalue.url)) {
										rcheck[key] = rvalue;
										itm = JSTVC.reporter.cloneItem(itms[j]);
										channel.process.randomGenerator.shuffleSeed(itm.title);
										for (var z = 0; z < mat[i].tag.length; z++) itm.set("tag", mat[i].tag[z]);
										channel.process.bucket.push(itm);
									} else {
										if (channel.process.repeatedLog[rvalue.url]) {
											rfrom = rvalue;
											rto = rcheck[key];
										} else {
											rfrom = rcheck[key];
											rto = rvalue;
											if (!channel.process.repeatedLog[rfrom.url]) channel.process.repeatedLog[rfrom.url] = {
												from: rfrom,
												type: {},
												alike: {}
											};
										};
										channel.process.repeatedLog[rfrom.url].alike[rto.url] = rto;
										if (!channel.process.repeatedLog[rfrom.url].type[itms[j].type]) channel.process.repeatedLog[rfrom.url].type[itms[j].type] = 0;
										channel.process.repeatedLog[rfrom.url].type[itms[j].type]++;
									}
								}
							}
						}
						next = JSTVT.can.worker && JSTVT.can.json ? 2 : 1; // Schedules worker or go to next step
						break;
					}
				case 1:
					{ // Initialize program processing
						this.workerProgress("Shuffling stuff", 0, from);
						// Shuffle data with custom random generator. Seed based on material.
						if (channel.materialProcessor && channel.materialProcessor.shuffle) channel.process.randomGenerator.shuffle(channel.process.bucket);
						if (channel.programProcessor && channel.programProcessor.shuffle) channel.process.randomGenerator.shuffle(channel.programModels);
						// Prepare index of bucket
						channel.process.index = this.getTagIndex(channel.process.bucket);
						channel.process.indexSize = channel.process.index.count;
						next = 1; // Go to next step
						break;
					}
				case 2:
					{ // Process material
						this.workerProgress("Filming...", 1 - (channel.process.index.count / channel.process.indexSize), from);

						var np, items, filled;
						var head = channel.programs.length;
						channel.process.tofill = false;

						// First batch of programs
						for (var i = 0; i < channel.programModels.length; i++)
						if (((channel.programModels[i].times == undefined) || (channel.programModels[i].times > 0)) && (channel.programModels[i].status != this.status.UNPROCESSABLE)) {
							if (channel.programModels[i].times != undefined) channel.programModels[i].times--;
							np = JSTVT.clone(channel.programModels[i]);
							np.programModelId = i;
							this.fillProgram(np, channel.process.index, channel.process.fillProgramCache);
							if (np.status == this.status.UNPROCESSABLE) channel.programModels[i].status = this.status.UNPROCESSABLE;
							else {
								if (np.status == this.status.READY) channel.process.tofill = true;
								channel.programs.push(np);
							}
						}

						// Fill programs
						if (channel.process.tofill) {
							filled = false;
							while (!filled) {
								filled = true;
								for (var i = head; i < channel.programs.length; i++) {
									this.fillProgram(channel.programs[i], channel.process.index, channel.process.fillProgramCache);
									if (channel.programs[i].status == this.status.READY) filled = false;
								}
							}
						}

						// Check empty programs
						var i = head;
						while (i < channel.programs.length)
						if (channel.programs[i].allowNoItems) i++;
						else {
							items = 0;
							for (var j = 0; j < channel.programs[i].scheme.length; j++)
							if (channel.programs[i].scheme[j].items) items += channel.programs[i].scheme[j].items.length;
							if (items == 0) {
								channel.programModels[channel.programs[i].programModelId].status = this.status.UNPROCESSABLE;
								channel.programs.splice(i, 1);
							} else i++;
						}

						// Keep on cycling until is filled
						next = channel.process.tofill ? 0 : 1;
						break;
					}
				case 3:
					{
						this.workerProgress("Mounting scenes...", channel.process.pp / channel.programs.length, from);

						var src;

						if (channel.programs[channel.process.pp]) {
							channel.programs[channel.process.pp].startAt = channel.scenes.length;
							for (var j = 0; j < channel.programs[channel.process.pp].scheme.length; j++) {
								if (channel.programs[channel.process.pp].scheme[j].items) for (var k = 0; k < channel.programs[channel.process.pp].scheme[j].items.length; k++) {
									src = channel.sourcesIndex[channel.programs[channel.process.pp].scheme[j].items[k].sourceuid];
									if (src) {
										JSTVT.cleanObject(src, ["callback", "queue"]);
										delete channel.sourcesIndex[channel.programs[channel.process.pp].scheme[j].items[k].sourceuid];
										channel.process.usedSources.push(src);
									}
								}
								if (channel.programs[channel.process.pp].scheme[j].beforeScene) JSTVT.mergeData(
								channel.programs[channel.process.pp].scheme[j].beforeScene,
								channel.programs[channel.process.pp].scheme[j].items,
								channel.scenes,
								channel.process.randomGenerator,
								channel.process.mergeSession);
								if (channel.programs[channel.process.pp].scheme[j].scene) JSTVT.mergeData(
								channel.programs[channel.process.pp].scheme[j].scene,
								channel.programs[channel.process.pp].scheme[j].items,
								channel.scenes,
								channel.process.randomGenerator,
								channel.process.mergeSession);
								if (channel.programs[channel.process.pp].scheme[j].afterScene) JSTVT.mergeData(
								channel.programs[channel.process.pp].scheme[j].afterScene,
								channel.programs[channel.process.pp].scheme[j].items,
								channel.scenes,
								channel.process.randomGenerator,
								channel.process.mergeSession);
							}
							JSTVT.cleanObject(channel.programs[channel.process.pp], ["programModelId", "status", "scheme", "times", "allowNoItems"]);
							channel.process.pp++;
						}

						next = channel.process.pp < channel.programs.length ? 0 : 1;
						break;
					}
				case 4:
					{ // Generate scenes and clean
						this.workerProgress("On air!", channel.process.pp / channel.programs.length, from);
						channel.sources = channel.process.usedSources;
						// LOGGING
						if (this.configuration.logging) {
							if (!channel.logs) channel.logs = {};
							channel.logs.finalizer = {
								unused: channel.process.index,
								repeated: channel.process.repeatedLog,
								worker: isworker ? true : false
							};
							channel.logs.sources = {
								unused: channel.sourcesIndex
							};
						}
						next = 1;
						break;
					}
			}
			return next;
		},
		/* Creates a sequence of programs/scenes from the available assets list */
		finalize: function(channel, from, isworker) {
			var self = this,
				state;

			if (isworker) {

				state = 0;
				while (state != 3) {
					state = this.finalizePhase(channel, from, isworker);
					if (state == 1) channel.process.phase++;
				}

			} else {

				state = this.finalizePhase(channel, from, null);
				switch (state) {
					case 0:
					case 1:
						{ // Go to the next phase / Rest here
							if (state == 1) channel.process.phase++;
							setTimeout(function() {
								self.finalize(channel, from, worker)
							}, 1);
							break;
						}
					case 2:
						{ // Schedules worker and exit
							var worker = new Worker(JSTVC.relativePath + "jstvc-worker.js?a=1");
							worker.onmessage = function(event) {
								var inp = JSON.parse(event.data);
								if (inp.__log) console.log("[WORKER] " + inp.__log);
								else if (inp.__msg) from.onPending(inp.__msg, inp.__pc);
								else {
									for (var a in inp) channel[a] = inp[a];
									self.finalize(channel, from, isworker);
								}
							};
							worker.postMessage(JSON.stringify(channel));
							break;
						}
					case 3:
						{ // End
							var ch,pr;
							JSTVT.cleanObject(channel, ["channelIntro", "process", "programModels", "programProcessor", "materialProcessor", "sourcesIndex"]);
							for (var i=0;i<channel.sources.length;i++) {
								ch=channel.sources[i];
								pr=JSTVT.getProtocol(ch.url);
								if (!ch.about&&JSTVC.reporter.material[ch.uid].feedLink) ch.about=JSTVC.reporter.material[ch.uid].feedLink;
								if ((pr!="http")&&(pr!="https")&&JSTVC.reporter.material[ch.uid].feedUrl) ch.url=JSTVC.reporter.material[ch.uid].feedUrl;
								delete ch.uid;
							}
							JSTVC.queue.done();
							break;
						}

				}
				return true;
			}
		},
		/* Adds the finalize phase to the local operations queue */
		addFinalize: function(channel, from) {
			JSTVC.queue.add([{
				context: this,
				method: this.finalize,
				args: [channel, from]
			}]);
		}
	},
	/* ---
	 * MAIN - Sources are pre-selected and added to the operations queue
	 * ---
	 */
	/* Parses the sources list and select feeds */
	prepareSources: function(channel, from) {
		var seed = 0;
		var sources, found;
		if (!this.queue) this.queue = JSTVT.makeOperationsQueue();
		if (!this.reporter.queue) this.reporter.queue = JSTVT.makeOperationsQueue();
		channel.sourcesAvailable = channel.sources.length;
		channel.process = {
			phase: 0,
			repeatedLog: {},
			bucket: [],
			usedSources: [],
			mergeSession: {},
			fillProgramCache: {},
			pp: 0,
			index: null,
			indexSize: 0,
			tofill: false,
			randomGenerator: JSTVT.makeRandomGenerator()
		};
		channel.programs = [];
		if (channel.sourcesProcessor) {
			sources = [];
			if (channel.sourcesProcessor.shuffle) {
				var date = new Date();
				var randomgenerator = JSTVT.makeRandomGenerator();
				randomgenerator.shuffleSeed(date.getUTCFullYear() + "-" + date.getUTCMonth() + "-" + date.getUTCDate() + "-" + date.getUTCHours());
				randomgenerator.shuffle(channel.sources);
			}
			for (var i = 0; i < channel.sources.length; i++) {
				var found = true;
				if (channel.sourcesProcessor.tag) {
					for (var j = 0; j < channel.sourcesProcessor.tag.length; j++)
					if (channel.sources[i].tag.indexOf(channel.sourcesProcessor.tag[j]) == -1) {
						found = false;
						break;
					}
				}
				if (found) sources.push(channel.sources[i]);
				if (channel.sourcesProcessor.count && (sources.length == channel.sourcesProcessor.count)) break;
			}
			delete channel.sourcesProcessor;
			channel.sources = sources;
		}
		channel.sourcesIndex = {};
		for (var i = 0; i < channel.sources.length; i++) {
			from.onStartedLoading("feed", channel.sources[i].url);
			this.reporter.addSource(channel.sources[i], from);
			channel.sourcesIndex[channel.sources[i].uid] = channel.sources[i];
		}
		this.finalizer.addFinalize(channel, from);
		this.queue.add([{
			context: from,
			method: from.onLoad,
			args: ["channelfetch"]
		}])
		this.queue.run();
	},
	/* (PRIVATE) Removes unused data from memory (scheduled by "flush") */
	doFlush: function() {
		for (var a in this.reporter.material)
		if (!this.reporter.material[a]._waiting) delete this.reporter.material[a];
		this.reporter.logs = [];
		this.flushSchedule = 1;
	},
	/* ---
	 * PUBLIC
	 * ---
	 */
	/* (PUBLIC) Schedules an unused data removal activity */
	flush: function() {
		if (!this.flushSchedule) {
			this.flushSchedule = 1;
			JSTVC.queue.add([{
				context: this,
				method: this.doFlush
			}]);
			JSTVC.queue.run();
		}
	},
	/* (PUBLIC) Converts the specified channel structure to a JSTV compatible scene sequence. */
	fetch: function(channel, from) {
		if (!this.relativePath) this.relativePath = JSTVT.getScriptRelativePath("jstvc.js");
		from.onStartedLoading("channelfetch");
		if (typeof(channel.sources) == "string") {
			var url = channel.path + channel.sources;
			from.onStartedLoading("sourceslist", url);
			JSTVT.ajax(
				"get",
			null,
			url,
			this,

			function(text) {
				var sources = JSTVT.jsonParse(text);
				if (!sources) from.onError("sources", url);
				else {
					channel.sources = sources;
					this.prepareSources(channel, from);
				}
				from.onLoad("sourceslist", url);
			},

			function() {
				from.onError("sourceslist", url)
			});
		} else this.prepareSources(channel, from);
	}
};