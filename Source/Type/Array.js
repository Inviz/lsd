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
  LSD.Array is an observable array that acts just like a regular array.
  It notifies listeners when new items are added, or old items
  are repositioned within array.
*/

LSD.Array = function(arg) {
  if (!this.push) {
    var array = new LSD.Array;
    array.push.apply(array, arguments);
    return array;
  } else {
    var j = arguments.length;
    if (j == 1) {
      if (arg != null && !arg.match && typeof arg != 'string' && typeof arg.length == 'number') {
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
  if (!this.hasOwnProperty('_length')) 
  this.length = this._length = 0;
};

/*
  LSD.Array uses LSD.Object as its base class like all other objects.
  When a non-integer key is given to `.set()`, `.unset()`, or `.get()`
  functions, it falls back to LSD.Object setters.

  Length property in LSD.Array is maintained and observed that way,
  by re-using LSD.Object capabilities.

  It is possible to change an LSD.Array subclass to have a different
  base structure, by altering the getter and setter methods.
*/

LSD.Array.prototype = new LSD.Object;
LSD.Array.prototype.constructor = LSD.Array,
  /*
    Public array-like length property. Although in javascript,
    some objects like functions have their own length property
    which can not be overwritten, thus is not reliable.
    Array internals use _length property instead.
  */
LSD.Array.prototype.length = 0;
LSD.Array.prototype._length = 0;
LSD.Array.prototype._offset = 0;
/*
  This option set to false forbids LSD.Array to reference
  LSD.Objects, thus it does not affect their `._owner` link.
*/
LSD.Array.prototype._owning = false;

LSD.Array.prototype.push = function() {
  var args = Array.prototype.slice.call(arguments);
  for (var i = 0, j = args.length; i < j; i++) {
    if (this._prefilter && !this._prefilter(args[i])) {
      args.splice(i, 1);
      j--;
    } else if (this._onSplice && (more = this._onSplice(args[i], args, true)) != null) {
      args.splice.apply(args, [i + 1, 0].concat(more))
      j += more.length
      i += more.length;
    }
  }
  for (var i = 0, j = args.length; i < j; i++)
    this.set(this._length, args[i], 'push');
  return this._length;
};
LSD.Array.prototype.set = function(key, value, old, meta, extra) {
  var index = parseInt(key);
  if (index != index) {
    return this['_set'](key, value, old, meta, extra);
  } else {
    this[index] = value;
    if (index + 1 > this._length) this._set('length', (this._length = index + 1));
    if (this._onSet && typeof (set = this._onSet(value, index, true, old, meta)) != 'undefined')
      this[index] = value = set;
    if (this.onSet && typeof (set = this.onSet(value, index, true, old, meta)) != 'undefined')
      this[index] = value = set;
    var watchers = this.__watchers, changed;
    if (watchers) for (var i = 0, j = watchers.length, fn; i < j; i++) {
      if (!(fn = watchers[i])) continue;
      if (typeof fn == 'function') fn.call(this, value, index, true, old, meta);
      else this._callback(fn, value, index, true, old, meta);
    }
    if (old == null && value && value.mix) {
      var stored = this._owner;
      if (stored && (stored = stored._stored) && (stored = stored[this._reference]))
        for (var i = 0, a; a = stored[i++];) 
          value.mix.apply(value, a);
      if ((stored = this._stored))
        for (var prop in stored) if (!this._skip[prop]) {
          var dot = prop.indexOf('.');
          var property = dot > -1 ? prop.substring(0, dot) : prop;
          if (parseInt(property) != property) {
            for (var i = 0, a; a = stored[prop][i++];) {
              if (a.length < 3) 
                value.set(prop, a[0], a[1]);
              else if (typeof a[0] == 'string')
                value.mix(prop + '.' + a[0], a[1], a[2], a[3], a[4], a[5], a[6])
            }
          } else if (property == key) {
            for (var i = 0, a; a = stored[prop][i++];) 
              value.mix((prop ? prop + '.' : '') + a[0], a[1], a[2], a[3], a[4], a[5], a[6])
          }
        }
    }
    return value;
  }
};
LSD.Array.prototype.unset = function(key, value, old, meta, extra) {
  var index = parseInt(key);
  if (index != index) {
    return this._unset(key, value, old, meta, extra);
  } else {
    delete this[index];
    if (index + 1 == this._length) this._set('length', (this._length = index));
    var watchers = this.__watchers;
    if (watchers) for (var i = 0, j = watchers.length, fn; i < j; i++) {
      if (!(fn = watchers[i])) continue;
      if (typeof fn == 'function') fn.call(this, value, index, false, old, meta);
      else this._callback(fn, value, index, false, old, meta);
    }
    if (old == null && value && value.mix) {
      var stored = this._owner;
      if (stored && (stored = stored._stored) && (stored = stored[this._reference]))
        for (var i = 0, a; a = stored[i++];) 
          value.unmix.apply(value, a);
      if ((stored = this._stored))
        for (var prop in stored) if (!this._skip[prop]) {
          if (parseInt(prop) != prop) {
            for (var i = 0, a; a = stored[prop][i++];) 
              if (a.length < 3) 
                value.unset(prop, a[0], a[1]);
              else if (typeof a[0] == 'string')
                value.unmix(prop + '.' + a[0], a[1], a[2], a[3], a[4], a[5], a[6])
          } else if (prop == key) {
            for (var i = 0, a; a = stored[prop][i++];) 
              value.unmix(a[0], a[1], a[2], a[3], a[4], a[5], a[6])
          }
        }
    }
    if (this._onSet) this._onSet(value, index, false, old, meta);
    if (this.onSet) this.onSet(value, index, false, old, meta);
    return value;
  }
};
LSD.Array.prototype.indexOf = function(object, from) {
  var hash = this._hash && typeof object == 'object' && object != null ? this._hash(object) : object;
  var length = this._length >>> 0;
  for (var i = (from < 0) ? Math.max(0, length + from) : from || 0; i < length; i++) {
    var value = this[i];
    if (value === object || (this._hash && hash != null && value != null && this._hash(value) == hash)) return i;
  }
  return -1;
};

/*
  Splice method is the heart of LSD.Array, since it's a method that abstracts
  away every possible modification of array. Methods like `pop`, `shift`,
  `unshift` use `splice`, because it's the only array method that shifts
  values when more values are added or removed from array.

  The goal of this method is to alter the array in a specific order that ensures
  that values are not overwritten in the process. That enables two things:

    - No intermediate values are stored when array modifications take place

    - Iterator-like separation of concerns, when observable array callbacks
      only receive bare minimum of arguments and not handle order of
      execution by outsourcing it to implementation of the method that changes
      the array.

  An array modification may lead up to 3 outcomes:

    1. No shift is needed, when values are replaced
      with other values

    2. Array needs to be shifted to the right, when more values
      are inserted than removed

    3. Array needs to be shifted to the left, when more values
      are removed than inserted

  It is also one of the few methods that prefilter their arguments,
  before inserting if array has defined `_prefilter` hook.
*/
LSD.Array.prototype.splice = function(index, offset) {
/*
  Arguments are filtered before they are used in array modification. 
  That allows array to allocate or use exactly right amount of space
  before anything is written.
*/
  var args = Array.prototype.slice.call(arguments, 2),
      arity = args.length,
      length = this._length, more
  for (var j = 0; j < arity; j++) {
    if (this._prefilter && !this._prefilter(args[j])) {
      args.splice(j--, 1);
      arity--;
    } else if (this._onSplice && (more = this._onSplice(args[j], args, true)) != null) {
      args.splice.apply(args, [j + 1, 0].concat(more))
      arity += more.length
    }
  }  
  if (index == null) index = 0;
  else if (index < 0) index = length + index;
  else index = Math.min(index, length)
  if (offset == null) offset = length - index;
  else offset = Math.max(0, Math.min(length - index, offset))
  if (this._onSplice) for (var i = index; i < offset + index; i++)
    if ((more = this._onSplice(this[i], args, false)) != null) 
      offset = Math.max(offset, more.length + (i - index + 1))
  var shift = arity - offset;
  this._shifting = shift;
  var values = [];
/*
  Splice first tries to insert new values, if given any.
  But it can only do it safely only to values that will
  be removed because of an `offset` argument of a `splice()`.
  if the offset is equal than the number of inserted
  values, then no shift is needed (outcome #1).
*/
  for (var i = 0, bit; i < arity; i++) {
    bit = (i == 0 && this.FIRST) | ((i == arity - 1) && this.LAST);
    if (i < offset) {
      values.push(this[i + index]);
      this.unset(i + index, this[i + index], null, bit | this.FORWARD);
    } else {
/*
  If there is more values to be inserted than to be removed (outcome #2),
  splice shifts the array to the right by iterating from end
  to the beginning, ensuring that values are always written in an
  unoccupied spot.
*/
      if (i == offset)
        for (var j = length, k = index + arity - shift; --j >= k;)
          this.set(j + shift, this[j], j, bit | this.MOVE | this.FORWARD)
    }
    this.set(i + index, args[i], null, i < offset ? bit : bit | this.SPLICE);
  }
/*
  Otherwise, if there are more to be removed, than to inserted 
  (outcome #3), it shifts the array to the left.
*/
  if (shift < 0 && index < length)
    for (var s = index + arity - shift, i = s, spliced, old; i < length; i++) {
      bit = ((i == index + arity - shift) && this.FIRST) | ((i === length - 1) && this.LAST);
      spliced = i - s < offset - arity;
      if (spliced) values.push(this[i + shift])
      this.unset(i + shift, this[i + shift], null, bit | (spliced ? this.FORWARD : this.MOVE));
      this.set(i + shift, this[i], i, bit | this.MOVE);
    }
  this._set('length', (this._length = length + shift));  
  for (var i = this._length; i < length; i++)  {
    bit = ((i === this._length) && this.FIRST) | ((i === length - 1) && this.LAST);
    if (values.length < - shift) {
      values.push(this[i])
      this.unset(i, this[i], null, bit | this.SPLICE);
    } else {
      this.unset(i, this[i], null, bit | this.MOVE);
    }
  }
  delete this._shifting;
  return values;
};
/*
  When splice method sets values in array, it also sends an additional
  argument, a number that can be bitmasked to figure out the type
  of an operation within a callback. 
  
  `MOVE` flag means that the the value was moved within array, e.g. when
  shifting the tail of array to the left, when some value in the middle
  was spliced out.
  
  When `FORWARD` flag goes together with `MOVE`, it means that new values
  were added somewhere, so a part of array needs to be shifted right.
  If a `FORWARD` flag goes without `MOVE`, it means that the value that
  is getting removed will be overwritten by inserted values.
  
  `SPLICE` means that some values were either removed or inserted into
  array, depending on `state` argument.
  
  `FIRST` and `LAST` flags are set when an operation is first or last
  within its type. A single `splice()` call may fire multiple
  callbacks with `FIRST` flag set - one for each type of array
  manipulation - first item to be removed, first item to be shifted.
  
*/
LSD.Array.prototype.MOVE = 0x1;
LSD.Array.prototype.FORWARD = 0x2;
LSD.Array.prototype.SPLICE = 0x4;
LSD.Array.prototype.FIRST = 0x8;
LSD.Array.prototype.LAST = 0x10;
/*
  `move` method can change the position of a value within array
  by shifting the values between the old and the new position.
  No values are lost this way, useful for manual sorting.
*/
LSD.Array.prototype.move = function(from, to, meta) {
  if (from === to) return true;
  var value = this[from];
  if (from > to)
    for (var i = from; --i > to;)
      this.set(i, this[i + 1], i + 1, 'collapse');
  else
    for (var i = from; i < to; i++)
      this.set(i, this[i + 1], i + 1, 'collapse');
  var j = from > to ? to : to - 1;
  if (j !== from) this.set(j, value, from, 'move');
};
LSD.Array.prototype.pop = function() {
  return this.splice(-1, 1)[0];
},

LSD.Array.prototype.shift = function() {
  return this.splice(0, 1)[0]
};
LSD.Array.prototype.unshift = function() {
  this.splice.apply(this, [0, 0].concat(Array.prototype.slice.call(arguments, 0)))
  return this._length;
};
LSD.Array.prototype.watch = function(callback, fn, meta) {
  if (typeof fn != 'undefined') return this._watch(callback, fn);
  for (var i = 0, j = this._length >>> 0; i < j; i++) {
    if (callback.call) callback.call(this, this[i], i, true);
    else this._callback(callback, this[i], i, true);
  }
  var watchers = this.__watchers;
  if (!watchers) watchers = this.__watchers = [];
  watchers.push(callback);
};
LSD.Array.prototype.unwatch = function(callback, fn, meta) {
  if (typeof fn != 'undefined') return this._watch(callback, fn);
  for (var i = 0, j = this._length >>> 0; i < j; i++) {
    if (callback.call) callback.call(this, this[i], i, false);
    else this._callback(callback, this[i], i, false);
  }
  var watchers = this.__watchers;
  var index = watchers.indexOf(callback);
  watchers.splice(index, 1);
};
LSD.Array.prototype._seeker = function(call, value, index, state, old, meta) {
  var args = this.slice.call(arguments, 1), block = call.block, invoker = call.invoker, array = call.meta, length = array && array.length;
  if (state && index > invoker._last && length >= invoker._limit && (array[length - 1] !== array[length - 1 + this._shifting]))
    return;
  if (index < invoker._position) return;
  if (block.block) {
    var result = block(state ? 'yield' : 'unyield', args, call.callback, index, old, meta);
  } else {
    var result = block.apply(block, args);
    if (call.callback) result = call.callback(result, value, index, state, old, meta);
  }
  if (result != null && result.value && (invoker._last == null || invoker._last < index)) invoker._last = index;
  return result;
};
LSD.Array.prototype.seek = function(block, callback, state, meta) {
  var array = this._origin || this, limit = this._limit, offset = this._offset;
  if (state !== false && (state = true)) {
    block.watcher = {fn: this._seeker, invoker: this, block: block, callback: callback, meta: meta};
  }
  this._position = 0;
  for (var i = 0, result, fn, j = array._length >>> 0; i < j; i++) {
    if (offset > 0 && (!this._skipped || this._skipped < offset)) {
      if (fn == null) fn = block.block ? block.block.eval() : block;
      this._skipped = (this._skipped || 0) + +!!fn(array[i], i, state, prev);
      this._position++;
      result = undefined;
    } else {
      result = array._callback(block.watcher, array[i], i, state, prev, {limit: this._limit, offset: this._offset});
      prev = null;
      if (limit) {
        if (!result) var prev = i;
        if (state && meta != null && meta.length == limit) break;
      }
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
  } else watchers.push(block.watcher);
  return meta;
};
LSD.Array.prototype.uneach = function(block) {
  return this.seek(block, null, false);
};
LSD.Array.prototype.each = function(callback) {
  return this.seek(callback)
};
LSD.Array.prototype.filter = function(callback, plain) {
  var filtered = plain ? [] : new LSD.Array;
  var shifts = [], spliced = 0, origin = this;
  return this.seek(callback, function(result, value, index, state, old, meta) {
    var splicing = meta & 0x4, moving = meta & 0x1;
    if (origin._position) index -= origin._position - (origin._origin && origin._origin._shifting || 0)
    for (var i = shifts.length; i <= index + 1; i++)
      shifts[i] = (shifts[i - 1]) || 0
    var shift = shifts[index];
    if (state && (old != null) && shifts[old + 1] > shifts[old])
      for (var i = old + 1, j = Math.max(shifts.length, index); i < j; i++)
        shifts[i]--;
    else
      var diff = shifts[index + 1] - shift;
    if (state ? result ? diff : !diff : diff)
      for (var i = index + 1, j = shifts.length, k = (state && !result ? 1 : -1); i < j; i++)
        shifts[i] += k;
    if (result && state) {
      var current = filtered[index - shift];
      if (index < 0 && old) {
        filtered.set ? filtered.unset(old, value) : delete filtered[old];
      } else if ((splicing || moving) && !diff && ((!spliced || index - shift > 0 || (filtered[index - shift] !== value && old > index)))) {
        filtered.set ? filtered.set(index - shift, value) : filtered[index - shift] = value;
      } else {
        filtered.splice(index - shift, 0, value);
      }
      if ((old != null || !splicing) && spliced > 0) spliced--;
    } else if (old == null && state ^ result && (!state || meta == null || splicing)) {
      filtered.splice(index - shift, 1);
      if (index - shift == 0 && (old != null || !splicing)) spliced++;
    }
    if (callback.block) callback.block.update(filtered);
    return filtered;
  }, true, filtered)
};
LSD.Array.prototype.sort = function(callback, plain) {
  if (!callback) callback = this._sorter;
  var sorted = plain ? [] : new LSD.Array;
  var map = [];
  this.watch(function(value, index, state, old, meta) {
    var moving = meta & 0x1;
    if (state) {
      for (var i = sorted._length || sorted.length; i > 0; i--)
        if (callback(sorted[i - 1], value) < 0) break;
      if (!moving) {
        sorted.splice(i, 0, value);
      } else {
        delete map[old];
        sorted.set ? sorted.set(i, value) : sorted[i] = value;
      }
    } else {
      i = map[index];
      if (i != null) sorted.splice(i, 1);
    }
    if (!state || !moving)
      for (var j = 0; j < map.length; j++)
        if (map[j] >= i) map[j] += (state ? 1 : -1);
    if (state) map[index] = i;
    else delete map[index];
    if (callback.block) callback.block.update(sorted);
    return sorted;
  });
  return sorted;
};
LSD.Array.prototype.limit = function(number) {
  return (this._origin ? this : (new this.constructor).mix('_origin', this)).mix('_limit', number);
};
LSD.Array.prototype.offset = function(number) {
  return (this._origin ? this : (new this.constructor).mix('_origin', this)).mix('_offset', number);
};
LSD.Array.prototype.every = function(callback) {
  if (callback.result != null) return callback.result === 0;
  var values = [];
  var that = this;
  this.seek(callback, function(result, value, index, state, old) {
    if (callback.result == null) callback.result = 0;
    if (state) {
      var previous = values[index];
      values[index] = result || false;
      if (previous != result)
        callback.result += (state && result ? previous == null ? 0 : -1 : 1);
      if (old != null) delete values[old];
    } else {
      if (!result) callback.result--
      values.splice(index, 1);
    }
    if (callback.block) callback.block.update(callback.result === 0);
    return callback.result === 0;
  });
  return this._length === 0 || callback.result === 0;
};
LSD.Array.prototype.some = function(callback) {
  var count = 0, values = [];
  this.seek(callback, function(result, value, index, state, old, meta) {
    if (state) {
      var previous = values[index];
      values[index] = result;
      if (previous != result) count += state && result ? 1 : previous == null ? 0 : - 1;
      if (old != null) delete values[old];
    } else if (meta == null || !(meta & 0x1)) {
      if (result) count--
      values.splice(index, 1);
    }
    if (callback.block) callback.block.update(count > 0);
    return count > 0;
  });
  return count > 0;
};
LSD.Array.prototype.map = function(callback) {
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
};
LSD.Array.prototype.toObject = function(normalize, serializer) {
  for (var result = [], i = 0; i < this._length; i++) {
    var value = this[i];
    if (value != null) value = LSD.toObject(this[i], normalize, serializer);
    if (!normalize || typeof value != 'undefined') result.push(value);
  }
  return result;
},
LSD.Array.prototype._manager = function(callback, value, old) {
  if (value != null) this.push(value);
  if (old != null) {
    var index = this.indexOf(old);
    if (index > -1) this.splice(index, 1);
  }
};
LSD.Array.prototype._sorter = function(a, b) {
  return a > b ? 1 : a < b ? - 1 : 0;
};
LSD.Array.prototype._hash = function(object) {
  return typeof object._id != 'undefined'
    ? object._id
    : typeof object.id != 'undefined'
      ? object.id
      : object.$id;
};
LSD.Array.prototype.clone = function() {
  var clone = new this.constructor;
  for (var i = 0; i < this._length; i++) clone.push(this[i]);
  return clone;
};
LSD.Array.prototype.onConstructRefused = function() {
  for (var i = 0, j = this._length, val; i < j; i++) {
    if ((val = this[i]) && val.mix)
      val.mix.apply(val, arguments);
  }
}
LSD.Array.prototype['<<'] = LSD.Array.prototype.push;
LSD.Array.prototype['+'] = LSD.Array.prototype.concat;
LSD.Array.prototype.slice = Array.prototype.slice;
LSD.Array.prototype.forEach = Array.prototype.forEach;
LSD.Struct.implement(Array.prototype, LSD.Array.prototype, true);
LSD.Struct.implement({
  _skip: {
    _onSplice: true,
    _prefilter: true,
    _length: true,
    length: true
  }
}, LSD.Array.prototype);