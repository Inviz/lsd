/*
---
 
script: Header.js
 
description: SVG-Based header element (like <header> in html5)
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Section

provides: [LSD.Widget.Header]
 
...
*/

LSD.Widget.Header = new Class({
  Extends: LSD.Widget.Section,
  
  options: {
    tag: 'header',
    element: {
      tag: 'header'
    }
  }
});