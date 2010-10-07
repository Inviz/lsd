/*
---
 
script: Button.js
 
description: A button widget. You click it, it fires the event
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Paint
- Base/Widget.Trait.Touchable

provides: [ART.Widget.Button]
 
...
*/

ART.Widget.Button = new Class({

  Includes: [
    ART.Widget.Paint,
    Widget.Trait.Touchable.Stateful
  ],

  name: 'button',

  options: {
    label: ''
  },
  
  events: {
    enabled: {
      element: {
        click: 'onClick'
      }
    }
  },
  
  layered: {
    shadow:  ['shadow'],
    stroke: ['stroke'],
    background:  ['fill', ['backgroundColor']],
    reflection:  ['fill', ['reflectionColor']],
    glyph: ['glyph']
  },
  
  onClick: function() {
    this.fireEvent('click', arguments);
  },

  setContent: Macro.onion(function(content) {
    this.setState('text')
  })

});
