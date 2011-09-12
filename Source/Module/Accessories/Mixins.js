/*
---
 
script: Element.js
 
description: Adds and removes Widget classes and traits 
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module

provides: 
  - LSD.Module.Mixins
 
...
*/

LSD.Module.Mixins = new Class({
  
  constructors: {
    mixins: function(options) {
      var self = this;
      this.mixins = (new LSD.Object.Stack).addEvent('change', function(name, value, state, old) {
        if (state) {
          if (old == null) self.mixin(LSD.Mixin[LSD.toClassName(name)], true);
        } else {
          self.unmix(LSD.Mixin[LSD.toClassName(name)], true);
        }
      })
    }
  },

  mixin: function(mixin, light) {
    if (typeof mixin == 'string') {
      this.mixins.include(mixin);
    } else {
      Class.mixin(this, mixin, light);
      this.construct(mixin.prototype, true);
    }
    return this;
  },

  unmix: function(mixin, light) {
    if (typeof mixin == 'string') {
      this.mixins.erase(mixin);
    } else {  
      this.destruct(mixin.prototype, true);
      Class.unmix(this, mixin, light);
    }
    return this;
  }
  
});