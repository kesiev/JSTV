importScripts("jstvt.js"); 
importScripts("jstvc.js");

self.onmessage = function (oEvent) {
	var parse={channel:JSON.parse(oEvent.data)};
	JSTVC.finalizer.finalize(parse.channel,null,true);
 	postMessage(JSON.stringify(parse.channel));
	self.close();
};