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
  
  Journal objects are useful in an environment where objects influence state of
  each other, in a possibly circular way. It provides gentle conflict 
  resolution based on order in which values were set. The latest change is more 
  important, but it's easy to roll back. It is possible to insert the value
  into the beginning of the journal, or reverse merge objects persistently. 
  Values set in a reverse mode never overwrite values that were already there,
  and dont fire callbacks for those values. Shadowed values may be used later. 
  When a shadowing value is removed from journal, journal picks the previous
  value. A call to `unset` function  with a value that is on top of the stack
  may result in a call to `set` as a side effect, that sets the previous 
  value in journal. Very handy for live merging of objects.
  
  Setter method also accepts special `prepend` argument. When true it adds
  values to the bottom of the stack. When number, it writes the value into 
  a separate section of a journal by that index. 
  
  Journal setters optionally accepts `old` value that will be removed from 
  the stack. It's a nice little convention that makes all the difference. 
  All callbacks in LSD accept both new and an old value, so when both values 
  are fed to setter, it handles side effects and ensures that a single 
  callback wrote a single value to the journal.
*/

LSD.Journal = function(object) {
  if (object != null) this._mix(undefined, object)
};

LSD.Journal.prototype = new LSD.Object;
LSD.Journal.prototype.constructor = LSD.Journal;
LSD.Journal.prototype._hash = function(key, value, old, meta, prepend, get) {
  if (prepend == 'watch' || prepend == 'get' || key.indexOf('.') > -1) return;
  var property = this._properties;
  if (property && (property = property[key]) && property.journal === false)
    return;
  switch (typeof prepend) {
    case 'number':
      var position = prepend;
      prepend = false;
      break;
    case 'string':
      switch (prepend) {
        case 'over': case 'under':
          var val = value || old;
          if (typeof val == 'object' && !val.exec && !val.push && !val.nodeType)
              return;
          prepend = prepend == 'under';
          break;
        default:
          prepend = prepend == 'before';
          break;
      }
  }
  var journal = this._journal;
  if (journal) {
    var group = journal[key];
    if (group) {
      var positioned = group.position;
      var before = group.hasOwnProperty('before')
      var after = group.hasOwnProperty('after');
      var j = group.length;
      if (j && value === undefined)
        for (var k = j; old === undefined && --k > -1;)
          old = group[k];
    }
  }
  var chunked = property && property.chunked, current = this[key];
  if (positioned == null) positioned = -1;
  if (before) positioned ++;
  if (after) positioned ++;
  if (old !== undefined) {
    var erasing = old === current;
    if (j && position == null)
      for (var i = prepend ? positioned : j;; ) {
        if (prepend ? ++i == j : --i < positioned + 1) break;
        if (group[i] === old) {
          group.splice(i, 1);
          if (i == j - 1) erasing = true;
          break;
        }
      }
    if (old && old._calculated)
      this._watch(key, undefined, old, meta)
  } else old = current;
  if (position != null) {
    if (!group) {
      if (!journal) journal = this._journal = {};
      group = journal[key] = [];
      if (current !== undefined) {
        group.push(current);
        j = 1;
      }
    }
    if (isFinite(position)) {
      if (position > positioned - (before || 0) - (after || 0)) {
        group.position = position;
      }
      if (after) positioned --;
      if (before) position ++;
    } else if (position > 0) {
      position = (positioned || 0) + +(value !== undefined && !after);
      group.after = value;
    } else {
      position = 0;
      group.before = value;
    }
    var diff = position - positioned;
    if (diff > 0)
      for (var i = j, k = positioned; --i > k;)
        group[i + diff] = group[i];
    if (value !== undefined) {
      if (diff > 0)
        j += diff;
      group[position] = value;
    } else
      delete group[position];
    if (chunked) 
      return null;
    if (j)
      for (var k = j; --k > -1;)
        if (group[k] !== undefined)
          if (value === undefined) {
            value = group[k]
            break;
          } else if (k > position) return true;
    if (k > -1)
      return this._set(key, value, undefined, meta, undefined, false);
    return;
  }
  if (value !== undefined) {
    if (group || (current !== undefined && !erasing && this.hasOwnProperty(key))) {
      if (!group) {
        if (!journal) journal = this._journal = {};
        group = journal[key] = [];
        if (current !== undefined) group.push(current);
      }
      if (prepend) {
        group.splice(positioned + 1, 0, value);
        if (group.length > positioned + 2)
          return true;
      } else {
        group.push(value);
      }
    }
  } else {
    if (j != null) {
      if (i < positioned + 1 || i === j)
        return false;
      else if (!erasing)
        return true;
      else if (j > 1) {
        for (var k = j; k > -1; k--)
          if ((value = group[k]) !== undefined && (!value || !value[this._trigger] || !value._ignore))
            break;
      } else return;
    } else if (old !== current) 
      return false;
    return this._set(key, value, undefined, meta, undefined, false);
  }
    
};
LSD.Journal.prototype._finalize = function(key, value, old, meta, prepend, hash, val) {
  if (val === value) return;
  var journal = this._journal;
  var group = journal && journal[key];
  if (!group) (journal || (this._journal = {}))[key] = [val];
}
LSD.Journal.prototype.change = function(key, value, old, meta, prepend) {
  if (old === undefined) {
    var group = this._journal;
    if (group && (group = group[key])) {
      for (var j = group.length; --j;) {
        var val = group[j];
        if (val !== undefined) {
          old = val;
          break;
        }
      }
    } else old = this[key];
  }
  return this._set(key, value, old, meta, prepend);
};
LSD.Struct.implement({
  _nonenumerable: {
    _journal: true
  }
}, LSD.Journal.prototype);