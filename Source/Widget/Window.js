/*
---
 
script: Window.js
 
description: Window for fun and profit
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Paint
- ART.Widget.Trait.Aware
- Base/Widget.Trait.Animation
 
provides: [ART.Widget.Window]
 
...
*/

// Window Widget. Work in progress.
ART.Widget.Window = new Class({
  
  Includes: [
    ART.Widget.Paint,
    ART.Widget.Trait.Aware,
    Widget.Trait.Animation
  ],
  
  States: {
    'closed': ['close', 'open'],
    'collapsed': ['collapse', 'expand']
  },
  
  name: 'window',
  
  layout: {},
  
  events: {
    buttons: {
      close: {
        click: 'close'
      },
      collapse: {
        click: 'collapse'
      },
      expand: {
        click: 'expand'
      }
    }
  },
  
  layered: {
    shadow:  ['shadow'],
    stroke:  ['stroke'],
    reflection: ['fill', ['reflectionColor']],
    background: ['fill', ['backgroundColor']],
  },
  
  close: Macro.onion(function() {
    this.hide();
  }),
  
  getResized: function() {
    return this.content;
  }
  
});