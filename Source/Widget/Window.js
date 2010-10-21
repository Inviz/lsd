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

ART.Widget.Window = new Class({
  
  Includes: [
    ART.Widget.Paint,
    ART.Widget.Trait.Aware,
    Widget.Trait.Animation
  ],
  
  States: {
    'closed': ['close', 'open'],
    'collapsed': ['collapse', 'expand'],
    'minified': ['minify', 'enlarge', 'mutate']
  },
  
  name: 'window',
  
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
    },
	  header: {
	    toggler: {
        click: 'mutate'
	    }
	  },
	  self: {
	    close: 'hide'
	  }
  },
  
  layered: {
    shadow:  ['shadow'],
    stroke:  ['stroke'],
    reflection: ['fill', ['reflectionColor']],
    background: ['fill', ['backgroundColor']]
  },
  
  getResized: function() {
    return this.content;
  }
  
});