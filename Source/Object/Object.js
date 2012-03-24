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
  if (object != null) this.mix(object)
};

LSD.Object.prototype = {
  constructor: LSD.Object,
  
  set: function(key, value, memo, index, hash) {
/*
  The values may be set by keys with types other then string.
  A special method named `_hash` is called each time and can
  return either string (a new key for value to be stored with)
  or anything else (an object, or true). When hash is not string
  the setter turns into immutable mode and only executes callbacks
  without changing any keys. A callback may implement its own
  strategy of storing values, as callbacks recieve result of hashing
  as the last argument. 
*/  
    if (this._hash && hash == null && typeof (hash = this._hash(key, value)) == 'string' && (key = hash)) hash = null;
    else if (typeof key == 'string') var nonenum = this._skip[key];
/*
  Object setters accept nested keys, instantiates objects in the 
  path (e.g. setting post.title will create a post object), and 
  observes changes in the path (post object may be changed
  and title property will be unset from the previous object and
  set to the new object)
*/
    if (hash == null && typeof index != 'number') index = key.indexOf('.');
    if (index > -1) return this.mix(key, value, memo, true, null, null, index);
/*
  `hash` argument may disable all mutation caused by the setter,
  the value by the key will not be mofified. May be used by subclasses
  to implement its own mechanism of object mutations. 
*/
    if (hash == null) {
      var old = this[key];
      if (old === value) return false;
      this[key] = value;
    }
/*
  Most of the keys that start with `_` underscore do not trigger calls to global
  object listeners. But they can be watched individually. A list of the skipped
  properties is defined in `_skip` object below. Builtin listeners may reject
  or transform value.
*/  
    var changed;
    if (this._onChange && typeof (changed = this._onChange(key, value, true, old, memo, hash)) != 'undefined')
      if (changed === this._skip) {
        if (hash == null) this[key] = old;
        return;
      } else value = changed;
    if (index !== -1 || nonenum !== true) {
      if (this.onChange && typeof (changed = this.onChange(key, value, true, old, memo, hash)) != 'undefined')
        if (changed === this._skip) {
          if (hash == null) this[key] = old;
          return;
        } else value = changed;
/*
  When objects link to other objects they write a link back to
  remote object. A linked object can access object that linked it
  with a private observable `_parent` property. Both linkee
  and linker objects may decide to avoid writing a link 
  (e.g. Arrays dont write a link to its object values, and DOM
  elements dont let any objects write a link either).
*/
      if (value != null && value._set && this._children !== false && value._parent == null)
        value._set('_parent', this);
    }
/*
  Objects accept special kind of values, compiled LSD.Script
  expressions. They may use other keys in the object as
  observable variables, call functions and iterate data.
  Script updates value for the key when it computes
  its value asynchronously. The value stays undefined, 
  while the script doesn't have enough data to compute.
*/
    if (nonenum !== true && this._script && value != null && value.script && value.Script && (!this._literal || !this._literal[key])) {
      if (hash == null) this[key] = old;
      return this._script(key, value);
    }
/*
  Watchers are listeners that observe every property in an object. 
  It may be a function (called on change) or another object (change property 
  will be changed in the watcher object)
*/
    var watchers = this._watchers;
    if (watchers && nonenum !== true) for (var i = 0, j = watchers.length, watcher, fn; i < j; i++) {
      if ((watcher = watchers[i]) == null) continue;
      if (typeof watcher == 'function') watcher.call(this, key, value, true, old, memo, hash);
      else this._callback(watcher, key, value, true, old, memo, hash);
    }
    if (index === -1) {
/*
  An alternative to listening for all properties, is to watch
  a specific property. Callback observers recieve new and old
  value each time value changes.
*/
      if (hash == null && this[key] !== value) this[key] = value;
      var watched = this._watched;
      if (watched && (watched = watched[key]))
        for (var i = 0, fn; fn = watched[i++];)
          if (fn.call) fn.call(this, value, old);
          else this._callback(fn, key, value, old, memo, hash);
/*
  When an LSD.Object is mixed with a nested object, it builds
  missing objects to apply nested values. But it also observes
  those object for changes, so if it changes it could re-apply
  the specific sub-tree of original nested object. Observing
  happens passively by storing links to sub-trees for each
  property that has nested object. When an object changes,
  it looks if it has any values stored for it to apply. 
*/
      var stored = this._stored;
      if (stored && (stored = stored[key]))
        for (var i = 0, item; item = stored[i++];) {
          if (value != null && (!item[2] || !item[2]._delegate || !item[2]._delegate(value, key, item[0], true)))
            if (value.mix) value.mix(item[0], item[1], item[2], true, item[3], item[4]);
            else if (typeof value == 'object' && item[1] == null) Object.append(value, item[0])
            else value[item[0]] = item[1];
          if (old != null && (!item[2] || !item[2]._delegate || !item[2]._delegate(old, key, item[0], false)))
            old.mix(item[0], item[1], item[2], false, item[3], item[4]);
        }
    } 
    return true;
  },
  
/*
  Unset method clean object key resetting its value to undefined.
  It does all things that .set do in the same order: hashes its key, 
  transforms values, notifies observers and fires callbacks. 
*/
  unset: function(key, value, memo, index, hash) {
    if (this._hash && hash == null && typeof (hash = this._hash(key, value)) == 'string' && (key = hash)) hash = null;
    else if (typeof key == 'string') var nonenum = this._skip[key];
    if (hash == null && typeof index != 'number') index = key.indexOf('.');
    if (index > -1) return this.mix(key, value, memo, false, null, null, index);
    var vdef = typeof value != 'undefined';
    if (vdef) old = value;
    else var old = this[key];
    if (!hash && vdef && typeof old == 'undefined') return false;
    if (hash == null) delete this[key];
    var changed;
    if (this._onChange && typeof (changed = this._onChange(key, old, false, undefined, memo, hash)) != 'undefined')
      if (changed === this._skip) return;
      else value = changed;
    if (index !== -1 || !this._skip[key]) {
      if (this.onChange && typeof (changed = this.onChange(key, old, false, undefined, memo, hash)) != 'undefined')
        if (changed === this._skip) return;
        else value = changed;
      if (value != null && this._children !== false && value._unset && value._parent === this) 
        value._unset('_parent', this);
    }
    if (nonenum !== true && this._unscript && value != null && value.script && (!this._literal || !this._literal[key]))
      return this._unscript(key, value);
    var watchers = this._watchers;
    if (watchers && nonenum !== true) for (var i = 0, j = watchers.length, watcher, fn; i < j; i++) {
      if ((watcher = watchers[i]) == null) continue
      if (typeof watcher == 'function') watcher.call(this, key, old, false, undefined, memo, hash);
      else this._callback(watcher, key, old, false, undefined, memo, hash);
    }
    if (index === -1) {
      var watched = this._watched;
      if (watched && (watched = watched[key]))
        for (var i = 0, fn; fn = watched[i++];)
          if (fn.call) fn.call(this, undefined, old);
          else this._callback(fn, key, undefined, old, memo);
      var stored = this._stored && this._stored[key];
      if (stored != null && value != null) {
        for (var i = 0, item; item = stored[i++];) {
          if (!item[2] || !item[2]._delegate || !item[2]._delegate(value, key, item[0], false, item[2]))
            value.mix(item[0], item[1], item[2], false, item[3], item[4]);
        }
      }
    }
    return true;
  },
/*
  Get method fetches a value by a simple or dot-separated keys.
  If an optional construct argument is given, it creates objects
  in place of missing values.
*/  
  get: function(key, construct) {
    if (construct == null) construct = this._eager;
    if (typeof key != 'string') {
      var hash = this._hash(key);
      if (typeof hash != 'string') return hash
      else key = hash;
    }
    for (var dot, start, result, object = this; dot != -1;) {
      start = (dot == null ? -1 : dot) + 1;
      dot = key.indexOf('.', start)
      var subkey = (dot == -1 && !start) ? key : key.substring(start, dot == -1 ? key.length : dot);
      if (!subkey) subkey = '_parent';
      if (object === this) {
        result = this[subkey];
      } else {
        result = typeof object._get == 'function' ? object._get(subkey, construct) : object[subkey];
      }  
      if (typeof result == 'undefined' && construct && !object._skip[subkey]) result = object._construct(subkey)
      if (typeof result != 'undefined') {
        if (dot != -1) object = result;
        else return result;
      } else break;
    }
  },
/*
  Mixing is a higher level abstraction above simply setting properties.
  `mix` method accepts both pairs of keys and values and whole objects
  to set and unset properties.
  
  Mixed values are stored twice in the object. Once, as the keys and values 
  processed by setters, and another time is when original arguments are 
  stored to be used later. For example, when an pair like 
  `attributes.tabindex`: `1` is mixed into the object, the arguments are
  stored and then `tabindex` property is applied to `attributes` object.
  When `attributes` object changes, arguments are used to clean
  up the old object, and assign properties to the new object. Similar 
  thing happens when deep nested objects are merged, it stores values
  on each level of the original object and can re-apply it to related
  struct objects when they change.
  
  When an observable object is mixed, it can be opted-in for "live" 
  merging, when updates to the merged object will propagate into 
  the object it was merged into. By default, all new and updated values 
  are appended on top, overwriting values that were set previously. 
  When `prepend` argument is given, reverse merging will be used instead, 
  applying values to the bottom of the stack. That will make merged
  object never overwrite the values that were there before. Those will
  only be used when the values that shadows the merged values will
  be unset.
*/
  mix: function(key, value, memo, state, merge, prepend, index, lazy) {
    if (!memo && this._delegate) memo = this;
    if (typeof key != 'string') {
      if (merge && typeof key._unwatch == 'function') {
        if (state === false) {
          key.unwatch(this);
        } else {  
          key.watch({
            fn: this._merger,
            bind: this,
            callback: this,
            prepend: prepend
          })
        }
      }
      var unstorable = memo && memo._unstorable;
      var skip = key._skip; 
      for (var prop in key) 
        if (key.hasOwnProperty(prop) && (unstorable == null || !unstorable[prop]) && (skip == null || !skip[prop])) {
          var val = key[prop];
          if (val == null || val._shared !== true) this.mix(prop, key[prop], memo, state, merge, prepend);
          else this[state ? 'set' : 'unset'](prop, key[prop], memo, prepend)
        }
    } else {
/*
  A string in the key may contain dots `.` that denote nested
  objects. The values are passed through to the related objects,
  but they are also stored in original object, so whenever related
  object reference is changed, the stored values are removed from 
  old objects and applied to the new related object. 
*/
      if (index == null) index = key.indexOf('.', -1);
      if (index > -1) {
        var name = key.substr(key.lastIndexOf('.', index - 1) + 1, index) || '_parent';
        var subkey = key.substring(index + 1);
        if (this.onStore && typeof this.onStore(name, value, memo, state, prepend, subkey) == 'undefined') return;
        var storage = (this._stored || (this._stored = {}));
        var group = storage[name];
        if (!group) group = storage[name] = [];
        if (state === false) {
          for (var i = 0, j = group.length; i < j; i++) {
            if (group[i][1] === value) {
              group.splice(i, 1);
              break;
            }
          }
        } else {
          group.push([subkey, value, memo, merge, prepend, index]);
        }
        var obj = this[name];
        if (obj == null) {
          if (state !== false && !this._skip[name] && !lazy)
            obj = this._construct(name, null, memo, value);
        } else if (obj.push) {
          for (var i = 0, j = obj.length; i < j; i++)
            obj[i].mix(subkey, value, memo, state, merge, prepend)
        } else {
          var parent = this._children !== false && obj._parent !== false && obj._parent;
          if (state !== false && parent && parent !== this && obj._shared !== true) {
            this[name] = null;
            obj = this._construct(name, null, memo, value)
          } else if (typeof obj.mix == 'function') {
            obj.mix(subkey, value, memo, state, merge, prepend);
          } else {
            for (var previous, k, object = obj; (subindex = subkey.indexOf('.', previous)) > -1;) {
              k = subkey.substring(previous || 0, subindex)
              if (previous > -1 && typeof object.mix == 'function') {
                object.mix(subkey.substring(subindex), value, memo, state, merge, prepend)
              } else if (object[k] != null) object = object[k];
              previous = subindex + 1;
            }
            k = subkey.substring(previous);
            if (typeof object.mix == 'function')
              object[state ? 'set' : 'unset'](k, value, memo)
            else object[k] = value;
          }
        }
      } else if (value != null && (typeof value == 'object' && !value.exec && !value.push && !value.nodeType && value.script !== true)
                               && (!value.mix || merge)) {
        if (this.onStore && typeof this.onStore(key, value, memo, state, prepend) == 'undefined') return;
        var storage = (this._stored || (this._stored = {}));
        var group = storage[key];
        if (!group) group = storage[key] = [];
        if (state === false) {
          for (var i = 0, j = group.length; i < j; i++) {
            if (group[i][0] === value) {
              group.splice(i, 1);
              break;
            }
          }
        } else {
          group.push([value, null, memo, merge, prepend, index]);
        }
/*
  When a deep object is mixed into an object, it construct objects on its
  path to set the values. The base class for those objects is determined
  dynamically, if `getConstructor` method is defined, or resorts to
  `this.constructor` which creates the same kind of object. That object
  recursion is useful, because it allows to define prototype methods
  on object prototype, and then be able to call them from any level of the
  object tree.
*/
        var obj = this[key];
        if (obj == null) {
          if (state !== false && !this._skip[name]) 
            obj = this._construct(key, null, memo, value);
/*
  Objects also support mixing values into arrays. They mix values
  into each value of the array. 
  
      // will set tabindex attribute to each of childNodes
      object.mix('childNodes.attributes.tabindex', -1);
*/
        } else if (obj.push) {
          for (var i = 0, j = obj.length; i < j; i++)
            if (!memo || !memo._delegate || !memo._delegate(obj[i], key, value, state))
              obj[i].mix(value, null, memo, state, merge, prepend);
        } else {
          obj.mix(value, null, memo, state, merge, prepend);
        }
      } else {
/*
  Optional memo argument may define the kind of the method that should be called
  on a respective property.
*/
        switch (memo) {
          case 'set': case '_set': case 'unset': case '_unset': case 'change': case 'mix':
            this[memo](key, value, memo, prepend);
            break;
          default:
            this[state !== false ? 'set' : 'unset'](key, value, memo, prepend);
        }
      }
    }
    return this;
  },
  
/*
  Unlike most of the hash table and object implementations out there, LSD.Object can 
  easily unmix values from the object. The full potential of unmixing objects can be
  explored with LSD.Object.Stack, that allows objects to be mixed on top or 
  to the bottom of the stack (some kind of reverse merge known in ruby).
  
  Plain LSD.Object is pretty naive about unmixing properties, it just tries to
  unset the ones that match the given values. LSD.Object.Stack on the other 
  hand, is pretty strict and never loses a value that was set before, and can 
  easily reset to other values that were set before by the same key.
  
  Different kind of objects often used nested together, so `mix` being a recursive
  function often helps to pass the commands through a number of objects of different 
  kinds.
*/
  unmix: function(key, value, memo, state, merge, prepend, index) {
    return this.mix(key, value, memo, false, merge, prepend, index);
  },
  
/*
  Merge method is an alias to mix with some arguments predefined. It does the same as
  simple mix, but it also tries to subscribe current object to changes in the object
  that is being mixed in, if it's observable. Changes then propagate back to current 
  object. `prepend` argument defines if the object should be merged to the bottom 
  or on top.
*/
  merge: function(value, prepend, memo) {
    return this.mix(value, null, memo, true, true, prepend)
  },
/*
  Unmerge method unmixes the object and unsubscribes current object from changes
  in the given object.
*/
  unmerge: function(value, prepend, memo) {
    return this.mix(value, null, memo, false, true, prepend)
  },
  
  watch: function(key, callback, lazy) {
    var string = typeof key == 'string';
    if (!string && typeof callback == 'undefined') {
      var watchers = this._watchers;
      if (!watchers) watchers = this._watchers = [];
      if (callback) watchers.unshift(key)
      else watchers.push(key);
    } else {
      if (!string) {
        var hash = this._hash(key, callback);
        if (typeof hash == 'string') key = hash
        else if (hash == null) return;
        else if (typeof hash.push == 'function') return hash.push(callback)
        else return hash.watch(key, callback);
      }
      var index = key.indexOf('.');
      if (index > -1) {
        this.watch(key.substr(0, index) || '_parent', {
          fn: this._watcher,
          index: index,
          key: key,
          callback: callback,
          lazy: lazy
        }, lazy)
      } else {  
        var value = this._get(key, lazy === false);
        var watched = (this._watched || (this._watched = {}));
        (watched[key] || (watched[key] = [])).push(callback);
        if (!lazy && typeof value != 'undefined') {
          if (callback.call) callback(value);
          else this._callback(callback, key, value, undefined);
        }
      }
    }
  },
  
  unwatch: function(key, callback) {
    var string = typeof key == 'string';
    if (!string && typeof callback == 'undefined') {
      var watchers = this._watchers;
      for (var i = 0, j = watchers.length, fn; i < j; i++) {
        var fn = watchers[i];
        if (fn === key || (fn != null && fn.callback == key)) watchers.splice(i, 1);
        break;
      }
    } else {
      if (!string) {
        var hash = this._hash(key, callback);
        if (typeof hash == 'string') key = hash
        else if (hash == null) return;
        else if (typeof hash.splice == 'function') {
          for (var i = hash.length, fn; i--;) {
            if ((fn = hash[i]) == callback || fn.callback == callback) {
              hash.splice(i, 1);
              break;
            }
          }
          return;
        } else return hash.watch(key, callback);
      }
      var index = key.indexOf('.');
      if (index > -1) {
        this.unwatch(key.substr(0, index) || '_parent', callback)
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
            if (typeof fn == 'function') fn(undefined, value);
            else this._callback(fn, key, undefined, value);
          }
          break;
        }
      }
    }
  },
  
  has: function(key) {
    if (!this.hasOwnProperty(key)) return false;
    var skip = this._skip;
    return !skip || !skip[key]
  },
  
  _construct: function(name, constructor, memo, value) {
    if (!constructor) {
      var constructors = this._constructors || (this._constructors = {});
      constructor = (constructors && constructors[name])
                || (this._getConstructor ? this._getConstructor(name) : value && value.__constructor || this.constructor);
    }
    var instance = new constructor;
    if (this._delegate && !memo) memo = this;
    this.set(name, instance, memo);
    return instance;
  },
  
  _watcher: function(call, key, value, old, memo) {
    var object = value == null ? old : value, key = call.key;
    if (typeof object._watch == 'function') {
      object[value ? '_watch' : '_unwatch'](key.substring(call.index + 1), call.callback, call.lazy);
    } else if (value != null) {
      for (var dot, start; dot != -1;) {
        start = (dot || call.index) + 1;
        dot = key.indexOf('.', start)
        var subkey = call.key.substring(start, dot == -1 ? key.length : dot);
        var result = object._get ? object._get(subkey, lazy === false) : object[subkey];
        if (result != null) {
          if (dot != -1) {
            if (typeof object._watch == 'function') {
              return result[value ? '_watch' : '_unwatch'](key.substring(dot + 1), call.callback, call.lazy);
            } else {
              object = object[subkey];
            }
          } else call.callback(result);
        } else break;
      }
    }
  },
  
  _merger: function(call, name, value, state, old) {
    if (state) this.mix(name, value, call, true, true, call.prepend);
    if (this._stack && (!state || old != null)) this.mix(name, state ? old : value, call, false, true, call.prepend);
  },
  
  _callback: function(callback, key, value, old, memo, obj, other) {
    if (callback.substr) 
      var subject = this, property = callback;
    else if (typeof callback.fn == 'function')
      return (callback.fn || (callback.bind || this)[callback.method]).call(callback.bind || this, callback, key, value, old, memo, obj, other);
    else if (callback.watch && callback.set) 
      var subject = callback, property = key;
    else if (callback.push) 
      var subject = callback[0], property = callback[1];
    if (property === true || property == false) 
      property = key;
    // check for circular calls
    if (memo != null && memo.push) {
      for (var i = 0, a; a = memo[i++];)
        if (a[0] == this && a[1] == property) return;
    } else memo = [];
    memo.push([this, key]);
    var vdef = typeof value != 'undefined';
    var odef = typeof old != 'undefined';
    if ((vdef || !odef) && (value !== callback[2])) subject.set(property, value, memo);
    if (!vdef || (odef && subject._stack)) subject.unset(property, old, memo);
  },
  
  _toString: Object.prototype.toString,
  
  toString: function(objects) {
    var string = '{';
    if (!objects) objects = [];
    for (var property in this) {
      var type = typeof this[property];
      if (type == 'object' && type) {
        if (objects.indexOf(type) > -1) return;
        objects.push(type);
      }
      if (this.has(property) && typeof this[property] != 'function') {
        string += (string.length > 1 ? ', ' : '') + (property + ': ' + this[property].toString(objects));
      }
    }
    return string + '}'
  },

  /*
    A function that recursively cleans LSD.Objects and returns
    plain object copy of the values
  */
  toObject: function(normalize, serializer) {
    if (this === LSD.Object || this === LSD)
      var obj = normalize, normalize = serializer, serializer = arguments[2];
    else 
      var obj = this;
    if (obj == null) return null;
    if (obj._toObject) {
      if (obj._toObject.call) {
        return obj._toObject.apply(obj, arguments);
      } else if (obj._toObject.push) {
        var object = {};
        for (var i = 0, prop; prop = obj._toObject[i++];)
          if (obj[prop]) {
            var val = LSD.toObject(obj[prop], normalize, serializer);
            if (!normalize || typeof val != 'undefined')
              object[prop] = val;
          }
      } else {
        var object = {};
        for (var prop in obj) 
          if (prop in obj._toObject) {
            var val = LSD.toObject(obj[prop], normalize, serializer);
            if (!normalize || typeof val != 'undefined')
              object[prop] = val;
          }
      }
    } else if (obj.lsd && obj.nodeType) {
      if (serializer === true) {
        return obj;
      } else if (typeof serializer == 'function') {
        return serializer(obj, normalize)
      } else {
        if (!obj.toData) return;
        return obj.toData();
      }
    } else if (obj.push) {
      if (obj.toObject) {
        var object = obj.toObject(normalize, serializer)
      } else {
        var object = [];
        for (var i = 0, j = obj.length; i < j; i++)
          object[i] = LSD.toObject(obj[i], normalize, serializer);
      }
    } else if (obj.setDate) {
      return obj.toString();
    } else if (!obj.indexOf && typeof obj == 'object') {
      var object = {};
      var skip = obj._skip;
      for (var key in obj) 
        if (obj.hasOwnProperty(key) && (skip == null || !skip[key])) {
          var val = obj[key];
          val = (val == null || val.exec || typeof val != 'object') ? val : LSD.toObject(val, normalize, serializer);
          if (!normalize || typeof val != 'undefined') 
            object[key] = val;
        }
    }
    return object || obj;
  },
  
  /*
    A dictionary of internal keys that get skipped
    when iterating over all keys of object. Some 
    of these properties are skipped naturally by
    using a hasOwnProperty function that filters
    out all properties that come from the prototype 
    of the object. But with this skip map, properties
    may be assigned to the object itself and still
    not be used.
  */
  _skip: {
    // Map of resolved constructors for properties
    _constructors: true,
    // Global value observers
    _watchers: true,
    // A flag to disable object "adoption"
    _children: true,
    // Individual property value observers
    _watched: true,
    // A link to an object "adopter"
    _parent: true,
    // Stored raw mixed values
    _stored: true,
    // A flag to avoid copying the object
    _shared: true,
    // A live merge worker callback
    _merger: true,
    // A key mutator function
    _hash: true,
    // Skip list itself
    _skip: true
  }
};

LSD.toObject = LSD.Object.toObject = LSD.Object.prototype.toObject;
['set', 'unset', 'watch', 'unwatch', 'get'].each(function(method) {
  LSD.Object.prototype['_' + method] = LSD.Object.prototype[method];
});
LSD.Object.prototype.change = LSD.Object.prototype.set;
