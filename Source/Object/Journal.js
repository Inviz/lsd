/*
---

script: Journal.js

description: An observable object that remembers values

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Object
  - LSD.Struct

provides:
  - LSD.Journal

...
*/

/*
  Journal object is an abstraction that aggregates have its key-values pairs 
  from multiple sources. All calls to `set` and `unset` functions are logged, 
  so when the value gets unset, it returns to previous value 
  (that was set before, possibly by a different external object).
  
  Journal objects are useful in an environment that objects influence each other,
  some times in a conflicting way, because it provides gentle conflict 
  resolution based on order of execution. The latest change is more 
  important, but it's easy to roll back. It is possible to insert the value
  into the beginning of the journal, or in other words do a reverse merge. 
  Values set in a reverse mode never overwrite values that were already there,
  and dont fire callbacks for those values. Shadowed values may be used later
  anyways, when a shadowing value is removed from journal, it picks the previous
  value. A call to `unset` function  with a value that is on top of the journal
  may result in a call to `set` as a side effect, that sets the previous 
  value in journal. Very handy for objects live merging.
  
  Setter method also accepts special `prepend` argument, that specifies
  if the value should be added on top or on the bottom of its stack. 
  Unlike regular LSD.Object, setter of LSD.Journal optionally accepts 
  `old` value that will be removed from the stack. It's a nice little
  convention that makes all the difference. All callbacks in LSD
  accept both new and an old value, so when both values are fed to
  setter, it handles side effects and ensures that a single callback
  wrote a single value to the journal.
  
  It should be noted that Journal does not accept `undefined` as values
  and ignores them. It is possible to give an `undefined` value
  and a defined `old` value, so a call to `_unset` method will be 
  issued instead. 
*/

LSD.Journal = function(object) {
  if (object != null) this.mix(object)
};

LSD.Journal.prototype = new LSD.Object;
LSD.Journal.prototype.constructor = LSD.Journal,
LSD.Journal.prototype.set = function(key, value, memo, prepend, old) {
  if (typeof key != 'string') {
    var hash = this._hash(key);
    if (typeof hash == 'string') {
      key = hash;
      var index = key.indexOf('.');
    } else {
      if (hash == null) return;
      var group = hash;
    }
  } else var index = key.indexOf('.');
  if (index === -1) {
    var journal = this._journal;
    if (!journal) journal = this._journal = {};
    var group = journal[key];
    if (!group) group = journal[key] = []
  }
  var vdef = typeof value != 'undefined';
  if (group != null) {
    if (typeof old != 'undefined') {
      var j = group.length;
      if (prepend) {
        for (var i = 0; i < j; i++) if (group[i] === old) {
            group.splice(i, 1);
            break;
          }
      } else {
        for (; --j > -1;) if (group[j] === old) {
            group.splice(j, 1);
            break;
          }
      }
    }
    if (vdef)
      if (prepend) {
        var length = group.unshift(value);
        if (length > 1) value = group[length - 1];
      } else group.push(value);
    else if (j == null || j == (i == null ? -1 : i)) 
      return false;
  }
  if (!vdef) return this._unset(key, old, memo, index, hash);
  var eql = value === this[key];
  if (!eql && !this._set(key, value, memo, index, hash)) {
    if (group) prepend ? group.shift() : group.pop();
    return false;
  }
  return !eql
};
LSD.Journal.prototype.unset = function(key, value, memo, prepend, hash) {
  if (typeof key != 'string') {
    if (hash == null) hash = this._hash(key);
    if (typeof hash == 'string') {
      key = hash;
      var index = key.indexOf('.');
    } else {
      if (hash == null) return;
      var group = hash;
    }
  } else {
    var index = key.indexOf('.');
  }
  if (group == null && index === -1) {
    var group = this._journal[key];
    if (!group) return;
    var length = group.length;
  }
  if (group != null) {
    if (typeof value == 'undefined') {
      if (prepend) group.shift();
      else group.pop()
    } else {
      if (prepend) {
        for (var i = 0, j = length; i < j; i++)
          if (group[i] === value) {
            group.splice(i, 1);
            break;
          }
        if (j == i) return
      } else {
        for (var j = length; --j > -1;)
          if (group[j] === value) {
            group.splice(j, 1);
            break;
          }
        if (j == -1) return
      }
    }
    if (length > 1) {
      if (value != null && value[this._trigger]) {
        this._unscript(key, value, memo, index, hash);
        if (--length === 1) return true;
      }
      var val = group[length - 2];
      if (val == null || !val[this._trigger]) {
        var method = '_set';
        value = val;
      }
    }
  }
  if (method !== '_set' || value != this[key])
    return this[method || '_unset'](key, value, memo, index, hash);
  else return false;
};
/*
  Change method first sets the new value, and triggers all callbacks,
  and then removes old value from the journal without calling callbacks.
  
  The method is useful to alter the state of the object in an 
  journal-based object and not pollute the journals with changed
  values. When objects use .change() to mutate the state of an object,
  even in the case of the conflicting change, no values will be lost
  in the journal, but only the top value on the journal of them will be used.
  
  Change method is a helper, but not the best method, because it
  produces side effect to value journals. It removes a value on top
  of a journal, but it's often possible to avoid any side-effects
  whatsoever. When dealing with callbacks and properties
  handlers it is better to use a pair of `set` & `unset` explicitly
  because callbacks have a reference to old value and may avoid
  screwing up the journal. The side effect often stay unnoticed
  and in some situations is the best thing to do. Use with caution.
*/
LSD.Journal.prototype.change = function(key, value, memo) {
  var old = this[key];
  this.set(key, value, memo);
  if (typeof old != 'undefined') this.unset(key, old, memo)
  return true;
};
LSD.Journal.prototype._skip = Object.append({_journal: true}, LSD.Object.prototype._skip);