/*
---
 
script: Input.js
 
description: A base class for all kinds of form controls
 
license: MIT-style license.
 
requires:
- ART.Widget.Paint
- Base/Widget.Trait.Input

provides: [ART.Widget.Input]
 
...
*/

ART.Widget.Input = new Class({
  Includes: [
    ART.Widget.Paint,
    Widget.Trait.Input
  ],
  
  name: 'input',
  
  attributes: {
    type: 'text'
  },
  
  events: {
    element: {
      mousedown: 'retain'
    }
  },
  
  layered: {
    shadow:  ['shadow'],
    stroke: ['stroke'],
    background:  ['fill', ['backgroundColor']],
    reflection:  ['fill', ['reflectionColor']],
    glyph: ['glyph']
  },
  
  focus: Macro.onion(function() {
    this.input.focus();
  }),
  
  retain: function() {
    if (!this.disabled) this.focus.delay(30, this);
  },
  
  applyValue: function(item) {
    this.input.set('value', item);
  }
});