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
/*
  Objects in LSD are different from regular objects in the way that LSD objects
  dont use or define getters at all. Values are precomputed and the good time
  to format or transform values is just before it was set. Object work with
  property observers and global listeners. Observing a property replaces some
  simple uses of Aspect Oriented Programming, an event system, and a pub/sub.
  It is possible because of the fact that all Object methods accept optional
  third parameter called `meta` that may describe what kind of operation led
  to the state change. It is easy to make dependent properties to
  know where the change come from, or what kind of change it is and react
  accordingly - e.g. avoid multiple or circular updates If a `meta` argument is
  not given, LSD automatically records cascade of changed properties and
  prevent circular property callbacks.
*/
LSD.Object.prototype.constructor = LSD.Object;
LSD.Object.prototype.set = function(key, value, old, meta, prepend, index, hash) {
/*
  Values may be set by keys with types other then string. There's special 
  method named `_hash` that is called when such key is passed to Object 
  methods. Hashing strategy is chosen based on return value:
    * A string is used as a new key
    * `true` aborts setter, no callbacks are invoked
    * Other values turns object immutable, but still invoke callbacks 
      and pass the result of hashing. Object does not change its state.
      So callbacks or superclasses may implement custom storage logic. 
*/
  if (hash === undefined && this._hash) {
    var hash = this._hash(key, value, old, meta, prepend, index);
    switch (typeof hash) {
      case 'boolean':
        return hash;
      case 'string':
        key = hash;
        hash = undefined;
    }
  }
  var skip = this._skip, stringy = typeof key == 'string';
/*
  Object setters accept composite keys. LSD.Object constructs objects in the 
  path (e.g. setting `post.title` will create a `post` object), and observes
  the whole path (post object may be changed and title property will be unset
  from the previous object and set to the new object)
*/
  if (stringy && hash === undefined) {
    if (typeof index != 'number')
      index = key.indexOf('.');
    var nonenum = skip[key];
  }
  if (index > -1) 
    return this.mix(key, value, old, meta, null, null, null, index);
/*
  Objects accept special kind of values, compiled LSD.Script expressions.
  They may use other keys in the object as observable variables, call
  functions, fetch and iterate data. Script updates value for the key when it
  computes its value asynchronously. The value stays undefined, while the
  script doesn't have enough data to compute.
*/
  var literal = this._literal;
  if (nonenum !== true && !(literal && literal[key])) {
    var trigger = this._trigger;
    if (!!(value != null && value[trigger] != null && !value._ignore && this._script(key, value, meta))
        + (old != null && old[trigger] != null && !old._ignore && this._unscript(key, old, meta))) 
      return false;
  }
  var deleting = value === undefined
  if (hash == null) {
    if (old === undefined)
      old = this[key];  
    if (value === this[key]) 
      return false;
    if (deleting) 
      delete this[key];
    else this[key] = value;
  }
/*
  When objects link to other objects they write a link back to remote object.
  A linked object can access object that linked it with a private observable
  `_owner` property. Both linkee and linker objects may decide to avoid
  writing a link (e.g. Arrays dont write a link to its object values, and DOM
  elements dont let any objects write a link either).
*/
  if (nonenum !== true) {
    if (value != null && value._set && !value._owner && this._owning !== false)
      if (meta !== 'reference') {
        if (value._ownable !== false) {
          value._reference = key;
          value._set('_owner', this);
        }
      } else value._references = (value._references || 0) + 1;
    if (old != null && old._owner === this)
      if (meta !== 'reference') {
        old._unset('_owner', this);
        delete old._reference;
      } else old._references --;
  }
  
/*
  Most of the keys that start with `_` underscore do not trigger calls to
  global object listeners. But they can be watched individually. A list of
  the skipped properties is defined in `_skip` object in the end of a file. 
  Builtin listeners may reject or transform value.
*/
  var changed;
  if (this._onChange && (changed = this._onChange(key, value, old, meta, hash)) !== undefined)
    if (changed === skip) {
      if (hash == null) this[key] = old;
      return;
    } else value = changed;
  if (index !== -1 || nonenum !== true)
    if (this.onChange && (changed = this.onChange(key, value, old, meta, hash)) !== undefined)
      if (changed === skip) {
        if (hash == null) this[key] = old;
        return;
      } else value = changed;
  if (this._finalize) this._finalize(key, value, old, meta, prepend, hash)
/*
  Global object listeners (and so custom property handlers in structs) 
  may compile given value into expression (e.g. a textnode may find
  interpolations in a given `textContent`).
*/
  if (trigger && value != null && value[trigger] != null && !value._ignore) {
    if (hash == null) this[key] = old;
    return this._script(key, value, meta);
  }
/*
  Watchers are listeners that observe every property in an object. It may be
  a function (called on change) or another object (property change in
  original object will change in the watcher object)
*/
  var watchers = this._watchers;
  if (watchers && nonenum !== true) for (var i = 0, j = watchers.length, watcher, fn; i < j; i++) {
    if ((watcher = watchers[i]) == null) continue;
    if (typeof watcher == 'function') watcher.call(this, key, value, old, meta, hash);
    else this._callback(watcher, key, value, old, meta, hash);
  }
/*
  An alternative to listening for all properties, is to watch a specific
  property. Callback observers recieve key, new and old value on each property
  change
  
*/  
  if (stringy && !(index > -1)) {
    if (!deleting && hash == null && this[key] !== value) this[key] = value;
    var watched = this._watched;
    if (watched && (watched = watched[key]))
      for (var i = 0, fn; fn = watched[i++];)
        if (fn.call) fn.call(this, value, old, meta);
        else this._callback(fn, key, value, old, meta, hash);
/*
  When an LSD.Object is mixed with a nested object, it builds missing objects
  to apply nested values. But it also observes those object for changes, so
  if it changes it could re-apply the specific sub-tree of original nested
  object. Observing happens passively by storing links to sub-trees for each
  property that has nested object. When an object changes, it looks if it has
  any values stored for it to apply.
*/
    var stored = this._stored, mem, obj, same;
    if (stored && (stored = stored[key])) for (var i = 0, args; args = stored[i++];) {
      obj = args[0], mem = args[3];
      if (obj === value) continue;
      if (value != null && (!mem || !mem._delegate || !mem._delegate(value, key, obj)))
        if (value.mix) value.mix.apply(value, args);
        else if (typeof value == 'object' && args[1] == null) 
          for (var p in obj) value[p] = obj[p];
        else value[args[0]] = args[1];
      if (old != null && typeof old == 'object' && meta !== 'copy' && obj !== old 
      && (!mem || !mem._delegate || !mem._delegate(old, key, undefined, obj, meta)))
        if (old.unmix) old.unmix.apply(old, args);
    }
  }
  return true;
};

/*
  Unset method cleans object key resetting its value to undefined.
  
   Unsetting is an important concept, that bears close resemblance to `delete`
  keyword in javascript. Using unset directly or indirectly throughout the
  code enables clean objects with predictable reusability patterns. Removing
  values and cleaning up side effects with `unset` and `unmix` methods goes a
  long way of programs without race conditions, that can be seemlessly
  assembled and disassembled at run time.
  
   LSD.Object#unset uses `delete` keyword to remove value from the object.
  It usually makes the key `undefined` in an object, if an object prototype
  does not have such key. If an object prototype has a value with the same
  key, the object will still reference that value after `delete` is called.
  LSD.Journal setters have similar behavior, it is possible to overwrite
  any value, but `unset`ting may revert the value to the one that was set
  previously. Repeated calls to `unset` will remove all values from the 
  journal and the key will finally may become undefined.
  
   `unset` method does all things that `set` does in the same order: hashes its
  key, deals with ownership reference, transforms values, notifies 
  observers, fires callbacks and processes stored arguments
*/
LSD.Object.prototype.unset = function(key, value, meta, old, index, hash) {
  return this.set(key, old, value, meta, index, hash);
};
LSD.Object.prototype._unset = function(key, value, meta, old, index, hash) {
  return this._set(key, old, value, meta, index, hash);
};
/*
  Get method fetches a value by a simple or composite keys. If an
  optional construct argument is given, it creates objects in place of
  missing properties.
  
   Despite the fact that older implementations of JavaScript do not allow
  native getter functions, `get` method in LSD is private and should not be
  used in places other than internals. The reason is that values in LSD are
  precomputed, and can be accessed like regular properties. There's no such
  thing as a getter method for a property in LSD.Object. If a property needs 
  to be set in a right format, it gets transformed, constructed or parsed 
  on set before it is assigned to the object.
  
   That also means that composite properties can not be described by a
  simple function that can be only executed when the property was requested.
  Properties that depend on more than one value may be implemented in two
  ways:
  
   * with LSD.Script expression in `imports` object that lazily creates
     individual observer objects for each variable used in parsed expression
   * or by listening to all properties and reacting to all involved
     properties and running a shared routine that tries to compose property
     from values it is observing.
  
  LSD.Script is fully magical, updates are lazy, happen in the right time and
  computed properties are always up to date. It's efficient in re-computation
  of expression, because it saves intermediate results for every branch of an
  expression syntax tree. So when values in expression change, it only
  recomputes affected parts of an expression. Still, LSD.Script has its own
  recursive evaluation model that has a large overhead and may be inappropriate
  in scenarios with many objects.

   LSD internals follow the second way of composing properties manually. It's
  the most memory efficient and LSD provides a few tools that may help in
  writing repetetive callbacks. Doing it manually may be very peformant, but
  needs tests that handle all possible situations.

   Another reason why the `get` method is so underused, is because LSD deals
  with observable objects and `get` function returns the value that object has
  at the time of getter invocation. If the value is changed, there's no way to
  know it for a variable that holds reference to a previous value. That is why
  `watch(key, callback) ` should be used instead, because it hides all the
  complexity of mutable state of objects without all the glue code
*/
LSD.Object.prototype.get = function(key, construct) {
  if (typeof key != 'string') {
    var hash = this._hash(key);
    if (typeof hash != 'string') return hash
    else key = hash;
  }
  for (var dot, start, result, object = this; dot != -1;) {
    start = (dot == null ? -1 : dot) + 1;
    dot = key.indexOf('.', start)
    var subkey = (dot == -1 && !start) ? key : key.substring(start, dot == -1 ? key.length : dot);
    if (!subkey) subkey = '_owner';
    if (object === this) {
      result = this[subkey];
    } else {
      if (construct == null) construct = this._eager || false;
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
  Mixing is a higher level abstraction above simply setting properties. `mix`
  method accepts both pairs of keys and values and whole objects to set and
  unset properties.

   Mixed values are stored twice in the object. Once, as the keys and values
  processed by setters, and another time is when original arguments are
  stored to be used later. For example, when an pair like
  `attributes.tabindex`: `1` is mixed into the object, the arguments are
  stored and then `tabindex` property is applied to `attributes` object. When
  `attributes` object changes, arguments are used to clean up the old object,
  and assign properties to the new object. Similar thing happens when deep
  nested objects are merged, it stores values on each level of the original
  object and can re-apply it to related struct objects when they change.

   When an observable object is mixed, it can be opted-in for "live" merging,
  when updates to the merged object will propagate into the object it was
  merged into. By default, all new and updated values are appended on top,
  overwriting values that were set previously. When `prepend` argument is
  given, reverse merging will be used instead, applying values to the bottom
  of the stack. That will make merged object never overwrite the values that
  were there before. Those will only be used when the values that shadows the
  merged values will be unset.
*/
LSD.Object.prototype.mix = function(key, value, old, meta, merge, prepend, lazy, index) {
  if (!meta && this._delegate) meta = this;
  var vdef = value !== undefined, odef = old !== undefined;
/*
    // mix an object
    this.mix(object)
    // mix object, unmix old object
    this.mix(object, undefined, old) 
  
    // unmix method is an alias to mix that passes value as old value
    this.unmix(object);
    // is the same as:
    this.mix(undefined, undefined, object)
  
    // mix & observe objects
    this.mix(object, undefined, old, meta, true) 
    // reverse merge, does not overwrite present keys
    this.mix(object, undefined, old, meta, true, true) 
*/
  if (typeof key != 'string') {
    var unstorable = meta && meta._delegateble, val;
    if (key) {
      if (key._watch) key._watch({
        fn: this._merger,
        bind: this,
        callback: this,
        prepend: prepend
      });
      var skip = key._skip;
      for (var prop in key)
        if (key.hasOwnProperty(prop) && (unstorable == null || !unstorable[prop]) && (skip == null || !skip[prop]))
          if ((val = key[prop]) != null && val._ownable === false) this.set(prop, val, undefined, meta, prepend);
          else this.mix(prop, val, undefined, meta, merge, prepend, lazy);
    };
    if (odef && old != null && typeof old == 'object') {
      if (old._unwatch) old._unwatch(this);
      var skip = old._skip;
      for (var prop in old)
        if (old.hasOwnProperty(prop) && (unstorable == null || !unstorable[prop]) && (skip == null || !skip[prop]))
          if ((val = old[prop]) != null && val._ownable === false) this.set(prop, undefined, val, meta, prepend);
          else this.mix(prop, undefined, val, meta, merge, prepend, lazy);
    }
    return this;
  }
/*
  A string in the key may contain dots `.` that denote nested objects. The
  values are passed through to the related objects, but they are also stored
  in original object, so whenever related object reference is changed, the
  stored values are removed from old objects and applied to the new related
  object.
  
    // create & observe object, set value by key
    this.mix('object.key', true)
    // when objects in path change, a value migrates to the new object
    this.set('object', new LSD.Object)      // this.object.key == true
*/
  if (index == null) index = key.indexOf('.', -1);
  if (index > -1) {
    var name = key.substr(key.lastIndexOf('.', index - 1) + 1, index) || '_owner';
    var subkey = key.substring(index + 1);
    var store = this.onStore && (this.onStore.call ? 'onStore' : '_onStore');
    if (store && this[store] && this[store](name, value, old, meta, prepend, subkey) === false) return;
    var storage = (this._stored || (this._stored = {})), group = storage[name];
    if (!group) group = storage[name] = [];
    if (vdef) group.push([subkey, value, undefined, meta, merge, prepend, lazy]);
    if (odef) for (var i = 0, j = group.length; i < j; i++)
      if (group[i][1] === old) {
        group.splice(i, 1);
        break;
      }
    var obj = this[name];
    if (obj == null) {
      if (vdef && !this._skip[name] && !lazy)
        obj = this._construct(name, null, meta);
      if (obj == null && this.onConstructRefused)
        this.onConstructRefused(key, value, meta, old, merge, prepend, lazy)
    } else if (obj.push && obj._object !== true) {
      var subindex = subkey.indexOf('.');
      var prop = (subindex > -1) ? subkey.substring(0, subindex) : subkey;
      if (parseInt(prop) == prop)
        obj.mix(subkey, value, old, meta, merge, prepend, lazy)
      else for (var i = 0, j = obj.length; i < j; i++)
        obj[i].mix(subkey, value, old, meta, merge, prepend, lazy);
    } else if (obj.apply) {
      if (vdef) this[name](subkey, value);
      if (odef) {
        var negated = LSD.negated[name] || (LSD.negated[name] = LSD.negate(name));
        this.unset(subkey, old)
      }
    } else {
/*
  When objects are merged together, nested objects are opted in for a
  copy-on-write merging, that speeds up merging by directly referencing
  objects that are not changed in the process merging.
  
   A controlled side effect e.g. `mix('object.key', true)` will safely
  modify an `object` if it was referenced in a copy-on-write merge by
  creating a new object that is subscribed to all values and changes of a
  referenced object.
*/
      if (vdef && old !== obj && this._owning !== false && obj._shared !== true
      && (obj._owner ? obj._owner !== this : obj._references > 0)) {
        obj = this._construct(name, null, 'copy')
      } else if (typeof obj.mix == 'function' && obj._ownable !== false) {
        obj.mix(subkey, value, old, meta, merge, prepend, lazy);
      } else {
/*
  A composite key given to a `mix` method affects an outside object be it
  observable or not. `mix('element.parentNode.id', 123)` will walk through
  references and set the id of a real DOM element. It will observe `element`
  reference for changes, but not `parentNode`, since DOM elements dont
  support observable API, unlike LSD.Elements. Although when `element`
  changes, the id will be removed from a `parentNode` of an old element if
  there were no unobserved changes to `parentNode` reference.
*/
        for (var previous, k, object = obj; (subindex = subkey.indexOf('.', previous)) > -1;) {
          k = subkey.substring(previous || 0, subindex)
          if (previous > -1 && typeof object.mix == 'function') {
            object.mix(subkey.substring(subindex), value, old, meta, merge, prepend, lazy);
            break;
          } else if (object[k] != null) object = object[k];
          previous = subindex + 1;
        }
        k = subkey.substring(previous);
        if (typeof object.mix == 'function')
          object.mix(k, value, old, meta, merge, prepend, lazy)
        else object[k] = value;
      }
    }
/*
    // set a value by key
    this.mix('key', 'value')
    // mix in object by the key (copy)
    this.mix('key', object) 
    // mix & unmix objects by the key
    this.mix('key', object, old, meta)
  
    // merge observable object by the key with copy-on-write reference
    this.mix('key', object, old, meta, true)  // this.key === object
    // direct mutation changes referenced object
    this.key.mix('sing', true)                // this.key === object
    // controlled mutation creates an observed copy of ref'd object
    this.mix('key.dance', true)               // this.key !== object
*/
  } else if ((!vdef && old != null && typeof old == 'object' && !old[this._trigger] && !old._ignore) 
         || (value != null && typeof value == 'object' && !value.exec && !value.push 
         && !value.nodeType && value[this._trigger] == null && (!value.mix || merge))) {
    var store = this.onStore && (this.onStore.call ? 'onStore' : '_onStore');
    if (store && this[store] && this[store](key, value, meta, old, prepend) === false) return;
    var storage = (this._stored || (this._stored = {}));
    var group = storage[key];
    if (!group) group = storage[key] = [];
    if (vdef) group.push([value, null, undefined, meta, merge, prepend, lazy, index]);
    if (odef) for (var i = 0, j = group.length; i < j; i++)
      if (group[i][0] === old) {
        group.splice(i, 1);
        break;
      }
/*
  When a deep object is mixed into an object, it construct objects on its
  path to set the values. The base class for those objects is determined
  dynamically, if `getConstructor` method is defined, or resorts to
  `this.constructor` which creates the same kind of object. When an object
  is mixed with merge mode turned on, and there was no object by the same
  key already, mix will attempt to reference a merged object marking it for
  a copy-on-write. It means that merged object will be the same object as
  was given in arguments, but there will be a copy made on any attempt to
  modify the object (e.g. by merging another object by the same key).
*/
    var obj = this[key];
    if (obj == null) {
      if (vdef && !this._skip[key])
        obj = (merge && value && value.mix && this.set(key, value, undefined, 'reference') && value)
             || this._construct(key, null, meta);
/*
  Objects also support mixing values into arrays. They mix values
  into each value of the array.
  
    // set disabled property to every object in childNodes array
    this.mix('childNodes.disabled', true)
*/
    } else if (obj.push && obj._object !== true) {
      for (var i = 0, j = obj.length; i < j; i++)
        if (!meta || !meta._delegate || !meta._delegate(obj[i], key, value, old, meta))
          obj[i].mix(value, null, old, meta, merge, prepend, lazy);
    } else if (obj.mix) {
/*
  When object is merged into another object by some key, it will be first
  referenced directly avoiding a full blown copy of an object. If an outside
  object will attempt a controlled mutation of a referenced object, the copy
  will be created to replace a reference. The copy will hold both values of
  a referenced object and a side effect from the mutation.
*/
      if (meta === 'copy') {
        this.set(key, value, old, meta, prepend)
      } else if (vdef && obj !== old && (obj._owner ? obj._owner !== this : obj._references > 0) 
             && this._owning !== false && (!meta || !meta._delegate) && obj._shared !== true) {
        obj = this._construct(key, null, 'copy')
      } else {
/*
  `mix` accepts two values and both of them are optional. First value is to be
  set, the second value (fourth argument) is to be unset. Both of them may be
  given in the same function call. Regular LSD.Objects are not affected by two
  values together, but objects that journal all side effects like LSD.Journal
  will use the old value to unset from the stack after the new value will be
  applied. It is a very useful technique that allows to keep state of a
  side-effect within a single function call of an observer callback. Callbacks
  that observe properties are fired with two values, the new and the old one.
  And if a callback needs to affect another property or an object, `mix` method
  can be used and given both new and old values. Two arguments cover all
  possible value manipulations and `mix` will manage side effects introduced by
  callbacks and ensure that they will be unrolled in right condition.
*/
        if (obj === old) {
          this.set(key, value, old, meta, prepend)
        } else obj.mix(value, null, old, meta, merge, prepend)
      }
    } else {
      if (vdef) for (var prop in value) 
        obj[prop] = value[prop];
      if (odef) for (var prop in old) 
        if (old[prop] === obj[prop] && (!vdef || old[prop] !== value[prop])) 
          delete old[prop];
    }
  } else {
    this.set(key, value, old, meta, prepend);
  }
  return this;
};
/*
  Unlike most of the hash table and object implementations out there,
  LSD.Object can easily unmix values from the object. The full potential of
  unmixing objects can be explored with LSD.Journal, that allows objects to be
  mixed on top or to the bottom of the stack (some kind of reverse merge known
  in ruby).

   Plain LSD.Object is pretty naive about unmixing properties, it just tries to
  unset the ones that match the given values. LSD.Journal on the other hand, is
  pretty strict and never loses a value that was set before, and can easily
  reset to other values that were set before by the same key.

   Different kind of objects often used nested together, so `mix` being a
  recursive function often helps to pass the commands through a number of
  objects of different kinds.

   `unmix` method has the same argument signature as `mix` function, although
  it ignores `old` argument and uses `value` instead when calling `mix`. It
  comes in handy when using stored arguments that may be processed with either
  state without destructuring or accessing each of function's 8 arguments by
  index.
*/
LSD.Object.prototype.unmix = function(key, value, old, meta, merge, prepend, lazy, index) {
  if (typeof key == 'string')
    return this.mix(key, undefined, value, meta, merge, prepend, lazy, index);
  else
    return this.mix(undefined, undefined, key, meta, merge, prepend, lazy, index)
};
/*
  Merge method is an alias to mix with some arguments predefined. It does
  the same as simple mix, but it also tries to subscribe current object to
  changes in the object that is being mixed in, if it's observable. Changes
  then propagate back to current object. `prepend` argument defines if the
  object should be merged to the bottom or on top.
*/
LSD.Object.prototype.merge = function(value, prepend, meta, old) {
  return this.mix(value, undefined, old, meta, true, prepend)
};
/*
  Unmerge method unmixes the object and unsubscribes current object from
  changes in the given object.
*/
LSD.Object.prototype.unmerge = function(value, prepend, meta) {
  return this.mix(undefined, undefined, value, meta, true, prepend)
};
/*
  Observing is all about passing around the callback and executing it at the
  right time. What makes observing objects practical is the fact that callbacks
  are called with a new value, the previous value that was overriten and
  optional data argument describing the mutation. There may not be a reference
  to the old value in the object anymore, but it still exists in a call chain
  of synchronous callbacks arguments. `_callback` method also solves a problem
  of circular callbacks that may possibly hang execution. The callback record
  and a reference to a previous value is passed to all callbacks, but not
  stored or referenced in objects.

   Another use case for referencing the previous values is that it allows to
  aggregate data from different sources with overlapping keys. The bad way to
  avoid callbacks be fired multiple times is to surpress execution of callbacks
  until it is known that all properties have right value it's safe to proceed.
  That approach is used in many frameworks that are based on event loops, but
  it gives too much control to developer and results in confusion and bugs. It
  also makes a developer write glue code, and require him to decide **when**
  it's time to do a batch of changes but in asynchronous code you may never
  know. The better approach is to buffer up values in a dedicated object (e.g.
  many CSS rules may define a font size of a specific element. But in the end
  only one declaration is used. An object may hold references to all the
  values, but decide which to use). When such dedicated object is observed, it
  fires callbacks when the keys change and it always send reference to previous
  value allowing a developer to choose the optimal way of transitioning from
  one value to another in his callback. Will be it be full redraw of a block,
  notification of child nodes, or a successful cache lookup. It enables "black
  box" abstractions where objects simply export some properties, but the
  behavior that makes one properties result in changing other is completely
  hidden from an uninterested spectator. Everything to separate state from
  logic.

   LSD Objects support two ways of observing values:
*/
LSD.Object.prototype.watch = function(key, callback, lazy, meta) {
/*
  * A single argument without a pair is treated like a **Global observer** that
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
  var string = typeof key == 'string';
  if (!string && typeof callback == 'undefined') {
    var watchers = this._watchers;
    if (!watchers) watchers = this._watchers = [];
    if (callback) watchers.unshift(key)
    else watchers.push(key);
/*
  * A pair of key and callback allow observing of an **individual property**.
  Unlike global observers, that only listens for public properties, it is
  possible to listen for a private property like `_owner` that links to
  another object that holds the reference to this object. Some objects opt
  out of writing or claiming `_owner` reference, but it is there by default
  and used for observing external related objects.
*/
  } else {
/*
  A key is often a string, the name of a property to observe, but it is
  possible to have a custom hashing logic for other types of keys via 
  `_hash` hook.
*/
    if (!string) {
      var hash = this._hash(key, callback);
      if (typeof hash == 'string') key = hash
      else if (hash == null) return;
      else if (typeof hash.push == 'function') return hash.push(callback)
      else return hash.watch(key, callback);
    }
/*
  The upside of having a consistent observable environment is that it is
  possible to seemlessly stack observations together. A complex key with dot
  delimeters may be given to a `watch` function and it will start observing
  separate keys. If an object changes somewhere along the path, overriden
  object gets cleaned from observations, and the new object become observed.
  It works with keys of any deepness, and lazy execution ensures that there
  isn't too much junk around.
*/
    var index = key.indexOf('.');
    if (index > -1) {
      this.watch(key.substr(0, index) || '_owner', {
        fn: this._watcher,
        index: index,
        key: key,
        callback: callback,
        meta: meta,
        lazy: lazy
      }, lazy)
    } else {
      if (lazy && typeof callback == 'string') {
        callback = {
          fn: this._watcher,
          key: callback,
          callback: callback,
          meta: meta,
          lazy: lazy
        }
      }
      var value = this.get(key, lazy === false);
      var watched = (this._watched || (this._watched = {}));
      (watched[key] || (watched[key] = [])).push(callback);
      if (typeof value != 'undefined') {
        if (callback.call) callback(value, undefined, meta);
        else this._callback(callback, key, value, undefined, meta, lazy);
      }
    }
  }
};
/*
  Unwatch is a mirror of a `watch` method that does the opposite,
  removes an observer and fires it if there was an actual observed
  value. Most of APIs that can add and remove callbacks suffer
  from the same plague - it needs a reference to exactly the same
  callback given to remover method to find it and remove it from
  a list. `unwatch` is a little more helpful, as it allows
  a callback to have an optional `callback` reference that may
  be used to match the callback. It may just as well be unique id,
  rather than a reference to an object, but an id has to be stored
  somewhere, and a reference is often already given.
*/
LSD.Object.prototype.unwatch = function(key, callback, lazy, meta) {
  var string = typeof key == 'string';
  if (!string && typeof callback == 'undefined') {
    var watchers = this._watchers;
    for (var i = 0, j = watchers.length, fn; i < j; i++) {
      var fn = watchers[i];
      if (fn === key || (fn != null && fn.callback == key))
        watchers.splice(i, 1);
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
      this.unwatch(key.substr(0, index) || '_owner', callback)
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
          if (typeof fn == 'function') fn(undefined, value, meta);
          else this._callback(fn, key, undefined, value, meta, lazy);
        }
        break;
      }
    }
  }
};
/*
  In some situations object needs to construct another object and assign it
  by a specific key. It may happen when another object with nested objects
  is merged in, so to make a deep copy of it, the original object needs to
  construct its own copies of all objects to hold nested values. Setting a
  nested key like `foo.bar` may also result in building a `foo` object to
  hold the `bar` key with given value.
  
   A private `_construct` method is a dynamic way to figure out the right
  constructor for an object to build. It tries to call a `_getConstructor`
  method first and use a returned value as a constructor. Then it tries to
  use a constructor of a given value, or falls back to use the same
  constructor as the object itself has.
  
   `onBeforeConstruct` hook may provide its own instantiation strategy.
  Object may have a `_constructors` object, possibly shared with other
  objects via prototype, that holds the cache of resolved constructors for
  each key. It may also be used as a dictionary of constructors without help
  of `_getConstructor` hook
*/
LSD.Object.prototype._construct = function(name, constructor, meta, value) {
  var constructors = this._constructors;
  if (constructors) var found = constructors[name] || false, instance;
  if (!(constructor = found) && this._getConstructor &&
      (constructor = this._getConstructor(name)) === false) return;
  if (!constructor) constructor = (value && value.constructor);
  if (!constructor)
    if (this.constructor.prototype._object === false) return;
    else constructor = this.constructor;
  if (found === false) constructors[name] = constructor;
  if (!this.onBeforeConstruct || typeof (instance = this.onBeforeConstruct(name, constructor)) == 'undefined') {
    instance = new constructor;
    this.set(name, instance, undefined, this._delegate && !meta ? this : meta);
  }
  return instance;
};
/*
  Observing a chain of properties in some frameworks result in
  callback-hell, when the functions are nested very deeply and it's
  impossible to decouple the program flow to something more reasonable. LSD
  instead provides a public interface to observe deeply properties and not
  bother about saving the state of execution somewhere. Instead of creating
  closures, for each observed property, lsd references a single function
  internally.
*/
LSD.Object.prototype._watcher = function(call, key, value, old, meta) {
  for (var i = 0, object; i < 2; i++) {
    if ((object = (i ? value : old)) == null) continue;
    for (var dot = null, start; dot != -1;) {
      start = (dot == null ? call.index == null ? -1 : call.index : dot) + 1;
      dot = call.key.indexOf('.', start)
      if (object && object._watch) {
        object[i ? '_watch' : '_unwatch'](call.key.substring(start), call.callback, call.lazy, call.meta || meta);
        break;
      } else {
        var subkey = call.key.substring(start, dot == -1 ? call.key.length : dot);
        if (typeof (object = object[subkey]) == 'undefined') break;
        if (dot == -1) 
          if (typeof call.callback == 'function') call.callback(object);
          else this._callback(call.callback, key, object, undefined, meta);
      }
    }
  }
};
LSD.Object.prototype._merger = function(call, name, value, old, meta) {
  this.mix(name, value, old, meta, true, call.prepend);
};
/*
  All LSD functions that accept callbacks support a various number of callback
  types by using a shared `_callback` method everywhere to figure out how to
  dispatch the given callback. It adds to consistensy and API richness across
  all observable structures. It also uses optional `meta` argument to record
  a trace of all properties affected by callbacks to avoid curcular calls
*/
LSD.Object.prototype._callback = function(callback, key, value, old, meta, lazy) {
  if (typeof callback == 'string')
    var subject = this, property = callback;
  else if (typeof callback.fn == 'function')
    return (callback.fn || (callback.bind || this)[callback.method]).apply(callback.bind || this, arguments);
  else if (callback._watch && callback.set)
    var subject = callback, property = key;
  else if (callback.push)
    var subject = callback[0], property = callback[1];
  if (property === true || property == false)
    property = key;
  // check for circular calls
  if (meta == null) meta = [[this, key]];
  else if (meta.push) {
    for (var i = 0, a; a = meta[i++];)
      if (a[0] == this && a[1] == property) return;
    meta.push([this, key]);
  }
  subject.mix(property, value, old, meta, true);
};
/*
  A function that recursively cleans LSD.Objects and returns plain object
  copy of the values. It is used on rare occasions where there needs to be a
  clean snapshot of an object expored to some foreign function (e.g. when
  passing observable data to some native JS API). It works, but it should
  not be used when it's possible.
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
        if (!(val == null || val.exec || typeof val != 'object'))
          val = LSD.toObject(val, normalize, serializer);
        if (!normalize || typeof val != 'undefined')
          object[key] = val;
      }
  }
  return object || obj;
};
LSD.toObject = LSD.Object.toObject = LSD.Object.prototype.toObject;
/*
  LSD.Object internals share the same name space of an object with its
  public properties. When an object is iterated it often does not expect
  internal keys be mixed with the data, so an iterator needs to skip keys.
  Most of the internals dont use this method internally, because they have
  it inlined, but it's the best way to tell private property from public. 
*/
LSD.Object.prototype.has = function(key) {
  return this.hasOwnProperty(key) && !this._skip[key];
};
/*
  A dictionary of internal keys that get skipped when iterating over all keys
  of object. Some of these properties are skipped naturally by using a
  hasOwnProperty function that filters out all properties that come from the
  prototype of the object. But with this skip map, properties may be assigned
  to the object itself and still be skipped by iterators.
*/
LSD.Object.prototype._skip = {
  _references: true,
  _reference: true,
  _watchers: true,
  _watched: true,
  _ownable: true,
  _owning: true,
  _stored: true,
  _owner: true,
  _hash: true,
  _skip: true
};
['get', 'set', 'mix', 'unmix', 'watch', 'unwatch', 'merge', 'unmerge'].forEach(function(method) {
  LSD.Object.prototype['_' + method] = LSD.Object.prototype[method];
});
LSD.Object.prototype.change = LSD.Object.prototype.set;
LSD.Object.prototype._onStore = function(key, value, old, meta, name) {
  if (name == null) {
    if (value != null && typeof value == 'object') {
      var skip = value._skip; 
      for (var prop in value) {
        if (value.hasOwnProperty(prop) && (skip == null || !skip[prop])) {
          var property = this._Properties[prop];
          if (property != null) property.call(this, key, value[prop], true);
        }
      }
    }
    if (old != null && typeof old == 'object') {
      var skip = old._skip; 
      for (var prop in old) {
        if (old.hasOwnProperty(prop) && (skip == null || !skip[prop])) {
          var property = this._Properties[prop];
          if (property != null) property.call(this, key, old[prop], false);
        }
      }
    }
  }
};
LSD.Object.prototype._trigger = '_calculated';
LSD.Object.prototype._script = function(key, expression) {
  var scripted = (this._scripted || (this._scripted = {}));
  var node = this.nodeType && this;
  if (this.nodeType) {
    scripted[key] = LSD.Script(expression, null, [this, key]);;
    node.watch('variables', '_scripted.' + key + '.scope')
  } else if (key === 'merged') {
    var merged = (scripted.merged || (scripted.merged = []));
    for (var i = 0, j = expression.length; i < j; i++)
      merged.push(LSD.Script(expression, this, this))
  } else {
    scripted[key] = LSD.Script(expression, this, [this, key]);;
  }
  return this._skip;
};
LSD.Object.prototype._unscript = function(key, value, meta) {
  var script = this._scripted[key];
  if (key === 'merged') {
    for (var i = 0, j = script.length; i < j; i++) {
      for (var k = 0, l = value.length; k < l; k++) {
        if (script[i].args[0] === value[k]) {
          script[i].set('attached', undefined, script[i].attached, meta);
          script[i].set('value', undefined, script[i].value, meta)
          script.splice(i--, 1);
          j--;
        }
      }
    }
  } else {
    script.set('attached', undefined, script.attached, meta);
    script.set('value', undefined, script.value, meta)
    delete this._scripted[key]
  }
  return this._skip;
};