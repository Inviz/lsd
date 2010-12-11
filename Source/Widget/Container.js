/*
---
 
script: Container.js
 
description: Container widget to wrap around the content
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Element

provides: [LSD.Widget.Container]
 
...
*/

LSD.Widget.Container = new Class({
  Extends: LSD.Widget.Element,
  
  options: {
    tag: 'container'
  }
});