/*
---
 
script: Element.js
 
description: Turns generic widget into specific by mixing in the tag class
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module
  - LSD.Module.Options

provides: 
  - LSD.Module.Tag
 
...
*/

LSD.Module.Tag = new Class({
  
  initializers: {
    tag: function(options) {
      this.nodeType = options.nodeType;
    }
  },
  
  setSource: function() {
    if (this.role) this.unsetTag(this.role);
    this.role = LSD.
    
  },
  
  unsetSource: function() {
    
  },
  
  setTag: function(tag) {
    var old = this.tagName;
    if (old) this.unsetTag(this.tag);
    this.nodeName = this.tagName = tag;
    this.tag = tag;
    console.log('set tag', this.tag)
    this.fireEvent('tagChanged', [this.tagName, old]);
  },
  
  unsetTag: function(tag) {
    
  },

  mixin: function(mixin) {
    if (typeof mixin == 'string') mixin = LSD.Mixin[LSD.capitalize(mixin)];
    Class.mixin(this, mixin);
    if (mixin.prototype.options) {
      Object.merge(this.options, mixin.prototype.options); //merge!
      this.setOptions(this.construct(mixin.prototype));
    }
    return this;
  },

  unmix: function(mixin) {
    if (typeof mixin == 'string') mixin = LSD.Mixin[LSD.capitalize(mixin)];
    this.unsetOptions(this.destruct(mixin.prototype));
    Class.unmix(this, mixin);
    return this;
  }
  
});

LSD.Options.tag = {
  add: 'setTag',
  remove: 'unsetTag'
}