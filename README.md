JSTV Suite and Gamecora TV
==========================

JSTV is the internet player. It plays a sequence of Javascript/CSS animated
scenes described via JSON and using a video-like interface.

JSTVC and Aggro can work together with JSTV for picking resources from Twitter
and RSS feeds and creating a dynamic sequence of scenes.
This package includes **Gamecora TV**, a full fledged dynamic channel about games
and hosted [here][gamecoratv].

[gamecoratv]: http://www.kesiev.com/gamecoratv

Helping Gamecora TV
-------------------

Do you want to suggest a new newsfeed, correct typos, suggest a new tagging structure for the [official hosted version][gamecoratv] of Gamecora TV?
Just branch JSTV, do some changes to the ``gamecora/sources/all.js`` and propose your commit for the main trunk.

Documentation
-------------

JSTV, JSTVC and Aggro are contained into the ``jstv/`` folder - that's all you need.
Further information are available on ``index-jstv.html``.

Ideas
-----

A set of ideas that could be implemented in the future.

**Aggro**

- Server-to-server cache update. It can be useful in order to full refresh cache from remote servers.
- *channel structure* to *channel content* conversion server-side (that means JSTVC porting on server side).It could be nice but after some tries I understood that switching everything to node.js can make everything easier and faster.

**JSTV**

- Add content cutting via ``{pick:"keyname"}``. If contents are too long to be fully rendered, why show them entirely? :)
- Turn on video preolading in ``youtube.js`` renderer. It can be switched on and off from configuration but it's not working on some legacy/stripped down browsers.
- Images preloading from scenes. It can take a long while on startup but it help stripping invisible/small images and will be shown faster on screen during playback.
- On ``jstvt.js`` use ``csssupport()`` in ``reset()`` command. It can make DOM node reset faster but seems that some CSS features aren't correctly detected (like ``borderRadius``). ``reset()`` is not massively used in the code and that makes this optimization not relevant.
- A "skip this scene" button on current position indicator. You can click on the left or on the right near any handle to move by a single unit (scene/volume) but an explicit button can make this feature more clear.

Hall of shame
-------------

Sadly many mobile browsers quite sucks on embedding videos and doing CSS3 animations due to outdated browsers or imposed limitations. I hope that this list will be kept short.

- **Safari on iOS devices** While CSS3 animations are quite good, it can't autoplay YouTube videos... :(
- **Firefox on Windows** Sometime it fails on linking JS interface so JSTV can't be called on video end. ``youtube.js`` is forcing HTML5 videos so this issue should be partially solved.
- **IE on XBOX360** While *IE10 seems giving best results here*, its XBOX360 incarnation seems pretty limited. No animations and bad graphics.
- **WiiU Browser** Like the iOS devices Safari, good animations but no YouTube autoplay.
- **Older Android phones stock browser** like Galaxy Ace. Everything works except for *no text in news*. Mmm.
- **PSVita Browser** HTML5 or Flash not supported... that's what YouTube is saying. The rest is working quite good!
- **3DS Browser** Surprisingly, everything works well except for the usual YouTube embeds and custom fonts.