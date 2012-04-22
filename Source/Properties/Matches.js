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

provides: 
  - LSD.Module.Matches
 
...
*/

/*
  The best way to customize widget behavior, is to define a widget role. The role may be further extended or reused by widgets with the 
  matching tag name. But a widget can only have one role at time. There is a way to provide additional customizations to widget through 
  use of mixins, a reusable class definition that may be applied on top of the widget role. Both role and mixins are applied when the 
  widget matches specific condition. Widgets can find their role easily, because often the role name matches with the widget tag name, so 
  their condition would be a specific tag name. But mixins may also be triggered with any selector, for example, watching for a specific 
  pseudo class. LSD.Behavior is used to make mixin observe a selector, so every mixin comes with a pre-defined behavior. Behavior may be 
  also used to apply plain widget options, instead of mixins.        
*/

/*
  Provides additional behavor for LSD Widgets. 

  There are several ways to define a new behavior (commands). For a complete list of commands, refer Widget guide.
      
  As pseudo:

    LSD.Behavior.define(':submittable', 'submittable')
  
  As pseudo containing certain attributes:

    LSD.Behavior.define(':form[acttion], [src], [href]', 'request')
  
  As an object containing certain attributes

    LSD.Behavior.define('[scrollable]', 'scrollable')

  Submitable, Request and Scrollable in the given examples are retrieved from LSD.Mixin object (they are LSD.Mixin.Submitable, LSD.Mixin.Request,
  LSD. Mixin.Scrollable).

  You can also specify a concerete class:

    LSD.Behavior.define('[scrollable]', LSD.Mixin.Scrollable)

*/
  
LSD.Properties.Matches = LSD.Struct('Group');
/*
  Matches observes selectors in small bites.
  
  Selector expression (e.g. `strong.important`) consists
  of a part that rarely changes in life time of a node
  (`strong` tag name) and another part that is dynamic
  (a class name `important` may be easily removed from 
  a node)
  
  The idea is to split the selector bit to static and dynamic
  parts. The widget that is *match*ing the selector, groups
  his matches by tag name. Every node inserted into
  that element or its children will pick up matches
  related to it, thus matching static part of a selector
  - tag name and combinator. 
  
  Then, dynamic part kicks in - a node itself observes 
  the state and fires callbacks when classes, pseudo 
  classes or attributes are changed.
*/
LSD.Properties.Matches.prototype.onChange = function(key, value, meta, old, hash) {
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
      if (odef) this.unset(expressions[meta], old);
      if (j == 1 || expressions == key) break;
    }
    if (j > 1 || l > 1) return this._skip;
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
          var kind = storage[type];
          if (!kind) kind = storage[type] = {};
          var group = kind[val];
          if (!group) group = kind[val] = [];
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
        else if (value.callback)
          (value.fn || (value.bind || this._owner)[value.method]).call(value.bind || this._owner, value, this._owner)
      if (odef)
        if (typeof old == 'function') old(undefined, this._owner);
        else if (old.callback)
          (old.fn || (old.bind || this._owner)[old.method]).call(old.bind || this._owner, old, undefined, this._owner)
    }
  /*
    Expression may also be matching other node according to its combinator.
    Expectation is indexed by its combinator & tag and stored in the object.
    Every time DOM structure changes, this object is notified about all 
    widgets that match each of combinator-tag pair.
  */
  } else {
    var stateful = !!(key.id || key.attributes || key.pseudos || key.classes)
    if (vdef) {
      hash.push([key, value, stateful]);
      if (this._results) {
        var group = this._hash(key, null, this._results);
        for (var i = 0, widget; widget = group[i++];) {
          if (!stateful) {
            if (typeof value == 'function') value(widget);
            else if (value.callback)
              (value.fn || (value.bind || this)[value.method]).call(value.bind || this, value, widget)
            else widget.mix(value, null, meta)
          } else widget.matches.set(key, value, 'state');
        }
      }
    }
    if (odef) {
      if (hash) for (var i = hash.length, fn; i--;) {
        if ((fn = hash[i]) && (fn = fn[1]) && (fn === old || fn.callback === old)) {
          if (this._results) {
            var group = this._hash(key, null, this._results);
            for (var j = 0, result; result = group[j++];) {
              if (!stateful) {
                if (typeof fn == 'function') fn(undefined, old);
                else if (fn.callback || fn.bind)
                  (fn.fn || (fn.bind || this)[fn.method]).call(fn.bind || this, fn, undefined, result)
                else result.mix(undefined, undefined, meta, old)
              } else result.matches.unset(key, old, 'state');
            }
          }
          hash.splice(i, 1);
          break;
        }
      }
    }
  }
  return this._skip;
};
/*
  Advancer callback is called whenever a widget is matched selector expression.
  If an expression was a part of the complex selector and there are more 
  expressions to be matched, it passes the same selector and callback 
  with a previously incremented index  to the matches object
  of a found widget. This makes it match widgets by the next expression in 
  selector. 
  
  When an element that matches the last expression in a selector is found, 
  the callback is called.
*/
LSD.Properties.Matches.prototype._advancer = function(call, value, old) {
  if (call.expressions[call.index] == null) {
    if (typeof call.callback == 'function') call.callback(value, old);
    else this._callback(call.callback, value, old)
  } else {
    if (value) value.matches.set(call.expressions, call.callback, call.index);
    if (old) old.matches.unset(call.expressions, call.callback, call.index);
  }
};
/*
  Hash hook allows Matches object to handle keys with types other than string.
  
  It accepts singular parsed expressions, and returns the storage for given
  value - either callbacks or elements storage with a group dedicated to
  the combinator/tag pair. 
  
  Matches object also handles arrays of expressions, and even arrays of arrays
  of expression, but results are not stored in the object. Rather it walks
  the array of expression from left to right and handles each expression separately
  storing a callback that advances the selector to the next expression. 
*/
LSD.Properties.Matches.prototype._hash = function(expression, value, storage) {
  if (typeof expression == 'string') {
    if (this._skip[expression]) return;
    expression = (this._parsed[expression] || (this._parsed[expression] = Slick.parse(expression))).expressions[0][0]
  }
  var tag = expression.tag;
  if (!tag) return false;
  if (storage == null) storage = value != null && value.lsd 
    ? this._results || (this._results = {}) 
    : this._callbacks || (this._callbacks = {});
  var combinator = expression.combinator || ' ';
  var group = storage[combinator];
  if (group == null) group = storage[combinator] = {};
  var array = group[tag];
  if (array == null) array = group[tag] = [];
  return array;
};
/*
  Matches structure join two different worlds together. It allows
  to observe widgets and fire `callback` when certain `widget` 
  matches the `selector`. And when it stops matching, it fires 
  callback again with different arguments.
    
    * It manages observers for callbacks and maintains state in 
      complex selectors
    * It registers sibling nodes with simple selectors, so all
      simple combinator selector queries are precomputed. 
    
*/

/*
  `add` and `remove` pair of functions are used for speedy 
  widget registering. It avoids selector parsing, because
  `combinator` and `tagName` are given in arguments.
  
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
            value.matches.set(item[0], item[1], 'state');
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
          } else value.matches.unset(item[0], item[1], 'state');
        }
      }
    }
  }
}
LSD.Properties.Matches.prototype._types = {pseudos: 1, classes: 1, attributes: 1};
LSD.Properties.Matches.prototype._parsed = {};