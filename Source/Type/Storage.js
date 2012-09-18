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

 * `LSD.Storage.Cookies(value, index)` to set a value by index
 * `LSD.Storage.Cookies(undefined, index)` to unset a value by index
 * `LSD.Storage.Cookies(array)` to sync array with storage (store values from array 
   and fetch values from cookies, use array values in case of conflicts)
 * `array.watch(LSD.Storage.Cookies)` to use it as a callback (won't retrieve values 
   from storage initially, but will save changes in array)
 * `[1,2,3].forEach(LSD.Storage.Cookies)` to store values from native array. 
 * `LSD.Storage.Cookies([])` to populate a native array with values from cookies
*/

LSD.Storage = function(value, index, state, old, meta, prefix, storage, self) {
  if (this.getAllItems) {
    if (value === false || (self && this instanceof self)) return;
    var constructor = function(v, i, s, o, m) {
      if (this instanceof constructor) {
        if (v != null) this.prefix = v;
      } else {
        return LSD.Storage.call(this, v, i, s, o, m, value, index, constructor)
      }
    }
    constructor.prototype = new LSD.Storage(false);
    return constructor;
  }
  if (!storage) storage = 'Local';
  if (typeof storage == 'string') storage = LSD.Storage[storage].prototype;
  var prototype = this.prototype;
  var context = (!prototype || !prototype.setItem) && this !== LSD && this;
  var external = state == null
  switch (typeof old) {
    case 'function':
      var callback = old;
      break;
    case 'object':
      var context = old;
  }
  switch (typeof index) {
    case 'string': case 'number':
      if (external && context) prefix = index;
      else if (meta === false) return;
      else var single = true;
      break;
    case 'function':
      var callback = index;
  }
  switch (typeof value) {
    case 'object': 
      var context = value;
      break;
    case 'function':
      var callback = value;
      break;
    case 'string': case 'number':
      if (external && context) prefix = value;
      if (single) var set = true;
      break;
    case 'undefined':
      if (single) var remove = true;
  }
  if (set || remove) switch (typeof state) {
    case 'string':
      prefix = state;
      break;
    case 'function':
      var callback = state;
  }
  if (prefix == null) if (single && ((callback && callback === value) || external && context)) 
    prefix = index;
  else if (context && context.push && context.prefix != null) 
    prefix = context.prefix;
  else prefix = '';
  if (remove || state === false) {  
    storage.removeItem(index, prefix, callback || context || this, meta, storage);
  } else if (set) {
    storage.setItem(index, value, prefix, callback || context || this, meta, storage);
  } else if (!context && (!callback || callback !== value)) {
    var result = storage.getItem(value, prefix, callback || context || this, meta, storage);
    return (result == null) ? undefined : result;
  } else {  
    if (context.push && context._watch) 
      context.watch(self);
    storage.getAllItems(prefix, callback || context || this, meta, storage);
  }
};
LSD.Storage.prototype.setItem = function(key, value, prefix, callback, meta) {
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
  if (value == null) value = undefined;
  if (callback) this.callback(callback, '' + key, value, meta);
  return value;
}
LSD.Storage.prototype.getAllItems = function(prefix, callback, meta) {
  var j = this.adapter.getItem(prefix + 'length');
  for (var i = 0; i < j; i++) 
    this.getItem(i, prefix, callback, meta);
};
LSD.Storage.prototype.callback = function(callback, key, value, meta) {
  if (callback.set) {
    if (meta !== 'storage') 
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