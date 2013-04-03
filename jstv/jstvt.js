/* JSTVT gives tools to JSTV and JSTVC */
var JSTVT = {
	configuration: {
		/* Random generator configuration */
		random: {
			a: 134775813,
			c: 1,
			m: Math.pow(2, 32)
		},
		/* List of months */
		month: ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"],
		/* Image size threshold for the data crawler */
		imageSizeThreshold: {
			width: 100,
			height: 100
		},
		/* Vendor prefixes for CSS features detection/apply */
		prefixVendors: [null, "Webkit", "Moz", "O", "Ms", "Khtml"],
		/* z-index used for the fake CSS onload technique */
		/* (inspired by http://otaqui.com/blog/890/cssp-loading-css-with-javascript-and-getting-an-onload-callback/) */
		cssOnLoadZIndex: 123321,
		/* Cache for the cssSupports command */
		cssSupports: {},
		/* CSS attributes used for animations */
		animatedCssValues: ["VendorAnimation", "VendorTransition"]
	},
	/* Cache for browser capabilities values */
	can: {},
	/* ---
	 * CSS/DOM/HTML Tools
	 * ---
	 */
	/* Converts URL to anchors */
	/* Returns the vendor-prefixed (or unprefixed) attribute if the browser supports the specified feature */
	cssSupports: function(css) {
		if (this.configuration.cssSupports[css] == undefined) {
			var div = document.createElement("div"),
				tmp;
			this.configuration.cssSupports[css] = false;
			for (var i = 0; i < this.configuration.prefixVendors.length; i++) {
				if (this.configuration.prefixVendors[i]) tmp = this.configuration.prefixVendors[i] + this.capitalize(css);
				else tmp = css;
				if (tmp in div.style) {
					this.configuration.cssSupports[css] = tmp;
					break;
				}
			}
		}
		return this.configuration.cssSupports[css];
	},
	/* Returns the absolute position of a HTML node */
	getAbsolutePosition: function(node) {
		var ret = {
			x: 0,
			y: 0
		};
		while (node) {
			if (node.offsetLeft) ret.x += node.offsetLeft;
			if (node.offsetTop) ret.y += node.offsetTop;
			node = node.offsetParent;
		}
		return ret;
	},
	/* Get events coords */
	getEventCoords:function(e){
		var touch=e.touch||e.touches;
		if (touch)
			return {x:touch[0].pageX,y:touch[0].pageY};
		else
			return {x:e.pageX,y:e.pageY};
	},
	/* Cancels the specified event */
	cancelEvent: function(e) {
		if (e.preventDefault) e.preventDefault();
		else e.returnValue = false;
		if (e.stopPropagation) e.stopPropagation();
		else e.cancelBubble = true;
		return false;
	},
	/* Get the calculated property value of a node */
	getStyleValue: function(el, styleProp) {
		var y;
		if (window.getComputedStyle) return document.defaultView.getComputedStyle(el, null).getPropertyValue(styleProp);
		else if (el.currentStyle) {
			var name = styleProp.split("-");
			styleProp = name[0];
			for (var i = 1; i < name.length; i++) styleProp += name[i].substr(0, 1).toUpperCase() + name[i].substr(1);
			return el.currentStyle[styleProp];
		}
		return null;
	},
	/* Registers a DOM event */
	registerEvent: function(obj, type, cb) {
		if (document.addEventListener) obj.addEventListener(type, cb, false);
		else obj.attachEvent("on" + type, cb);
	},
	/* Unregisters a DOM event */
	unregisterEvent: function(obj, type, cb) {
		if (document.removeEventListener) obj.removeEventListener(type, cb);
		else obj.detachEvent("on" + type, cb);
	},
	/* Gets or create the HEAD tag of the current page */
	getHead: function() {
		var head = document.getElementsByTagName("head");
		if (head.length) head = head[0];
		else {
			head = document.createElement("head");
			document.body.appendChild(head);
		};
		return head;
	},
	/* Creates a set of DIVs from keys/values of an object. Quickly creates a CSS animable scene */
	objToScene: function(elm, container, classes, path) { // 
		var cont, div, prefix = classes.className ? classes.className + " " : "";

		if (elm.backgroundImage) {
			div = document.createElement("div");
			div.className = prefix + "backgroundimage";
			div.style.backgroundImage = "url('" + elm.backgroundImage + "')";
			container.appendChild(div);
		}
		div = document.createElement("div");
		div.className = prefix + "background" + (elm.backgroundImage ? " withImage" : "");
		container.appendChild(div);
		for (var i = 0; i < 10; i++) {
			div = document.createElement("div");
			div.className = prefix + "type-sprite sprite-" + i;
			container.appendChild(div);
		}
		for (var a in elm) if (elm[a] && classes.elements[a]) switch (classes.elements[a].as) {
			case "html":
			case "text":
				{
					div = document.createElement("div");
					div.className = prefix + "type-text " + a;
					div.innerHTML = this.htmlEntities(elm[a], false, classes.elements[a].as == "html");
					container.appendChild(div);
					break;
				}
			case "image":
				{
					div = document.createElement("div");
					div.className = prefix + "type-image " + a;
					div.style.backgroundImage = "url('" + this.applyPath(elm[a], path) + "')";
					container.appendChild(div);
					break;
				}
		}
	},
	/* Applies a set of CSS values to the specified element */
	reset: function(model, ne, skipanimation) {
		var value;
		for (var a in model.style) {
			value = model.style[a];
			if (skipanimation && (this.configuration.animatedCssValues.indexOf(a) != -1)) value = "";
			if (a.substr(0, 6) == "Vendor") {
				for (var i = 0; i < this.configuration.prefixVendors.length; i++)
				if (this.configuration.prefixVendors[i]) ne.style[this.configuration.prefixVendors[i] + a.substr(6)] = value;
				else ne.style[this.uncapitalize(a.substr(6))] = value;
			} else ne.style[a] = model.style[a];
		}
		for (var a in model.set) ne[a] = model.set[a];
		for (var a in model.attrs) ne.setAttribute(a, model.attrs[a]);
	},
	/* Creates a DOM object starting from a JSON descriptor */
	make: function(model, tox, skipanimation) {
		var ne = document.createElement(model.type);
		this.reset(model, ne, skipanimation);
		if (tox) tox.appendChild(ne);
		return ne;
	},
	/* Applies a path to an URL if is relative */
	applyPath: function(url, path) {
		var protocol = this.getProtocol(url);
		if (protocol) return url;
		else return (path || "") + url;
	},
	/* Get the path of the specified url */
	getPath: function(url) {
		return url.substring(0, url.lastIndexOf("/") + 1);
	},
	/* Tries to get the relative path of the specified script included in page */
	getScriptRelativePath: function(name) {
		var src = "";
		var matcher = new RegExp("/" + name + "[?|$]*", "i")
		var stripper = new RegExp("^(.*)/" + name, "i")
		var scripts = document.getElementsByTagName("script");
		for (var i = 0; i < scripts.length; i++)
		if ((src = scripts[i].getAttribute("src")) && (src.match(matcher))) return src.match(stripper)[1] + "/";
		return "";
	},
	/* ---
	 * String/Object manipulation
	 * ---
	 */
	/* Get URL protocol */
	getProtocol: function(url) {
		return url.toLowerCase().match(/^([^:]*):\/\//, "");
	},
	/* Converts a string date (dd MMM yyyy) to UNIX timestamp */
	simpleDateToDate: function(str) {
		str = str.split(" ");
		return new Date(str[2] * 1, this.configuration.month.indexOf(str[1].toLowerCase()), str[0] * 1, 0, 0, 0, 0);
	},
	/* Clean an object removing the listed keys */
	cleanObject: function(obj, keys) {
		for (var i = 0; i < keys.length; i++)
		delete obj[keys[i]];
		return obj;
	},
	/* Parses a JSON file with browser JSON parser or (sigh) with eval */
	jsonParse: function(data) {
		var out = null;
		try {
			if (this.can.json) out = JSON.parse(data);
			else out = eval("(" + data + ")");
			return out;
		} catch (e) {
			return null;
		}
	},
	/* Clones an object */
	clone: function(o) {
		if ((o == '[object NodeList]') || (o == null) || (o.constructor == RegExp) || ((typeof(o) != "object") && (o.constructor != Array)) || (o.tagName) || (o.nodeName) || (o.target !== undefined)) return o;
		var newO = o.constructor();
		for (var i in o) if (o.hasOwnProperty(i)) newO[i] = this.clone(o[i]);
		return newO;
	},
	/* Extracts a set of media links from a string, linking them to the specified source */
	mineLinks: function(string, source) {
		var url, accept, guesssize, out = {
			links: [],
			youtube: [],
			images: [],
			logs: []
		}, matcher = /^((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)$/gi;
		found = string.split(/[\s<>'"]/);
		for (var j = 0; j < found.length; j++)
		if (found[j].match(matcher)) {
			url = found[j];
			out.links.push(url);
			if (url.match(/akamaihd.net\//i)) {
				url=url.match(/url=([^&]*)/i);
				if (url) url=unescape(url[1]);
				else url="";
			}
			if (url.match(/\.(jpg|png|gif)$/i)) {
				guesssize = url.match(/([0-9]+)x([0-9]+)/i);
				accept = true;
				if (guesssize) accept = (guesssize[1] * 1 > this.configuration.imageSizeThreshold.width) && (guesssize[2] * 1 > this.configuration.imageSizeThreshold.height);
				if (accept) out.images.push(url);
				else out.logs.push({
					message: "Skipped small image",
					value: url,
					src: source
				});
			} else if (url.match(/youtube.com/i)) {
				if (hit = (url + "?").match(/embed\/([^?]*)/i)) out.youtube.push(hit[1]);
			} else if (url.match(/youtu.be/)) {
				if (hit = (url + "?").match(/youtu.be\/([^?]*)/i)) out.youtube.push(hit[1]);
			} else out.logs.push({
				message: "Can't use this URL for creating contents",
				value: url,
				src: source
			});
		}
		return out;
	},
	/* Converts a string to its HTML version */
	htmlEntities: function(text, nlbr, keeplinks) {
		var out;
		if (keeplinks) {
			var out = "",
				link;
			var urlregexp = /\(?\bhttp:\/\/[-A-Za-z0-9+&@#\/%?=~_()|!:,.;]*[-A-Za-z0-9+&@#\/%=~_()|]/gi;
			while (text.length) {
				link = text.match(urlregexp);
				this._div.innerHTML = "";
				if (link) {
					this._div.appendChild(document.createTextNode(text.substr(0, text.indexOf(link[0]))));
					out += this._div.innerHTML;
					out += "<a target='_blank' href='" + link[0] + "'>" + link[0] + "</a>";
					text = text.substr(text.indexOf(link[0]) + link[0].length);
				} else {
					this._div.appendChild(document.createTextNode(text));
					out += this._div.innerHTML;
					text = "";
				}
			}
		} else {
			this._div.innerHTML = "";
			this._div.appendChild(document.createTextNode(text));
			out = this._div.innerHTML;
		}
		if (nlbr) out = out.replace(/\n/g, "<br>");
		return out;
	},
	/* Converts an HTML to plain text */
	htmlUnentities: function(text) {
		if (!this._div) this._div = document.createElement("div");
		this._div.innerHTML = text;
		return this._div[this._div.innerText ? "innerText" : "textContent"];
	},
	/* Strips everything except numbers a and letters - making a string tag-like */
	tagize: function(string) {
		return string.toLowerCase().replace(/[^a-z0-9]*/g, "")
	},
	/* Strips spaces */
	trim: function(string) {
		return string.replace(/^\s+|\s+$/g, '')
	},
	/* Removes tags from a string */
	textize: function(text) {
		var otext;
		text = text.replace(/<br>/g, "\n").replace(/<\/?[^>]+(>|$)/g, " ").replace(/[\t|\n|\r| ]+/g, " ");
		do {
			otext = text;
			text = text.replace(/  /g, " ");
		} while (text != otext);
		return this.trim(text);
	},
	/* Capitalize the first letter of a string */
	capitalize: function(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	},
	/* Uncapitalize the first letter of a string */
	uncapitalize: function(string) {
		return string.charAt(0).toLowerCase() + string.slice(1);
	},
	/* Merges data to a model - mainly the core of JSTVC data merger.  Mergesession is used for storing random indexes. */
	mergeDataItem: function(model, item, elements, randomgenerator, mergesession) {
		var pick, value, itm, list, tmp;
		for (var a in model)
		if (model[a] && (model[a].constructor === Object) && model[a].pick) if (model[a].pick.constructor === Object) {
			value = [];
			for (var i = 0; i < elements.length; i++) {
				itm = this.clone(model[a].pick);
				this.mergeDataItem(itm, elements[i], []);
				value.push(itm);
			}
			model[a] = value;
		} else {
			pick = model[a].pick;
			if (pick == "randomly") {
				if (model[a].fromSet) {
					if (!mergesession.sets) mergesession.sets = {};
					if (!mergesession.sets[model[a].fromSet]) mergesession.sets[model[a].fromSet] = {
						set: [],
						last: null
					};
					if (!mergesession.sets[model[a].fromSet].length) {
						list = [];
						for (var i = 0; i < model[a].oneOf.length; i++)
						list.push(i);
						randomgenerator.shuffle(list);
						if (list[list.length - 1] == mergesession.sets[model[a].fromSet].last) {
							tmp = list[0];
							list[0] = list[list.length - 1];
							list[list.length - 1] = tmp;
						}
						mergesession.sets[model[a].fromSet] = list;
					}
					mergesession.sets[model[a].fromSet].last = mergesession.sets[model[a].fromSet].pop();
					model[a] = model[a].oneOf[mergesession.sets[model[a].fromSet].last];
				} else model[a] = randomgenerator.pick(model[a].oneOf);
			} else {
				value = item;
				pick = pick.split(".");
				for (var i = 0; i < pick.length; i++) if (!value) break;
				else value = value[pick[i]];
				model[a] = this.clone(!value && model[a].or ? model[a].or : value);
			}
		}
		return model;
	},
	/* Merges data to a set of models - mainly the core of JSTVC data merger. Mergesession is used for storing random indexes. */
	mergeData: function(model, elements, out, randomgenerator, mergesession) {
		var cl;
		if (!elements) elements = [];
		if (!elements.length) elements.push({});
		if (model instanceof Array) {
			for (var j = 0; j < elements.length; j++)
			for (var i = 0; i < model.length; i++) {
				cl = this.clone(model[i]);
				delete cl.pick;
				this.mergeDataItem(cl, elements[j], elements, randomgenerator, mergesession);
				out.push(cl);
			}
		} else {
			cl = this.clone(model);
			this.mergeDataItem(cl, elements[0], elements, randomgenerator, mergesession);
			out.push(cl)
		}
		return out;
	},
	/* ---
	 * Data send/receive
	 * ---
	 */
	/* A classic AJAX caller. The okcb and kocb are called on subj's context */
	ajax: function(method, postdata, url, subj, okcb, kocb) {
		var xmlhttp = false;
		/* running locally on IE5.5, IE6, IE7 */
		;
		/*@cc_on
		 if(location.protocol=="file:"){
		  if(!xmlhttp)try{ xmlhttp=new ActiveXObject("MSXML2.XMLHTTP"); }catch(e){xmlhttp=false;}
		  if(!xmlhttp)try{ xmlhttp=new ActiveXObject("Microsoft.XMLHTTP"); }catch(e){xmlhttp=false;}
		 }                                                                                ; @cc_off @*/
		/* IE7, Firefox, Safari, Opera...  */
		if (!xmlhttp) try {
			xmlhttp = new XMLHttpRequest();
		} catch (e) {
			xmlhttp = false;
		}
		/* IE6 */
		if (typeof ActiveXObject != "undefined") {
			if (!xmlhttp) try {
				xmlhttp = new ActiveXObject("MSXML2.XMLHTTP");
			} catch (e) {
				xmlhttp = false;
			}
			if (!xmlhttp) try {
				xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
			} catch (e) {
				xmlhttp = false;
			}
		}
		/* IceBrowser */
		if (!xmlhttp) try {
			xmlhttp = createRequest();
		} catch (e) {
			xmlhttp = false;
		}
		xmlhttp.open(method, url, true);
		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == 4) if (((xmlhttp.status == 200) || (xmlhttp.status == 0)) && xmlhttp.getAllResponseHeaders().length) {
				if (okcb) okcb.apply(subj, [xmlhttp.responseText, xmlhttp]);
			} else {
				if (kocb) kocb.apply(subj, [xmlhttp]);
			}
		}
		xmlhttp.send(postdata);
		return xmlhttp;
	},
	/* A JSONP caller. The okcb and kocb are called on subj's context */
	jsonp: function(url, subj, cbok, cbko, cbname) {
		var callback = cbname ? cbname : "callback" + Math.floor(Math.random() * 100000);
		var script = document.createElement("script");
		window[callback] = function() {
			cbok.apply(subj, arguments)
		};
		this.registerEvent(script, "error", function() {
			cbko.apply(subj, arguments)
		});
		this.registerEvent(script, "load", function() {
			script.parentNode.removeChild(script);
			try {
				delete window[callback];
			} catch (e) {
				window[callback] = null;
			}
		});
		script.src = url.replace("**", callback);
		this.getHead().appendChild(script);
	},
	/* ---
	 * HTML Widgets
	 * ---
	 */
	/* Creates a knob starting from an handle->position->bar DIV hierarchy */
	makeKnob: function(handle, scale, subject, onstart, onchange, onend) {
		var dragging = false;
		var jstvt = this;
		var knobposition = handle.parentNode;
		var knobbar = knobposition.parentNode;
		handle.isKnobDragging = false;
		handle._scale = scale;
		handle._currentposition = 0;
		handle.setScale = function(scale) {
			this._scale = scale;
		}
		handle.setAt = function(position) {
			handle._currentposition = position;
			knobposition.style.left = (position / handle._scale * 100) + "%";
		}
		jstvt.registerEvent(knobbar, jstvt.configuration.interaction.events.start, function(e) {
			if (!handle.isKnobDragging) {
				var current = jstvt.getAbsolutePosition(knobposition);
				var coord=jstvt.getEventCoords(e);
				var dist = coord.x - current.x;
				var ow = knobbar.offsetWidth;
				if (Math.abs(dist) < (handle.offsetWidth * 2)) {
					var nextpos = handle._currentposition + (dist > 0 ? 1 : -1);
					if ((nextpos > -1) && (nextpos < handle._scale)) handle.setAt(nextpos);
					if (onend) onend.apply(subject, [nextpos, nextpos / handle._scale, (nextpos / handle._scale) * ow, ow]);
				} else {
					var click = jstvt.getAbsolutePosition(knobbar);
					var pos = (coord.x - click.x);
					handle.setAt(pos / ow);
					if (onend) onend.apply(subject, [(pos / ow) * handle._scale, pos / ow, pos, ow]);
				}
				return jstvt.cancelEvent(e);
			}
		});
		jstvt.registerEvent(handle, jstvt.configuration.interaction.events.start, function(e) {
			dragging = true;
			handle.isKnobDragging = true;
			if (onstart) onstart.apply(subject);
			var currentx = knobposition.offsetLeft, coord= jstvt.getEventCoords(e);
			var dragstart = coord.x;
			jstvt.registerEvent(document, jstvt.configuration.interaction.events.move, function(e) {
				if (dragging) {
					var ow = knobposition.parentNode.offsetWidth;
					var coord = jstvt.getEventCoords(e);
					var pos = currentx + (coord.x - dragstart);
					if (pos < 0) pos = 0;
					if (pos > ow) pos = ow;
					knobposition.style.left = pos + "px";
					if (onchange) onchange.apply(subject, [(pos / ow) * handle._scale, pos / ow, pos, ow]);
					return jstvt.cancelEvent(e);
				}
			});
			jstvt.registerEvent(document, jstvt.configuration.interaction.events.end, function(e) {
				if (dragging) {
					handle.isKnobDragging = false;
					var ow = knobposition.parentNode.offsetWidth;
					var pos = knobposition.offsetLeft;
					knobposition.style.left = (pos / ow * 100) + "%";
					if (onend) onend.apply(subject, [(pos / ow) * handle._scale, pos / ow, pos, ow]);
					dragging = false;
					return jstvt.cancelEvent(e);
				}
			});
			return jstvt.cancelEvent(e);
		});
	},
	/* ---
	 * MISC MANAGERS
	 * A manager is a singleton element specialized on a single task.
	 * ---
	 */
	/* Creates a fullscreen manager, with HTML5/compatibility mode */
	makeFullscreenManager: function() {
		var jstvt = this;
		return {
			nativeFullscreen: this.can.fullscreen ? true : false,
			fullscreenCb: [],
			fullscreenObject: null,
			_triggerfakefullscreencb: function() {
				for (var i = 0; i < this.fullscreenCb.length; i++)
				this.fullscreenCb[i]();
			},
			isFullscreen: function() {
				if (this.nativeFullscreen && jstvt.can.fullscreen) return document[jstvt.can.fullscreen.check];
				else return this.fullscreenObject ? true : false;
			},
			cancelFullscreen: function() {
				if (this.nativeFullscreen && jstvt.can.fullscreen) document[jstvt.can.fullscreen.cancel]();
				else {
					this.fullscreenObject = null;
					this._triggerfakefullscreencb();
				}
			},
			setFullscreen: function(obj) {
				if (this.nativeFullscreen && jstvt.can.fullscreen) obj[jstvt.can.fullscreen.request]();
				else {
					this.fullscreenObject = obj;
					this._triggerfakefullscreencb();
				}
			},
			getFullscreenElement: function() {
				if (this.nativeFullscreen && jstvt.can.fullscreen) return document[jstvt.can.fullscreen.element];
				else return this.fullscreenObject;
			},
			onFullscreen: function(cb, owner) {
				owner._fullscreencb = cb;
				if (this.nativeFullscreen && jstvt.can.fullscreen) jstvt.registerEvent(document, jstvt.can.fullscreen.event, cb);
				else this.fullscreenCb.push(cb);
			},
			offFullscreen: function(owner) {
				if (this.nativeFullscreen && jstvt.can.fullscreen) jstvt.unregisterEvent(document, jstvt.can.fullscreen.event, owner._fullscreencb);
				else this.fullscreenCb.splice(this.fullscreenCb.indexOf(owner._fullscreencb), 1);
				delete owner._fullscreencb;
			},
			applyFullscreen: function(obj) {
				if (!this.nativeFullscreen || !jstvt.can.fullscreen) {
					jstvt.configuration.fullScreenParent = obj.parentNode;
					obj.parentNode.removeChild(obj);
					document.body.appendChild(obj);
				}
				obj.style.position = "fixed";
				obj.style.left = 0;
				obj.style.top = 0;
			},
			unapplyFullscreen: function(obj) {
				if (!this.nativeFullscreen || !jstvt.can.fullscreen) {
					document.body.removeChild(obj);
					jstvt.configuration.fullScreenParent.appendChild(obj);
					delete jstvt.configuration.fullScreenParent;
				}
				obj.style.position = "relative";
				obj.style.left = "auto";
				obj.style.top = "auto";
			},
		}
	},
	/* Creates a resource loader/cacher */
	makeResourcesManager: function() {
		var jstvt = this;
		var loader = {
			index: {},
			triggerevent: function(reference, event) {
				reference.from[event].apply(reference.from, [reference.type, reference.name, this.index[reference.realname]]);
			},
			broadcastevent: function(resource, event) {
				if (typeof resource == "string") resource = this.index[resource];
				for (var i = 0; i < resource.waiting.length; i++)
				if (resource.waiting[i]) this.triggerevent(resource.waiting[i], event);
			},
			onLoad: function(resource, result) {
				if (typeof resource == "string") resource = this.index[resource];
				if (resource.type == "data") resource.data = result;
				resource.loading = false;
				this.broadcastevent(resource, "onLoad");
				delete resource.waiting;
			},
			onError: function(resource) {
				if (typeof resource == "string") resource = this.index[resource];
				delete resource.data;
				resource.loading = false;
				this.broadcastevent(resource, "onError");
				delete resource.waiting;
			},
			isLoading: function(resource) {
				if (typeof resource == "string") resource = this.index[resource];
				return resource.loading;
			},
			setLoading: function(resource, value, success) {
				if (typeof resource == "string") resource = this.index[resource];
				if (!value) if (success) this.onLoad(resource);
				else this.onError(resource);
			},
			load: function(type, name, from, logictype, logicname, onloadhandler, onerrorhandler) {

				if (!logicname) logicname = name;
				if (!logictype) logictype = type;

				var reference = {
					from: from,
					realtype: type,
					type: logictype,
					realname: name,
					name: logicname
				};

				this.triggerevent(reference, "onStartedLoading");

				if (this.index[name]) {
					if (this.index[name].waiting == undefined) this.triggerevent(reference, "onLoad");
					else if (this.index[name].waiting.indexOf(from) == -1) this.index[name].waiting.push(reference);
				} else {
					var resource = {
						data: null,
						loading: true,
						name: name,
						type: type,
						waiting: [reference]
					};
					if (!onloadhandler) onloadhandler = function(e) {
						loader.onLoad(resource, e)
					};
					if (!onerrorhandler) onerrorhandler = function(e) {
						loader.onError(resource)
					};

					var found = true;
					switch (resource.type) {
						case "data":
							{
								jstvt.ajax(
									"get",
								null,
								resource.name,
								this,
								onloadhandler,
								onerrorhandler);
								break;
							}
						case "javascript":
							{
								var head = jstvt.getHead();
								var js = document.createElement("script");
								js.src = resource.name + (resource.name.indexOf("?") == -1 ? "?" : "&") + Math.random();
								jstvt.registerEvent(js, "load", onloadhandler);
								jstvt.registerEvent(js, "error", onerrorhandler);
								head.appendChild(js);
								break;
							}
						case "stylesheet":
							{
								var onloadtrigger = resource.name.substr(resource.name.lastIndexOf("/") + 1).split(".");

								var head = jstvt.getHead();
								var css = document.createElement("link");
								css.href = resource.name + (resource.name.indexOf("?") == -1 ? "?" : "&") + Math.random();
								css.rel = "stylesheet";

								if (onloadtrigger.length == 3) {
									var onloader = document.createElement("div");
									onloader.style.position = "absolute";
									onloader.style.left = onloader.style.top = onloader.style.width = onloader.style.height = "1px";
									onloader.className = "onload-" + onloadtrigger[1];
									document.body.appendChild(onloader);
									var oldzindex = jstvt.getStyleValue(onloader, "z-index");
									var interval = setInterval(function() {
										if (jstvt.getStyleValue(onloader, "z-index") != oldzindex) {
											clearTimeout(interval);
											document.body.removeChild(onloader);
											onloadhandler();
										}
									}, 100)
								} else setTimeout(onloadhandler, 2000);
								jstvt.registerEvent(css, "error", onerrorhandler);
								head.appendChild(css);
								break;
							}
						default:
							{
								found = false;
							}
					}
					if (found) this.index[resource.name] = resource;
					else this.triggerevent(reference, "onError");
				}
			}
		}
		return loader;
	},
	/* Creates a seedable random generator */
	makeRandomGenerator: function(seed) {
		return {
			seed: seed || 0,
			a: this.configuration.random.a,
			c: this.configuration.random.c,
			m: this.configuration.random.m,
			shuffleSeed: function(text) {
				if (text.length) for (var i = 0; i < text.length; i++)
				this.seed += text.charCodeAt(i);
				else this.seed *= 2;
				this.seed = this.seed % 10000000000;
			},
			random: function() {
				this.seed = (this.a * this.seed + this.c) % this.m;
				return ("0." + this.seed) * 1;
			},
			pick: function(list) {
				var index = Math.floor(list.length * this.random());
				return list[index];
			},
			shuffle: function(list) {
				var swp, frm, pos;
				for (var i = 0; i < list.length * 2; i++) {
					frm = i % list.length;
					pos = Math.floor(this.random() * list.length);
					swp = list[frm];
					list[frm] = list[pos];
					list[pos] = swp;
				}
				return list;
			}
		}
	},
	/* Creates a settings manager, which saves/loads settings from cookies */
	makeSettingsManager: function(id, scheme) {
		var settings = {
			id: id,
			scheme: scheme,
			values: {},
			load: function() {
				var name, c, value;
				var ca = document.cookie.split(';');
				for (var option in this.scheme) {
					name = id + "_" + option + "=";
					value = this.scheme[option].defaultValue;
					for (var j = 0; j < ca.length; j++) {
						c = ca[j];
						while (c.charAt(0) == ' ') c = c.substring(1, c.length);
						if (c.indexOf(name) == 0) {
							value = c.substring(name.length, c.length);
							break;
						}
					}
					switch (this.scheme[option].type) {
						case "number":
							{
								this.values[option] = value == "null" ? null : value * 1 ? value * 1 : 0;
								break;
							}
						case "flag":
							{
								this.values[option] = value == "null" ? null : value == "1" ? true : false;
								break;
							}
					}
				}
			},
			save: function() {
				var set;
				for (var option in this.values) {
					set = "";
					switch (this.scheme[option].type) {
						case "number":
							{
								set = this.values[option] == null ? "null" : this.values[option] * 1 ? this.values[option] * 1 : "0"
								break;
							}
						case "flag":
							{
								set = this.values[option] == null ? "null" : this.values[option] ? "1" : "0";
								break;
							}
					}
					document.cookie = id + "_" + option + "=" + set + "; path=/";
				}
			},
			setDefault: function() {
				for (var option in this.scheme) this.values[option] = this.scheme[option].defaultValue;
			}
		}
		settings.setDefault();
		settings.load();
		return settings;
	},
	/* Creates a bundle manager, which aggregates data in clusters and find them by ticket */
	makeBundleManager: function(size) {
		return {
			size: size,
			items: {},
			findByTicket: function(ticket) {
				for (var a in this.items)
				for (var j = 0; j < this.items[a].length; j++)
				if (this.items[a][j].indexOf(ticket) != -1) return {
					destination: a,
					id: j,
					content: this.items[a][j]
				};
				return null;
			},
			pickBundleByTicket: function(ticket) {
				var bundle = this.findByTicket(ticket);
				if (bundle) {
					this.items[bundle.destination].splice(bundle.id, 1);
					return bundle;
				} else return null;
			},
			add: function(ticket, destination) {
				if (!this.items[destination]) this.items[destination] = [];
				if (!this.items[destination].length) this.items[destination].push([]);
				var dest = this.items[destination];
				if ((this.size != -1) && (dest[dest.length - 1].length == this.size)) dest.push([]);
				dest[dest.length - 1].push(ticket);
			}
		}
	},
	/* Creates a music player, with cross fader and ID management */
	makeMusicPlayer: function(parentnode, path) {
		if (this.can.audio) return {
			current: null,
			next: null,
			fadeVolume: null,
			currentVolume: 1,
			timeout: null,
			abortFade: function() {
				this.fadeVolume = null;
				if (this.timeout) {
					clearTimeout(this.timeout);
					this.timeout = null;
				}
			},
			forceStop: function() {
				this.abortFade();
				this.current = null;
				if (this.audiotag) {
					this.audiotag.pause();
					this.audiotag.setAttribute("src", "#");
					parentnode.removeChild(this.audiotag);
					delete this.audiotag;
				}
			},
			playnext: function() {
				this.forceStop();
				if (this.next && this.next.files) {
					var src, self = this;
					this.audiotag = document.createElement("audio");
					this.audiotag.style.position = "absolute";
					this.audiotag.style.left = "-10000px";
					this.audiotag.style.top = "-10000px";
					parentnode.appendChild(this.audiotag);
					for (var a in this.next.files) {
						src = document.createElement("source");
						src.setAttribute("type", a);
						src.setAttribute("src", path + this.next.files[a]);
						this.audiotag.appendChild(src);
					}
					this.currentVolume = 1;
					this.updatevolume();
					this.audiotag.load();
					setTimeout(function() {
						self.audiotag.play();
					}, 1);
					this.current = this.next;
				} else this.current = null;
				this.next = null;
			},
			timer: function() {
				var self = this;
				this.fadeVolume--;
				this.currentVolume = this.fadeVolume / 10;
				this.updatevolume();
				if (this.fadeVolume == 0) this.playnext();
				else this.timeout = setTimeout(function() {
					self.timer()
				}, 100);
			},
			updatevolume: function() {
				if (this.audiotag) this.audiotag.volume = this.currentVolume * this.volume;
			},
			setVolume: function(volume) {
				if (volume < 0) volume = 0;
				if (volume > 100) volume = 100;
				var realvolume = volume / 100;
				this.volume = realvolume == 0 ? 0.0001 : realvolume;
				this.volume = realvolume;
				this.updatevolume();
			},
			play: function(music) {
				if (!this.current || ((music.name != this.current.name) || music.forceChange || music.stop)) {
					if (this.next) this.next = music;
					else {
						this.next = music;
						if (this.audiotag && !this.audiotag.ended) {
							this.fadeVolume = 10;
							this.timer();
						} else this.playnext();
					}
				}
			}
		}; else return {
			forceStop: function() {},
			setVolume: function(volume) {},
			play: function(music) {}
		}
	},
	/* Creates a stats tool, which counts strings and calculates misc stats about them */
	makeStatsTool: function() {
		var jstvt = this;
		return {
			items: [],
			index: {},
			perten: {},
			lower: null,
			higher: null,
			lowervalue: 0,
			highervalue: 0,
			keys: null,
			add: function(item) {
				if (!this.index[item]) {
					this.index[item] = 1;
					this.items.push(item);
				} else this.index[item]++;
			},
			getCloud: function(cloudclass, itemclass) {
				var out = "<ul class='" + cloudclass + "'>";
				for (var j = 0; j < this.items.length; j++)
				out += "<li class='" + itemclass + this.perten[this.items[j]] + "'>" + jstvt.htmlEntities(this.items[j]) + "</li>";
				out += "</ul>";
				return out;
			},
			close: function() {
				for (var i = 0; i < this.items.length; i++) {
					if ((this.lower == null) || (this.index[this.items[i]] < this.lowervalue)) {
						this.lower = this.items[i];
						this.lowervalue = this.index[this.lower];
					}
					if ((this.higher == null) || (this.index[this.items[i]] > this.highervalue)) {
						this.higher = this.items[i];
						this.highervalue = this.index[this.higher];
					}
				}
				var range = this.highervalue - this.lowervalue;
				for (var i = 0; i < this.items.length; i++)
				this.perten[this.items[i]] = range ? Math.round((this.index[this.items[i]] - this.lowervalue) / range * 10) : 3;
				this.keys = [];
				for (var a in this.index) this.keys.push(a);
				this.items.sort();
			}
		}
	},
	/* Creates an operation queue. */
	makeOperationsQueue: function(cb) {
		return {
			running: false,
			cnext: 1,
			items: [],
			add: function(elm, bottom) {
				for (var i = 0; i < elm.length; i++)
				this.items.splice(bottom ? this.items.length : this.cnext++, 0, elm[i]);
			},
			next: function() {
				this.running = true;
				this.cnext = 1;
				if (!this.items.length) {
					if (cb) cb(this);
					this.running = false;
				} else if (!this.items[0].method.apply(this.items[0].context, this.items[0].args)) this.done()
			},
			done: function() {
				this.items.shift();
				return this.next()
			},
			run: function() {
				if (!this.running) this.next();
			}
		}
	},
	/* ---
	 * INITIALIZES JSTVT
	 * ---
	 */
	/* Detects basic browser features and applies some common fixes */
	initialize: function() {
		this._div = document.createElement("div");
		// FULL SCREEN CAPABILITIES
		var api = [{
			request: "requestFullScreen",
			cancel: "cancelFullScreen",
			check: "fullScreen",
			event: "fullscreenchange",
			element: "fullscreenElement"
		}, {
			request: "webkitRequestFullScreen",
			cancel: "webkitCancelFullScreen",
			check: "webkitIsFullScreen",
			event: "webkitfullscreenchange",
			element: "webkitFullscreenElement"
		}, {
			request: "mozRequestFullScreen",
			cancel: "mozCancelFullScreen",
			check: "mozFullScreen",
			event: "mozfullscreenchange",
			element: "mozFullScreenElement"
		}, {
			request: "oRequestFullScreen",
			cancel: "oCancelFullScreen",
			check: "oFullScreen",
			event: "ofullscreenchange",
			element: "oFullScreenElement"
		}];
		for (var a = 0; a < api.length; a++) if (this._div[api[a].request]) {
			this.can.fullscreen = api[a];
			break;
		}
		// AUDIO CAPABILITIES
		var audio = document.createElement("audio");
		this.can.audio = !! audio.canPlayType;
		this.can.worker = !! window.Worker;
		this.can.json = !! window.JSON
		// TOUCH CAPABILITIES
		if ('ontouchstart' in this._div) this.configuration.interaction = {
			isTouch: true,
			events: {
				hover: "touchstart",
				start: "touchstart",
				move: "touchmove",
				end: "touchend"
			}
		};
		else this.configuration.interaction = {
			isTouch: false,
			events: {
				hover: "mousemove",
				start: "mousedown",
				move: "mousemove",
				end: "mouseup"
			}
		};
		// CSS3 GFX CAPABILITIES
		this.can.transform = this.cssSupports("transform");
		this.can.transition = this.cssSupports("transition");
		this.can.animate = this.can.transform && this.can.transition;
		// IE FIXES
		if (!Array.indexOf) {
			Array.prototype.indexOf = function(obj, start) {
				for (var i = (start || 0); i < this.length; i++) {
					if (this[i] == obj) {
						return i;
					}
				}
				return -1;
			}
		}
	},
	initializeWorker: function() {
		this.configuration.isWorker = true;
	}
}

if (this.document !== undefined) JSTVT.initialize();
else JSTVT.initializeWorker();