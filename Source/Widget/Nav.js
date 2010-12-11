/*
---
 
script: Nav.js
 
description: SVG-Based nav element (like <nav> in html5)
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Section

provides: [LSD.Widget.Nav]
 
...
*/

LSD.Widget.Nav = new Class({
  Extends: LSD.Widget.Section,
  
  options: {
    tag: 'nav',
    element: {
      tag: 'nav'
    }
  }
});