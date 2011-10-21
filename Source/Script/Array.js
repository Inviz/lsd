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
      this.set(arg, length - 1);
    }
  },
  set: function(value, index, state, old) {
    if (state !== false) {
      this[index] = value;
      if (index + 1 > this.length) this.length = index + 1;
    } else {  
      delete this[index];
      if (index + 1 == this.length) this.length = index;
    }
    this.fireEvent('change', value, index, !(state === false), old);
    if (state === false || old != null)
      this.fireEvent(state === false ? 'remove' : 'add', value, index, old);
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
  slice: function(index, offset) {
    return this.values.slice(index, offset);
  },
  splice: function(index, offset) {
    var values =  this.values.splice(index, offset);
    if (index < 0) index = this.length - index;
    if (offset == null) offset = this.length - index;
    var args = Array.prototype.slice.call(arguments, 2);
    var length = args.length;
    var shift = length - offset;
    if (shift && index < this.length) {
      // we have to shift the tail of array either left or right, 
      // each needs its own loop direction to avoid overwriting values 
      if (shift > 0)
        for (var i = this.length; --i >= index;)
          this.set(this[i], i + shift, true, i)
      else 
        for (var i = index - shift; i < this.length; i++) {
          if (i + shift <= index - shift) this.set(this[i + shift], i + shift, false)
          this.set(this[i], i + shift, true, i);
        }
    }
    this.length += shift - length;
    // insert new values
    for (var i = 0; i < length; i++) {
      if (i < offset) this.set(args[i], i + index, false);
      this.set(args[i], i + index, true);
    }
    return values;
  },
  watch: function(callback) {
    for (var i = 0, j = this.length >>> 0; i < j; i++)
      callback.call(this, this[i], i, true);
    this.addEvent('change', callback);
  },
  unwatch: function() {
    for (var i = 0, j = this.length >>> 0; i < j; i++)
      callback.call(this, this[i], i, false);
    this.removeEvent('change', callback);
  },
  fireEvent: LSD.Object.prototype.fireEvent,
  removeEvent: LSD.Object.prototype.removeEvent,
  addEvent: LSD.Object.prototype.addEvent,
  iterate: function(block, callback, state) {
    if (state !== false) {
      block.watcher = function(value, index, substate, old) {
        block.call(block, substate ? 'yield' : 'unyield', arguments, callback, index, old);
      };
      block.callback = block;
    }
    this[state !== false ? 'watch' : 'unwatch'](block.watcher);
  }
};

LSD.Array.prototype['<<'] = LSD.Array.prototype.push;
LSD.Array.prototype['+'] = LSD.Array.prototype.concat;

for (var method in Array.prototype) 
  if (!LSD.Array.prototype[method]) 
    LSD.Array.prototype[method] = Array.prototype[method];