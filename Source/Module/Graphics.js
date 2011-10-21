/*
---

script: Proxies.js

description: All visual rendering aspects under one umbrella

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Module.Layers
  - LSD.Module.Render
  - LSD.Module.Shape

provides:
  - LSD.Module.Graphics

...
*/


LSD.Module.Graphics = new Class({
  Implements: [
    LSD.Module.Layers,
    LSD.Module.Render,
    LSD.Module.Shape
  ]
});