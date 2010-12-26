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
    actions: {
      draggable: {
        watches: "#title"
      },
      resizer: {
        uses: ["#handle", "#content"]
      }
    },
    events: {
      '#buttons': {
        '#close': {
          click: 'close'
        },
        '#minimize': {
          click: 'collapse'
        },
        '#maximizer': {
          click: 'expand'
        }
      },
      'header #toggler': {
        click: 'mutate'
      },
      self: {
        close: 'hide'
      }
    }
  }
  
});