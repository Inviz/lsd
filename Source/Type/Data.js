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
  if (typeof object == 'string') {
    LSD.Object()
    this.fromString(object);
  } else LSD.Object(object)
};
LSD.Data.prototype = new LSD.Object;
LSD.Data.prototype.constructor = LSD.Data;
LSD.Data.prototype.set = function (key, value, meta) {
  for (var l, r, start = 0, obj = this, subkey, name, index;;) {
    if ((l = key.indexOf('[', start)) == -1) {
      if (name === '') return obj.push(value);
      else return obj[obj === this ? '_set' : 'set'](name || key, value, meta)
    } else {
      if ((r = key.indexOf(']', l)) == -1) return;
      if (name == null) name = key.substring(start, l);
      subkey = key.substring(l + 1, r);
      index = (subkey === '' || (parseInt(subkey) == subkey))
      if (!obj[name]) {
        constructor = index ? new LSD.Array : new this.constructor;
        if (array && name === '') name = obj.push(constructor) - 1;
        else obj[obj === this ? '_set' : 'set'](name, constructor)
      }
      obj = obj[name]
      name = subkey;
      start = r;
      var array = index;
    }
  }
};
LSD.Data.prototype.unset = function (key, value, meta) {
  for (var l, r, start = 0, obj = this, subkey, name, index; ;) {
    if ((l = key.indexOf('[', start)) == -1) {
      if (name === '') obj.pop();
      else obj[obj === this ? '_unset' : 'unset'](name || key, value, meta)
    } else {
      if ((r = key.indexOf(']', l)) == -1) return;
      if (!(obj = obj[key.substring(start, l)])) return
      start = r;
      name = key.substring(l + 1, r);
    }
  }
};
LSD.Data.prototype.get = function (key, value, meta) {
  for (var l, r, start = 0, obj = this, subkey, name, index; ;) {
    if ((l = key.indexOf('[', start)) == -1) {
      if (name === '') return obj[obj.length - 1];
      else return obj[name];
    } else {
      if ((r = key.indexOf(']', l)) == -1) return;
      if (!(obj = obj[key.substring(start, l)])) return
      start = r;
      name = key.substring(l + 1, r);
    }
  }
};
LSD.Data.prototype.fromString = function() {
  return this;
}
LSD.Data.prototype.toString = function() {

};
LSD.Data.prototype._hash = function(key, value, meta, state) {
  
}