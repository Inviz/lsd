/*
---
 
script: Script/Variable.js
 
description: Creates an object that watches parent widget for a value by token
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
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
  in object values. Any object may be used as the source for data to populate
  variables with values.
  
  Each variable has a name, which is used as the key to fetch values.
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
  this.input = input;
  this.output = output;
  this.source = source;
};

LSD.Script.Variable.prototype = {
  type: 'variable',
  
  script: true,
  
  set: function(value, reset) {
    if (this.frozen) return;
    var old = this.value;
    this.value = this.process ? this.process(value) : value;
    if (reset || typeof this.value == 'function' || old !== this.value || (this.invalidator && (this.invalidator())))
      this.onSet(this.value, null, old);
  },
  
  onSet: function(value, output, old) {
    if (value == null && this.placeholder) value = this.placeholder;
    if (this.output && output !== false) this.update(value, old);
    if (this.attached !== false && this.parents)
      for (var i = 0, parent; parent = this.parents[i++];) {
        if (!parent.translating && parent.attached !== false) parent.set();
      }
    if (this.wrapper && this.wrapper.wrappee)
      this.wrapper.wrappee.onSuccess(value)
    return this;
  },
  
  attach: function(origin) {
    return this.fetch(true, origin);
  },
  
  detach: function(origin) {
    delete this.value;
    return this.fetch(false, origin);
  },
  
  fetch: function(state, origin) {
    if (this.attached ^ state) {
      this.attached = state;
      if (!this.setter) this.setter = this.set.bind(this);
      if (this.source != null)
        this[this.source.call ? 'source' : 'request'](this.input, this.setter, this.source, state);
    }
    return this;
  },
  
  request: function(input, callback, source, state) {
    return (this.source.variables || this.source)[state ? 'watch' : 'unwatch'](input, callback);
  },
  
  getContext: function() {
    for (var scope = this.source, context; scope; scope = scope.parentScope) {
      context = (scope.nodeType && scope.nodeType != 11) ? scope : scope.widget;
      if (context) break;
    }
    this.context = context || false;
    return this.context;
  } 
};
Object.each(LSD.Script.prototype, function(value, key) {
  if (!LSD.Script.Variable.prototype[key]) LSD.Script.Variable.prototype[key] = value;
});