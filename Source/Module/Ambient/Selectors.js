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
  
  // we have to figure the document before we do a .search  
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
    var handler = Pseudos[name];
    if (handler && (handler = handler.apply(this, arguments))) return handler;
    return this[name];
  }
});

var Pseudos = LSD.Module.Selectors.PseudoElements = {
  dialog: function(type) {
    return 
  }
}

var Combinators = LSD.Module.Selectors.Combinators = {
  '$': function(node, tag, id, classes, attributes, pseudos) { //this element
    return this.push(node, tag, id, classes, attributes, pseudos)
  },

  '$$': function(node, tag, id, classes, attributes, pseudos) { //this element document
    if ((tag == '*') && !id && !classes && !attributes) return this.push(this.document.body, null, null, null, null, pseudos);
    else return this['combinator: '](this.document.body, tag, id, classes, attributes, pseudos);
  }
};

Combinators['&'] = Combinators['$'];
Combinators['&&'] = Combinators['$$'];

for (name in Combinators) Slick.defineCombinator(name, Combinators[name])

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