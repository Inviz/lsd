/*
---
 
script: Target.js
 
description: Functions to fetch and parse targets
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD

provides: 
  - LSD.Module.Target

...
*/

!function() {
  var cache = {};
  LSD.Module.Target = new Class({
    behaviour: '[target][target!=_blank][target!=false]',

    options: {
      chain: {
        target: function() {
          var action = this.getTargetAction();
          if (action) return {name: action, target: this.getTarget, arguments: this.getTargetArguments}
        }
      }
    },
    
    getTarget: function(target, anchor) {
      if (!target && !(target = this.attributes.target)) return false;
      var parsed = this.parseTargetSelector(target);
      results = [];
      parsed.each(function(expression) {
        results.push.apply(results, Slick.search(anchor || expression.anchor || (this.document || document.body), expression.selector));
      }, this);
      return results.length > 0 && results.map(function(result) {
        if (result.localName) {
          var widget = Element.retrieve(result, 'widget');
          if (widget && widget.element == result) return widget
        }
        return result;
      });
    },
    
    parseTargetSelector: function(target) {
      if (cache[target]) return cache[target];
      var parsed = target.Slick ? target : Slick.parse(target);
      cache[target] = parsed.expressions.map(this.parseTarget.bind(this));
      return cache[target];
    },
  
    parseTarget: function(expression) {
      var pseudos = expression[0].pseudos;
      var pseudo = pseudos && pseudos[0];
      var result = {}
      if (pseudo && pseudo.type == 'element') { 
        if (Pseudo[pseudo.key]) {
          result.anchor = Pseudo[pseudo.key].call(this, pseudo.value);
          expression.shift();
        }
      }
      result.selector = {Slick: true, expressions: [expression], length: 1};
      return result;
    },

    getTargetAction: function() {
      return this.attributes.interaction || this.options.targetAction;
    }
  });
  
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
    element: function() {
      return this.element;
    }
  }

}();