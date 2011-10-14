/*
---
 
script: Script/Interpolation.js
 
description: Tools to find and evaluate interpolated strings in text content and attributes
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Script.Function
  - LSD.Script.Scope
  
provides:
  - LSD.Script.Interpolation
  
...
*/

LSD.Script.Interpolation = function(object, source, element) {
  if (object.nodeType) {
    if (object.nodeType == 3)
      return LSD.Script.Interpolation.Textnode(object, source)
  } else if (Type.isEnumerable(object)) {
    for (var i = 0, attribute; attribute = object[i++];) {
      var copy = {name: attribute.name, value: attribute.value, ownerElement: element, nodeType: 2};
      var interpolated = LSD.Script.Interpolation.Attribute(copy.name, copy.value, source, copy);
      if (interpolated && interpolated.value == attribute.value) element.removeAttribute(copy.name);
    }
  } else if (type.toObject) {
    for (var name in type) {
      if (type.hasProperty(type))
        LSD.Script.Interpolation.Attribute(name, type[name], source)
    }
  }
};

LSD.Script.Interpolation.Attribute = function(name, value, source, attribute, forgiving) {
  var count = 0, last = 0, index, args;
  var regex = forgiving ? LSD.Layout.Interpolation.rForgivingBoundaries : LSD.Script.Interpolation.rBoundaries;
  for (var match, compiled; match = regex.exec(value);) {
    index = match.index;
    if (!args) args = [];
    if (index > last) args.push(value.substring(last, index));
    if (match[2] == "}" || match[2] == null) {
      args.push(LSD.Script({
        input: match[1],
        source: source,
        placeholder: match[0]
      }));
    }
    last = index + match[0].length;
  }
  if (args && last < value.length) args.push(value.substring(last, value.length));
  if (args) {
    if (!attribute) attribute = source.getAttributeNode(name);
    return new LSD.Script.Function(args, source, attribute, 'concat').attach();
  }
};

LSD.Script.Interpolation.Textnode = function(node, source, forgiving) {
  var content = node.textContent, finder, length = content.length;
  var regex = forgiving ? LSD.Layout.Interpolation.rForgivingBoundaries : LSD.Script.Interpolation.rBoundaries;
  for (var match, index, last, next, compiled; match = regex.exec(content);) {
    last = index || 0
    var index = match.index + match[0].length;
    expression = node;
    var cut = index - last;
    if (cut < node.textContent.length) node = node.splitText(index - last);
    if ((cut = (match.index - last))) expression = expression.splitText(cut);
    compiled = LSD.Script({
      input: match[1],
      source: source,
      output: expression,
      placeholder: match[0]
    });
    Element.store(expression, 'interpolation', compiled);
    last = index;
  }
}
// Find {interpolated} expressions in a string
LSD.Script.Interpolation.rBoundaries = /\\?\$\{([^{}]+)\}/g;
// Find {interpolated} expressions and tolerate {unclosed expressions
LSD.Script.Interpolation.rForgivingBoundaries = /\\?\$\{([^{}]+)(\}|$)/g;