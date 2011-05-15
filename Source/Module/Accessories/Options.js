/*
---
 
script: Options.js
 
description: A module that sets and unsets various options stuff
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module
  
provides:
  - LSD.Module.Options

...
*/

LSD.Module.Options = new Class({
  Implements: [Options],
  
  setOptions: function(options) {
    for (var name in options) this.setOption(name, options[name]);
    return this;
  },
  
  setOption: function(name, value, unset) {
    setter = LSD.Options[name];
    if (!setter) return;
    if (setter.process) {
      value = (setter.process.charAt ? this[setter.process] : setter.process).call(this, value);
    }
    if (setter.events) LSD.Module.Events.setEventsByRegister.call(this, name, !unset, setter.events);
    var mode = unset ? 'remove' : 'add', method = setter[mode];
    if (method.charAt) method = this[method];
    if (setter.iterate) {
      if (value.each) for (var i = 0, j = value.length; i < j; i++) method.call(this, value[i]);
      else for (var i in value) method.call(this, i, value[i])
    } else method.call(this, value);
    return this;
  },
  
  unsetOptions: function(options) {
    for (var name in options) this.setOption(name, options[name], true);
    return this;
  },
  
  construct: function(object) {
    if (!object) object = this;
    var initialized = object.$initialized = [];
    /*
      Run module initializers and keep return values
    */
    for (var name in object.initializers) {
      var initializer = object.initializers[name];
      if (initializer) {
        var result = initializer.call(this, object.options);
        if (result) initialized.push(result);
      }
    }
    /*
      Set options returned from initializers
    */
    for (var i = 0, value; value = initialized[i++];) this.setOptions(value);
    return object.options;
  },
  
  destruct: function(object) {
    if (!object) object = this;
    var initialized = object.$initialized;
    if (initialized)
      for (var i = 0, value; value = initialized[i++];) this.unsetOptions(value);
    return object.options;
  }
});

LSD.Module.Options.initialize = function(element, options) {
  // Rearrange arguments if they are in the wrong order
  if ((element && !element.tagName) || (options && options.tagName)) {
    var el = options;
    options = element, element = el;
  }
  
  // Merge given options object into this.options
  if (options) Object.merge(this.options, options);
  
  // Collection options off initializers
  options = this.construct();
  
  // Call parent class initializer (if set)
  if (Class.hasParent(this)) this.parent(element, options);
  
  // Run callbacks for all the options set
  this.setOptions(options);
  
  // Attach to a given element
  this.fireEvent('initialize', [options, element])
};