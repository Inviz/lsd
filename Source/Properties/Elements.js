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
  - LSD.Properties.Fields
  - LSD.Properties.Elements
 
...
*/
LSD.Properties.Fields = function() {
  LSD.Object.apply(this, arguments);
};

LSD.Properties.Fields.prototype = Object.append(new LSD.Object, {
  constructor: LSD.Properties.Fields,
  set: function(key, value) {
    for (var regex = LSD.Properties.Fields.rNameParser, matched = [], match; match = regex.exec(key);)
      matched.push(match);
    for (var i = 0, next, array, index, object = this, name; match = matched[i++];) {
      name = match[1] == null ? match[2] : match[1];
      next = matched[i] ? matched[i][2] : null
      index = (next === '' || (parseInt(next) == next));
      if (array) {
        if (next != null && !object[name]) {
          if (name !== '') object.set(name, index ? new LSD.Array : new this.constructor);
          else name = object.push(index ? new LSD.Array : new this.constructor) - 1;
        }
      } else if (index)  {
        if (!object[name]) object.set(name, new LSD.Array);
      } else if (next != null) {
        if (!object[name]) object.set(name, new this.constructor)
      }
      if (next == null) {
        if (name !== '') {
          if (object !== this) object.set(name, value);
          else this._set(name, value);
        } else object.push(value)
      } else object = object[name]
      array = index;
    }
  },
  unset: function(key, value) {
    for (var regex = LSD.Properties.Fields.rNameParser, matched = [], match; match = regex.exec(key);)
      matched.push(match);
    for (var i = 0, next, array, index, name, object = this; match = matched[i++];) {
      name = match[1] == null ? match[2] : match[1];
      if (name === '') name = object.length - 1;
      if (i == matched.length) {
        if (object !== this) object.unset(name, value);
        else this._unset(name, value);
      } else object = object[name];
    }
  },
  get: function(key, value) {
    for (var regex = LSD.Properties.Fields.rNameParser, matched = [], match; match = regex.exec(key);)
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
  }
});
LSD.Properties.Fields.rNameParser = /(^[^\[]+)|\[([^\]]*)\]/g;
LSD.Properties.Elements = LSD.Struct.Array({
  exports: {
    length: 'length'
  }
});
LSD.Properties.Elements.prototype.onSet = function(value, index, state, old, memo) {
  if (old == null) {
    if (state === false) value.attributes.unwatch('name', this);
    else value.attributes.watch('name', (this._identifier || (this._identifier = {
      fn: this._identify,
      callback: this
    })))
  }
};
LSD.Properties.Elements.prototype._identify = function(call, key, value, old) {
  var object = call.callback;
  if (value) value.watch('nodeValue', (object._observer || object._observer = {
    fn: object._observe,
    callback: object
  }))
  if (old) old.unwatch('nodeValue', object);
};
LSD.Properties.Elements.prototype._observe = function(call, key, value, old) {
  call.callback.values.reset(this.attributes.name, value);
};
LSD.Properties.Elements.prototype._get = LSD.Properties.Fields.prototype.get;
LSD.Properties.Elements.prototype._set = LSD.Properties.Fields.prototype.set;
LSD.Properties.Elements.prototype._unset = LSD.Properties.Fields.prototype.unset;