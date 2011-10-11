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
  merge: function(object, reverse) {
    if (object.watch) {
      var self = this;
      var watcher = function(name, value, state, old) {
        if (state) self.set(name, value, null, reverse);
        if (!state || old != null) self.unset(name, state ? old : value, null, reverse);
      }
      watcher.callback = object;
      object.addEvent('change', watcher);
      for (var name in object) 
        if (object.has(name)) 
          this.set(name, object[name], null, reverse)
    } else {
      for (var name in object) 
        this.set(name, object[name], null, reverse);
    }
  },
  unmerge: function(object, reverse) {
    if (object.unwatch) {
      object.removeEvent('change', this);
      for (var name in object) 
        if (object.has(name)) 
          this.unset(name, object[name], null, reverse)
    } else {
      for (var name in object) 
        this.set(name, object[name], null, reverse);
    }
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
  toObject: function() {
    var object = {};
    for (var key in this) if (this.has(key)) object[key] = this[key];
    return object;
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