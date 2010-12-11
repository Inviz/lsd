/*
---
 
script: Input.js
 
description: A base class for all kinds of form controls
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Paint
- Base/Widget.Trait.Input
- Base/Widget.Trait.Focus.State

provides: [LSD.Widget.Input]
 
...
*/
LSD.Widget.Input = new Class({
  Includes: [
    LSD.Widget.Paint,
    Widget.Trait.Focus.State,
    Widget.Trait.Input
  ],
  
  options: {
    tag: 'input',

    attributes: {
      type: 'text'
    },

    layers: {
      shadow:  ['shadow'],
      stroke: ['stroke'],
      background:  [LSD.Layer.Fill.Background],
      reflection:  [LSD.Layer.Fill.Reflection],
      glyph: ['glyph']
    }
  },
  
  focus: Macro.onion(function() {
    this.input.focus();
  }),
  
  retain: function() {
    this.focus(false);
    return false;
  },
  
  applyValue: function(item) {
    this.input.set('value', item);
  }
});