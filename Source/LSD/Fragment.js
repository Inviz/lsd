/*
---
 
script: Fragment.js
 
description: A subset of nodes, a template or a parsed html string
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Struct.Stack

provides: 
  - LSD.Fragment
 
...
*/

LSD.Fragment = LSD.Struct({
  initialize: function() {
    this.childNodes = new LSD.Type.Children.Virtual
  }
});

LSD.Fragment.prototype.nodeType = 11;
LSD.Fragment.prototype.render = function(object, parent, memo) {
  return this[this.typeOf(object)](object, parent, memo);
};
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
    widget = parent.document.createNode(nodeType, object, memo);
  else if (memo && memo.clone) 
    widget = widget.cloneNode()
  if (widget.parentNode != parent) parent.appendChild(widget, memo);
  if (children)
    for (var i = 0, child, array = this.slice.call(children, 0); child = array[i]; i++)
      this.node(child, parent);
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
  for (var i = 0, result = [], length = object.length, val; i < length; i++) {
    val = object[i];
    result[i] = this[this.typeOf(val)](val, parent, memo)
  }
  return result;
};
LSD.Fragment.prototype.object = function(object, parent, memo) {
  for (var selector in object) {
    if (typeof object.has == 'function' ? !object.has(selector) : !object.hasOwnProperty(selector)) continue;
  }
};
LSD.Fragment.prototype.string = function(object, parent, memo) {
  
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
        if (!word/* || !parent.methods.lookup(word)*/) {
          return LSD.Script()
        }

    }
  }
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