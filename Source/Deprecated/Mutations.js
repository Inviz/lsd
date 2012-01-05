/*
---
 
script: Mutations.js
 
description: Mutate elements into structures in one pass
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module.Expectations

provides: 
  - LSD.Module.Mutations
 
...
*/

LSD.Module.Mutations = LSD.Struct({
  
});

LSD.Module.Mutations.implement({
  onChange: function(expression, callback, state, old, memo) {
    if (state) {
      if (selector.indexOf) selector = LSD.Slick.parse(selector);
      if (this.document && !this.document.building) LSD.Slick.search(this.element, selector).each(function(node) {
        var parent = LSD.Module.DOM.find(node);
        var options = Object.append({context: this.options.context}, callback.indexOf ? LSD.Module.Selectors.parse(callback) : callback);
        var mutated = this.document.create(node, options);
        if (parent) parent.appendChild(mutated, false);
      }, this);
      selector.expressions.each(function(expressions) {
        var expression = expressions[1];
        if (expression) {
          var watcher = function(widget, state, depth) {
            if (!depth) depth = 0;
            var expression = expressions[depth + 1];
            if (expression) {
              var obj = {};
              obj[expression.tag] = [[expression, function() {
                return expressions[depth + 2] ? watcher(selector, callback, depth + 1) : callback;
              }]];
              return [expression.combinator, obj]
            } else return callback;
            watcher.callback = callback;
          };
        }
        var mutations = this.mutations[selector.combinator];
        if (!mutations) mutations = this.mutations[selector.combinator] = {};
        var group = mutations[selector.tag];
        if (!group) group = mutations[selector.tag] = [];
        group.push([selector, callback]);
      }, this);
    } else {
      if (!depth) depth = 0;
      selector.expressions.each(function(expressions) {
        var group = this[selector.combinator][selector.tag];
        for (var i = group.length; i--;) {
          var fn = group[i][1]; 
          if (fn == callback || fn.callback == callback) {
            group.splice(i, 1);
            break;
          }
        };
        group.push([selector, callback]);
      }, this);
    }
  },
  _hash: function(expression) {
    if (typeof expression == 'string') expression = LSD.Slick.parse(key).expressions[0][0];
    var storage = this._storage || (this._storage = {})
    return (storage[combinator] || (storage[combinator] = {}))[tag] || (storage.id[tag] = []);
  }
})