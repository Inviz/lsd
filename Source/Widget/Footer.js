/*
---
 
script: Footer.js
 
description: SVG-Based footer element (like <footer> in html5)
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Section

provides: [LSD.Widget.Footer]
 
...
*/

LSD.Widget.Footer = new Class({
  Extends: LSD.Widget.Section,

  options: {
    tag: 'footer',
    element: {
      tag: 'footer'
    }
  }
});