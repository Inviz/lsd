/*
---
 
script: Script/Variable.js
 
description: Creates an object that watches parent widget for a value by token
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - LSD.Script
  
provides:
  - LSD.Script.Variable
  
...
*/

/*
  Variables are the core of LSD.Script. A variable attaches to a widget and 
  notifies it that there's a named variable that needs to populate its value.
  
  A widget may have muptiple sources of data for variables. The only source
  that is enabled by default is microdata and dataset, so a HTML written the 
  right way provides values for variables. Microdata and dataset objects, 
  just like other other store objects used are LSD.Object-compatible. 
  These objects provide `.watch()` interface that allows to observe changes
  in object values. See LSD.Module.Interpolations for ways to add other
  sources of data.
  
  Each variable has `token` or name, which is used as the key to fetch values.
  LSD.Object provides support for nested keys as in `post.author.name` that
  sets up a chain of observers and whenever any of the parts are changed,
  the variable is set a new value.
 
  A value may have a placeholder - default value to be used when the value
  was not found in widget.
  
  A variable may have a parent object, a function that has that variable 
  as argument. Whenever variable changes, it only calls parent function
  to update, and that function cascades up updating all the parents. That 
  makes values recompule lazily.
  
  A variable accepts `output` as a second parameter. It may be function,
  text node, a layout branch or widget. Variable class is also a base
  class for Function and Selector classes, so they are all handle
  `output` the same way.
*/

LSD.Script.Variable = function(input, source, output) {
  this.name = this.input = input;
  this.output = output;
  this.source = source;
};

LSD.Script.Variable.prototype = {
  variable: true,
  
  set: function(value) {
    this.value = this.process ? this.process(value) : value;
    this.onSet(this.value);
  },
  
  onSet: function(value) {
    if (value == null && this.placeholder) value = this.placeholder;
    if (this.output) this.update(value);
    if (this.parent) this.parent.set();
  },
  
  attach: function() {
    return this.fetch(true);
  },
  
  detach: function() {
    return this.fetch(false);
  },
  
  fetch: function(state) {
    if (!this.setter) this.setter = this.set.bind(this);
    (this.source.call ? this.source : this.request).call(this, this.input, this.setter, this.source, state);
    return this;
  },
  
  request: function(input, callback, source, state) {
    return this.source.variables[state ? 'watch' : 'unwatch'](input, callback);
  },
  
  update: function(value) {
    var output = this.output;
    if (!output) return;
    return LSD.Script.output(this.output, value); 
  }     
};