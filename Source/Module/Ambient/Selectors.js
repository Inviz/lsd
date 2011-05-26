/*
---
 
script: Selectors.js
 
description: Define a widget associations
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module
  - Core/Slick.Finder

provides: 
  - LSD.Module.Selectors

...
*/

!function() {

LSD.Module.Selectors = new Class({
  getElements: function(selector, origin) {
    return Slick.search(origin || this.getSelectorOrigin(selector), selector)
  },
  
  getElement: function(selector, origin) {
    return Slick.find(origin || this.getSelectorOrigin(selector), selector)
  },
  
  /*
    We have to figure the document before we do a .search
    to let Slick switch into the right mode and be prepared
  */
    
  getSelectorOrigin: function(selector) {
    if (!selector.Slick) selector = Slick.parse(selector);
    var first = selector.expressions[0][0];
    switch (first.combinator) {
      case "$": case "$$":
        return this.element;
      case "&": case "&&": default:
        return this;
    }
    return Slick.search(origin, selector)
  },
  
  getElement: function(selector) {
    return Slick.find(this, selector)
  },
  
  getPseudoElementsByName: function(name) {
    var handler = PseudoElements[name];
    if (handler && (handler = handler.apply(this, arguments))) return handler;
    return this[name];
  },
  
  match: function(selector) {
    if (typeof selector == 'string') selector = Slick.parse(selector);
    if (selector.expressions) selector = selector.expressions[0][0];
    if (selector.combinator == '::') {
      if (selector.tag && (selector.tag != '*')) {
        var group = this.expectations['!::'];
        if (!group || !(group = group[selector.tag]) || !group.length) return false;
      }
    } else {
      if (selector.tag && (selector.tag != '*') && (this.tagName != selector.tag)) return false;
    }
    if (selector.id && (this.attributes.id != selector.id)) return false;
    if (selector.attributes) for (var i = 0, j; j = selector.attributes[i]; i++) 
      if (j.operator ? !j.test(this.attributes[j.key] && this.attributes[j.key].toString()) : !(j.key in this.attributes)) return false;
    if (selector.classes) for (var i = 0, j; j = selector.classes[i]; i++) if (!this.classes[j.value]) return false;
    if (selector.pseudos) {
      for (var i = 0, j; j = selector.pseudos[i]; i++) {
        var name = j.key;
        if (this.pseudos[name]) continue;
        var pseudo = pseudos[name];
        if (pseudo == null) pseudos[name] = pseudo = Slick.lookupPseudo(name) || false;
        if (pseudo === false || (pseudo && !pseudo.call(this, this, j.value))) return false;
      }
    }
    return true;
  }
});
var pseudos = {};


var PseudoElements = {
  
};

var Combinators = LSD.Module.Selectors.Combinators = {
  '$': function(node, tag, id, classes, attributes, pseudos) { //this element
    return this.push(node, tag, id, classes, attributes, pseudos)
  },

  '$$': function(node, tag, id, classes, attributes, pseudos) { //this element document
    if ((tag == '*') && !id && !classes && !attributes) return this.push(this.document.body, null, null, null, null, pseudos);
    else return this['combinator: '](this.document.body, tag, id, classes, attributes, pseudos);
  },
  
  '::': function(node, tag, id, classes, attributes, pseudos) {
    var value = node[tag];
    if (value) {
      for (var i = 0, element, result = [], ary = (value.length == null) ? [value] : value; element = ary[i]; i++) 
        this.push(element, null, id, classes, attributes, pseudos);
    }
  }
};

Combinators['&'] = Combinators['$'];
Combinators['&&'] = Combinators['$$'];

for (name in Combinators) Slick.defineCombinator(name, Combinators[name]);

LSD.Module.Selectors.Features = {
  brokenStarGEBTN: false,
  starSelectsClosedQSA: false,
  idGetsName: false,
  brokenMixedCaseQSA: false,
  brokenGEBCN: false,
  brokenCheckedQSA: false,
  brokenEmptyAttributeQSA: false,
  isHTMLDocument: false,
  nativeMatchesSelector: false,
  hasAttribute: function(node, attribute) {
    return (attribute in node.attributes) || ((attribute in node.$states) && (attribute in node.pseudos))
  },
  getAttribute: function(node, attribute) {
    return node.attributes[attribute] || ((attribute in node.$states) || node.pseudos[attribute]);
  },
  getPseudoElementsByName: function(node, name, value) {
    var collection = node.getPseudoElementsByName ? node.getPseudoElementsByName(name) : node[name];
    return collection ? (collection.push ? collection : [collection]) : [];
  }
};

}();