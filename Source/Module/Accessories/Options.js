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
    for (var name in options) LSD.Module.Options.setOption.call(this, name, options[name]);
    return this;
  },
  
  unsetOptions: function(options) {
    for (var name in options) LSD.Module.Options.setOption.call(this, name, options[name], true);
    return this;
  },
  
  /*
    Run constructors for a given object. If no object was given,
    constructs this widget. It collects functions defined in
    `this.constructors` object and runs them in order (but they
    should make no assumptions about the order). If a constructor
    function returns options, the function keeps and sets it to
    the widget later.
  */
  
  construct: function(object, set) {
    if (!object) object = this;
    var initialized = (this.$initialized || (this.$initialized = {}));
    /*
      Run module constructors and keep returned values
    */
    for (var name in object.constructors) {
      var constructor = object.constructors[name];
      if (constructor) {
        var result = constructor.call(this, object.options, true);
        if (result) initialized[name] = result;
      }
    }
    /*
      Set options returned from constructors
    */
    for (var name in initialized) this.setOptions(initialized[name]);
    /* 
      Set options from the object
    */
    if (set) this.setOptions(object.options);
    return object.options;
  },
  
  /*
    Undo all things constructor did. Run all constructors callback
    with a `state` argument given as false. If a constructor on
    the object has associated generated options, it unsets them.
  */
  destruct: function(object, set) {
    if (!object) object = this;
    for (var name in object.constructors) {
      var constructor = object.constructors[name];
      if (constructor) constructor.call(this, object.options, false);
      if (this.$initialized[name]) {
        if (!initialized) var initialized = [];
        initialized.push(object)
      }
    }
    if (initialized)
      for (var i = 0, value; value = initialized[i++];) this.unsetOptions(value);
    if (set) this.unsetOptions(object.options);
    return object.options;
  }
});

LSD.Module.Options.setOption = function(name, value, unset, context) {
  var setter = (context || LSD.Options)[name];
  if (!setter) {
    Object.merge(this.options, name, value);
    return this;
  };
  if (setter.process) {
    value = (setter.process.charAt ? this[setter.process] : setter.process).call(this, value);
  }
  if (setter.events) LSD.Module.Events.setEventsByRegister.call(this, name, !unset, setter.events);
  var mode = unset ? 'remove' : 'add', method = setter[mode];
  if (method.charAt) method = this[method];
  if (setter.iterate) {
    if (value.each) {
      var length = value.length;
      if (length != null) for (var i = 0, j = value.length; i < j; i++) method.call(this, value[i]);
      else value.each(method, this);
    } else for (var i in value) method.call(this, i, value[i])
  } else method.call(this, value);
  return this;
};

LSD.Module.Options.implement('setOption', LSD.Module.Options.setOption);

LSD.Module.Options.initialize = function(element, options) {
  // Swap arguments if they are in the wrong order
  if ((element && !element.localName) || (options && options.localName)) 
    options = [element, element = options][0];
  
  // Merge given options object into this.options
  if (options) Object.merge(this.options, options);
  
  // Run constructors and set options
  options = this.construct(this, true);
  
  // Indicate readiness to start
  this.fireEvent('boot', [options, element]);
  
  // Attach to a given element
  this.fireEvent('prepare', [options, element]);
  this.prepared = true;
  
  this.fireEvent('finalize', [options, this.element]);
  
  // And we're all set!
  this.fireEvent('initialize', [options, this.element]);
};