/*
---
 
script: Type.js
 
description: A base class for all class pools
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Behavior
  - More/Object.Extras
  
provides:
  - LSD.Type
  - LSD.Module
  - LSD.Trait
  - LSD.Mixin
  - LSD.Element
  - LSD.Native
  
...
*/

LSD.Type = function(name, namespace) {
  this.name = name;
  this.namespace = namespace || 'LSD';
  var holder = Object.getFromPath(window, this.namespace);
  if (this.storage = holder[name]) {
    
    for (var key in this) {
      this.storage[key] = (this[key].call) ? this[key].bind(this) : this[key];
    }
  }
  else this.storage = (holder[name] = this);
  if (typeOf(this.storage) == 'class') this.klass = this.storage;
  this.pool = [this.storage];
  this.queries = {};
};

LSD.Type.prototype = {
  each: function(callback, bind) {
    for (var name in this.storage) {
      var value = this.storage[name];
      if (value && value.$family && value.$family() == 'class') callback.call(bind || this, value, name)
    }
  },
  
  find: function(name) {
    if (name.push) {
      for (; name.length; name.pop()) {
        var found = this.find(name.join('-'));
        if (found) return found;
      }
      return false;
    }
    if (!this.queries) this.queries = {};
    else if (this.queries[name] != null) return this.queries[name];
    name = LSD.toClassName(name);
    for (var i = 0, storage; storage = this.pool[i++];) {
      var result = Object.getFromPath(storage, name);
      if (result) return (this.queries[name] = result);
    }
    return (this.queries[name] = false);
  },
  
  create: function(element, options) {
    return new LSD.Widget(element, options)
  },
  
  use: function(element, options, parent) {
    if (parent) var mutation = LSD.Layout.mutate(element, parent);
    options = mutation && options ? Object.merge(mutation, options) : mutation || options;
    options.context = LSD.toLowerCase(this.name);
    return this.convert(element, options);
  },
  
  convert: function(element, options) {
    var source = (options && options.source) || LSD.Layout.getSource(element);
    if (!this.find(source)) return;
    var klass = this.klass || LSD.Widget;
    return new LSD.Widget(element, options);
  }
}
// must-have stuff for all widgets 
new LSD.Type('Module');
// some widgets may use those
new LSD.Type('Trait');
// these may be applied in runtime
new LSD.Type('Mixin');
// a widget holder
new LSD.Type('Element');
// native browser controls
new LSD.Type('Native');

// Inject native widgets into default widget pool as a fallback
LSD.Element.pool[LSD.useNative ? 'unshift' : 'push'](LSD.Native);