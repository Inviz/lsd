/*
---
 
script: Matches.js
 
description: A trait that allows to wait for related \s until they are ready
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Type
  - LSD.Struct.Group

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
  
LSD.Type.Matches = LSD.Struct.Group();  
/*
  Expectation observes single selector expression. 
  
  Selector expression (e.g. `strong.important`) consists
  of a part that rarely changes in life time of a node
  (`strong` tag name) and another part that is dynamic
  (a class name `important` may be easily removed from 
  a node)
  
  The idea is to split the selector bit to static and dynamic
  parts. The widget that is *expect*ing the selector, groups
  his matches by tag name. Every node inserted into
  that element or its children will pick up matches
  related to it, thus matching static part of a selector
  - tag name and combinator. 
  
  Then, dynamic part kicks in - a node itself observes 
  the state and fires callbacks when classes, pseudo 
  classes or attributes are changed.
*/
LSD.Type.Matches.prototype.onChange = function(selector, callback, state, old, memo, hash) {
  /*
    Expression may be a string selector, so it gets parsed with Slick
  */
  if (typeof selector == 'string') {
    selector = Slick.parse(selector);
    if (callback.lsd) selector = selector.expressions[0];
  }
  /*
    Expression may be a parsed Slick selector, only expressions part is used then
  */
  var expression = selector.expressions || selector;
  /*
    If a selector is array of expressions, each of those expressions are processed then
  */
  if (callback.lsd) {
    if (typeof expression.push == 'function') expression = expression[memo || 0];
    if (this._callbacks) {
      var storage = this._hash(expression);
      for (var i = 0, group; group = storage[i++];) {
        if (group[2] === false) {
          if (typeof group[1] == 'function') group[1](callback, state);
          else this._callback(group[1], callback, state)
        } else callback.matches[state ? 'set' : 'unset'](group[0], group[1], group[2])
      }
    }
    return callback;
  } else if (typeof expression.push == 'function') {
    for (var i = 0, j = expression.length; i < j; i++) {
      var expressions = expression[i];
      if (typeof expressions.push != 'function') expressions = expression;
      var l = expressions.length;
      if (j == 1 && l == 1) break; 
      if (typeof memo != 'number') memo = 0;
      if (state) {
        this.set(expressions[memo], {
          fn: this.__watcher,
          bind: this,
          index: memo + 1,
          callback: callback,
          expressions: expressions
        });
      } else {
        this.unset(expressions[memo], callback);
      }
      if (j == 1 || expressions == expression) break;
    }
    if (j > 1 || l > 1) return;
  }
  /* 
    Expression may be a state selector, that expects current node
    to be in a specific state (classes, pseudos and attributes).
  */
  if (!expression.combinator || expression.combinator == '&' || memo === 'state') {
    for (var types = this._types, type, i = 0; type = types[i++];) {
      var values = expression[type];
      var storage = this._state || (this._state = {});
      if (values) for (var j = 0, value; (value = values[j++]) && (value = value.key || value.value);) {
        if (state) {
          var kind = storage[type];
          if (!kind) kind = storage[type] = {};
          var group = kind[value];
          if (!group) group = kind[value] = [];
          group.push([expression, callback, true]);
        } else {
          var array = group[bit.key || bit.value];
          if (array) for (var k = array.length, fn; k--;)
            if ((fn = array[k][1]) == callback || fn.callback == callback) {
              array.splice(k, 1);
              break;
            }
        }
      }
    }
    if (this._parent && this._parent.test(expression)) callback(this._parent, state);
  } else {
    /*
      Expression may also be matching other node according to its combinator.
      Expectation is indexed by its combinator & tag and stored in the object.
      Every time DOM structure changes, this object is notified about all 
      widgets that matches each of combinator-tag pair.
    */
    if (state) {
      var stateful = !!(expression.id || expression.attributes || expression.pseudos || expression.classes) 
      hash.push([expression, callback, stateful]);
      if (this._results) {
        var group = this._hash(expression, null, this._results);
        for (var i = 0, widget; widget = group[i++];) {
          if (stateful) widget.matches[state ? 'set' : 'unset'](expression, callback, 'state');
          else {
            if (typeof callback == 'function') callback(widget, state);
            else this._callback(callback, widget, state)
          }
        }
      }
    } else {
      if (hash) for (var i = hash.length, fn; i--;) {
        if ((fn = hash[i]) && (fn = fn[1]) && (fn === callback || fn.callback === callback)) {
          if (this._results) {
            var results = this._hash(expression, null, this._results);
            for (var j = 0, result; result = results[j++];) {
              if (typeof fn == 'function') fn(widget, state);
              else this._callback(fn, result, state)
            }
          }
          hash.splice(i, 1);
          break;
        }
      }
    }
  }
};
LSD.Type.Matches.prototype.__watcher = function(call, widget, state) {
  if (call.expressions[call.index] == null) {
    if (typeof call.callback == 'function') call.callback(widget, state);
    else this._callback(call.callback, widget, state)
  } else widget.matches[state ? 'set' : 'unset'](call.expressions, call.callback, call.index)
};
LSD.Type.Matches.prototype._hash = function(expression, value, storage) {
  if (typeof expression == 'string') expression = Slick.parse(expression).expressions[0][0];
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
LSD.Type.Matches.prototype._types = ['pseudos', 'classes', 'attributes'];