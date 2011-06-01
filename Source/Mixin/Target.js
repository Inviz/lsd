/*
---
 
script: Target.js
 
description: Functions to fetch and parse target into action chains
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Mixin

provides: 
  - LSD.Mixin.Target

...
*/

!function() {
  var cache = {};
  LSD.Mixin.Target = new Class({
    options: {
      chain: {
        target: function() {
          if (!this.attributes.target) return;
          return this.parseTargetSelector(this.attributes.target).map(function(chain) {
            if (!chain.action) chain.action = this.getTargetAction();
            if (!chain.action) return;
            if (chain.selector) chain.target = function() {
              return this.getTarget(chain.selector);
            }
            return chain;
          }.bind(this));
        }
      }
    },
    
    getTarget: function(selector) {
      if (!selector && !(selector = this.attributes.target)) return false;
      var results = this.getElements(selector)
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
      return this.attributes.interaction || this.captureEvent('getTargetAction', arguments);
    }
  });
  
  
  var Parser = LSD.Mixin.Target.Parser = {
    build: function(expression, start, end) {      
      var last = expression[end - start - 1];
      if (!last.classes && !last.attributes && last.tag == '*' && !last.id && last.pseudos[0].type == 'class') {
        var actions = last.pseudos
        end--;
      };
      var built = (start < end) ? {selector: Parser.slice(expression, start, end)} : {}
      if (actions) return actions.map(function(pseudo, i) {
          var object = Object.append({action: pseudo.key}, built);
          if (pseudo.value) object.arguments = pseudo.value;
          return object;
      }); else return built;
    },
    
    slice: function(expressions, start, end) {
      return {
        Slick: true,
        expressions: [expressions.slice(start, end)]
      };
    },
    
    exec: function(selector) {
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
  };
}();

LSD.Behavior.define('[target]', LSD.Mixin.Target);