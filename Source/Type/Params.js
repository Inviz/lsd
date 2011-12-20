/*
---

script: Stack.js

description: An observable object that provides query-string accessors api

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Object

provides:
  - LSD.Object.Params

...
*/

LSD.Object.Params = function() {
  LSD.Object.apply(this, arguments);
};

LSD.Object.Params.prototype = Object.append(new LSD.Object, {
  _constructor: LSD.Object.Params,

  set: function(key, value) {
    for (var regex = LSD.Object.Params.rNameParser, matched = [], match; match = regex.exec(key);)
      matched.push(match);
    for (var i = 0, next, array, index, object = this, name; match = matched[i++];) {
      name = match[1] == null ? match[2] : match[1];
      next = matched[i] ? matched[i][2] : null
      index = (next === '' || (parseInt(next) == next));
      if (array) {
        if (next != null && !object[name]) {
          if (name !== '') object.set(name, index ? new LSD.Array : new this._constructor);
          else name = object.push(index ? new LSD.Array : new this._constructor) - 1;
        }
      } else if (index)  {
        if (!object[name]) object.set(name, new LSD.Array);
      } else if (next != null) {
        if (!object[name]) object.set(name, new this._constructor)
      }
      if (next == null) {
        if (name !== '') {
          if (object !== this) object.set(name, value);
          else LSD.Object.prototype.set.call(this, name, value);
        } else object.push(value)
      } else object = object[name]
      array = index;
    }
  },
  
  unset: function(key, value) {
    for (var regex = LSD.Object.Params.rNameParser, matched = [], match; match = regex.exec(key);)
      matched.push(match);
    for (var i = 0, next, array, index, name, object = this; match = matched[i++];) {
      name = match[1] == null ? match[2] : match[1];
      if (name === '') name = object.length - 1;
      if (i == matched.length) {
        if (object !== this) object.unset(name, value);
        else LSD.Object.prototype.unset.call(this, name, value);
      } else object = object[name];
    }
  },
  
  get: function(key, value) {
    for (var regex = LSD.Object.Params.rNameParser, matched = [], match; match = regex.exec(key);)
      matched.push(match);
    for (var i = 0, next, array, index, name, object = this; match = matched[i++];) {
      name = match[1] == null ? match[2] : match[1];
      if (name === '') name = object.length - 1;
      if (i == matched.length) {
        return object[name];
      } else if ((object = object[name]) == null) {
        return;
      }
    }
  },
  
  _exclusions: Array.object('_method')
});

LSD.Object.Params.rNameParser = /(^[^\[]+)|\[([^\]]*)\]/g;