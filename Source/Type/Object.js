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
    this._set(undefined, object, undefined, undefined, 'over');
};
LSD.Object.prototype.constructor = LSD.Object;
LSD.Object.prototype.set = function(key, value, old, meta, prepend, hash) {
  //run hashing hooks to transform key
  var stringy = typeof key == 'string';
  hasher: switch (hash) {
    case undefined:
      for (var method = key == null ? '_join' : '_hash'; this[method]; method = '_' + method) {
        hash = this[method](key, value, old, meta, prepend);
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
            break hasher;
        }
      };
      break hasher;
    case false:
      hash = undefined;
  }
  if (!meta && this._delegate) meta = this;
  // merge objects
  if (key == null) {
    var unstorable = meta && meta._delegateble, val;
    if (value) {
      if (typeof value._watch == 'function') 
        value._watch(undefined, {
          fn: this._merger,
          bind: this,
          callback: this,
          prepend: prepend
        });
      var skip = value._nonenumerable;
      for (var prop in value)
        if (value.hasOwnProperty(prop) 
        && (unstorable == null || !unstorable[prop]) 
        && (skip == null || !skip[prop])
        && (val = value[prop]) !== undefined) { 
          this._set(prop, val, undefined, meta, prepend);
        }
    };
    if (old && typeof old == 'object') {
      if (typeof old._unwatch == 'function') 
        old._unwatch(undefined, this);
      var skip = old._nonenumerable;
      for (var prop in old)
        if (old.hasOwnProperty(prop) 
        && (unstorable == null || !unstorable[prop]) 
        && (skip == null || !skip[prop])
        && (val = old[prop]) !== undefined) {
          this._set(prop, undefined, val, meta, prepend);
        }
    }
    return true;
  }
  // set property in a foreign object, observe objects in path
  if (!hash && stringy)
    var index = key.indexOf('.', -1);
  if (index > -1) {
    var name = key.substr(key.lastIndexOf('.', index - 1) + 1, index) || '_owner';
    var subkey = key.substring(index + 1);
    if (this.onStore && this.onStore(name, value, old, meta, prepend, subkey) === false) return;
    // store arguments to reuse when object in path changes
    var storage = (this._stored || (this._stored = {}));
    var group = (storage[name] || (storage[name] = []));
    if (value !== undefined)
    group.push([subkey, value, undefined, meta, prepend, hash]);
    if (old !== undefined) 
      for (var i = 0, j = group.length; i < j; i++)
        if (group[i][1] === old) {
          group.splice(i, 1);
          break;
        }
    var obj = this[name];
    // build object in path
    if (obj == null) {
      if (value !== undefined && !this._nonenumerable[name] && !hash)
        obj = this._construct(name, null, meta);
      if (obj == null && this.onConstructRefused)
        this.onConstructRefused(key, value, meta, old, prepend, hash)
    // broadcast value to array
    } else if (obj.push && obj._object !== true) {
      var subindex = subkey.indexOf('.');
      var prop = (subindex > -1) ? subkey.substring(0, subindex) : subkey;
      if (parseInt(prop) == prop)
        obj._set(subkey, value, old, meta, prepend, hash)
      else for (var i = 0, j = obj.length; i < j; i++)
        obj[i]._set(subkey, value, old, meta, prepend, hash);
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
          obj = this._construct(name, null, 'copy', obj)
        else
          obj._set(subkey, value, old, meta, prepend, hash);
      } else {
        for (var previous, k, object = obj; (subindex = subkey.indexOf('.', previous)) > -1;) {
          k = subkey.substring(previous || 0, subindex)
          if (previous > -1 && object._set) {
            object._set(subkey.substring(subindex), value, old, meta, prepend, hash);
            break;
          } else if (object[k] != null) 
            object = object[k];
          previous = subindex + 1;
        }
        k = subkey.substring(previous);
        if (object._set)
          object._set(k, value, old, meta, prepend, hash)
        else
          object[k] = value;
      }
    }
    return true;
  // merge objects by key
  } else if (prepend === 'over' || prepend === 'under') {
    var arg = value || old;
    if (arg && typeof arg == 'object' && !arg.exec && !arg.push && !arg.nodeType) {
      if (this.onStore && this.onStore(key, value, meta, old, prepend) === false) return;
      var storage = (this._stored || (this._stored = {}));
      var group = storage[key] || (storage[key] = []);
      if (value !== undefined) 
        group.push([undefined, value, undefined, meta, prepend, hash, index]);
      if (old !== undefined) 
        for (var i = 0, j = group.length; i < j; i++)
          if (group[i][1] === old) {
            group.splice(i, 1);
            break;
          }
      var obj = this[key];
      // set a reference to remote object without copying it
      if (obj == null) {
        if (value !== undefined && !this._nonenumerable[key])
          obj = (value && value._set && this._set(key, value, undefined, 'reference') && value)
               || this._construct(key, null, meta);
      // if remote object is array, merge object with every item in it
      } else if (obj.push && obj._object !== true) {
        for (var i = 0, j = obj.length; i < j; i++)
          if (!meta || !meta._delegate || !meta._delegate(obj[i], key, value, old, meta))
            obj[i]._set(undefined, value, old, meta, prepend, hash);
      } else if (obj._set) {
        var ref = obj._reference, owner = obj._owner;
        // if there was an object referenced by that key, copy it
        if (!this._nonenumerable[name] 
        && value !== undefined && obj !== old 
        && (!meta || !meta._delegate)
        && !value._shared
        && (ref && ref !== key || owner !== this)) {
          obj = this._construct(key, null, 'copy', obj)
        } else {
          // swap objects
          if (obj === old)
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
    }
  }
  // set value by key
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
  if (stringy && !(index > -1)) {
    if (!deleting && hash === undefined && this[key] !== value)
      this[key] = value;
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
        if (val === value) continue;
        if (value != null && (!mem || !mem._delegate || !mem._delegate(value, key, val)))
          if (value._set)
            value._set.apply(value, args);
          else if (k == null)  {
            if (typeof value == 'object')
              for (var p in val)
                value[p] = val[p];
          } else
            value[k] = val;
        if (old != null && typeof old == 'object' && meta !== 'copy' && val !== old 
        && (!mem || !mem._delegate || !mem._delegate(old, key, undefined, val, meta)))
          if (old._unmix)
            old._unset.apply(old, args);
      }
  }
  return true;
};

LSD.Object.prototype.unset = function(key, value, old, meta, index, hash) {
  return this._set(key, old, value, meta, index, hash);
};

LSD.Object.prototype.get = function(key, construct, meta) {
  for (var method = '_hash'; this[method] && hash === undefined; method = '_' + method) {
    var hash = this[method](key, undefined, undefined, meta, 'get');
    switch (typeof hash) {
      case 'boolean':
        return;
      case 'string': case 'number':
        key = hash;
        hash = undefined;
    }
  };
  for (var dot, start, result, object = this; dot != -1;) {
    start = (dot == null ? -1 : dot) + 1;
    dot = key.indexOf('.', start)
    var subkey = ((dot == -1 && !start) ? key : key.substring(start, dot == -1 ? key.length : dot)) || '_owner';
    if (object === this) {
      result = this[subkey];
    } else {
      if (construct == null)
        construct = this._eager || false;
      result = typeof object.get == 'function' ? object.get(subkey, construct) : object[subkey];
    }
    if (result == undefined && construct && !object._nonenumerable[subkey])
      result = object._construct(subkey, undefined, meta)
    if (result != undefined) {
      if (dot != -1) object = result;
      else return result;
    } else break;
  }
};

LSD.Object.prototype.mix = function(key, value, old, meta, prepend, lazy) {
  return this._set(key, value, old, meta, prepend || 'over', lazy)
};

LSD.Object.prototype.unmix = function(key, value, old, meta, prepend, lazy) {
  return this._set(key, old, value, meta, prepend || 'over', lazy)
};

LSD.Object.prototype.merge = function(value, prepend, meta, old) {
  return this._set(undefined, value, old, meta, prepend || 'over')
};

LSD.Object.prototype.unmerge = function(value, prepend, meta) {
  return this._set(undefined, undefined, value, meta, prepend || 'over')
};

LSD.Object.prototype.watch = function(key, value, old, meta, lazy) {
  for (var method = key == null ? '_join' : '_hash'; this[method]; method = '_' + method) {
    var hash = this[method](key, value, old, meta, 'watch');
    switch (typeof hash) {
      case 'string':
        key = hash;
        string = true;
        break;
      case 'object':
        if (value) {
          if (typeof hash.push == 'function')
            hash.push(value)
          else
            hash.watch(key, value);
          value = undefined;
        }
        if (old) {
          if (typeof hash.splice == 'function')
            for (var i = hash.length, fn; i--;) {
              if ((fn = hash[i]) == old || fn.callback == old) {
                hash.splice(i, 1);
                break;
              }
            }
          else 
            hash.unwatch(key, old);
          old = undefined;
        }
    }
  }
  if (!key) {
    var watchers = (this._watchers || (this._watchers = []));
    if (value !== undefined) 
      watchers.push(value)
    if (old !== undefined) for (var i = 0, j = watchers.length, fn; i < j; i++) {
      var fn = watchers[i];
      if (fn === old || (fn != null && fn.callback == old))
        watchers.splice(i, 1);
      break;
    }
  } else {
    var index = key.indexOf('.');
    if (index > -1) {
      this._watch(key.substr(0, index) || '_owner', value && {
        fn: this._watcher,
        index: index,
        key: key,
        callback: typeof value == 'string' ? [this, value] : value,
        meta: meta,
        lazy: lazy
      }, typeof old == 'string' ? [this, old] : old, meta, lazy)
    } else {
      var val = this._get(key, value && lazy === false);
      var watched = (this._watched || (this._watched = {}));
      watched = (watched[key] || (watched[key] = []))
      if (value) {
        watched.push(value);
        if (val != undefined) {
          if (value.call)
            value(val, undefined, meta);
          else
            this._callback(value, key, val, undefined, meta, lazy);
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
            this._callback(old, key, undefined, val, meta, lazy);
        }
      }
    }
  }
};

LSD.Object.prototype.unwatch = function(key, value, old, meta, lazy) {
  return this._watch(key, old, value, meta, lazy);
};

LSD.Object.prototype._construct = function(name, constructor, meta, value) {
  var constructors = this._constructors;
  if (constructors)
    var found = constructors[name] || false, instance;
  if (!(constructor = found) && this._getConstructor &&
     (constructor = this._getConstructor(name)) === false) 
    return;
  if (!constructor)
    constructor = (value && value.constructor);
  if (!constructor)
    if (this.constructor.prototype._object === false)
      return;
    else
      constructor = this.constructor;
  if (found === false)
    constructors[name] = constructor;
  if (!this._onBeforeConstruct || (instance = this._onBeforeConstruct(name, constructor)) === undefined) {
    instance = new constructor;
    this._set(name, instance, value, this._delegate && !meta ? this : meta);
  }
  return instance;
};

LSD.Object.prototype._watcher = function(call, key, value, old, meta) {
  for (var i = 0, object; i < 2; i++) {
    if ((object = (i ? value : old)) == null) continue;
    for (var dot = null, start; dot != -1;) {
      start = (dot == null ? call.index == null ? -1 : call.index : dot) + 1;
      dot = call.key.indexOf('.', start)
      if (object && object._watch) {
        object[i ? '_watch' : '_unwatch'](call.key.substring(start), call.callback, undefined, call.meta || meta, call.lazy);
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
        return (callback.fn || (callback.bind || this)[callback.method]).apply(callback.bind || this, arguments);
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
  return this._set(key, value, old, meta, 'change');
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
    this._set(undefined, object, undefined, undefined, 'over');
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