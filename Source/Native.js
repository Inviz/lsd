/*
---
 
script: Native.js
 
description: Wrapper for native browser controls
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Widget

provides: 
  - LSD.Native
 
...
*/

LSD.Native = new Class({
  Extends: LSD.Widget,
  options: {
    inline: null //use widget tag when no element tag specified
  }
});
new LSD.Type('Native');

// Inject native widgets into default widget pool as a fallback
LSD.Element.pool[LSD.useNative ? 'unshift' : 'push'](LSD.Native);