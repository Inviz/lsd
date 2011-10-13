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
};

LSD.Object.prototype = {
  set: function(key, value, memo) {
    var index = key.indexOf('.');
    if (index > -1) {
      for (var bit, end, obj = this, i = 0;;) {
        bit = key.substring(i, index)
        i = index + 1;
        if (!end) {
          if (!obj[bit]) {
            var o = new LSD.Object;
            obj.set(bit, o);
            obj = o;
          } else {
            obj = obj[bit];
          }
        } else obj.set(bit, value);
        index = key.indexOf('.', i);
        if (index == -1) {
          if (!end && (end = true)) {
            index = key.length;
          } else break
        }
      }
    } else {
      var old = this[key];
      if (old === value && typeof old != 'undefined') return false;
      if (old) this.fireEvent('beforechange', key, old, false);
      this[key] = value;
      this[key] = value = this.fireEvent('change', key, value, true, old, memo);
      var watched = this._watched;
      if (watched && (watched = watched[key]))
        for (var i = 0, fn; fn = watched[i++];)
          if (fn.call) fn(value, old);
          else LSD.Object.callback(this, fn, key, value, old, memo);
      return true;
    }
  },
  unset: function(key, value, memo) {
    var index = key.indexOf('.');
    if (index > -1) {
    } else {
      var old = this[key];
      if (old == null && value != null) return false;
      this.fireEvent('change', key, old, false, null, memo);
      var watched = this._watched;
      if (watched && (watched = watched[key]))
        for (var i = 0, fn; fn = watched[i++];)
          if (fn.call) fn(null, old);
          else LSD.Object.callback(this, fn, key, null, old, memo);
      delete this[key];
      return true;
    }
  },
  mix: function(object, state, reverse) {
    for (var name in object)
      if (object.has ? object.has(name) : object.hasOwnProperty(name))
        this[state !== false ? 'set' : 'unset'](name, object[name], null, reverse);
  },
  merge: function(object, reverse) {
    if (object.watch) {
      var self = this;
      var watcher = function(name, value, state, old) {
        if (state) self.set(name, value, null, reverse);
        if (!state || old != null) self.unset(name, state ? old : value, null, reverse);
      }
      watcher.callback = object;
      object.addEvent('change', watcher);
    }
    this.mix(object, true, reverse);
  },
  unmerge: function(object, reverse) {
    if (object.unwatch) {
      object.removeEvent('change', this);
    }
    this.mix(object, false, reverse);
  },
  include: function(key, memo) {
    return this.set(key, true, memo)
  },
  erase: function(key, memo) {
    return this.unset(key, true, memo)
  },
  write: function(key, value, memo) {
    if (value == null) this.unset(key, this[key], memo)
    else this.set(key, value, memo);
  },
  fireEvent: function(key, a, b, c, d, e) {
    var storage = this._events;
    if (storage) {
      var collection = storage[key];
      if (collection) for (var i = 0, fn; fn = collection[i++];) {
        var result = fn(a, b, c, d, e);
        if (result != null) b = result;
      }
    }
    return b;
  },
  addEvent: function(key, callback, unshift) {
    var storage = this._events;
    if (!storage) storage = this._events = {};
    (storage[key] || (storage[key] = []))[unshift ? 'unshift' : 'push'](callback);
    return this;
  },
  removeEvent: function(key, callback) {
    var group = this._events[key]
    for (var j = group.length; --j > -1;) {
      var listener = group[j];
      if (listener === callback || listener.callback === callback) {
        group.splice(j, 1);
        break;
      }
    }
    return this;
  },
  watch: function(key, callback, lazy) {
    var index = key.indexOf('.');
    if (index > -1) {
      var finder = function(value, old) {
        var object = value || old;
        if (object.watch) {
          object[value ? 'watch' : 'unwatch'](key.substring(index + 1), callback);
        } else {
          var result = Object.getFromPath(object, key.substring(index + 1));
          if (result != null) callback(result);
        }
      };
      finder.callback = callback;
      this.watch(key.substr(0, index), finder)
    } else {
      var watched = (this._watched || (this._watched = {}));
      (watched[key] || (watched[key] = [])).push(callback);
      var value = this[key];
      if (!lazy && value != null) {
        if (callback.call) callback(value);
        else LSD.Object.callback(this, callback, key, value);
      }
    }
  },
  unwatch: function(key, callback) {
    var index = key.indexOf('.');
    if (index > -1) {
      this.unwatch(key.substr(0, index), callback)
    } else if (this._watched) {
      var watched = this._watched[key];
      var value = this[key];
      for (var i = 0, fn; fn = watched[i]; i++) {
        var match = fn.callback || fn;
        if (match.push) {
          if (!callback.push || callback[0] != match[0] || callback[1] != match[1]) continue;
        } else if (match != callback && fn != callback) continue;
        watched.splice(i, 1);
        if (value != null) {
          if (callback.call) fn(null, value);
          else LSD.Object.callback(this, fn, key, null, value);
        }
        break;
      }
    }
  },
  has: function(key) {
    return this.hasOwnProperty(key) && (key.charAt(0) != '_')
  },
  join: function(separator) {
    var ary = [];
    for (var key in this)
      if (this.has ? this.has(key) : this.hasOwnProperty(key))
        ary.push(key);
    return ary.join(separator)
  }
};

LSD.toObject = LSD.Object.toObject = LSD.Object.prototype.toObject = function() {
  if (this === LSD.Object || this === LSD) var obj = arguments[0];
  else var obj = this;
  if (obj == null) return null;
  if (obj._toObject) {
    if (obj._toObject.call) {
      return obj._toObject.apply(obj, arguments);
    } else if (obj._toObject.push) {
      var object = {};
      for (var i = 0, prop; prop = obj._toObject[i++];)
        if (obj[prop]) object[prop] = LSD.toObject(obj[prop]);
    } else {
      var object = {};
      for (var prop in obj) 
        if (prop in obj._toObject) object[prop] = LSD.toObject(obj[prop])
    }
  } else if (obj.push) {
    var object = [];
    for (var i = 0, j = obj.length; i < j; i++)
      object[i] = LSD.toObject(obj[i]);
  } else if (obj.setDate) {
    var object = obj.format('compact');
  } else if (!obj.indexOf && typeof obj == 'object') {
    var object = {};
    for (var key in obj)
      if (obj.has ? obj.has(key) : obj.hasOwnProperty(key)) {
        var val = obj[key];
        object[key] = !val || val.push || val.exec || val.call || val.indexOf ? val : LSD.toObject(val);
      }
  }
  return object || obj;
}

/*
  Stack object is an object that may have its values set from multiple sources.
  All of `set` and `unset` calls are logged, so when the value gets unset,
  it returns to previous value (that was set before by a different external object).

  It was designed to be symetric, so every .set is paired with .unset. Originally,
  unset raised exception when it could not find its value set before.

  That perhaps is too idealistic and doenst work in real world, so value that was
  set by some `set`/`unset` pair, can be unset by an outside `unset` call.
  A paired `unset` having nothing to unset will silently do nothing.
*/

LSD.Object.Stack = function(object) {
  if (object) for (var key in object) this.set(key, object[key]);
};

LSD.Object.Stack.prototype = Object.append(new LSD.Object, {
  set: function(key, value, memo, prepend) {
    var stack = this._stack;
    if (!stack) stack = this._stack = {};
    var group = stack[key];
    if (!group) group = stack[key] = []
    var length = (prepend || value == null) ? group.unshift(value) : group.push(value);
    return LSD.Object.prototype.set.call(this, key, group[length - 1], memo);
  },
  unset: function(key, value, memo, prepend) {
    var group = this._stack[key], length = group.length;
    if (prepend) {
      for (var i = 0, j = length; i < j; i++)
        if (group[i] === value) {
          group.splice(i, 1);
          break;
        }
      if (j == i) return
    } else {
      for (var j = length; --j > -1; )
        if (group[j] === value) {
          group.splice(j, 1);
          break;
        }
      if (j == -1) return
    }
    value = group[length - 2];
    var method = length == 1 ? 'unset' : 'set';
    return LSD.Object.prototype[method].call(this, key, value, memo);
  },
  write: function(key, value, memo) {
    if (value != null) {
      if (this[key] != null) this.unset(key, this[key], memo);
      this.set(key, value, memo);
    } else if (this[key] != null) this.unset(key, this[key], memo);
  }
})

LSD.Object.callback = function(object, callback, key, value, old, memo) {
  if (callback.substr) var subject = object, property = callback;
  else if (callback.watch && callback.set) var subject = callback, property = key;
  else if (callback.push) var subject = callback[0], property = callback[1];
  else throw "Callbacks should be either functions, strings, objects, or [object, string] arrays"
  if (property === true || property == false) property = key;
  // check for circular calls
  if (memo != null && memo.push) {
    for (var i = 0, a; a = memo[i++];)
      if (a[0] == object && a[1] == property) return;
  } else memo = [];
  memo.push([object, key]);
  if (value != null || typeof old == 'undefined') subject.set(property, value, memo);
  if (value == null || typeof old != 'undefined') subject.unset(property, old, memo);
};

/*

*/

LSD.Struct = function(properties) {
  if (this === LSD) {
    return function() {
      var object = new LSD.Struct(properties)
      if (arguments.length) LSD.Object.apply(object, arguments);
      return object;
    }
  }
  if (properties) {
    this._properties = properties;
    this.addEvent('change', function(name, value, old) {
      var prop = properties[name];
      if (prop) return prop.call(this, value, old);
    }.bind(this));
    this._toObject = properties
  };
};
LSD.Struct.prototype = LSD.Object.prototype;