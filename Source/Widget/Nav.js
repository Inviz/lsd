/*
---
 
script: Nav.js
 
description: SVG-Based nav element (like <nav> in html5)
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Section

provides: [ART.Widget.Nav]
 
...
*/

ART.Widget.Nav = new Class({
  Extends: ART.Widget.Section,
  
  name: 'nav',

  options: {
    element: {
      tag: ART.html5 ? 'nav' : 'div'
    }
  }
});