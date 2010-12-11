/*
---
 
script: Glyph.js
 
description: Like a button with icon but without a button, actually
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Paint
- Base/Widget.Trait.Touchable

provides: [LSD.Widget.Glyph]
 
...
*/

LSD.Widget.Glyph = new Class({
  Includes: [
    LSD.Widget.Paint,
    Widget.Trait.Touchable.Stateful
  ],
  
  options: {
    name: null,
    tag: 'glyph',
    layers: {
      glyph: ['glyph']
    }
  },
  
  initialize: function() {
    this.parent.apply(this, arguments);
    if (this.options.name) this.style.current.glyphName = this.options.name;
  }
});