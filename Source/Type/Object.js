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
  if (object != null)
    this._set(undefined, object, undefined, undefined, 'merge');
};
LSD.Object.prototype.constructor = LSD.Object;

// a catch-all method for all public method calls
LSD.Object.prototype._dispatch = function(key, value, old, meta, prepend) {
  if (key == null)
    if (prepend === 'watch' || prepend === 'observe')
      return this.__observe(key, value, old, meta, prepend);
    else
      return this.__join(key, value, old, meta, prepend);
  var stringy = typeof key == 'string';
  var hashers = this._hashers;
  // hash hook can transform keys or overload setters 
  loop: for (var i = 0, method; method = hashers ? hashers[i++] : !method && this._hash && '_hash';) {
    var hash = this[method](key, value, old, meta, prepend);
    switch (typeof hash) {
      case 'boolean':
        return hash;
      case 'string': 
        key = hash
        hash = undefined;
        stringy = true;
        break;
      case 'number':
        key = hash;
        hash = undefined;
        break;
      case 'object':
        break loop;
    }
  };
  if (!meta && this._delegate) meta = this;
  if (!hash && stringy)
    var index = key.indexOf('.', -1);
  if (index > -1) {
    return this.__walk(key, value, old, meta, prepend, hash, index);
  } else if (typeof prepend == 'string') {
    var methods = this._methods;
    var method = methods && methods[prepend] || '__' + prepend;
    var result = this[method](key, value, old, meta, prepend);
    if (result != null)
      return result;
  }
  return this.__set(key, value, old, meta, prepend, hash);
};

LSD.Object.prototype.set = LSD.Object.prototype._dispatch;

LSD.Object.prototype.construct = function(key, value, old, meta) {
  return this._dispatch(key, value, value, meta, 'construct')
};

LSD.Object.prototype.unset = function(key, value, old, meta, index, hash) {
  return this._dispatch(key, old, value, meta, index, hash);
};

LSD.Object.prototype.mix = function(key, value, old, meta, prepend, lazy) {
  return this._dispatch(key, value, old, meta, prepend || 'merge', lazy)
};

LSD.Object.prototype.unmix = function(key, value, old, meta, prepend, lazy) {
  return this._dispatch(key, old, value, meta, prepend || 'merge', lazy)
};

LSD.Object.prototype.watch = function(key, value, old, meta, lazy) {
  return this._dispatch(key, value, old, meta, 'watch');
};

LSD.Object.prototype.unwatch = function(key, value, old, meta, lazy) {
  return this._dispatch(key, old, value, meta, 'watch');
};

LSD.Object.prototype.get = function(key, value, old, meta) {
  return this._dispatch(key, value, old, meta, 'get')
};

LSD.Object.prototype.merge = function(value, old, meta, prepend) {
  return this._dispatch(undefined, value, old, meta, prepend || 'merge')
};

LSD.Object.prototype.unmerge = function(value, old, meta, prepend) {
  return this._dispatch(undefined, old, value, meta, prepend || 'merge')
};

LSD.Object.prototype.observe = function(value, old, meta, prepend) {
  return this._dispatch(undefined, value, old, meta, 'watch')
};

LSD.Object.prototype.unobserve = function(value, old, meta, prepend) {
  return this._dispatch(undefined, old, value, meta, 'watch')
};

// assign a value by key
LSD.Object.prototype.__set = function(key, value, old, meta, prepend, hash) {
  var skip = this._nonenumerable;
  var nonenum = skip[key];
  var deleting = value === undefined
  if (hash === undefined) {
    if (old === undefined)
      old = this[key];  
    if (value === this[key]) 
      return false;
    if (deleting) 
      delete this[key];
    else
      this[key] = value;
  }
  if (nonenum !== true) {
    if (value != null && value._set && this._owning !== false)
      if (meta !== 'reference' && !value._owner) {
        if (value._ownable !== false) {
          value._reference = key;
          value._set('_owner', this);
        }
      } 
    if (old != null && old._owner === this && old._reference === key)
      if (meta !== 'reference') {
        old._set('_owner', undefined, this);
        delete old._reference;
      }
  }
  // run casting hooks to transform value
  var changed, val = value;
  for (var method = '_cast', i = 0; (changed === undefined || !nonenum) && this[method]; method = '_' + method)
    if ((changed = this[method](key, value, old, meta, prepend, hash)) !== undefined)
      if (changed === skip) {
        if (hash === undefined) this[key] = old;
        return;
      } else value = changed;
  for (var method = '_finalize'; this[method]; method = '_' + method)
    if (this[method](key, value, old, meta, prepend, hash, val) === true)
      return true;
  // notify observers
  var watchers = this._watchers;
  if (watchers && nonenum !== true) 
    for (var i = 0, j = watchers.length, watcher, fn; i < j; i++) {
      if ((watcher = watchers[i]) == null) continue;
      this._callback(watcher, key, value, old, meta, prepend, hash, val);
    }
  if (!deleting && hash === undefined && this[key] !== value)
    this[key] = value;
  if (value === true && key == 'variables')
    debugger
  var watched = this._watched;
  if (watched && (watched = watched[key]))
    for (var i = 0, fn; fn = watched[i++];)
      if (typeof fn == 'function')
        fn.call(this, value, old, meta, prepend, hash, val);
      else
        this._callback(fn, key, value, old, meta, prepend, hash, val);
  // apply stored arguments
  var stored = this._stored, mem, k;
  if (stored && (stored = stored[key])) 
    for (var i = 0, args; args = stored[i++];) {
      k = args[0], val = args[1], mem = args[3];
      var delegate = mem && mem._delegate;
      if (val === value) continue;
      if (value != null && (!delegate || !mem._delegate(value, key, val)))
        if (value._set)
          value._set(args[0], val, args[2], mem, args[4]);
        else if (k == null)  {
          if (typeof value == 'object')
            for (var p in val)
              value[p] = val[p];
        } else
          value[k] = val;
      if (old != null && old._unmix && meta !== 'copy' && val !== old 
      && (!delegate || !mem._delegate(old, key, undefined, val, meta)))
        old._set(args[0], args[2], val, mem, args[4]);
    }
  return true;
}
LSD.Object.prototype.__replace  = LSD.Object.prototype.__set; 

// dispatches a composite key
LSD.Object.prototype.__walk = function(key, value, old, meta, prepend, hash, index) {
  var name = key.substr(key.lastIndexOf('.', index - 1) + 1, index) || '_owner';
  var subkey = key.substring(index + 1);
  // store arguments to reuse when object in path changes
  var storage = (this._stored || (this._stored = {}));
  var group = (storage[name] || (storage[name] = []));
  if (value !== undefined)
    group.push([subkey, value, undefined, meta, prepend]);
  if (old !== undefined) 
    for (var i = 0, j = group.length; i < j; i++)
      if (group[i][1] === old) {
        group.splice(i, 1);
        break;
      }
  var obj = this[name];
  // build object in path
  if (obj == null) {
    if (value !== undefined && !this._nonenumerable[name]
    && prepend !== 'watch' && prepend !== 'get')
      obj = this._dispatch(name, undefined, undefined, meta, 'construct');
    //if (obj == null && this.onConstructRefused)
    //  this.onConstructRefused(key, value, meta, old, prepend)
  // broadcast value to every element of an array
  } else if (obj.push && obj._object !== true) {
    var subindex = subkey.indexOf('.');
    var prop = (subindex > -1) ? subkey.substring(0, subindex) : subkey;
    if (parseInt(prop) == prop)
      obj._set(subkey, value, old, meta, prepend)
    else for (var i = 0, j = obj.length; i < j; i++)
      obj[i]._set(subkey, value, old, meta, prepend);
  // invoke a function
  } else if (obj.apply) {
    if (value !== undefined) 
      this[name](subkey, value);
    if (old !== undefined) {
      var negated = LSD.negated[name] || (LSD.negated[name] = LSD.negate(name));
      this[negated](subkey, old)
    }
  // set property in object
  } else {
    if (obj._set && obj._ownable !== false) {
      if (!this._nonenumerable[name] 
      && value !== undefined
      && old !== obj && this._owning !== false
      && obj._shared !== true && obj._owner !== this)
        obj = this._dispatch(name, obj, undefined, 'copy', 'construct');
      else
        obj._set(subkey, value, old, meta, prepend);
    } else {
      for (var previous, k, object = obj; (subindex = subkey.indexOf('.', previous)) > -1;) {
        k = subkey.substring(previous || 0, subindex)
        if (previous > -1 && object._set) {
          object._set(subkey.substring(subindex), value, old, meta, prepend);
          break;
        } else if (object[k] != null) 
          object = object[k];
        previous = subindex + 1;
      }
      k = subkey.substring(previous);
      if (object._set)
        object._set(k, value, old, meta, prepend)
      else
        object[k] = value;
    }
  }
  return true;
}

// merge an object into this
LSD.Object.prototype.__join = function(key, value, old, meta, prepend) {
  var unstorable = meta && meta._delegateble, val;
  if (value) {
    if (value.__observe) 
      value.__observe(undefined, {
        fn: this._merger,
        bind: this,
        callback: this,
        prepend: prepend
      });
    var skip = value._nonenumerable;
    for (var prop in value)
      if (value.hasOwnProperty(prop) 
      && (!unstorable || !unstorable[prop]) 
      && (!skip || !skip[prop])
      && (val = value[prop]) !== undefined)
        this._set(prop, val, undefined, meta, prepend);
  };
  if (old) {
    if (old.__observe) 
      old.__observe(undefined, undefined, this);
    var skip = old._nonenumerable;
    for (var prop in old)
      if (old.hasOwnProperty(prop) 
      && (!unstorable || !unstorable[prop]) 
      && (!skip || !skip[prop])
      && (val = old[prop]) !== undefined)
        this._set(prop, undefined, val, meta, prepend);
  }
  return true;
}

// merge object by a property
LSD.Object.prototype.__merge = function(key, value, old, meta, prepend) {
  if (key == 'author' && !value && old && old.title)
    debugger
  var arg = value || old;
  if (!(arg instanceof Object) || arg.apply || arg.nodeType || arg.push)
    return null;
  var storage = (this._stored || (this._stored = {}));
  var group = storage[key] || (storage[key] = []);
  if (value !== undefined) 
    group.push([undefined, value, undefined, meta, prepend]);
  if (old !== undefined) 
    for (var i = 0, j = group.length; i < j; i++)
      if (group[i][1] === old) {
        group.splice(i, 1);
        break;
      }
  var obj = this[key];
  // set a reference to remote object without copying it
  if (obj == null) {
    if (value !== undefined && !this._nonenumerable[key]) {
      if (value && value._set)
        obj = this.__set(key, value, undefined, 'reference') && value;
      if (!obj) 
        obj = this.__construct(key, undefined, undefined, meta);
    }
  // if remote object is array, merge object with every item in it
  } else if (obj.push && obj._object !== true) {
    for (var i = 0, j = obj.length; i < j; i++)
      if (!meta || !meta._delegate || !meta._delegate(obj[i], key, value, old, meta))
        obj[i].__join(undefined, value, old, meta, prepend);
  } else if (obj._set) {
    var ref = obj._reference, owner = obj._owner;
    // if there was an object referenced by that key, copy it
    if (!this._nonenumerable[name] 
    && value !== undefined && obj !== old 
    && (!meta || !meta._delegate)
    && !value._shared
    && (ref && ref !== key || owner !== this)) {
      obj = this.__construct(key, obj, undefined, 'copy')
    } else {
      // swap objects
      if (obj === old || (old && obj._origin === old))
        this._set(key, value, old, meta)
      // merge objects
      else if (obj !== value) 
        obj._set(undefined, value, old, meta, prepend)
    }
  // merge into regular javascript object (possible side effects)
  } else {
    if (value !== undefined) for (var prop in value) 
      obj[prop] = value[prop];
    if (old !== undefined) for (var prop in old) 
      if (old[prop] === obj[prop] && (value === undefined || old[prop] !== value[prop])) 
        delete old[prop];
  }
  return true;
};
LSD.Object.prototype.__defaults = LSD.Object.prototype.__merge;

// set up a global observer
LSD.Object.prototype.__observe = function(key, value, old, meta, method) {
  var watchers = (this._watchers || (this._watchers = []));
  if (value !== undefined) 
    watchers.push(value)
  if (old !== undefined) for (var i = 0, j = watchers.length, fn; i < j; i++) {
    var fn = watchers[i];
    if (fn === old || (fn != null && fn.callback == old))
      watchers.splice(i, 1);
    break;
  }
}

// set up a property observer
LSD.Object.prototype.__watch = function(key, value, old, meta, method) {
  var val = this.__get(key, value, old, meta, method);
  var watched = (this._watched || (this._watched = {}));
  watched = (watched[key] || (watched[key] = []))
  if (value) {
    watched.push(value);
    if (val != undefined) {
      if (value.call)
        value(val, undefined, meta);
      else
        this._callback(value, key, val, undefined, meta);
    }
  }
  if (old) {
    for (var i = watched.length, fn; fn = watched[--i];) {
      var match = fn.callback || fn;
      if (match.push) {
        if (!old.push || old[0] != match[0] || old[1] != match[1])
          continue;
      } else if (match != old && fn != old)
        continue;
      old = watched[i];
      watched.splice(i, 1);
      break;
    }
    if (val != undefined && i > -1) {
      if (fn.call)
        old(undefined, val, meta);
      else
        this._callback(old, key, undefined, val, meta);
    }
  }
  return true;
};

// get a single property
LSD.Object.prototype.__get = function(key, value, old, meta, method) {
  var result = this[key];
  var nonenum = this._nonenumerable;
  if (result == undefined && method === 'construct' && this._construct)
    result = this.__construct(key, value, old, meta);
  if (result === true)
      debugger
  return result;
};

LSD.Object.prototype.__construct = function(key, value, old, meta, method) {
  var constructors = this._constructors;
  if (constructors)
    var found = constructors[key] || false, instance;
  if (!(constructor = found) && this._getConstructor &&
     (constructor = this._getConstructor(key)) === false) 
    return;
  if (method !== 'link') {
    if (value) switch (typeof value) {
      case 'object':
        var given = value.constructor
        if (given != Object);
          constructor = given;
        break;
      case 'function':
        constructor = value;
    }
  }
  if (!constructor)
    if (this.constructor.prototype._object === false)
      return;
    else
      constructor = this.constructor;
  if (found === false)
    constructors[key] = constructor;
  if (!this._onBeforeConstruct || (instance = this._onBeforeConstruct(key, constructor)) === undefined) {
    instance = new constructor;
    this.__set(key, instance, undefined, this._delegate && !meta ? this : meta);
  }
  if (given)
    instance._origin = given;
  if (method === 'link') {
    debugger
    console.error('error', key, value, old, meta, method)
    this.__watch(key, value, old, meta, 'construct')
  }
  return instance;
};
LSD.Object.prototype.__link = LSD.Object.prototype.__construct;

LSD.Object.prototype._merger = function(call, name, value, old, meta) {
  this._set(name, value, old, meta, call.prepend);
};

LSD.Object.prototype._callback = function(callback, key, value, old, meta, lazy) {
  switch (typeof callback) {
    case 'function':
      return callback.call(this, key, value, old, meta, lazy);
    case 'string':
      var subject = this, property = callback;
      break;
    default:
      if (typeof callback.fn == 'function')
        return (callback.fn || (callback.bind || this)[callback.method]).call(callback.bind || this, callback, key, value, old, meta, lazy);
      else if (typeof callback._watch == 'function')
        var subject = callback, property = key;
      else if (callback.push)
        var subject = callback[0], property = callback[1];
  }
  if (property === true || property == false)
    property = key;
  // check for circular calls
  if (meta == null) meta = [[this, key]];
  else if (meta.push) {
    for (var i = 0, a; a = meta[i++];)
      if (a[0] == this && a[1] == property) return;
    meta.push([this, key]);
  }
  if (typeof lazy == 'number') {
    var prop = subject._properties;
    if (!prop || !(prop = prop[property]) || !prop.chunked)
      return;
  }  
  subject._set(property, value, old, meta, lazy);
};

LSD.Object.prototype.has = function(key) {
  return this.hasOwnProperty(key) && !this._nonenumerable[key];
};

LSD.Object.prototype.forEach = function(callback, bind) {
  for (var property in this)
    if (this.hasOwnProperty(property) && !this._nonenumerable[property])
      callback.call(bind || this, this[property], property);
};

LSD.Object.prototype.getKeys = function() {
  var keys = [];
  for (var property in this)
    if (this.hasOwnProperty(property) && !this._nonenumerable[property])
      keys.push(property);
  return keys;
};

LSD.Object.prototype.change = function(key, value, old, meta, prepend) {
  return this._set(key, value, old, meta, 'replace');
};

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
    var skip = obj._nonenumerable;
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
LSD.Object.prototype._trigger = '_calculated';
LSD.Dictionary = function(object) {
  if (object != null)
    this._set(undefined, object, undefined, undefined, 'merge');
};

LSD.Object.prototype._nonenumerable = {
  _nonenumerable: true,
  _reference: true,
  __finalize: true, _finalize: true,
  _watchers: true,
  _scripts: true,
  _watched: true,
  _ownable: true,
  _owning: true,
  _stored: true,
  ___hash: true, __hash: true, _hash: true,
  ___cast: true, __cast: true, _cast: true,
  _owner: true
};
!function(proto, dict) {
  dict._nonenumerable = {};
  for (var property in proto._nonenumerable)
    dict._nonenumerable[property] = proto._nonenumerable[property];
  for (var property in proto) {
    if (property.charAt(0) == '_') {
      dict._nonenumerable[property] = true;
      proto._nonenumerable[property] = true
      if (property != '_nonenumerable')
        dict[property] = proto[property];
    } else {
      dict['_' + property] = proto['_' + property] = proto[property];
      dict._nonenumerable['_' + property] = true;
      proto._nonenumerable['_' + property] = true
      proto._nonenumerable[property] = true
    }
  };
}(LSD.Object.prototype, LSD.Dictionary.prototype);