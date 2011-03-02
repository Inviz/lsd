/*
---
 
script: Target.js
 
description: A mixins that assigns command targets from selectors in markup
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
 
provides:
  - LSD.Mixin.Target
 
...
*/

(function() {
  var cache = {};
  
  LSD.Mixin.Target = new Class({
    behaviour: '[target][target!=_blank][target!=false]',
  
    getTarget: function(target) {
      if (!target) target = this.attributes.target;
      if (!target) return false;
      var parsed = this.parseTargetSelector(target);
      results = [];
      parsed.each(function(expression) {
        results.push.apply(results, Slick.search(expression.anchor || (this.document ? this.document.element : document.body), expression.selector));
      }, this);
      return results;
    },
    
    parseTargetSelector: function(target) {
      if (cache[target]) return cache[target];
      var parsed = Slick.parse(target);
      cache[target] = parsed.expressions.map(this.parseTarget.bind(this));
      return cache[target];
    },
  
    parseTarget: function(expression) {
      var pseudos = expression[0].pseudos;
      var pseudo = pseudos && pseudos[0];
      var result = {}
      if (pseudo && pseudo.type == 'element') { 
        if (Pseudo[pseudo.key]) {
          result.anchor = Pseudo[pseudo.key](pseudo.value);
          expression.shift();
        }
      }
      result.selector = {Slick: true, expressions: [expression], length: 1};
      return result;
    },
    
    commit: function(action) {
      return this.getTarget().map(function(target) { 
        return this.execute(target, action) 
      }.bind(this));
    }
  });
  
  var Pseudo = LSD.Mixin.Target.Pseudo = {
    document: function() {
      return this.document;
    },
    body: function() {
      return this.document.element;
    },
    self: function() {
      return this;
    },
    element: function() {
      return this.element;
    }
  }

})();