/*
---
 
script: Body.js
 
description: Lightweight document body wrapper
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires: 
  - LSD.Document.Resizable
  - LSD.Widget
  - LSD.Widget.Module.Expectations
provides:
  - LSD.Widget.Body

...
*/

LSD.Widget.Body = new Class({
  Includes: [LSD.Document.Resizable, LSD.Widget.Module.Expectations]
});