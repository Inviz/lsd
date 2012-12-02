/*
---

script: Storage.js

description: Clientside storage mechanism

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Data

provides:
  - LSD.Storage

...
*/

/*
  Storage API is simple, yet effective. It uses reverse `value`, `key` signature
  to be compatible with array iterators and callbacks. 

 * `LSD.Storage.get(key) to get value by key
 * `LSD.Storage(key, value)` to set a value by key
 * `LSD.Storage(key)` to unset a value by key
 * `LSD.Storage(array)` to sync array with storage (store values from array 
   and fetch values from cookies, use array values in case of conflicts)
 * `array.watch(LSD.Storage.Cookies)` to use it as a callback (won't retrieve values 
   from storage initially, but will save changes in array)
 * `[1,2,3].forEach(LSD.Storage)` to store values from native array. 
 * `LSD.Storage([])` to populate a native array with values from cookies
 * `new LSD.Storage('clients')` create a storage with prefix
 * `new LSD.Storage.Cookies` create a storage with specific adapter
*/

LSD.Storage = function(key, value, old, meta, prefix, storage, get, self, length) {
  if (length == null) {
    length = arguments.length;
    var initial = true;
  }
  if (this.getAllItems) {
    if (prefix == null) prefix = key;
    if (storage == null) storage = value;
    if (!length) return;
    var constructor = function(k, v, o, m, p) {
      if (this instanceof constructor) {
        return LSD.Storage.call(this, undefined, undefined, undefined, undefined,
                                      k != null ? k : prefix, 
                                      v != null ? v : storage, 
                                      o != null ? o : get, 
                                      constructor, arguments.length)
      } else {
        if (this.LSD)
          var s = k, k = v, v = s;
        return LSD.Storage.call(this, k, v, o, m, prefix, storage, get, constructor, arguments.length)
      }
    }
    return !initial ? constructor : LSD.Storage.initialize(constructor, true, key, value);
  }
  if (!storage) storage = 'Local';
  if (typeof storage == 'string') 
    storage = LSD.Storage[storage].prototype;
  var prototype = this.prototype;
  var context = (!prototype || !prototype.setItem) && this !== LSD && !this.LSD && this;
  if ((length != null ? length : (length = arguments.length)) > 4 && this !== LSD) {
    switch (typeof prefix) {
      case 'function':
        var callback = prefix;
        break;
      case 'object':
        var context = prefix;
    }
    var set = value !== undefined;
  } else {
    for (var i = 0, j = Math.min(4, length), arg; i < j; i++) {
      switch (typeof (arg = arguments[i])) {
        case 'function':
          var callback = arg;
          break;
        case 'object':
          var context = arg;
          break;
        case 'undefined':
          if (i == 1)
            var single = true;
          break;
        case 'string': case 'number':
          if (i == 1) {
            var single = true;
          } else if (i == 0 && !context) 
            var set = false;
          if (context || callback || (i > 1 && set != null)) {
            var prefix = arg;
          } else if (i == 1 && callback !== key)
            var set = true;
      }
    }
  }
  if (meta == 'storage') return;
  meta = 'storage';
  if (prefix == null) if (single && ((callback && callback === key) || (context && context === key))) 
    prefix = value;
  else
    prefix = context && context.push && context.prefix || ''
  if (set != null && !get) {
    if (set) {
      storage.setItem(key, value, prefix, callback || context || this, meta, storage);
    } else {
      storage.removeItem(key, prefix, callback || context || this, meta, storage);
    }
  } else if (!context && (!callback || callback !== key)) {
    var result = storage.getItem(key, prefix, callback || context || this, meta, storage);
    return (result == null) ? undefined : result;
  } else {  
    if (context.push && context._watch) 
      context.watch(self);
    storage.getAllItems(prefix, callback || context || this, meta, storage);
  }
};
LSD.Storage.initialize = function(storage, proto, k, v) {
  if (!storage) storage = this;
  if (proto) storage.prototype = new LSD.Storage;
  storage._object = true;
  storage.set = storage;
  storage.get = new storage(k, v, true);
  storage.setItem = storage.set                          
  storage.getItem = storage.get;
  return storage;
};
LSD.Storage.prototype.setItem = function(key, value, prefix, callback, meta) {
  if (typeof value != 'string') value = String(value);
  if (callback && callback.push && callback.length <= key)
    this.adapter.setItem(prefix + 'length', key + 1);
  this.adapter.setItem(prefix + key, value);
  if (callback) this.callback(callback, key, value, meta)
};
LSD.Storage.prototype.removeItem = function(key, prefix, callback, meta) {
  if (callback && callback.push && callback.length == key - 1)
    this.adapter.setItem(prefix + 'length', key - 1);
  this.adapter.removeItem(prefix + key);
  if (callback) this.callback(callback, key, undefined, meta)
};
LSD.Storage.prototype.getItem = function(key, prefix, callback, meta) {
  var value = this.adapter.getItem(prefix + key);
  if (value === null) value = undefined;
  if (callback) this.callback(callback, String(key), value, meta);
  return value;
}
LSD.Storage.prototype.getAllItems = function(prefix, callback, meta) {
  var j = this.adapter.getItem(prefix + 'length');
  for (var i = 0; i < j; i++) 
    this.getItem(i, prefix, callback, meta);
};
LSD.Storage.prototype.callback = function(callback, key, value, meta) {
  if (callback._watch) {
    callback[typeof value == 'undefined' ? 'unset' : 'set'](key, value, undefined, 'storage');
  } else if (callback.call) 
    callback.call(this, key, value, meta)
  else if (typeof value != 'undefined') 
    callback[key] = value;
  else {
    delete callback[key];
    if (callback.push && callback.length == parseInt(key) + 1)
      callback.length = key;
  }
}
LSD.Storage.prototype.prefix = '';
LSD.Storage.Local = new LSD.Storage(undefined, 'Local');
LSD.Storage.Local.prototype.adapter = localStorage;

LSD.Storage.Session = new LSD.Storage(undefined, 'Session');
LSD.Storage.Session.prototype.adapter = sessionStorage;

LSD.Storage.Cookies = new LSD.Storage(undefined, 'Cookies');
LSD.Storage.Cookies.prototype.setItem = function(key, value, prefix, callback, meta) {
  document.cookie = prefix + key + '=' + value + ';expires=' + (new Date(+new Date + 365 * 60 * 60 * 24)).toGMTString();
  if (callback) this.callback(callback, key, value, meta)
};
LSD.Storage.Cookies.prototype.removeItem = function(key, prefix, callback, meta) {
  document.cookie = prefix + key + '=;expires=Thu, 01-Jan-1970 00:00:01 GMT';
  if (callback) this.callback(callback, key, undefined, meta)
};
LSD.Storage.Cookies.prototype.getItem = function(key, prefix, callback, meta) {
  switch (typeof prefix) {
    case 'undefined': case 'string':
      break;
    default:
      meta = callback, callback = prefix, prefix = key, key = null;
  }
  var skip = prefix.length;
  for (var cookie = document.cookie, p = 0; i = cookie.indexOf(';', p);) {
    if (!skip || cookie.substring(p, p + skip) == prefix) {
      var eql = cookie.indexOf('=', p);
      var index = cookie.substring(p + skip, eql);
      if (key && index != key) continue;
      var val = cookie.substring(eql + 1, i);
      if (callback) this.callback(callback, index, val, meta);
      if (key) return val;
    }
    if (i == -1) break;
    else p = i + 2;
  };
};
LSD.Storage.Cookies.prototype.getAllItems = LSD.Storage.Cookies.prototype.getItem;


LSD.Storage.Indexed = new LSD.Storage(undefined, 'Indexed');
LSD.Storage.Indexed.prototype.database = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB;
LSD.Storage.Indexed.prototype.transaction = window.IndexedTransaction || window.mozDBTransaction  || window.webkitIndexedTransaction;
LSD.Storage.Indexed.prototype.databases = {};
if (navigator.userAgent.indexOf('Chrome') > -1) {
  LSD.Storage.Indexed.prototype.keyPath = 'key';
  LSD.Storage.Indexed.prototype.valuePath = 'value';
}
LSD.Storage.Indexed.prototype.open = function() {
  for (var i = 0, j = arguments.length, arg; i < j; i++) {
    switch (typeof (arg = arguments[i])) {
      case 'string':
        var name = arg;
        break;
      case 'number':
        var version = arg;
        break;
      case 'function':
        var callback = arg;
    }
  }
  var db = this.databases[name];
  if (db) {
    if (callback) callback.call(this, db)
    return db;
  }
  var self = this;
  var onUpgrade = function(event) {
    var db = event.target.source || event.target.result
    var found, names = db.objectStoreNames;
    for (var i = 0, id; (id = names[i++]) != null;)
      if (id == name) break;
    if (!id) db.createObjectStore(name, {
      keyPath: self.keyPath,
      autoIncrement: false
    }, true)
    return db;
  };
  if (!version) version = 3;
  var request = this.database.open(name, version, onUpgrade)
  request.onerror = request.onsuccess = request.onblocked = function(event) {
    var db = event.target.result
    if (db.version != version) {
      var request = db.setVersion(version);;
      request.onsuccess = function(e) {
        db = onUpgrade(e);
        setTimeout(function() {
          callback.call(self, self.databases[name] = db)
        }, 0)
      }
      return request;
    } else {
      return callback.call(self, self.databases[name] = db)
    }
  }
  request.onupgradeneeded = onUpgrade;
  return request;
}
LSD.Storage.Indexed.prototype.openCursor = function() {
  var self = this;
  for (var i = 0, j = arguments.length, arg; i < j; i++) {
    switch (typeof (arg = arguments[i])) {
      case 'string':
        if (!prefix) var prefix = arg;
        break;
      case 'boolean': case 'number':
        if (arg) var mode = 'readwrite';
        break;
      case 'function':
        var callback = arg;
    }
  }
  return this.openStore(prefix, mode, function(store) {
    var cursor = store.openCursor();
    cursor.onsuccess = cursor.onerror = function(event) {
      callback.call(self, cursor.result, event);
    };
    return cursor;
  })
};
LSD.Storage.Indexed.prototype.openStore = function() {
  var name = this.prefix, mode, callback;
  for (var i = 0, j = arguments.length, arg; i < j; i++) {
    switch (typeof (arg = arguments[i])) {
      case 'string':
        if (!name) name = arg;
        else mode = arg;
        break;
      case 'boolean': case 'number':
        if (arg) mode = 'readwrite';
        break;
      case 'function':
        callback = arg;
    }
  }
  return this.open(name, function(database) {
    var store = database.transaction([name], mode || 'readonly').objectStore(name);
    if (callback) callback.call(this, store);
    return store;
  })
};
LSD.Storage.Indexed.prototype.close = function(name) {
  if (this.database) this.database.close();
};
LSD.Storage.Indexed.prototype.setItem = function(key, value, prefix, callback, meta) {
  return this.openStore(prefix, true, function(store) {
    if (this.keyPath) {
      if (typeof value != 'object') {
        var obj = {};
        obj[this.keyPath] = key;
        obj[this.valuePath] = value;
      }
      var request = store.put(obj || value)
    } else {
      var request = store.put(value, key)
    }
    var self = this;
    request.onsuccess = request.onerror = function(event) {
      if (event.type == 'error') return;
      self.callback(callback, key, value, meta || event)
    }
    return request;
  });
};
LSD.Storage.Indexed.prototype.removeItem = function(key, prefix, callback, meta) {
  return this.openStore(prefix, true, function(store) {
    var request = store['delete'](key), self = this;
    request.onsuccess = request.onerror = function(event) {
      if (event.type == 'error') return;
      self.callback(callback, key, undefined, meta || event)
    }
    return request;
  });
};
LSD.Storage.Indexed.prototype.getItem = function(key, prefix, callback, meta) {
  return this.openStore(prefix, false, function(store) {
    var request = store.get(key), self = this;
    request.onsuccess = request.onerror = function(event) {
      if (event.type == 'error') return;
      var result = event.target.result;
      if (self.valuePath && result) result = result[self.valuePath];
      self.callback(callback, key, result, meta || event)
    }
    return request;
  });
};
LSD.Storage.Indexed.prototype.getAllItems = function(prefix, callback, meta) {
  return this.openCursor(prefix, function(cursor, event) {
    if (!cursor) return;
    else var value = cursor.value;
    if (this.valuePath && value) value = value[this.valuePath];
    this.callback(callback, cursor.key, value, meta || event);
    return cursor['continue']();
  });
};
LSD.Storage.initialize();