/*
---
 
script: Radio.js
 
description: A radio button, set of connected widgets that steal checkedness from each other
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Input
- ART.Widget.Paint
- Base/Widget.Trait.Touchable
- Base/Widget.Trait.Focus
- Base/Widget.Trait.Accessibility

provides: [ART.Widget.Input.Radio]
 
...
*/

ART.Widget.Input.Radio = new Class({
  Includes: [
    ART.Widget.Paint,
    Widget.Trait.Touchable.Stateful,
    Widget.Trait.Focus.Stateful,
    Widget.Trait.Accessibility
  ],
  
  States: {
    'checked': ['check', 'uncheck']
  },
  
  name: 'input',
  
  shortcuts: {
    space: 'check'
  },

  layered: {
    shadow:  ['shadow'],
    stroke: ['stroke'],
    background:  ['fill', ['backgroundColor']],
    reflection:  ['fill', ['reflectionColor']],
    glyph: ['glyph']
  },
  
  check: Macro.onion(function() {
    this.getGroup().each(function(element) {
      if (element != this && element.getAttribute('type') == 'radio') element.uncheck();
    }, this)
  }),
  
  getGroup: function() {
    return (this.attributes.name) ? this.document.getElements('[name="' + this.attributes.name + '"]') : []
  },
  
  retain: function() {
    this.check();
    return this.parent.apply(this, arguments);
  }
});