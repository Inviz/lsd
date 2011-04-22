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
      var results = [];
      if (!parsed.each) return parsed;
      parsed.each(function(expression) {
        if (!anchor) anchor = expression.anchor ? expression.anchor.call(this) : (this.document || document.body);
        if (expression.selector) results.push.apply(results, Slick.search(anchor, expression.selector));
        else if (anchor) results.push(anchor)
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
          result.anchor = function() {
            return Pseudo[pseudo.key].call(this, pseudo.value);
          }
          expression = expression.slice(1);
        }
      }  
      if (expression.length > 0) result.selector = {Slick: true, expressions: [expression], length: 1};
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