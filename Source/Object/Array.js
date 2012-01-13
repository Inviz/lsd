/*
---
 
script: Array.js
 
description: An observable array 
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Object
  - LSD.Struct
  
provides:
  - LSD.Array
  
...
*/

/*
  LSD.Array is an observable array that acts just likea regular array.
  It notifies listeners when new items are added, or old items 
  are repositioned within array. 
*/

LSD.Array = function(arg) {
  if (!this.push) {
    return LSD.Array.from(arguments);
  } else {
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
      for (var i = 0; i < j; i++) 
        this.push(arguments[i]);
    }
  }
};

LSD.Array.prototype = Object.append(new LSD.Object, {
  _constructor: LSD.Array,
  
  push: function() {
    for (var i = 0, j = arguments.length, length, arg; i < j; i++) {
      arg = arguments[i];
      this.set(this.length >>> 0, arg);
    }
    return this.length;
  },
  
  set: function(key, value, old, memo) {
    var index = parseInt(key);
    if (index != index) { //NaN
      return this._set(key, value, memo);
    } else {
      this[index] = value;
      if (index + 1 > this.length) this._set('length', index + 1);
      var watchers = this.__watchers;
      if (watchers) for (var i = 0, j = watchers.length, fn; i < j; i++) {
        var fn = watchers[i];
        if (!fn) continue;
        if (typeof fn == 'function') fn.call(this, value, index, true, old, memo);
        else this._callback(fn, value, index, true, old, memo);
      }
      if (this._onSet) this._onSet(value, index, true, old, memo);
      if (this.onSet) this.onSet(value, index, true, old, memo);
      return value;
    }
  },
  
  unset: function(key, value, old, memo) {
    var index = parseInt(key);
    if (index != index) { //NaN
      return this._unset(key, value, memo);
    } else {
      delete this[index];
      if (index + 1 == this.length) this._set('length', index);
      var watchers = this.__watchers;
      if (watchers) for (var i = 0, j = watchers.length, fn; i < j; i++) {
        var fn = watchers[i];
        if (!fn) continue;
        if (typeof fn == 'function') fn.call(this, value, index, false, old, memo);
        else this._callback(fn, value, index, false, old, memo);
      }
      if (this._onSet) this._onSet(value, index, false, old, memo);
      if (this.onSet) this.onSet(value, index, false, old, memo);
      return value;
    }
  },
  
  indexOf: function(object, from) {
    var hash = typeof object == 'object' && this._hash ? this._hash(object) : object;
    var length = this.length >>> 0;
    for (var i = (from < 0) ? Math.max(0, length + from) : from || 0; i < length; i++) {
      var value = this[i];
      if (value === object || (this._hash && hash != null && value != null && this._hash(value) == hash)) return i;
    }
    return -1;
  },
  
  splice: function(index, offset) {
    var args = Array.prototype.slice.call(arguments, 2);
    var arity = args.length, length = this.length;
    if (index == null) index = 0;
    else if (index < 0) index = length + index;
    if (offset == null) offset = length - index;
    else offset = Math.max(0, Math.min(length - index, offset))
    var shift = arity - offset;
    var values = [];
    // when given arguments to insert
    for (var i = 0; i < arity; i++) {
      if (i < offset) {
        // remove original value
        values.push(this[i + index]);
        this.unset(i + index, this[i + index], false);
      } else {    
        // shift array forwards
        if (i == offset)
          for (var j = length, k = index + arity - shift; --j >= k;)
            this.set(j + shift, this[j], j)
      }
      // insert new value
      this.set(i + index, args[i], i < offset ? false : null);
    }
    // shift array backwards
    if (shift < 0 && index < length)
      for (var i = index + arity - shift, old; i < length; i++) {
        if (i + shift <= index - shift) {
          if (i + shift < index - shift) values.push(this[i + shift])
          this.unset(i + shift, this[i + shift]);
        }
        this.set(i + shift, this[i], i);
      }
    this.set('length', length + shift);
    for (var i = this.length; i < length; i++) {
      if (values.length < - shift) {
        values.push(this[i])
        this.unset(i, this[i]);
      } else {  
        this.unset(i, this[i], false);
      }
    }
    return values;
  },
  
  pop: function() {
    return this.splice(-1, 1)[0];
  },
  
  shift: function() {
    return this.splice(0, 1)[0]
  },
  
  unshift: function() {
    return this.splice.apply(this, [0, 0].concat(Array.prototype.slice.call(arguments, 0)))
  },
  
  watch: function(callback, fn) {
    if (typeof fn != 'undefined') return this._watch(callback, fn);
    for (var i = 0, j = this.length >>> 0; i < j; i++) {
      if (callback.call) callback.call(this, this[i], i, true);
      else this._callback(callback, this[i], i, true);
    }
    var watchers = this.__watchers;
    if (!watchers) watchers = this.__watchers = [];
    watchers.push(callback);
  },
  
  unwatch: function(callback, fn) {
    if (typeof fn != 'undefined') return this._unwatch(callback, fn);
    for (var i = 0, j = this.length >>> 0; i < j; i++) {
      if (callback.call) callback.call(this, this[i], i, false);
      else this._callback(callback, this[i], i, false);
    }
    var watchers = this.__watchers;
    var index = watchers.indexOf(callback);
    watchers.splice(index, 1);
  },
  
  iterate: function(block, callback, state) {
    if (state !== false) {
      block.watcher = function(value, index, substate, old) {
        if (block.block) {
          block(substate ? 'yield' : 'unyield', arguments, callback, index, old);
        } else {
          callback(block.apply(block, arguments), value, index, substate, old);
        }
      };
      block.callback = block;
    }
    this[state !== false ? 'watch' : 'unwatch'](block.watcher);
    return null;
  },
  
  uneach: function(block) {
    return this.iterate(block, null, false);
  },
  
  each: function(callback) {
    return this.iterate(callback)
  },
  
  filter: function(callback, plain) {
    var filtered = plain ? [] : new LSD.Array;
    var shifts = [], spliced = 0;
    this.iterate(callback, function(result, value, index, state, old) {
      for (var i = shifts.length; i <= index + 1; i++) 
        shifts[i] = (shifts[i - 1]) || 0
      var shift = shifts[index];
      if (state && old != null && shifts[old + 1] > shifts[old])
        for (var i = old + 1, j = Math.max(shifts.length, index); i < j; i++)
          shifts[i]--;
      else
        var diff = shifts[index + 1] - shift;
      if (state ? result ? diff : !diff : diff)
        for (var i = index + 1, j = shifts.length; i < j; i++) 
          shifts[i] += (state && !result ? 1 : -1);
      if (result && state) {
        var current = filtered[index - shift];
        if (old !== false && ((!spliced || index - shift > 0 || (filtered[index - shift] != value && old > index)))) {
          filtered.set ? filtered.set(index - shift, value) : filtered[index - shift] = value;
        } else {
          filtered.splice(index - shift, 0, value);
        }
        if (old != null && spliced > 0) spliced--;
      } else if (state ? (!result && old == null) : result && (old === false || old == null)) {
        filtered.splice(index - shift, 1);
        if (index - shift == 0 && old !== null) spliced++;
      }
      if (callback.block) callback.block.update(filtered);
      return filtered;
    })
    return filtered;
  },
  
  sort: function(callback, plain) {
    if (!callback) callback = function(a, b) {
      return a > b ? 1 : a < b ? - 1 : 0;
    };
    var sorted = plain ? [] : new LSD.Array;
    var map = [];
    this.watch(function(value, index, state, old) {
      if (state) {
        for (var i = sorted.length; i > 0; i--)
          if (callback(sorted[i - 1], value) < 0) break;
        if (old == null) {
          sorted.splice(i, 0, value);
        } else {
          delete map[old];
          sorted.set ? sorted.set(i, value) : sorted[i] = value;
        }
      } else {
        i = map[index];
        if (i != null) sorted.splice(i, 1);
      }
      if (!state || old == null) 
        for (var j = 0; j < map.length; j++)
          if (map[j] >= i) map[j] += (state ? 1 : -1);
      if (state) map[index] = i;
      else delete map[index];
      if (callback.block) callback.block.update(sorted);
      return sorted;
    });
    return sorted;
  },
  
  every: function(callback) {
    if (callback.watcher) return callback.watcher.result === 0;
    var values = [];
    var that = this;
    this.iterate(callback, function(result, value, index, state, old) {
      if (callback.watcher.result == null) callback.watcher.result = 0;
      if (state) {
        var previous = values[index];
        values[index] = result || false;
        if (previous != result) 
          callback.watcher.result += (state && result ? previous == null ? 0 : -1 : 1);
        if (old != null && old !== false) delete values[old];
      } else {
        if (!result) callback.watcher.result--
        values.splice(index, 1);
      }
      if (callback.block) callback.block.update(callback.watcher.result === 0);
      return callback.watcher.result === 0;
    });
    return this.length === 0 || callback.watcher.result === 0;
  },
  
  some: function(callback) {
    var count = 0;
    var values = [];
    this.iterate(callback, function(result, value, index, state, old) {
      if (state) {
        var previous = values[index];
        values[index] = result;
        if (previous != result) count += state && result ? 1 : previous == null ? 0 : - 1;
        if (old != null && old !== false) delete values[old];
      } else if (old !== false) {
        if (result) count--
        values.splice(index, 1);
      }
      if (callback.block) callback.block.update(count > 0);
      return count > 0;
    });
    return count > 0;
  },
  
  map: function(callback) {
    var values = [];
    this.iterate(callback, function(result, value, index, state, old) {
      if (state) {
        var previous = values[index];
        values[index] = result;
      } else {
        values.splice(index, 1);
      }
      if (callback.block) callback.block.update(values);
      return values;
    }); 
    return values;
  },
  
  toObject: function(normalize, serializer) {
    for (var result = [], i = 0; i < this.length; i++) {
      var value = this[i];
      if (value != null) value = LSD.toObject(this[i], normalize, serializer);
      if ((!normalize || typeof value != 'undefined') && (typeof value._length == 'undefined' || value._length > 0))
       result.push(value);
    }
    return result;
  },

  _hash: function(object) {
    return typeof object._id != 'undefined' 
      ? object._id 
      : typeof object.id != 'undefined' 
        ? object.id
        : typeof object.$id != 'undefined' ? object.$id : null;
  },
  
  clone: function() {
    var clone = new this._constructor;
    for (var i = 0; i < this.length; i++) clone.push(this[i]);
    return clone;
  },
  
  _parent: false
});

LSD.Array.from = function(origin) {
  var array = new LSD.Array;
  if (typeof origin != 'string' && typeof origin.length == 'number') array.push.apply(array, origin);
  else array.push(origin);
  return array;
}

LSD.Array.prototype['<<'] = LSD.Array.prototype.push;
LSD.Array.prototype['+'] = LSD.Array.prototype.concat;

/*=
  There're not too many methods in a standart javascript Array prototype.
  Libraries like mootools provide many more useful functions that can be
  used with array. But internally, those extensions have to rely on
  simple rules of Array behavior which are easy to emulate. LSD.Array
  obeys those rules, so those additional extra functions work out of the box.
*/
Object.each(Array.prototype, function(fn, method) {
  if (!LSD.Array.prototype[method]) LSD.Array.prototype[method] = fn;
});

LSD.Struct.Array = function(properties) {
  if (!properties) properties = {};
  properties._constructor = LSD.Array;
  var struct = LSD.Struct(properties)
  struct.prototype._parent = null;
  return struct;
};