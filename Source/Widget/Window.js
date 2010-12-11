/*
---
 
script: Window.js
 
description: Window for fun and profit
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Paint
- Base/Widget.Trait.Animation
 
provides: [LSD.Widget.Window]
 
...
*/

LSD.Widget.Window = new Class({
  
  Includes: [
    LSD.Widget.Paint,
    Widget.Trait.Animation
  ],
  
  States: {
    'closed': ['close', 'open'],
    'collapsed': ['collapse', 'expand'],
    'minified': ['minify', 'enlarge', 'mutate']
  },
  
  options: {
    tag: 'window',
    layers: {
      shadow:  ['shadow'],
      stroke:  ['stroke'],
      reflection: [LSD.Layer.Fill.Reflection],
      background: [LSD.Layer.Fill.Background]
    },
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
    }
  },
  
  getResized: function() {
    return this.content;
  }
  
});