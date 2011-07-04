/*
---
 
script: Element.js
 
description: Turns generic widget into specific by mixing in the tag class
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module
  - LSD.Module.Options
  - LSD.Module.Events

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
      if (options.context) this.setContext(options.context)
      this.nodeType = options.nodeType;
    }
  },
  
  getSource: function(raw) {
    var source = this.options.source;
    if (source) return source;
    source = LSD.Layout.getSource(this.attributes, this.tagName);
    return raw || !source.join ? source : source.join('-');
  },
  
  setSource: function(source) {
    if (!source) source = this.getSource(true);
    if (this.source != source) {
      if (source.length) {
        var role = this.context.find(source);
        if (role && role != this.role) {
          var kind = this.attributes.kind
          if (kind) role = role[LSD.toClassName(kind)] || role;
          if (this.role) this.unmix(this.role);
          this.role = role;
          this.mixin(role);
          if ((this.sourced = this.captureEvent('setRole', role))) this.setOptions(this.sourced);
          console.log(this.sourced, this.element, source)
        }
      }
      this.source = source && source.length ? (source.join ? source.join('-') : source) : false; 
    }
    return this;
  },
  
  unsetSource: function(source) {
    if (source != this.source) return;
    if (this.role) this.unmix(this.role);
    if (this.sourced) this.unsetOptions(this.sourced);
    delete this.source;
    delete this.role;
    return this;
  },
  
  setContext: function(name) {
    name = LSD.toClassName(name);
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
      this.unsetTag(old, true);
    }
    this.nodeName = this.tagName = tag;
    this.fireEvent('tagChanged', [this.tagName, old]);
  },
  
  unsetTag: function(tag, light) {
    if (tag ? !this.tagName : this.tagName != tag) return;
    delete this.tagName;
    if (!light) this.fireEvent('tagChanged', [null, this.tagName]);
    this.unsetSource();
    delete this.nodeName;
  },

  mixin: function(mixin, light) {
    if (typeof mixin == 'string') mixin = LSD.Mixin[LSD.capitalize(mixin)];
    Class.mixin(this, mixin, light);
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

LSD.Module.Events.addEvents.call(LSD.Module.Tag.prototype, {
  tagChanged: function(tag) {
    if (tag) this.setSource();
    else this.unsetSource();
  },
  initialize: function() {
    this.setSource();
  },
  beforeBuild: function() {
    if (this.source == null) this.setSource();
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