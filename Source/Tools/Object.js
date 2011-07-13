/*
---
 
script: Object.js
 
description: An observable object 
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  
provides:
  - LSD.Object
  
...
*/

LSD.Object = function(object) {
  if (object) for (var key in object) this.set(key, object[key]);
}
LSD.Object.prototype = {
  set: function(key, value) {
    var old = this[key];
    if (old === value) return false;
    if (old) {
      var onBeforeChange = this._beforechange;
      if (onBeforeChange) for (var i = 0, fn; fn = onBeforeChange[i++];) fn(key, old, false);
    }
    if (key == 'person' && value == false) debugger
    this[key] = value;
    var onChange = this._change;
    if (onChange) for (var i = 0, fn; fn = onChange[i++];) fn(key, value, true);
    var watched = this._watched;
    if (watched && (watched = watched[key])) for (var i = 0, fn; fn = watched[i++];) fn(value, old);
    return true;
  },
  unset: function(key, value) {
    var old = this[key];
    if (old == null) return false;
    for (var i = 0, a = this._change, fn; a && (fn = a[i++]);) fn(key, old, false);
    var watched = this._watched;
    if (watched && (watched = watched[key])) for (var i = 0, fn; fn = watched[i++];) fn(null, old);
    delete this[key];
    return true;
  },
  addEvent: function(name, callback) {
    var key = '_' + name;
    (this[key] || (this[key] = [])).push(callback);
    return this;
  },
  removeEvent: function(name, callback) {
    var key = '_' + name;
    var index = this[key].indexOf(callback);
    if (index > -1) this[key].splice(0, 1);
    return this;
  },
  watch: function(name, callback, lazy) {
    var index = name.indexOf('.');
    if (index > -1) {
      var finder = function(value, old) {
        (value || old)[value ? 'watch' : 'unwatch'](name.substring(index + 1), callback);
      };
      finder.callback = callback;
      this.watch(name.substr(0, index), finder)
    } else {
      var watched = (this._watched || (this._watched = {}));
      (watched[name] || (watched[name] = [])).push(callback);
      var value = this[name];
      if (!lazy && value != null) callback(value);
    }
  },
  unwatch: function(name, callback) {
    var index = name.indexOf('.');
    if (index > -1) {
      this.unwatch(name.substr(0, index), callback)
    } else {
      var watched = this._watched[name];
      for (var i = 0, fn; fn = watched[i++];) {
        if (fn == callback || fn.callback == callback) {
          watched.splice(i, 1);
          if (value != null) fn(null, value);
          break;
        }
      }
    }
  },
  toObject: function() {
    var object = {};
    for (var name in this) if (this.hasProperty(name)) object[name] = this[name];
    return {};
  },
  hasProperty: function(name) {
    return this.hasOwnProperty(name) && (name.charAt(0) != '_')
  }
};

