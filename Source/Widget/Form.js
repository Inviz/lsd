/*
---
 
script: Form.js
 
description: A form widgets. Intended to be submitted.
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Paint

provides: [LSD.Widget.Form]
 
...
*/

LSD.Widget.Form = new Class({
  Extends: LSD.Widget.Paint,

  options: {
    tag: 'form',
    element: {
      tag: 'form'
    },
    layers: {},
    events: {
      element: {
        submit: $lambda(false)
      }
    }
  }  
});