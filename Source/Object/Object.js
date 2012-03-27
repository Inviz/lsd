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

LSD.Object.prototype.constructor = LSD.Object;
LSD.Object.prototype.set = function(key, value, memo, index, hash) {
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
  if (index > -1) return this.mix(key, value, memo, true, null, null, null, index);
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
      for (var i = 0, args; args = stored[i++];) {
        if (value != null && (!args[2] || !args[2]._delegate || !args[2]._delegate(value, key, args[0], true)))
          if (value.mix) value.mix.apply(value, args);
          else if (typeof value == 'object' && args[1] == null) Object.append(value, args[0])
          else value[args[0]] = args[1];
        if (old != null && (!args[2] || !args[2]._delegate || !args[2]._delegate(old, key, args[0], false)))
          old.unmix.apply(old, args);
      }
  } 
  return true;
};
  
/*
  Unset method clean object key resetting its value to undefined.
  It does all things that .set do in the same order: hashes its key, 
  transforms values, notifies observers and fires callbacks. 
*/
LSD.Object.prototype.unset = function(key, value, memo, index, hash) {
  if (this._hash && hash == null && typeof (hash = this._hash(key, value)) == 'string' && (key = hash)) hash = null;
  else if (typeof key == 'string') var nonenum = this._skip[key];
  if (hash == null && typeof index != 'number') index = key.indexOf('.');
  if (index > -1) return this.mix(key, value, memo, false, null, null, null, index);
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
    if (stored != null && value != null)
      for (var i = 0, args; args = stored[i++];)
        if (!args[2] || !args[2]._delegate || !args[2]._delegate(value, key, args[0], false, args[2]))
          value.unmix.apply(value, args)
  }
  return true;
};
/*
  Get method fetches a value by a simple or dot-separated keys.
  If an optional construct argument is given, it creates objects
  in place of missing values.
*/  
LSD.Object.prototype.get = function(key, construct) {
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
      result = typeof object.get == 'function' ? object.get(subkey, construct) : object[subkey];
    }  
    if (typeof result == 'undefined' && construct && !object._skip[subkey]) result = object._construct(subkey)
    if (typeof result != 'undefined') {
      if (dot != -1) object = result;
      else return result;
    } else break;
  }
};
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
LSD.Object.prototype.mix = function(key, value, memo, state, merge, prepend, lazy, index) {
  if (state !== false) state = true;
  if (!memo && this._delegate) memo = this;
  if (typeof key != 'string') {
    if (merge && typeof key._unwatch == 'function') {
      if (state) {
        key._watch({
          fn: this._merger,
          bind: this,
          callback: this,
          prepend: prepend
        })
      } else key._unwatch(this);
    }
    var unstorable = memo && memo._unstorable;
    var skip = key._skip, method = state ? 'set' : 'unset'; 
    for (var prop in key) 
      if (key.hasOwnProperty(prop) && (unstorable == null || !unstorable[prop]) && (skip == null || !skip[prop])) {
        var val = key[prop];
        if (val == null || val._shared !== true) this.mix(prop, key[prop], memo, state, merge, prepend, lazy);
        else this[method](prop, key[prop], memo, prepend)
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
      if (state) {
        group.push([subkey, value, memo, state, merge, prepend, lazy]);
      } else {  
        for (var i = 0, j = group.length; i < j; i++) {
          if (group[i][1] === value) {
            group.splice(i, 1);
            break;
          }
        }
      }
      var obj = this[name];
      if (obj == null) {
        if (state && !this._skip[name] && !lazy)
          obj = this._construct(name, null, memo);
      } else if (obj.push && obj._object !== true) {
        for (var i = 0, j = obj.length; i < j; i++)
          obj[i].mix(subkey, value, memo, state, merge, prepend, lazy)
      } else {
        var parent = this._children !== false && obj._parent !== false && obj._parent;
        if (state && parent && parent !== this) {
          this[name] = null;
          obj = this._construct(name, null, memo)
        } else if (typeof obj.mix == 'function' && obj._shared !== true) {
          obj.mix(subkey, value, memo, state, merge, prepend, lazy);
        } else {
          for (var previous, k, object = obj; (subindex = subkey.indexOf('.', previous)) > -1;) {
            k = subkey.substring(previous || 0, subindex)
            if (previous > -1 && typeof object.mix == 'function') {
              object.mix(subkey.substring(subindex), value, memo, state, merge, prepend, lazy)
            } else if (object[k] != null) object = object[k];
            previous = subindex + 1;
          }
          k = subkey.substring(previous);
          if (typeof object.mix == 'function')
            object[state ? 'set' : 'unset'](k, value, memo, prepend)
          else object[k] = value;
        }
      }
    } else if (value != null && (typeof value == 'object' && !value.exec && !value.push && !value.nodeType && value.script !== true)
                             && (!value.mix || merge)) {
      if (this.onStore && typeof this.onStore(key, value, memo, state, prepend) == 'undefined') return;
      var storage = (this._stored || (this._stored = {}));
      var group = storage[key];
      if (!group) group = storage[key] = [];
      if (state) {
        group.push([value, null, memo, state, merge, prepend, lazy, index]);
      } else {
        for (var i = 0, j = group.length; i < j; i++) {
          if (group[i][0] === value) {
            group.splice(i, 1);
            break;
          }
        }
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
          obj = this._construct(key, null, memo);
/*
  Objects also support mixing values into arrays. They mix values
  into each value of the array. 
  
      // will set tabindex attribute to each of childNodes
      object.mix('childNodes.attributes.tabindex', -1);
*/
      } else if (obj.push && obj._object !== true) {
        for (var i = 0, j = obj.length; i < j; i++)
          if (!memo || !memo._delegate || !memo._delegate(obj[i], key, value, state))
            obj[i].mix(value, null, memo, state, merge, prepend, lazy);
      } else if (obj.mix) {
        obj.mix(value, null, memo, state, merge, prepend, lazy);
      } else {
        for (var prop in value)
          if (state) obj[prop] = value[prop];
          else if (value[prop] === obj[prop]) delete value[prop];
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
};
/*
  Unlike most of the hash table and object implementations out there, LSD.Object can 
  easily unmix values from the object. The full potential of unmixing objects can be
  explored with LSD.Stack, that allows objects to be mixed on top or 
  to the bottom of the stack (some kind of reverse merge known in ruby).
  
  Plain LSD.Object is pretty naive about unmixing properties, it just tries to
  unset the ones that match the given values. LSD.Stack on the other 
  hand, is pretty strict and never loses a value that was set before, and can 
  easily reset to other values that were set before by the same key.
  
  Different kind of objects often used nested together, so `mix` being a recursive
  function often helps to pass the commands through a number of objects of different 
  kinds.
  
  `unmix` method has the same argument signature as `mix` function, although
  it overrides fourth given argument with `false` when calling `mix`.
  It comes in handy when using stored arguments that may be processed with either state
  without destructuring or accessing each of function's 8 arguments by index.
*/
LSD.Object.prototype.unmix = function(key, value, memo, state, merge, prepend, lazy, index) {
  return this.mix(key, value, memo, false, merge, prepend, lazy, index);
};
/*
  Merge method is an alias to mix with some arguments predefined. It does the same as
  simple mix, but it also tries to subscribe current object to changes in the object
  that is being mixed in, if it's observable. Changes then propagate back to current 
  object. `prepend` argument defines if the object should be merged to the bottom 
  or on top.
*/
LSD.Object.prototype.merge = function(value, prepend, memo) {
  return this.mix(value, null, memo, true, true, prepend)
};
/*
  Unmerge method unmixes the object and unsubscribes current object from changes
  in the given object.
*/
LSD.Object.prototype.unmerge = function(value, prepend, memo) {
  return this.mix(value, null, memo, false, true, prepend)
};
/*
  LSD Objects support two ways of observing values:
*/
LSD.Object.prototype.watch = function(key, callback, lazy, memo) {
  var string = typeof key == 'string';
/*
  A single argument without a pair is treated like a **Global observer** that 
  recieve changes to all properties in an object. It supports different
  kind of callbacks:
  
  * function - a de-facto standart for callbacks, the most flexible one, 
    for high-order data flows.
  * Bound object, a simple object with `bind` object and `method` 
    property or a `fn` function. Objects are often used internally, and they
    are made to link to an external function to avoid creating a needless 
    closure that a functional callback implies.
  * Another observable object - the most efficient way, since it stores 
    only a reference to another object. It results in "linking" objects 
    together, so changes in observed object will be propagated to argument
        
*/
  if (!string && typeof callback == 'undefined') {
    var watchers = this._watchers;
    if (!watchers) watchers = this._watchers = [];
    if (callback) watchers.unshift(key)
    else watchers.push(key);
/*
  A pair of key and callback allow observing of an **individual property**. 
  Unlike global observers, that only listens for public properties, it is 
  possible to listen for a private property like `_parent` that links to 
  another object that holds the reference to this object. Some objects
  opt out of writing or claiming `_parent` reference, but it is there 
  by default and used for observing external related objects.
*/
  } else {
/*
  A key is often a string, the name of a property to observe, but it 
  is possible to have a custom hashing function in an object, and 
  then unknown object keys may be hashed down to a functional
  callback to call, or a stringy key to be used instead. 
*/
    if (!string) {
      var hash = this._hash(key, callback);
      if (typeof hash == 'string') key = hash
      else if (hash == null) return;
      else if (typeof hash.push == 'function') return hash.push(callback)
      else return hash.watch(key, callback);
    }
/*
  The upside of having a consistent observable environment is that 
  it is possible to seemlessly stack observations together. A complex 
  key with dot delimeters may be given to a `watch` function and it 
  will start observing separate keys. If an object changes somewhere 
  along the path, overriden object gets cleaned from observations,
  and the new object gets observed. It works with keys of any deepness, 
  and lazy execution ensures that there isn't too much junk around.
*/
    var index = key.indexOf('.');
    if (index > -1) {
      this.watch(key.substr(0, index) || '_parent', {
        fn: this._watcher,
        index: index,
        key: key,
        callback: callback,
        memo: memo,
        lazy: lazy
      }, lazy)
    } else {
/*
  Observing is about passing around the callback and executing it at the right 
  time. LSD does not care about type of callback while observing if it isn't
  the right time to call it. All endpoints that might call outsider's callbacks 
  in LSD.Object execute `_callback` method that figures out how to dispatch the 
  given callback. It adds to consistensy and API richness across all observable 
  structures. Another detail that makes it more practical is the fact that 
  each time a callback is called with a new value, it also sends the old value 
  that was possibly overriten. There may not be a reference to the old value in 
  the object anymore, but it still exists in a call chain of synchronous 
  callbacks arguments. `_callback` method also solves a problem of pairs of 
  object and property that triggered callbacks. The callback record and a 
  reference to a previous value is passed to all callbacks, but not stored 
  or referenced in objects.
  
  Another use case for referencing the previous values is that it allows to 
  aggregate data from different sources with overlapping keys. The bad way to
  avoid callbacks be fired multiple times is to surpress execution of 
  callbacks it is known that all values are in place and it's safe to 
  do things. That approach is used in many frameworks based on event loops, 
  but it gives too much control to developer and results in confusion and bugs.
  It also makes a developer write glue code, and require him to decide **when** 
  it's time to do a batch of changes but in asynchronous code you never know. 
  The better approach is to buffer up values in a dedicated object 
  (e.g. many CSS rules may define a font size of a specific element. 
  But in the end only one declaration is used. An object may hold references
  to all the values, but decide which to use). When such dedicated object 
  is observed, it fires callbacks when the keys change and it always send 
  reference to previous value allowing a developer to choose the optimal way
  of transitioning from one value to another in his callback. Will be it 
  be full redraw of a block, notification of child nodes, or a successful
  cache lookup. It enables "black box" abstractions where objects simply 
  export some properties, but the behavior that makes one properties
  result in changing other is completely hidden from an uninterested 
  spectator. Everything to make state separate from the code.
*/
      var value = this.get(key, lazy === false);
      var watched = (this._watched || (this._watched = {}));
      (watched[key] || (watched[key] = [])).push(callback);
      if (memo !== 'skip' && typeof value != 'undefined') {
        if (callback.call) callback(value, undefined, memo);
        else this._callback(callback, key, value, undefined, memo, lazy);
      }
    }
  }
};
LSD.Object.prototype.unwatch = function(key, callback, memo, lazy) {
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
          if (typeof fn == 'function') fn(undefined, value, memo);
          else this._callback(fn, key, undefined, value, memo, lazy);
        }
        break;
      }
    }
  }
};
LSD.Object.prototype.has = function(key) {
  return this.hasOwnProperty(key) && !this._skip[key];
};
LSD.Object.prototype._construct = function(name, constructor, memo, value) {
  var constructors = this._constructors;
  if (!constructor) constructor =  ((constructors && constructors[name])
                                || (this._getConstructor && this._getConstructor(name)) 
                                || (value && value.constructor) || this.constructor);
  if (constructors && !constructors[name]) constructors[name] = constructor;
  if (constructor !== Object && !constructor.prototype._construct) return null;
  var instance = new constructor;
  if (this._delegate && !memo) memo = this;
  this.set(name, instance, memo);
  return instance;
};
LSD.Object.prototype._watcher = function(call, key, value, old, memo) {
  var object = value == null ? old : value, key = call.key;
  if (typeof object._watch == 'function') {
    object[value ? '_watch' : '_unwatch'](key.substring(call.index + 1), call.callback, call.lazy);
  } else if (value != null) {
    for (var dot, start; dot != -1;) {
      start = (dot || call.index) + 1;
      dot = key.indexOf('.', start)
      var subkey = call.key.substring(start, dot == -1 ? key.length : dot);
      var result = object.get ? object.get(subkey, lazy === false) : object[subkey];
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
};
LSD.Object.prototype._merger = function(call, name, value, state, old) {
  if (state)
    this.mix(name, value, call, true, true, call.prepend);
  if (this._stack && (!state || old != null))
    this.mix(name, state ? old : value, call, false, true, call.prepend);
};
LSD.Object.prototype._callback = function(callback, key, value, old, memo, lazy) {
  if (callback.substr) 
    var subject = this, property = callback;
  else if (typeof callback.fn == 'function')
    return (callback.fn || (callback.bind || this)[callback.method]).apply(callback.bind || this, arguments);
  else if (callback.watch && callback.set) 
    var subject = callback, property = key;
  else if (callback.push) 
    var subject = callback[0], property = callback[1];
  if (property === true || property == false) 
    property = key;
  // check for circular calls
  // 25.03 - try keeping memo if given without forcing call stack - YF
  if (memo == null) memo = [[this, key]];
  else if (memo.push) {
    for (var i = 0, a; a = memo[i++];)
      if (a[0] == this && a[1] == property) return;
    memo.push([this, key]);
  }
  var vdef = typeof value != 'undefined';
  var odef = typeof old != 'undefined';
  var index = property.indexOf('.');
  if ((vdef || !odef) && (value !== callback[2])) {
    if (index == -1) subject.set(property, value, memo);
    else subject.mix(property, value, memo, true, true, null, lazy, index);
  }
  if (!vdef || (odef && subject._stack)) {
    if (index == -1) subject.unset(property, old, memo);
    else subject.mix(property, old, memo, false, true, null, lazy, index);
  }
};
/*
  A function that recursively cleans LSD.Objects and returns
  plain object copy of the values
*/
LSD.Object.prototype.toObject = function(normalize, serializer) {
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
};
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
LSD.Object.prototype._skip = {
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
};

LSD.toObject = LSD.Object.toObject = LSD.Object.prototype.toObject;
['get', 'set', 'unset', 'mix', 'watch', 'unwatch'].each(function(method) {
  LSD.Object.prototype['_' + method] = LSD.Object.prototype[method];
});
LSD.Object.prototype.change = LSD.Object.prototype.set;
