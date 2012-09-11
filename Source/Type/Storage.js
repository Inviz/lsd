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
  if (this instanceof LSD.Storage) {
    if (value === false) return;
    storage = function(v, i, s, o, m) {
      return LSD.Storage.call(this, v, i, s, o, m, value, index, storage)
    }
    storage.prototype = new LSD.Storage(false);
    return storage;
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
  else 
    prefix = '';
  if (remove || state === false) {  
    storage.removeItem(index, prefix, callback || context || this, meta, storage);
  } else if (set) {
    storage.setItem(index, value, prefix, callback || context || this, meta, storage);
  } else if (!context && (!callback || callback !== value)) {
    var result = storage.getItem(value, prefix, callback || context || this, meta, storage);
    return (result == null) ? undefined : result;
  } else {  
    if (context.push && context.watch) 
      context.watch(self);
    storage.getAllItems(prefix, callback || context || this, meta, storage);
  }
};
LSD.Storage.prototype.callback = function(callback, key, value, meta) {
  if (callback.set) {
    if (meta !== 'storage') 
      callback[typeof value == 'undefined' ? 'unset' : 'set'](key, value, undefined, 'storage');
  } else if (callback.call) 
    callback(key, value, meta)
  else if (typeof value != 'undefined') 
    callback[key] = value;
  else {
    delete callback[key];
    if (callback.push && callback.length == parseInt(key) + 1)
      callback.length = key;
  }
}
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



//LSD.Storage.IDB = new LSD.Storage(undefined, 'IDB');
//LSD.Storage.IDB.prototype.database = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB;
//LSD.Storage.IDB.prototype.transaction = window.IDBTransaction || window.mozDBTransaction  || window.webkitIDBTransaction;
//LSD.Storage.IDB.prototype.open = function(name, version) {
//  var request = this.database.open(name, version || 1);
//  var self = this;
//  request.onsuccess = function(event) {
//    return self.onOpenSuccess(event, name);
//  }
//  request.onfailure = function(event) {
//    return self.onOpenError(event, name);
//  }
//  request.onupgradeneeded = function(event) {
//    return self.onUpgradeNeeded(event, name);
//  }
//  return request;
//}
//LSD.Storage.IDB.prototype.getTransaction = function(name, mode) {
//  var db = this.database || (this.database = this.open());
//  return db.transaction(name, mode).objectStore(name);
//}
//LSD.Storage.IDB.prototype.onOpenSuccess = function(event, name) {
//  
//}
//LSD.Storage.IDB.prototype.onOpenError = function(event, name) {
//  
//}
//LSD.Storage.IDB.prototype.setItem = function(key, callback, storage, prefix) {
//  var transaction = this.getTransaction(prefix);
//  transaction.onsuccess = this
//}
//LSD.Storage.IDB.prototype.removeItem = function() {
//  
//}
//LSD.Storage.IDB.prototype.getItem = function() {
//
//}
//LSD.Storage.IDB.prototype.getAllItems = function() {
//  
//}
//
//LSD.Storage.IDB.prototype.onUpgradeNeeded = function(event, name) {
//  var db = event.target.result;
//  db.createObjectStore(name, 1)
//}
