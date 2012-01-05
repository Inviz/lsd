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

LSD.Module.Selectors = {
  
  
};

/* 
  Parses selector and generates options for widget 
*/
LSD.Module.Selectors.parse = function(selector, parent) {
  var options = {};
  var expressions = (selector.Slick ? selector : LSD.Slick.parse(selector)).expressions[0];
  for (var j = expressions.length, expression; expression = expressions[--j];) {
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
    if ((' ' + this.className + ' ').indexOf(bits) == -1) return false;
    for (var node = this; node = node.previousSibling;)
      if (node.nodeType == 1 && (' ' + node.className + ' ').indexOf(bits) > -1)
        return false;
    return true;
  },

  'last-of-class': function(klass){
    var bits = ' ' + klass + ' ';
    if ((' ' + this.className + ' ').indexOf(bits) == -1) return false;
    for (var node = this; node = node.nextSibling;) 
      if (node.nodeType == 1 && (' ' + node.className + ' ').indexOf(bits) > -1)
        return false;
      
    return true;
  },
  
  'only-of-class': function(klass){
    var bits = ' ' + klass + ' ';
    if ((' ' + this.className + ' ').indexOf(bits) == -1) return false;
    for (var node = this; node = node.previousSibling;)
      if (node.nodeType == 1 && (' ' + node.className + ' ').indexOf(bits) > -1)
        return false;
    for (var node = this; node = node.nextSibling;) 
      if (node.nodeType == 1 && (' ' + node.className + ' ').indexOf(bits) > -1)
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