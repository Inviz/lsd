/*
---
 
script: Button.js
 
description: A button widget. You click it, it fires the event
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Paint
- Base/Widget.Trait.Touchable

provides: [LSD.Widget.Button]
 
...
*/

LSD.Widget.Button = new Class({

  Includes: [
    LSD.Widget.Paint,
    Widget.Trait.Touchable.Stateful
  ],

  options: {
    tag: 'button',
    layers: {
      shadow:  ['shadow'],
      stroke: ['stroke'],
      background:  [LSD.Layer.Fill.Background.Offset],
      reflection:  [LSD.Layer.Fill.Reflection.Offset],
      glyphShadow: ['glyph-shadow'],
      glyph: ['glyph']
    },
    label: ''
  },
  
  setContent: function(content) {
    this.setState('text');
    return this.parent.apply(this, arguments);
  }

});
