/*
---
 
script: Container.js
 
description: Makes widget use container - wrapper around content setting
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Base
- ART.Container

provides: [ART.Widget.Module.Container]
 
...
*/

ART.Widget.Module.Container = new Class({
  options: {
    container: false
  },
  
  setContent: function() {
    return this.getContainer().set.apply(this.container, arguments);
  },
  
  getContainer: function() {
    if (!this.container) this.container = new Moo.Container(this, this.options.container);
    return this.container;
  }
});

ART.Widget.Ignore.attributes.push('container');