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
    switch (first.combinator.charAt(0)) {
      case "$":
        return this.element;
      default:
        return this;
    }
  },
  
  getPseudoElementsByName: function(name) {
    return this.captureEvent('getRelated', arguments) || this[name];
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

var Combinators = LSD.Module.Selectors.Combinators = {
  '$': function(node, tag, id, classes, attributes, pseudos, classList) { //this element
    if ((tag == '*') && !id && !classes && !attributes && !pseudos) return this.push(node, null, null, null, null, pseudos);
    else return this['combinator: '](node, tag, id, classes, attributes, pseudos, classList)
  },

  '$$': function(node, tag, id, classes, attributes, pseudos, classList) { //this element document
    if ((tag == '*') && !id && !classes && !attributes && !pseudos) return this.push(this.document.body);
    else return this['combinator: '](this.document.body, tag, id, classes, attributes, pseudos, classList);
  },
  
  '::': function(node, tag, id, classes, attributes, pseudos) {
    var found = this.found;
    var value = this.getPseudoElementsByName(node, tag, id, classes, attributes, pseudos);
    this.found = found;
    if (value)
      for (var i = 0, element, result = [], ary = (value.length == null) ? [value] : value; element = ary[i]; i++)
        this.push(element, '*', id, classes, attributes);
  }
};

Combinators['&'] = Combinators['$'];
Combinators['&&'] = Combinators['$$'];
for (var combinator in Combinators) 
  if (combinator != '::') Combinators[combinator + '::'] = Combinators['::'];

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
  documentSorter: function(a, b) {
    if (!a.sourceIndex || !b.sourceIndex) return 0;
		return a.sourceIndex - b.sourceIndex;
  },
  hasAttribute: function(node, attribute) {
    return (attribute in node.attributes) || ((attribute in node.$states) && (attribute in node.pseudos))
  },
  getAttribute: function(node, attribute) {
    return node.attributes[attribute] || ((attribute in node.$states) || node.pseudos[attribute]);
  },
  getPseudoElementsByName: function(node, name, id, classes, attributes, pseudos) {
    var collection = node.getPseudoElementsByName ? node.getPseudoElementsByName(name, id, classes, attributes, pseudos) : node[name];
    return collection ? (collection.push ? collection : [collection]) : [];
  }
};

}();