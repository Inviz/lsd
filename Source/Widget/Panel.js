/*
---
 
script: Panel.js
 
description: A fieldset like widget for various content
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Paint

provides: [LSD.Widget.Panel]
 
...
*/

LSD.Widget.Panel = new Class({
  Extends: LSD.Widget.Paint,
  
  States: {
    'collapsed': ['collapse', 'expand']
  },
  
  options: {
    tag: 'panel',
    layers: {
      shadow:  ['shadow'],
      stroke:  ['stroke'],
      reflection: [LSD.Layer.Fill.Reflection],
      background: [LSD.Layer.Fill.Background],
      innerShadow:  ['inner-shadow']
    }
  }
  
});