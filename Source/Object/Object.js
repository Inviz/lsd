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
  _constructor: LSD.Object,
  
  _length: 0,
  
  set: function(key, value, memo, index, hash) {
    /*
      The values may be set by keys which types is not string.
      A special method named `_hash` is called each time and can
      return either string (a new key for value to be stored with)
      or anything else (an object, or true). When hash is not string
      the setter turns into immutable mode and only executes callbacks
      without changing any keys. A callback may implement its own
      strategy of storing values, as callbacks recieve result of hashing
      as the last argument. 
    */
    if (typeof key != 'string') {
      if (typeof hash == 'undefined') hash = this._hash(key);
      if (typeof hash == 'string') {
        key = hash;
        hash = null;
      }
    } else var nonenum = this._skip[key];
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
      if (typeof old == 'undefined')
        this._length++;
      this[key] = value;
    }
    /*
      Keys that start with `_` underscore do not trigger calls to global
      object listeners. But they can be watched individually.
    */
    if (index !== -1 || nonenum !== true) {
      if((this._onChange && typeof (value = this._onChange(key, value, true, old, memo, hash)) == 'undefined')
      || (this.onChange && typeof (value = this.onChange(key, value, true, old, memo, hash)) == 'undefined')) {
        if (hash == null) this[key] = old;
        return;
      }
      if (value != null && value._constructor && this._children !== false && value._parent == null)
        value._set('_parent', this);
    }
    var watchers = this._watchers;
    if (watchers) for (var i = 0, j = watchers.length, watcher, fn; i < j; i++) {
      if ((watcher = watchers[i]) == null) continue
      if (typeof watcher == 'function') watcher.call(this, key, value, true, old, memo, hash);
      else this._callback(watcher, key, value, true, old, memo, hash);
    }
    if (index === -1) {
      if (hash == null && this[key] !== value) this[key] = value;
      var watched = this._watched;
      if (watched && (watched = watched[key]))
        for (var i = 0, fn; fn = watched[i++];)
          if (fn.call) fn.call(this, value, old);
          else this._callback(fn, key, value, old, memo, hash);
      var stored = this._stored;
      if (stored && (stored = stored[key]))
        for (var i = 0, item; item = stored[i++];) {
          if (value != null && (!item[2] || !item[2]._delegate || !item[2]._delegate(value, key, item[0], true)))
            value.mix(item[0], item[1], item[2], true, item[3], item[4]);
          if (old != null && (!item[2] || !item[2]._delegate || !item[2]._delegate(old, key, item[0], false)))
            old.mix(item[0], item[1], item[2], false, item[3], item[4]);
        }
    } 
    return true;
  },
  
  unset: function(key, value, memo, index, hash) {
    if (typeof key != 'string') {
      if (typeof hash == 'undefined') hash = this._hash(key);
      if (typeof hash == 'string') {
        key = hash;
        hash = null;
      }
    }
    if (hash == null && typeof index != 'number') index = key.indexOf('.');
    if (index > -1) return this.mix(key, value, memo, false, null, null, index);
    var vdef = typeof value != 'undefined';
    if (vdef) old = value;
    else var old = this[key];
    if (!hash && vdef && typeof old == 'undefined') return false;
    if (index !== -1 || !this._skip[key]) {
      if (this._onChange && (value = this._onChange(key, old, false, undefined, memo, hash)) == null && old != null)
        return false;
      if (this.onChange && (value = this.onChange(key, old, false, undefined, memo, hash)) == null && old != null)
        return false;
      if (value != null && this._children !== false && value._constructor && value._parent === this) 
        value._unset('_parent', this);
      this._length--;
    }
    var watchers = this._watchers;
    if (watchers) for (var i = 0, j = watchers.length, watcher, fn; i < j; i++) {
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
      if (hash == null) delete this[key];
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
        result = typeof object.get == 'function' ? object.get(subkey, construct) : object[subkey];
      }  
      if (typeof result == 'undefined' && construct && !object._skip[subkey]) result = object._construct(subkey)
      if (typeof result != 'undefined') {
        if (dot != -1) object = result;
        else return result;
      } else break;
    }
  },
  
  mix: function(key, value, memo, state, merge, prepend, index) {
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
        if (key.hasOwnProperty(prop) && (unstorable == null || !unstorable[prop]) && (skip == null || !skip[prop]))
          this.mix(prop, key[prop], memo, state, merge, prepend);
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
          if (state !== false && !this._skip[name])
            obj = this._construct(name, null, memo, value);
        } else if (obj.push) {
          for (var i = 0, j = obj.length; i < j; i++)
            obj[i].mix(name, value, memo, state, merge, prepend)
        } else {
          var parent = this._children !== false && obj._parent !== false && obj._parent;
          if (state !== false && parent && parent !== this) {
            this[name] = null;
            obj = this._construct(name, null, memo, value)
          } else if (typeof obj.mix == 'function')
            obj.mix(subkey, value, memo, state, merge, prepend);
        }
      } else if (value != null && (typeof value == 'object' && !value.exec && !value.push && !value.nodeType)
                               && (!value._constructor || merge)) {
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
        var obj = this[key];
        if (obj == null) {
          if (state !== false && !this._skip[name]) 
            obj = this._construct(key, null, memo, value);
        } else if (obj.push) {
          for (var i = 0, j = obj.length; i < j; i++)
            if (!memo || !memo._delegate || !memo._delegate(obj[i], key, value, state))
              obj[i].mix(value, null, memo, state, merge, prepend);
        } else {
          obj.mix(value, null, memo, state, merge, prepend);
        }
      } else {
        this[memo === 'reset' ? memo : state !== false ? 'set' : 'unset'](key, value, memo, prepend);
      }
    }
    return this;
  },
  
  unmix: function(key, value, memo, state, merge, prepend, index) {
    return this.mix(key, value, memo, false, merge, prepend, index);
  },
  
  merge: function(value, prepend, memo) {
    return this.mix(value, null, memo, true, true, prepend)
  },
  
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
        var value = this.get(key, lazy === false);
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
      var constructors = this._constructors;
      constructor = (constructors && constructors[name])
                || (this._getConstructor ? this._getConstructor(name) : value && value.__constructor || this._constructor);
    }
    var instance = new constructor;
    if (this._delegate && !memo) memo = this;
    this.set(name, instance, memo);
    return instance;
  },
  
  _hash: function() {
    throw "The key for the value is not a string. Define _hash method for the object and implement the indexing strategy"
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
  },
  
  _merger: function(call, name, value, state, old) {
    if (state) this.mix(name, value, call, true, true, call.prepend);
    if (this._stack && (!state || old != null)) this.mix(name, state ? old : value, call, false, true, call.prepend);
  },
  
  _callback: function(callback, key, value, old, memo, obj) {
    if (callback.substr) 
      var subject = this, property = callback;
    else if (typeof callback.fn == 'function')
      return (callback.fn || (callback.bind || this)[callback.method]).call(callback.bind || this, callback, key, value, old, memo, obj);
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
  
  toString: function() {
    var string = '{';
    for (var property in this)
      if (this.has(property) && typeof this[property] != 'function')
        string += (string.length > 1 ? ', ' : '') + (property + ': ' + this[property]);
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
  
  _skip: {
    _skip: true,
    _constructor: true,
    _watchers: true,
    _children: true,
    _watched: true,
    _parent: true,
    _stored: true,
    _length: true,
    _merger: true,
    _hash: true,
  }
};

LSD.toObject = LSD.Object.toObject = LSD.Object.prototype.toObject;
['set', 'unset', 'watch', 'unwatch'].each(function(method) {
  LSD.Object.prototype['_' + method] = LSD.Object.prototype[method];
});
LSD.Object.prototype.reset = LSD.Object.prototype.set;
