/*
---

script: Ambient.js

description: When it needs to know what's going on around 

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module.DOM
  - LSD.Module.Layout
  - LSD.Module.Expectations
  - LSD.Module.Mutations
  - LSD.Module.Allocations
  - LSD.Module.Relations
  - LSD.Module.Proxies
  - LSD.Module.Container

provides: 
  - LSD.Module.Ambient

...
*/

LSD.Module.Ambient = new Class({
  Implements: [
    LSD.Module.DOM, 
    LSD.Module.Layout,
    LSD.Module.Expectations,
    LSD.Module.Mutations,
    LSD.Module.Allocations,
    LSD.Module.Relations,
    LSD.Module.Proxies,
    LSD.Module.Container
  ]
});