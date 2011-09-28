/*
---
 
script: Object.js
 
description: An observable object 
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - LSD.Object
  
provides:
  - LSD.Array
  
...
*/

LSD.Array = function(arg) {
  this.values = [];
  this.length = 0;
  var j = arguments.length;
  if (j == 1) {
    if (arg != null && !arg.match && Type.isEnumerable(arg)) {
      for (var i = 0, k = arg.length; i < k; i++)
        this.push(arg[i]);
    } else {
      this.push(arg);
    }
  } else {
    for (var i = 0; i < j; i++) this.push(arguments[i]);
  }
};

LSD.Array.prototype = {
  push: function() {
    for (var i = 0, j = arguments.length, length, arg; i < j; i++) {
      arg = arguments[i];
      length = this.values.push(arg);
      this[length - 1] = arg;
      this.length = length;
      this.fireEvent('change', arg, length - 1, true);
      this.fireEvent('add', arg, length - 1);
    }
  },
  indexOf: function(object, from) {
    var id = typeof object == 'object' ? LSD.getID(object) : object;
    var length = this.length >>> 0;
    for (var i = (from < 0) ? Math.max(0, length + from) : from || 0; i < length; i++) {
      var value = this[i];
      if ((id != null && (value != null && LSD.getID(value) == id)) || value === object) return i;
    }
    return -1;
  },
  slice: function() {
    return this.values.slice(0);
  },
  splice: function() {
    return this.values.splice(0);
  },
  watch: function() {
    this.addEvent
  },
  unwatch: function() {
    
  },
  fireEvent: LSD.Object.prototype.fireEvent,
  removeEvent: LSD.Object.prototype.removeEvent,
  addEvent: LSD.Object.prototype.addEvent
};

for (var method in Array.prototype) 
  if (!LSD.Array.prototype[method]) 
    LSD.Array.prototype[method] = Array.prototype[method];