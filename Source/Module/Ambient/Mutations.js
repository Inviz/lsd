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

LSD.Module.Mutations = new Class({
  constructors: {
    mutations: function() {
      this.mutations = {};
    }
  },
  
  mutate: function(selector, callback, object) {
    if (selector.indexOf) selector = Slick.parse(selector);
    if (selector.expressions) selector = selector.expressions[0][0];
    if (!object) object = this.mutations;
    if (!object) object = this.mutations = {};
    var mutations = this.mutations[selector.combinator];
    if (!mutations) mutations = this.mutations[selector.combinator] = {};
    var group = mutations[selector.tag];
    if (!group) group = mutations[selector.tag] = [];
    group.push([selector, callback]);
  },
  
  unmutate: function(selector, callback, iterator) {
    if (selector.indexOf) selector = Slick.parse(selector);
    if (selector.expressions) selector = selector.expressions[0][0];
    if (iterator === true) iterator = function(widget) {
      if (widget.match(selector)) callback(widget, false);
    };
    var group = this.mutations[selector.combinator][selector.tag];
    for (var i = group.length; i--;) {
      var fn = group[i][1]; 
      if (fn == callback || fn.callback == callback) {
        group.splice(i, 1);
        break;
      }
    };
    group.push([selector, callback]);
  },
  
  addMutation: function(selector, callback) {
    if (selector.indexOf) selector = Slick.parse(selector);
    if (this.document && !this.document.building) Slick.search(this.element, selector).each(function(node) {
      var parent = LSD.Module.DOM.find(node);
      var options = Object.append({context: this.options.context}, callback.indexOf ? LSD.Layout.parse(callback) : callback);
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
      this.mutate(expressions[0], watcher || callback);
    }, this);
  },
  
  removeMutation: function(selector, callback, depth) {
    if (selector.indexOf) selector = Slick.parse(selector);
    if (!depth) depth = 0;
    selector.expressions.each(function(expressions) {
      this.unmutate(expressions[depth], callback, function(widget) {
        if (expressions[depth + 1]) widget.unwatch(selector, callback, depth + 1)
        else callback(widget, false)
      });
    }, this);
  }
})

LSD.Options.mutations = {
  add: 'addMutation',
  remove: 'removeMutation',
  iterate: true
};