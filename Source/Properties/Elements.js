/*
---
 
script: Children.js
 
description: Makes a DOM tree like structure out of any objects
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Properties
  - LSD.Array

provides: 
  - LSD.Properties.Elements
 
...
*/
LSD.Properties.Elements = function() {
  LSD.Object.apply(this, arguments);
};
LSD.Properties.Elements.prototype = new LSD.Object;
LSD.Properties.Elements.prototype.constructor = LSD.Properties.Elements;
LSD.Properties.Elements.prototype.set = function (key, value, memo) {
  for (var l, r, start = 0, obj = this, subkey, name, index, object;;) {
    if ((l = key.indexOf('[', r || start)) == -1) {
      if (name === '') return object.push(value);
      else return object[object === this ? '_set' : 'set'](name || key, value, memo)
    } else {
      if ((r = key.indexOf(']', l)) == -1) return;
      name = key.substring(start, l - 1);
      subkey = key.substring(l, r);
      index = (subkey === '' || (parseInt(subkey) == index))
      if (!object[name]) {
        constructor = index ? new LSD.Array : new this.constructor;
        if (array && name === '') name = object.push(constructor) - 1;
        else object.set(name, constructor)
      }
      object = object[name]
      name = subkey;
      array = index;
    }
  }
};
LSD.Properties.Elements.prototype.unset = function (key, value, memo) {
  for (var l, r, start = 0, obj = this, subkey, name, index; ;) {
    if ((l = key.indexOf('[', start)) == -1) {
      if (name === '') object.pop();
      else object[object === this ? '_unset' : 'unset'](name || key, value, memo)
    } else {
      if ((r = key.indexOf(']', l)) == -1) return;
      if (!(object = object[key.substring(start, l - 1)])) return
      start = r;
      name = key.substring(l, r);
    }
  }
};
LSD.Properties.Elements.prototype.get = function (key, value, memo) {
  for (var l, r, start = 0, obj = this, subkey, name, index; ;) {
    if ((l = key.indexOf('[', start)) == -1) {
      if (name === '') return object[object.length - 1];
      else return object[name];
    } else {
      if ((r = key.indexOf(']', l)) == -1) return;
      if (!(object = object[key.substring(start, l - 1)])) return
      start = r;
      name = key.substring(l, r);
    }
  }
};