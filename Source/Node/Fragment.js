/*
---
 
script: Fragment.js
 
description: A subset of nodes, a template or a parsed html string
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Struct.Stack
  - LSD.Properties.ChildNodes

provides: 
  - LSD.Fragment
 
...
*/

LSD.Fragment = LSD.Struct({
  initialize: function() {
    this.childNodes = new LSD.Properties.ChildNodes.Virtual
  }
});

LSD.Fragment.prototype.nodeType = 11;
LSD.Fragment.prototype.node = 
LSD.Fragment.prototype.element =
LSD.Fragment.prototype.fragment = 
LSD.Fragment.prototype.instruction =
LSD.Fragment.prototype.textnode = function(object, parent, memo) {
  var uid      = object.lsd,
      widget   = uid && LSD.widgets[uid],
      nodeType = object.nodeType, 
      children = nodeType == 1 && object.childNodes;
  if (!widget) 
    widget = parent.document.createNode(nodeType, object);
  else if (memo && memo.clone) 
    widget = widget.cloneNode()
  if (widget.parentNode != parent) parent.appendChild(widget, memo);
  if (children)
    for (var i = 0, child, array = this.slice.call(children, 0); child = array[i]; i++)
      this.node(child, parent, memo);
  return widget;
};
LSD.Fragment.prototype.comment = function(object, parent, memo) {
  this.instruction(object)
};
LSD.Fragment.prototype.enumerable = 
LSD.Fragment.prototype.arguments =
LSD.Fragment.prototype.collection = 
LSD.Fragment.prototype.children =
LSD.Fragment.prototype.array = function(object, parent, memo) {
  for (var i = 0, length = object.length; i < length; i++)
    this[this.typeOf(object[i])](object[i], parent, memo)
};
LSD.Fragment.prototype.object = function(object, parent, memo) {
  var skip = object._skip, value, result;
  for (var selector in object) {
    if (!object.hasOwnProperty(selector) || (skip && skip[selector])) continue;
    result = this.instruction(selector, parent, memo) || this.selector(selector, parent, memo);
    if ((value = object[selector]))
      this[this.typeOf(value)](value, result, memo);
  }
};
LSD.Fragment.prototype.string = function(object, parent, memo) {
  var node = parent.document.createTextNode(object);
  parent.appendChild(node, memo);
  return node;
};
LSD.Fragment.prototype.selector = function(object, parent, memo) {
  var node = parent.document.createElement(object).setSelector(object);
  parent.appendChild(node, memo);
  return node;
};
LSD.Fragment.prototype.instruction = function(object, parent, memo) {
  if (typeof object.nodeType == 'number') {
    var element = object;
    object = element.nodeValue;
    if (object.charAt(0) == '?') {
      var length = object.length;
      if (object.charAt(length - 1) == '?') object = object.substring(1, length - 2);
    }
  }
  if (typeof object == 'string') {
    switch (object.charAt(0)) {
      case '-': case '=':
      
      default:
        var word = object.match(this.R_WORD);
        /*if (word || !parent.methods.lookup(word)) 
          return */
        

    }
    var node = parent.document.createInstruction(object);
    parent.appendChild(node);
    return node;
  }
};
LSD.Fragment.prototype.render = function(object, parent, memo) {
  return this[this.typeOf(object)](object, parent, memo);
};
LSD.Fragment.prototype.typeOf = function(object, memo) {
  var type = typeof object;
  if (type == 'object') {
    if (typeof object.nodeType == 'number') return 'node';
    if (typeof object.length == 'number') return 'enumerable';
  }
  return type;
};
LSD.Fragment.prototype.slice = Array.prototype.slice;
LSD.Fragment.prototype.R_WORD = /\w/; 