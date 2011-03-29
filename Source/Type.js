/*
---
 
script: Type.js
 
description: A base class for all class pools
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - More/Object.Extras
  
provides:
  - LSD.Type
  - LSD.Module
  - LSD.Trait
  - LSD.Mixin
  - LSD.Element
  
...
*/

LSD.Type = function(name, namespace) {
  this.name = name;
  this.count = 0;
  this.namespace = namespace || 'LSD';
  var holder = Object.getFromPath(window, this.namespace);
  if (this.storage = holder[name]) {
    for (var key in this) this.storage[key] = (this[key].call) ? this[key].bind(this) : this[key];
  }
  else this.storage = (holder[name] = this);
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
    if (!this.queries) this.queries = {};
    else if (this.queries[name] != null) return this.queries[name];
    name = LSD.toClassName(name);
    for (var i = 0, storage; storage = this.pool[i++];) {
      var result = Object.getFromPath(storage, name);
      if (result) return (this.queries[name] = result);
    }
    return (this.queries[name] = false);
  },
  create: function(name, a, b, c, d) {
    var widget = this.find(name);
    if (!widget) throw 'Class named LSD.' + LSD.toClassName(this.name) + '.' + LSD.toClassName(name) + ' was not found';
    this.count++;
    return new widget(a, b, c, d);
  }
}
// must-have stuff for all widgets 
new LSD.Type('Module');
// some widgets may use those
new LSD.Type('Trait');
// these may be applied in runtime
new LSD.Type('Mixin');
// these may be applied in runtime
new LSD.Type('Element');