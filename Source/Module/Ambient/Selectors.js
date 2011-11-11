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

/* 
  Parses selector and generates options for widget 
*/
LSD.Module.Selectors.parse = function(selector, parent) {
  var options = {};
  var expressions = (selector.Slick ? selector : Slick.parse(selector)).expressions[0];
  loop: for (var j = expressions.length, expression; expression = expressions[--j];) {
    switch (expression.combinator) {
      case ' ':
        break;
      case '::':
        if (LSD.Allocations[expression.tag]) {
          var allocation = options.allocation = LSD.Module.Allocations.compile(expression.tag, expression.classes, expression.attributes, expression.pseudos);
          if (allocation.options && allocation.options.source) {
            var source = allocation.options.source;
            delete allocation.options.source
          }
        } else {
          var relation = (parent[0] || parent).relations[expression.tag];
          if (!relation) throw "Unknown pseudo element ::" + expression.tag;
          options.source = relation.getSource();
        }
        break;
      default:
        if (expression.tag == '*' && !expression.classes && !expression.attributes && !expression.pseudos) {
          options.order = expression.combinator;
        } else {
          options.combinator = expression.combinator;
        }
    }
    if (expression.id) (options.attributes || (options.attributes = {})).id = expression.id
    if (expression.attributes) 
      for (var all = expression.attributes, attribute, i = 0; attribute = all[i++];) {
        var value = attribute.value || LSD.Attributes[attribute.key] == 'number' || "";
        (options.attributes || (options.attributes = {}))[attribute.key] = value;
      }
    if (expression.tag != '*' && expression.combinator != '::')
      if (expression.tag.indexOf('-') > -1) {
        options.source = expression.tag;
      } else {
        options.tag = expression.tag;
        var source = LSD.Layout.getSource(options, options.tag);
        if (source.push) options.source = source;
      }
    if (expression.classes) 
      for (var all = expression.classes, pseudo, i = 0; klass = all[i++];) 
        (options.classes || (options.classes = {}))[klass.value] = true;
    if (expression.pseudos) 
      for (var all = expression.pseudos, pseudo, i = 0; pseudo = all[i++];) 
        (options.pseudos || (options.pseudos = {}))[pseudo.key] = true;
  }
  return options;
};



var pseudos = {};
var Combinators = LSD.Module.Selectors.Combinators = {
  '$': function(node, tag, id, classes, attributes, pseudos, classList) { //this element
    if ((tag == '*') && !id && !classes && !attributes) return this.push(node, null, null, null, null, pseudos);
    else return this['combinator: '](node, tag, id, classes, attributes, pseudos, classList)
  },

  '$$': function(node, tag, id, classes, attributes, pseudos, classList) { //this element document
    if ((tag == '*') && !id && !classes && !attributes) return this.push(this.document.body, null, null, null, null, pseudos);
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

for (var name in Combinators) Slick.defineCombinator(name, Combinators[name]);

var Pseudos = LSD.Module.Selectors.Pseudos = {
  'first-of-class': function(klass){
    var bits = ' ' + klass + ' ';
    for (var node = this.previousSibling; node = node.previousSibling;)
      if ((' ' + node.className + ' ').indexOf(bits) > -1)
        return false;
    return true;
  },

  'last-of-class': function(klass){
    var bits = ' ' + klass + ' ';
    for (var node = this.nextSibling; node = node.nextSibling;) 
      if ((' ' + node.className + ' ').indexOf(bits) > -1)
        return false;
    return true;
  },
  
  'only-of-class': function(klass){
    var bits = ' ' + klass + ' ';
    for (var node = this; node = node.previousSibling;)
      if ((' ' + node.className + ' ').indexOf(bits) > -1)
        return false;
    for (var node = this; node = node.nextSibling;) 
      if ((' ' + node.className + ' ').indexOf(bits) > -1)
        return false;
    return true;
  }
}  

for (var name in Pseudos) Slick.definePseudo(name, Pseudos[name]);

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