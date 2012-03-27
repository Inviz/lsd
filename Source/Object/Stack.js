/*
---

script: Stack.js

description: An observable object that remembers values

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Object
  - LSD.Struct

provides:
  - LSD.Stack

...
*/

/*
  Stack object is an abstraction that aggregates have its key-values pairs 
  from multiple sources. All calls to `set` and `unset` functions are logged, 
  so when the value gets unset, it returns to previous value 
  (that was set before, possibly by a different external object).
  
  Stack objects are useful in an environment that objects influence each other,
  some times in a conflicting way, because it provides gentle conflict 
  resolution based on order of execution. The latest change is more 
  important, but it's easy to roll back. It is possible to insert the value
  into the beginning of the stack, or in other words do a reverse merge. 
  Values set in a reverse mode never overwrite values that were already there,
  and dont fire callbacks for those values. Shadowed values may be used later
  anyways, when a shadowing value is removed from stack, it picks the previous
  value. A call to `unset` function  with a value that is on top of the stack
  may result in a call to `set` as a side effect, that sets the previous 
  value in stack. Very useful for objects live-merging.  
*/

LSD.Stack = function(object) {
  if (object != null) this.mix(object)
};

LSD.Stack.prototype = new LSD.Object;
LSD.Stack.prototype.constructor = LSD.Stack,
LSD.Stack.prototype.set = function(key, value, memo, prepend, hash) {
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
    var stack = this._stack;
    if (!stack) stack = this._stack = {};
    var group = stack[key];
    if (!group) group = stack[key] = []
  }
  if (group != null) {
    if (prepend) {
      var length = group.unshift(value);
      if (length > 1) value = group[length - 1];
    } else group.push(value);
  }
  var eql = value === this[key];
  if (!eql && !this._set(key, value, memo, index, hash)) {
    prepend ? group.shift() : group.pop();
    return false;
  }
  return !eql
};
LSD.Stack.prototype.unset = function(key, value, memo, prepend, hash) {
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
    var group = this._stack[key];
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
    if (length > 1 && (value == null || !value.script)) {
      var method = '_set';
      value = group[length - 2];
    } else var method = '_unset';
  }
  if (method !== '_set' || value != this[key])
    return this[method || '_unset'](key, value, memo, index, hash);
  else return false;
};
/*
  Change method first sets the new value, and triggers all callbacks,
  and then removes old value from the stack without calling callbacks.
  
  The method is useful to alter the state of the object in an 
  stack-based object and not pollute the stacks with changed
  values. When objects use .change() to mutate the state of an object,
  even in the case of the conflicting change, no values will be lost
  in the stack, but only the top value on the stack of them will be used.
  
  Change method is a helper, but not the best method, because it
  produces side effect to value stacks. It removes a value on top
  of a stack, but it's often possible to avoid any side-effects
  whatsoever. When dealing with callbacks and properties
  handlers it is better to use a pair of `set` & `unset` explicitly
  because callbacks have a reference to old value and may avoid
  screwing up the stack. The side effect often stay unnoticed
  and in some situations is the best thing to do. Use with caution.
*/
LSD.Stack.prototype.change = function(key, value, memo) {
  var old = this[key];
  this.set(key, value, memo);
  if (typeof old != 'undefined') this.unset(key, old, memo)
  return true;
};
LSD.Stack.prototype._skip = Object.append({_stack: true}, LSD.Object.prototype._skip);