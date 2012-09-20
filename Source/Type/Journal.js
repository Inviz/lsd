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
  
  Journal objects are useful in an environment that objects influence state of
  each other, in a possibly conflicting way. It provides gentle conflict 
  resolution based on order in which values were set. The latest change is more 
  important, but it's easy to roll back. It is possible to insert the value
  into the beginning of the journal, or in other words do a reverse merge. 
  Values set in a reverse mode never overwrite values that were already there,
  and dont fire callbacks for those values. Shadowed values may be used later. 
  When a shadowing value is removed from journal, journal picks the previous
  value. A call to `unset` function  with a value that is on top of the stack
  may result in a call to `set` as a side effect, that sets the previous 
  value in journal. Very handy for live merging of objects.
  
  Setter method also accepts special `prepend` argument, that specifies if the
  value should be added on top or on the bottom of its stack. Unlike regular
  LSD.Object, setter of LSD.Journal optionally accepts `old` value that will
  be removed from the stack. It's a nice little convention that makes all the
  difference. All callbacks in LSD accept both new and an old value, so when
  both values are fed to setter, it handles side effects and ensures that a
  single callback wrote a single value to the journal.

   It should be noted that Journal does not accept `undefined` as values and
  ignores them. It is possible to give an `undefined` value and a defined
  `old` value, so a call to `_unset` method will be issued instead.
*/

LSD.Journal = function(object) {
  if (object != null) this.mix(object)
};

LSD.Journal.prototype = new LSD.Object;
LSD.Journal.prototype.constructor = LSD.Journal;
LSD.Journal.prototype._hash = function(key, value, old, meta, prepend, index) {
  if (this.__hash) {
    var hash = this.__hash(key, value, old, meta);
    switch (typeof hash) {
      case 'string':
        key = hash;
        hash = null;
        break;
      case 'boolean':
        return hash;
      case 'object':
        if (hash != null) var group = hash;
    }
  }
  if (hash == null) var index = key.indexOf('.');
  if (index === -1) {
    var journal = this._journal;
    if (!journal) journal = this._journal = {};
    var group = journal[key];
    if (!group) group = journal[key] = []
  }
/*
  Most of hash table implementations have a simplistic way to delete
  a key - they just erase the value. LSD.Journal's unset function 
  call may result in one of 3 cases

  * Value becomes undefined, like after a `delete object.key` call in
    javascript. It only happens if there was a single logged value by
    that key. Callbacks are called and passed that value as a second
    argument.
  * Value does not change, if the value being unset was not on top of
    the stack. It may also happen if there were two identical values 
    on top of the stack, so removing the top value falls back to the
    same value. Callbacks don't fire.
  * Value gets reverted to previous value on the stack. Callbacks are
    fired with both new and old value as arguments.
*/
  if (!group) return;
  var vdef = typeof value != 'undefined', odef = typeof old != 'undefined';
  var j = group.length
  if (!vdef && !odef)
    odef = typeof (old = group[j - 1]) != 'undefined';
  if (odef) for (var j = group.length, i = prepend ? -1 : j;; ) {
    if (prepend ? ++i == j : --i < 0) break;
    if (group[i] === old) {
      group.splice(i, 1);
      break;
    }
  }
  if (old && old[this._trigger] && !old._ignore) {
    this._unscript(key, old, meta)
  }
  if (vdef)
    if (prepend) {
      j = group.unshift(value) || group.length;
      value = group[j - 1];
      if (j !== 1) return true;
    } else {
      group.push(value);
      if (odef && old !== this[key])
        return this._set(key, value, undefined, meta, false, index, null);
    }
  else if (i < 0 || i == j) 
    return false;
  else {
    if ((value = group[j - 2]) && value[this._trigger] && !value._ignore)
      value = undefined;
    if (odef) 
      return this._set(key, value, undefined, meta, false, index, null);
  }
};
/*
  LSD.Journal is a subclass of LSD.Object and thus it inherits a method
  named `change` that is an alias to `set` with predefined `old` argument.
  As a LSD.Object method it does nothing of interest, but in LSD.Journal
  it pops the value on top the stack and then adds a new value instead.
  
  The method is useful to alter the value by the key in journalized hash
  from the outside:
    
    object.set('a', 1);             // adds value to stack
    console.log(object._journal.a)  // [1]
    object.set('a', 2);             // adds another value to the stack
    console.log(object._journal.a)  // [1, 2]
    object.change('a', 3);          // changes the value on top of the stack
    console.log(object._journal.a)  // [1, 3]
  
  Change method removes a value on top from the journal, but that may lead to
  unexpected results, if the top value was set by another entity that does
  not expect that value to be removed. It is possible to avoid side-effects
  completely by unsetting specific value that is known to be given by the party
  that invokes `change`. It is easy to do within a callback, because callbacks
  in LSD receive both old and new value:
  
    object.watch('a', function(value, old, meta) {
      object.set('b', value, old, meta);
    })
*/
LSD.Journal.prototype.change = function(key, value, meta, prepend) {
  return this.set(key, value, this[key], meta, prepend);
};
LSD.Struct.implement({
  _skip: {
    _journal: true
  }
}, LSD.Journal.prototype);