/*
---
 
script: Data.js
 
description: An object with query-string like key access
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Object

provides: 
  - LSD.Data
 
...
*/
LSD.Data = function(object) {
  var subject = this.mix ? this : new LSD.Data;
  if (typeof object == 'string')
    subject.fromString(object);
  else if (object) 
    subject.mix(object);
  return subject;
};
LSD.Data.prototype = new LSD.Object;
LSD.Data.prototype.constructor = LSD.Data;
LSD.Data.prototype.fromString = LSD.Data.fromString = function(string, state, meta) {
  var object = this.mix ? this : new LSD.Data;
  for (var start = -1, delimeter; delimeter = string.indexOf('&', start);) {
    var bit = string.substring(start, delimeter == -1 ? string.length : delimeter);
    var pos = bit.indexOf('=');
    var key = bit.substring(0, pos == -1 ? bit.length : pos);
    var value = pos == -1 ? null : bit.substring(pos + 1);
    object.set(key, state !== false && value || undefined, state === false && value || undefined, meta);
    if ((start = delimeter + 1) == 0) return object;
  }
}
LSD.Data.prototype.toString = LSD.Data.toString = function(prefix) {
  var skip = this._skip, result;
  if (this.push) {
    for (var i = 0, j = this.length; i < j; i++) {
      var value = this[i];
      var prop = prefix ? prefix + '[]' : i;
      result = (result ? result + '&' : '') + 
        (typeof value == 'object' ? LSD.Data.toString.call(value, prop) : prop + '=' + value);
    }
  } else {
    for (var property in this) {
      if (skip && (!this.hasOwnProperty(property) || skip[property])) continue;
      var value = this[property];
      var prop = prefix ? prefix + '[' + property + ']' : property;
      result = (result ? result + '&' : '') +
        (typeof value == 'object' ? LSD.Data.toString.call(value, prop) : prop + '=' + value);
      
    }
  }
  return result;
};
/*
  A custom hashing function for LSD.Object that handles
  query-string-esque keys like `a[b]` and `a[][d]`.
*/
LSD.Data.prototype._hash = function(key, value, old, meta) {
  for (var l, r, start = 0, obj = this, hash, subkey, name, index, empty;;) {
    if ((l = key.indexOf('[', start)) == -1) {
      return hash ? hash + '.' + (name == null ? key : name) : undefined;
    } else {
      if ((r = key.indexOf(']', l)) == -1) return;
      if (name == null) name = key.substring(start, l);
      subkey = key.substring(l + 1, r);
      var empty = subkey === '';
      if (!empty) index = parseInt(subkey) == subkey;
      if (typeof value != 'undefined') {
        if (!obj[name]) {
          constructor = empty || index ? new LSD.Array : new this.constructor;
          if (array && name === '') name = obj.push(constructor) - 1;
          else obj[obj === this ? '_set' : 'set'](name, constructor)
        }
        if (empty) subkey = obj[name].length;
      } else if (empty) {
        if (obj[name]) subkey = obj[name].length - 1;
        else return;
      }
      if (obj) obj = obj[name]
      hash = (hash ? hash + '.' : '') + name;  
      name = subkey;
      start = r;
      var array = index;
    }
  }
}