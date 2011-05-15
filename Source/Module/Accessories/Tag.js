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
  options: {
    context: 'element',
    namespace: 'LSD'
  },
  
  initializers: {
    tag: function(options) {
      this.setContext(options.context)
      this.nodeType = options.nodeType;
    }
  },
  
  getSource: function(raw) {
    var attributes = this.attributes, source = attributes.source;
    if (source) return source;
    source = [this.tagName];
    var type = attributes.type;
    if (type) source.push(type);
    var kind = attributes.kind;
    if (kind) source.push(kind);
    return raw ? source : source.join('-');
  },
  
  setSource: function(source) {
    if (!source) source = this.getSource();
    var role = this.context.find(source);
    if (role && role != this.role) {
      if (this.role) this.unmix(this.role);
      this.role = role;
      this.mixin(role);
    }
    this.source = source;
    return this;
  },
  
  unsetSource: function(source) {
    if (source != this.source) return;
    if (this.role) this.unmix(this.role);
    delete this.source;
    delete this.role;
    return this;
  },
  
  setContext: function(name) {
    name = LSD.toClassName(name)
    if (this.context && this.context.name == name) return;
    if (this.source) {
      var source = this.source;
      this.unsetSource();
    }
    this.context = window[this.options.namespace][LSD.toClassName(name)];
    if (source) this.setSource(source);
    return this;
  },
  
  setTag: function(tag) {
    var old = this.tagName;
    if (old) {
      if (old == tag) return;
      this.unsetTag(old);
    }
    this.nodeName = this.tagName = tag;
    this.fireEvent('tagChanged', [this.tagName, old]);
    this.setSource();
  },
  
  unsetTag: function(tag) {
    this.unsetSource();
    delete this.tagName;
    delete this.nodeName;
  },

  mixin: function(mixin, light) {
    if (typeof mixin == 'string') mixin = LSD.Mixin[LSD.capitalize(mixin)];
    Class.mixin(this, mixin, light);
    if (mixin.prototype.options) Object.merge(this.options, mixin.prototype.options); //merge!
    this.setOptions(this.construct(mixin.prototype));
    return this;
  },

  unmix: function(mixin, light) {
    if (typeof mixin == 'string') mixin = LSD.Mixin[LSD.capitalize(mixin)];
    this.unsetOptions(this.destruct(mixin.prototype));
    Class.unmix(this, mixin, light);
    return this;
  }
  
});

Object.append(LSD.Options, {
  tag: {
    add: 'setTag',
    remove: 'unsetTag'
  },
  
  context: {
    add: 'setContext',
    remove: 'unsetContext'
  },
  
  source: {
    add: 'setSource',
    remove: 'unsetSource'
  }
});