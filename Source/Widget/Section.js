/*
---
 
script: Section.js
 
description: SVG-Based content element (like <section> in html5)
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Paint

provides: [LSD.Widget.Section]
 
...
*/

LSD.Widget.Section = new Class({
  Extends: LSD.Widget.Paint,
  
  options: {
    tag: 'section',
    layers: {
      shadow:  ['shadow'],
      fill:  ['stroke'],
      reflection:  [LSD.Layer.Fill.Reflection.Offset],
      background: [LSD.Layer.Fill.Background.Offset]
    },
    element: {
      tag: 'section'
    }
  }
});