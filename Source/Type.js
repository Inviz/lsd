/*
---
 
script: Type.js
 
description: A base class for all class pools
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Behavior
  - LSD.Helpers
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
  if (name) {
    this.name = name;
    this.namespace = namespace || 'LSD';
    var holder = Object.getFromPath(LSD.global, this.namespace);
    if (typeof holder == 'undefined') throw "LSD.Type cant find namespace " + namespace
    var storage = Object.getFromPath(holder, name);
    if (storage) {
      if (!storage.pool)
        for (var key in this)
          storage[key] = (this[key].call) ? this[key].bind(this) : this[key];
      else storage = null;
    } else 
      storage = (holder[name] = this);
  } else {
    storage = this;
  }  
  this.storage = storage;
  if (typeOf(this.storage) == 'class') 
    this.klass = this.storage;
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
  
  find: function(name, strict) {
    if (!strict) {
      if (!name.push && name.indexOf('-') > -1) name = name.split('-');
      if (name.push) {
        for (; name.length; name.pop()) {
          var found = this.find(name.join('-'), true);
          if (found) return found;
        }
        return false;
      }
    }
    if (!this.queries) this.queries = {};
    else if (this.queries[name] != null) return this.queries[name];
    var path = LSD.toClassName(name);
    for (var i = 0, storage; storage = this.pool[i++];) {
      var result = Object.getFromPath(storage, path);
      if (result) return (this.queries[name] = result);
    }
    return (this.queries[name] = false);
  },
  
  create: function(element, options) {
    return new LSD.Widget(element, options)
  },
  
  convert: function(element, options) {
    if (!this.find(LSD.Layout.getSource(element))) return;
    var klass = this.klass || LSD.Widget;
    return new LSD.Widget(element, options);
  },
  
  $family: function() {
    return 'type';
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
