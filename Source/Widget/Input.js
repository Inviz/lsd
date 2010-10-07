/*
---
 
script: Input.js
 
description: A base class for all kinds of form controls
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Paint
- Base/Widget.Trait.Input
- Base/Widget.Trait.Focus.State

provides: [ART.Widget.Input]
 
...
*/
ART.Widget.Input = new Class({
  Includes: [
    ART.Widget.Paint,
    Widget.Trait.Focus.State,
    Widget.Trait.Input
  ],
  
  name: 'input',
  
  attributes: {
    type: 'text'
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
    this.focus(false);
    return false;
  },
  
  applyValue: function(item) {
    this.input.set('value', item);
  }
});