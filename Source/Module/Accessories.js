/*
---

script: Accessories.js

description: Things that change the widget in one module

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module.Options
  - LSD.Module.States
  - LSD.Module.Attributes
  - LSD.Module.Events
  - LSD.Module.Dimensions
  - LSD.Module.Styles
  - LSD.Module.Shortcuts
  - LSD.Module.Element
  - LSD.Module.Selectors
  - LSD.Module.Tag
provides: 
  - LSD.Module.Accessories

...
*/

LSD.Module.Accessories = new Class({
  Implements: [
    LSD.Module.Options,
    LSD.Module.States,
    LSD.Module.Attributes,
    LSD.Module.Events,
    LSD.Module.Dimensions,
    LSD.Module.Styles,
    LSD.Module.Shortcuts,
    LSD.Module.Element,
    LSD.Module.Selectors,
    LSD.Module.Tag
  ]
});