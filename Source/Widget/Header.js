/*
---
 
script: Header.js
 
description: SVG-Based header element (like <header> in html5)
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Section

provides: [ART.Widget.Header]
 
...
*/

ART.Widget.Header = new Class({
  Extends: ART.Widget.Section,
  
  name: 'header',

  options: {
    element: {
      tag: ART.html5 ? 'header' : 'div'
    }
  }
});