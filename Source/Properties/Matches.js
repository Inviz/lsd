/*
---
 
script: Matches.js
 
description: A trait that allows to wait for related \s until they are ready
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Properties
  - LSD.Struct
  - LSD.Group
  - Slick/Slick.Parser

provides: 
  - LSD.Module.Matches
 
...
*/
  
LSD.Properties.Matches = LSD.Struct();
/*
  Matches observes selectors in small bites.

   Selector expression (e.g. `strong.important`) consists of a part that rarely
  changes in life time of a node (`strong` tag name) and another part that is
  dynamic (a class name `important` may be easily removed from a node)

   The idea is to split the selector bit to static and dynamic parts. The
  widget that is *match*ing the selector, groups his matches by tag name. Every
  node inserted into that element or its children will pick up matches related
  to it, thus matching static part of a selector - tag name and combinator.

   Then, dynamic part kicks in - a node observes its own state and fires
  callbacks when classes, pseudo classes or attributes are changed.
*/
LSD.Properties.Matches.prototype.__cast = function(key, value, old, meta, extra, hash) {
  if (typeof key == 'string') 
    key = (this._parsed[key] || (this._parsed[key] = Slick.parse(key)));
  var odef = old !== undefined, vdef = value !== undefined;
  if (key.expressions) key = key.expressions;
  if (typeof key.push == 'function') {
    for (var i = 0, j = key.length; i < j; i++) {
      var expressions = key[i];
      if (typeof expressions.push != 'function') expressions = key;
      var l = expressions.length;
      if (j == 1 && l == 1) {
        key = key[0][0]
        break; 
      }
      if (typeof meta != 'number') meta = 0;
      if (vdef) this.set(expressions[meta], {
        fn: this._advancer,
        bind: this,
        index: meta + 1,
        callback: value,
        expressions: expressions
      });
      if (odef) this.set(expressions[meta], undefined, old);
      if (j == 1 || expressions == key) break;
    }
    if (j > 1 || l > 1) return this._nonenumerable;
  }
  /* 
    Expression may be a state key, that expects current node
    to be in a specific state (classes, pseudos and attributes).
  */
  if (!key.combinator || key.combinator == '&' || meta === 'state') {
    for (var type in this._types) {
      var values = key[type];
      var storage = this._state || (this._state = {});
      if (values) for (var j = 0, val; (val = values[j++]) && (val = val.key || val.value);) {
        if (vdef) {
          var kind = storage[type] || (storage[type] = {});
          var group = kind[val] || (kind[val] = []);
          group.push([key, value, true]);
        }
        if (odef) {
          var array = storage[type][val];
          if (array) for (var k = array.length, fn; k--;)
            if ((fn = array[k][1]) == old || fn.callback == old) {
              array.splice(k, 1);
              break;
            }
        }
      }
    }
    if (this._owner && this._owner.test(key)) {
      if (vdef)
        if (typeof value == 'function') value(this._owner);
        else if (value.callback || value.bind)
          (value.fn || (value.bind || this._owner)[value.method]).call(value.bind || this._owner, value, this._owner)
      if (odef)
        if (typeof old == 'function') old(undefined, this._owner);
        else if (old.callback || old.bind)
          (old.fn || (old.bind || this._owner)[old.method]).call(old.bind || this._owner, old, undefined, this._owner)
    }
  /*
    Expression may also be matching other node by its combinator.
    Expectation is stored by its combinator & tag and stored in the object.
    Every time DOM structure changes, the object is notified about all 
    widgets that start matching a combinator-tag pair.
  */
  } else {
    var stateful = !!(key.id || key.attributes || key.pseudos || key.classes)
    if (vdef) {
      hash.push([key, value, stateful]);
      if (this._results) {
        var group = this._hash(key, null, null, null, this._results);
        for (var i = 0, widget; widget = group[i++];) {
          if (!stateful) {
            if (typeof value == 'function') value(widget);
            else if (value.callback || value.bind)
              (value.fn || (value.bind || this)[value.method]).call(value.bind || this, value, widget)
            else widget.mix(undefined, value, undefined, meta)
          } else widget.matches.set(key, value, undefined, 'state');
        }
      }
    }
    if (odef) {
      if (hash) for (var i = hash.length, fn; i--;) {
        if ((fn = hash[i]) && (fn = fn[1]) && (fn === old || fn.callback === old)) {
          if (this._results) {
            var group = this._hash(key, null, null, null, this._results);
            for (var j = 0, result; result = group[j++];) {
              if (!stateful) {
                if (typeof fn == 'function') fn(undefined, old);
                else if (fn.callback || fn.bind)
                  (fn.fn || (fn.bind || this)[fn.method]).call(fn.bind || this, fn, undefined, result)
                else result.mix(undefined, undefined, old, meta)
              } else result.matches.set(key, undefined, old, 'state');
            }
          }
          hash.splice(i, 1);
          break;
        }
      }
    }
  }
  return this._nonenumerable;
};
/*
  Advancer callback is called whenever a widget is matched selector expression.
  If an expression was a part of the complex selector and there are more 
  expressions to be matched, it recursively passes the same selector and 
  callback with incremented expression index to the matches object
  of a found widget. This makes it match widgets by the next expression in 
  selector. 
  
  When a widget that matches the last expression in a selector is found, 
  the callback is fired.
*/
LSD.Properties.Matches.prototype._advancer = function(call, value, old) {
  if (call.expressions[call.index] == null) {
    if (typeof call.callback == 'function') call.callback(value, old);
    else this._callback(call.callback, value, old)
  } else {
    if (value) value.matches.set(call.expressions, call.callback, undefined, call.index);
    if (old) old.matches.set(call.expressions, undefined, call.callback, call.index);
  }
};
/*
  It accepts singular parsed expressions, and returns the storage for given
  value - either callbacks or elements storage with a group dedicated to
  the combinator/tag pair. 
  
  Matches object also handles arrays of expressions, and even arrays of arrays
  of expression, but results are not stored in the object. Rather it walks
  the array of expression from left to right and handles each expression separately
  storing a callback that advances the selector to the next expression. 
*/
LSD.Properties.Matches.prototype._hash = function(key, value, old, meta, storage) {
  if (typeof key == 'string') {
    if (this._nonenumerable[key]) return;
    var parsed = this._parsed;
    key = (parsed[key] || (parsed[key] = Slick.parse(key))).expressions[0][0]
  }
  var tag = key.tag;
  if (!tag) return key;
  if (storage == null) storage = (value && value.lsd || old && old.lsd) 
    ? this._results || (this._results = {}) 
    : this._callbacks || (this._callbacks = {});
  var combinator = key.combinator || ' ';
  var group = storage[combinator];
  if (group == null) group = storage[combinator] = {};
  var array = group[tag];
  if (array == null) array = group[tag] = [];
  return array;
};
/*
  Matches structure joins two different worlds together. It allows
  to observe widgets and fire `callback` when certain `widget` 
  matches the `selector`. And when it stops matching, it fires 
  callback again with different arguments.
    
    * It manages observers for callbacks and maintains state in 
      complex selectors
    * It registers sibling nodes with simple selectors, so all
      simple combinator selector queries are precomputed. 
*/

/*
  `add` and `remove` functions are used for speedy widget registration. 
  It avoids selector parsing, because `combinator` and `tagName` 
  are provided given explicitly in arguments.
  
  If `wildcard` argument is given, it will also register 
  the widget with `*` tag by the same combinator.
*/
LSD.Properties.Matches.prototype.add = function(combinator, tag, value, wildcard) {
  if (this._types[combinator]) {
    var storage = this._state, group, owner = this._owner;
    if (!storage || !(group = storage[combinator]) || !(group = group[tag])) return;
    for (var i = 0, item; item = group[i++];)
      if (owner.test(item[0]))
        if (typeof item[1] == 'function') item[1](owner);
        else this._callback(item[1], owner);
  } else {
    if (value.lsd) {
      var storage = this._results || (this._results = {}), other = this._callbacks;
    } else {
      var storage = this._callbacks || (this._callbacks = {}), other = this._results;
    }
    var group = storage[combinator];
    if (group == null) group = storage[combinator] = {};
    for (var key = tag; key; key = key == tag && wildcard && '*') {
      var array = group[key];
      if (array == null) array = group[key] = [];
      array.push(value);
      if (other && (matched = other[combinator]) && (matched = matched[key])) {
        for (var i = 0, item; item = matched[i++];) {
          if (item[2] === false) {
            if (typeof item[1] == 'function') item[1](value);
            else this._callback(item[1], value);
          } else {
            value.matches.set(item[0], item[1], undefined, 'state');
          }
        }
      }
    }
  }
}
LSD.Properties.Matches.prototype.remove = function(combinator, tag, value, wildcard) {
  if (this._types[combinator]) {
    var storage = this._state, group, owner = this._owner;
    if (!storage || !(group = storage[combinator]) || !(group = group[tag])) return;
    for (var i = 0, item; item = group[i++];)
      if (owner.test(item[0], combinator, tag, value))
        if (typeof item[1] == 'function') item[1](undefined, owner);
        else this._callback(item[1], undefined, owner);
  } else {
    if (value.lsd) var storage = this._results, other = this._callbacks;
    else var storage = this._callbacks, other = this._results;
    if (storage == null) return false;
    var group = storage[combinator];
    if (group == null) return false;
    for (var key = tag; key; key = key == tag && wildcard && '*') {
      var array = group[key];
      if (!array) continue;
      var index = array.indexOf(value);
      if (index > -1) array.splice(index, 1);
      if (other && (matched = other[combinator]) && (matched = matched[key])) {
        for (var i = 0, item; item = matched[i++];) {
          if (item[2] === false) {
            if (typeof item[1] == 'function') item[1](undefined, value);
            else this._callback(item[1], undefined, value);
          } else value.matches.set(item[0], undefined, item[1], 'state');
        }
      }
    }
  }
}
LSD.Properties.Matches.prototype._types = {pseudos: 1, classes: 1, attributes: 1};
LSD.Properties.Matches.prototype._parsed = {};
LSD.Properties.Matches.prototype._composite = false;
LSD.Properties.Matches.prototype._watchable = null;