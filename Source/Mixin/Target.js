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
            chain = Object.append({}, chain);
            if (!chain.action && !(chain.action = this.getTargetAction())) return;
            if (chain.selector) {
              chain.target = function(callback, state, revert) {
                if (chain.keyword == 'watch' || (chain.keyword == 'do' && chain.selector.expressions[0][0].combinator.charAt(0) != '$')) {
                  this[(state == true && revert) ? 'unmatch' : 'match'](chain.selector, callback);
                  return true;
                } else {
                  return this.getElements(chain.selector);
                }
              }.bind(this)
            };
            switch (chain.keyword) {
              case "before":
                chain.priority = 50;
                break;
              case "after":
                chain.priority = -50;
            }
            return chain;
          }.bind(this));
        }
      }
    },
  
    parseTargetSelector: function(selector) {
      return (cache[selector] || (cache[selector] = Parser.exec.apply(Parser, arguments)))
    },

    getTargetAction: function() {
      return this.attributes.interaction || this.captureEvent('getTargetAction', arguments);
    }
  });
  
  
  var Parser = LSD.Mixin.Target.Parser = {
    build: function(expression, start, end, keyword) {      
      var last = expression[end - start - 1];
      if (!last.classes && !last.attributes && last.tag == '*' && !last.id && last.pseudos[0].type == 'class') {
        var actions = last.pseudos
        end--;
      };
      if (keyword) start++;
      var built = (start < end) ? {selector: Parser.slice(expression, start, end)} : {}
      if (actions) return actions.map(function(pseudo, i) {
        var object = Object.append({action: pseudo.key}, built);
        var action = LSD.Action[LSD.toClassName(pseudo.key)];
        var priority = action && action.prototype.options && action.prototype.options.priority;
        if (priority != null) object.priority = priority;
        if (pseudo.value) object.arguments = pseudo.value;
        if (keyword) object.keyword = keyword;
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
      var parsed = selector.Slick ? selector : LSD.Slick.parse(selector), expressions = [];
      for (var i = 0, expression; expression = parsed.expressions[i]; i++) {
        var started = 0;
        var first = expression[0];
        var keyword = Keywords[first.tag] ? first.tag : null; 
        var exp = Parser.build(expression, started, expression.length, keyword);
        expressions.push[exp.push ? 'apply' : 'call'](expressions, exp);
      }
      return expressions;
    }
  };
  
  var Keywords = Parser.Keywords = Array.object('if', 'then', 'else', 'or', 'and', 'before', 'do', 'watch');
}();

LSD.Behavior.define('[target]', LSD.Mixin.Target);