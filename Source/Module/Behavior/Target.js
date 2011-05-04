/*
---
 
script: Target.js
 
description: Functions to fetch and parse targets
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module

provides: 
  - LSD.Module.Target

...
*/

!function() {
  var cache = {};
  LSD.Module.Target = new Class({
    options: {
      chain: {
        target: function() {
          if (!this.attributes.target) return;
          var action;
          return this.parseTargetSelector(this.attributes.target).map(function(chain) {
            console.log(Object.clone(chain), this.attributes.target)
            if (!chain.action) chain.action = this.getTargetAction();
            if (chain.selector) chain.target = function() {
              return this.getTarget(chain.selector, chain.anchor);
            }
            return chain;
          }.bind(this));
        }
      }
    },
    
    getTarget: function(target, base) {
      if (!target && !(target = this.attributes.target)) return false;
      var results = [];
      if (!base) base = this.document || document.body;
      var add = function(expression) {
        var anchor = (expression.anchor || base);
        if (anchor.indexOf) anchor = Pseudo[anchor];
        if (anchor && anchor.call) anchor = anchor.call(this);
        console.log(expression.anchor, anchor, this)
        if (expression.selector) results.push.apply(results, Slick.search(anchor, expression.selector));
        else if (expression.anchor) results.push(anchor)
      };
      if (target.Slick) add.call(this, {selector: target})
      else if (target.indexOf) this.parseTargetSelector(target).each(add, this);
      else add.call(target, base);
      console.log(target, results.length);
      return results.length > 0 && results.map(function(result) {
        if (result.localName) {
          var widget = Element.retrieve(result, 'widget');
          if (widget && widget.element == result) return widget
        }
        return result;
      });
    },
  
    parseTargetSelector: function(selector) {
      if (cache[selector]) return cache[selector]
      return cache[selector] = Parser.exec.apply(Parser, arguments)
    },

    getTargetAction: function() {
      return this.attributes.interaction;
    }
  });
  
  
  var Parser = LSD.Module.Target.Parser = {
    build: function(expression, start, end) {      
      var built = {};
      var first = expression[start];
      if (!first.classes && !first.attributes && first.tag == '*' && !first.id && first.pseudos.length == 1) {
        var pseudo = first.pseudos[0];
        if (pseudo.type == 'element') {
          built.anchor = pseudo.key;
          start++;
        }
      }
      if (end > start  + (!built.anchor)) {
        var last = expression[end - start - (!built.anchor)];
        if (!last.classes && !last.attributes && last.tag == '*' && !last.id && last.pseudos[0].type == 'class') {
          var actions = last.pseudos
          end--;
        };
      }
      if (start != end) built.selector = Parser.slice(expression, start, end);
      return !actions ? built : actions.map(function(pseudo, i) {
        var object = (i == 0) ? built : Object.clone(built)
        object.action = pseudo.key;
        if (pseudo.value) object.arguments = pseudo.value;
        return object;
      });
    },
    
    slice: function(expressions, start, end) {
      return {
        Slick: true,
        expressions: [expressions.slice(start, end)]
      };
    },
    
    exec: function(selector) {
    console.log(selector)
      var parsed = selector.Slick ? selector : Slick.parse(selector), expressions = [];
      for (var i = 0, expression; expression = parsed.expressions[i]; i++) {
        var started = 0;
        for (var j = 0, k = expression.length - 1, selector; selector = expression[j]; j++) {
          var joiner = Joiners[selector.combinator];
          if (joiner || j == k) {
            var exp = Parser.build(expression, started, (joiner ? j : j + 1));
            expressions.push[exp.push ? 'apply' : 'call'](expressions, exp);
          }
        }
      }
      return expressions;
    }
  };
  
  var Joiners = Parser.Joiners = {
    '&': function(a, b) {
      return a() && b()
    },
    '|': function(a, b) {
      return a() || b()
    }
  }
  
  var Pseudo = LSD.Module.Target.Pseudo = {
    document: function() {
      return this.document;
    },
    body: function() {
      return this.document.element;
    },
    page: function() {
      return document.body;
    },
    self: function() {
      return this;
    },
    parent: function() {
      return this.parentNode
    },
    element: function() {
      return this.element;
    },
    'parent-element': function() {
      return this.element.parentNode
    }
  }

}();