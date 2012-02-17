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
  - LSD.Struct.Array
  
...
*/

/*
  LSD.Array is an observable array that acts just like a regular array.
  It notifies listeners when new items are added, or old items 
  are repositioned within array. 
*/

LSD.Array = function(arg) {
  if (!this.push) {
    return LSD.Array.from(arguments);
  } else {
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

/*
  LSD.Array uses LSD.Object as its base class like all other objects.
  When a non-integer key is given to `.set()`, `.unset()`, or `.get()`
  functions, it resorts back to LSD.Object setters. 
  
  Length property in LSD.Array is maintained and observed that way, 
  by re-using LSD.Object capabilities.
  
  It is possible to change an LSD.Array subclass to have a different
  base structure, by altering the getter and setter methods.
*/

LSD.Array.prototype = Object.append(new LSD.Object, {
  constructor: LSD.Array,
  /*
    Public array-like length property. Although in javascript,
    some objects like functions have their own length property
    which can not be overwritten, thus is not reliable. So internally
    __length property is checked
  */
  length: 0,
  __length: 0,
  _offset: 0,
  /*
    Children option set to false disallows LSD.Array to adopt 
    LSD.Objects, thus it does not change their ._parent link.
  */
  _children: false,
  
  push: function() {
    for (var i = 0, j = arguments.length, filter = this._prefilter; i < j; i++) {
      if (!filter || filter(arguments[i]))
        this.set(this.__length, arguments[i]);
    }
    return this.__length;
  },
  
  set: function(key, value, old, memo) {
    var index = parseInt(key);
    if (index != index) { //NaN
      return this._set(key, value, memo);
    } else {
      this[index] = value;
      if (index + 1 > this.__length) this._set('length', (this.__length = index + 1));
      var watchers = this.__watchers;
      if (watchers) for (var i = 0, j = watchers.length, fn; i < j; i++) {
        if (!(fn = watchers[i])) continue;
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
      if (index + 1 == this.__length) this._set('length', (this.__length = index));
      var watchers = this.__watchers;
      if (watchers) for (var i = 0, j = watchers.length, fn; i < j; i++) {
        if (!(fn = watchers[i])) continue;
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
    var length = this.__length >>> 0;
    for (var i = (from < 0) ? Math.max(0, length + from) : from || 0; i < length; i++) {
      var value = this[i];
      if (value === object || (this._hash && hash != null && value != null && this._hash(value) == hash)) return i;
    }
    return -1;
  },
  
/*
  Splice method is the heart of LSD.Array, since it's a method that abstracts
  away every change to array that may be appropriate. Methods like `pop`, `shift`,
  `unshift` all re-use it, because it's the only array method that does shifting
  of values that happens when more values are added or removed from array.
  
  The goal of this method is to alter the array in a specific order that ensures
  that values are not overwritten in the process. That enables two things:
  
    - No intermediate values are stored when array modifications take place
    
    - Iterator-like separation of concerns, when observable array callbacks
      only receive bare minimum of arguments and not handle order of 
      execution by outsourcing it to implementation of the method that changes
      the array.
  
  An array modification may lead up to 3 sitatuions:

    1. No shift is needed, when values are replaced
      with other values
  
    2. It needs to be shifted to the right, when more values
      are inserted than removed
  
    3. It needs to be shifted to the left, when more values
      are removed than inserted

  It is also one of the few methods that prefilter their arguments, 
  before inserting when `_prefilter` hook is set in array definition
*/
  splice: function(index, offset) {
/*
  Arguments are normalized and values are filtered, so splice knows 
  upfront the number of inserted values, even if some of them may 
  be filtered out by an optional `_prefilter` function hook.
*/
    var args = Array.prototype.slice.call(arguments, 2), 
        filter = this._prefilter, 
        arity = args.length, 
        length = this.__length
    if (filter) for (var j = arity; j--;)
      if (!filter(args[j])) {
        args.splice(j--, 1);
        arity--;
      }
    if (index == null) index = 0;
    else if (index < 0) index = length + index;
    if (offset == null) offset = length - index;
    else offset = Math.max(0, Math.min(length - index, offset))
    if (this._onShift && arity - offset) {
      offset = this._onShift(index, offset, args, arity - offset);
      arity = args.length;
    }
    var shift = arity - offset;
    var values = [];
/*
  Splice first tries to insert new values, if given any.
  But it can only do it safely only to values that will
  be removed because of an `offset` argument of a `splice()`.
  if the offset is equal than the number of inserted
  values, then no shift is needed (#1).
*/
    for (var i = 0; i < arity; i++) {
      if (i < offset) {
        // remove original value
        values.push(this[i + index]);
        this.unset(i + index, this[i + index], false);
      } else {    
/*
  If there is more values to be inserted (#2) then to be removed,
  splice shifts the array to the right by iterating from end 
  to the beginning, ensuring that values are always written in an 
  unoccupied spot.
*/
        if (i == offset)
          for (var j = length, k = index + arity - shift; --j >= k;)
            this.set(j + shift, this[j], j)
      }
      this.set(i + index, args[i], i < offset ? false : null);
    }
/*
  Otherwise, if there are more to be removed, then to inserted (#3),
  it shifts the array to the left.
*/
    if (shift < 0 && index < length)
      for (var i = index + arity - shift, old; i < length; i++) {
        if (i + shift <= index - shift) {
          if (i + shift < index - shift) values.push(this[i + shift])
          this.unset(i + shift, this[i + shift]);
        }
        this.set(i + shift, this[i], i);
      }
    this.set('length', (this.__length = length + shift));
    for (var i = this.__length; i < length; i++) {
      if (values.length < - shift) {
        values.push(this[i])
        this.unset(i, this[i]);
      } else {  
        this.unset(i, this[i], false);
      }
    }
    return values;
  },

/*
  `move` method can change the position of a value within array 
  by shifting the values between the old and the new position. 
  No values are lost this way, useful for manual sorting.
*/
  move: function(from, to) {
    if (from === to) return true;
    var value = this[from];
    // shift forwards
    if (from > to)
      for (var i = from; --i > to;)
        this.set(i, this[i + 1], i + 1);
    // shift backwards
    else
      for (var i = from; i < to; i++)
        this.set(i, this[i + 1], i + 1);
    this.set(from > to ? to : to - 1, value, from);
  },
  
  pop: function() {
    return this.splice(-1, 1)[0];
  },
  
  shift: function() {
    return this.splice(0, 1)[0]
  },
  
  unshift: function() {
    this.splice.apply(this, [0, 0].concat(Array.prototype.slice.call(arguments, 0)))
    return this.__length;
  },
  
  watch: function(callback, fn, memo) {
    if (typeof fn != 'undefined') return this._watch(callback, fn);
    for (var i = 0, j = this.__length >>> 0; i < j; i++) {
      if (callback.call) callback.call(this, this[i], i, true);
      else this._callback(callback, this[i], i, true);
    }
    var watchers = this.__watchers;
    if (!watchers) watchers = this.__watchers = [];
    watchers.push(callback);
  },
  
  unwatch: function(callback, fn, memo) {
    if (typeof fn != 'undefined') return this._watch(callback, fn);
    for (var i = 0, j = this.__length >>> 0; i < j; i++) {
      if (callback.call) callback.call(this, this[i], i, false);
      else this._callback(callback, this[i], i, false);
    }
    var watchers = this.__watchers;
    var index = watchers.indexOf(callback);
    watchers.splice(index, 1);
  },
  
  _seeker: function(call, value, index, state, old, limit) {
    var args = this.slice.call(arguments, 1);
    var block = call.block.block;
    if (block) {
      if (state && (call.memo != null && call.memo.length >= (this._limit || Infinity))) {
        if (old != null && block.yields && block.yields[old]) {
          block.yields[index] = block.yields[old];
          delete block.yields[old];
        }
        return
      };
      return call.block(state ? 'yield' : 'unyield', args, call.callback, index, old, limit);
    } else {
      return call.callback(call.block.apply(call.block, args), value, index, state, old);
    }
  },
  
  seek: function(block, callback, state, memo) {
    var array = this.origin || this;
    if (state !== false && (state = true)) {
      var watcher = {fn: this._seeker, bind: this, block: block, callback: callback, memo: memo};
    }
    for (var i = 0, result, j = array.__length >>> 0; i < j; i++) {
      result = array._callback(watcher, array[i], i, state, prev, this._limit);
      prev = null;
      if (this._limit < Infinity) {
        if (!result.value) var prev = i;
        if (state && memo != null && memo.length == this._limit) break;
      }
    }
    var watchers = array.__watchers;
    if (!watchers) watchers = array.__watchers = [];
    if (!state) {
      for (var j = watchers.length; --j;)
        if (watchers[j].callback === callback) {
          watchers.splice(j, 1);
          break;
        }
    } else watchers.push(watcher);
    return memo;
  },
  
  uneach: function(block) {
    return this.seek(block, null, false);
  },
  
  each: function(callback) {
    return this.seek(callback)
  },
  
  filter: function(callback, plain) {
    var filtered = plain ? [] : new LSD.Array;
    var shifts = [], spliced = 0;
    return this.seek(callback, function(result, value, index, state, old) {
//      console.info('Arrghs', Array.from(arguments), filtered, shifts.slice())
      for (var i = shifts.length; i <= index + 1; i++) 
        shifts[i] = (shifts[i - 1]) || 0
      var shift = shifts[index];
      if (state && old != null && shifts[old + 1] > shifts[old])
        for (var i = old + 1, j = Math.max(shifts.length, index); i < j; i++)
          shifts[i]--;
      else
        var diff = shifts[index + 1] - shift;
      if (state ? result ? diff : !diff : diff)
        for (var i = index + 1, j = shifts.length, k = (state && !result ? 1 : -1); i < j; i++) 
          shifts[i] += k;
      if (result && state) {
        var current = filtered[index - shift];
        if (old !== false && !diff && ((!spliced || index - shift > 0 || (filtered[index - shift] != value && old > index)))) {
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
    }, true, filtered)
  },
  
  sort: function(callback, plain) {
    if (!callback) callback = function(a, b) {
      return a > b ? 1 : a < b ? - 1 : 0;
    };
    var sorted = plain ? [] : new LSD.Array;
    var map = [];
    this.watch(function(value, index, state, old) {
      if (state) {
        for (var i = sorted.__length || sorted.length; i > 0; i--)
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
  
  limit: function(number) {
    var collection = new this.constructor;
    collection.origin = this;
    collection._set('_limit', number);
    return collection;
  },
  
  offset: function(number) {
    var collection = this.source || (this.implementation && this.implementation.limit) ? this : new this.constructor;
    if (collection !== this) collection.origin = this;
    collection._set('_limit', number);
    return collection;
  },
  
  every: function(callback) {
    var values = [], that = this, count = 0
    this.seek(callback, function(result, value, index, state, old) {
      if (state) {
        var previous = values[index];
        values[index] = result || false;
        if (previous != result) 
          count += (state && result ? previous == null ? 0 : -1 : 1);
        if (old != null && old !== false) delete values[old];
      } else {
        if (!result) count--
        values.splice(index, 1);
      }
      if (callback.block) callback.block.update(count === 0);
    });
    return this.__length === 0 || count === 0;
  },
  
  some: function(callback) {
    var count = 0, values = [];
    this.seek(callback, function(result, value, index, state, old) {
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
    return this.seek(callback, function(result, value, index, state, old) {
      if (state) {
        var previous = values[index];
        values[index] = result;
      } else {
        values.splice(index, 1);
      }
      if (callback.block) callback.block.update(values);
      return values;
    }, true, values);
  },
  
  toObject: function(normalize, serializer) {
    for (var result = [], i = 0; i < this.__length; i++) {
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
    var clone = new this.constructor;
    for (var i = 0; i < this.__length; i++) clone.push(this[i]);
    return clone;
  }
});

LSD.Array.from = function(origin) {
  var array = new LSD.Array;
  if (typeof origin != 'string' && typeof origin.length == 'number') array.push.apply(array, origin);
  else array.push(origin);
  return array;
};

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

/*
  A special kind of object that is based on LSD.Array but also 
  has its own properties.
*/

LSD.Struct.Array = function(properties) {
  return LSD.Struct(properties, LSD.Array);
};
