/*
---
 
script: Section.js
 
description: SVG-Based content element (like <section> in html5)
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Paint

provides: [ART.Widget.Section]
 
...
*/

ART.Widget.Section = new Class({
  Extends: ART.Widget.Paint,
  
  name: 'section',

  options: {
    element: {
      tag: ART.html5 ? 'section' : 'div'
    }
  },
  
  layered: {
    shadow:  ['shadow'],
    fill:  ['stroke'],
    reflection:  [ART.Layer.Fill.Reflection.Offset],
    background: [ART.Layer.Fill.Background.Offset]
  }
});