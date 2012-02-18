/*
---
 
script: Fragment.js
 
description: A subset of nodes, a template or a parsed html string
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Element
  - LSD.Properties.ChildNodes

provides: 
  - LSD.Fragment
 
...
*/

LSD.Fragment = function(argument, parent) {
  if (this.nodeType) this.childNodes = this;
  var length = arguments.length;
  if (!length) return;
  if (length === 1 || (parent == null || parent.lsd))
    if (argument.nodeType === 11 && !argument.lsd) this.enumerable(argument.childNodes)
    else this[typeof argument == 'string' ? 'html' : this.typeOf(argument)](argument);
  else this.enumerable(arguments);
};
LSD.Fragment.prototype = new LSD.Properties.ChildNodes.Virtual;
LSD.Fragment.prototype.nodeType = 11;
LSD.Fragment.prototype.node = function(object, parent, memo, nodeType) {
  var uid      = object.lsd,
      widget   = uid && LSD.UIDs[uid], 
      children = object.childNodes;
  if (!nodeType) nodeType = object.nodeType
  if (!parent) parent = this;
  if (!widget) 
    widget = (parent && parent.document || LSD.Document.prototype).createNode(nodeType, object);
  else if (memo && memo.clone) 
    widget = widget.cloneNode();
  if (widget.parentNode != parent) parent.appendChild(widget, memo);
  if (children)
    for (var i = 0, child, array = this.slice.call(children, 0); child = array[i]; i++)
      this.node(child, widget, memo);
  return widget;
};
LSD.Fragment.prototype.comment = function(object, parent, memo) {
  return this.instruction(object, parent, memo) || this.node(object, parent, memo, 8);
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
        break;
      case '!':
        break;
      default:
        var word = object.match(this.R_WORD);
        if (!word || !(word = word[0]) || !LSD.Script.prototype.lookup(word, null, parent))
          return false;
        

    }
    return this.node(object, parent, memo, 5)
  }
};
LSD.Fragment.prototype.enumerable = function(object, parent, memo) {
  for (var i = 0, length = object.length; i < length; i++)
    this[this.typeOf(object[i])](object[i], parent, memo)
};
LSD.Fragment.prototype.element    = LSD.Fragment.prototype.fragment = 
LSD.Fragment.prototype.textnode   = LSD.Fragment.prototype.node;
LSD.Fragment.prototype.arguments  = LSD.Fragment.prototype.collection = 
LSD.Fragment.prototype.children   = LSD.Fragment.prototype.array 
                                  = LSD.Fragment.prototype.enumerable;
LSD.Fragment.prototype.object = function(object, parent, memo) {
  var skip = object._skip, value, result;
  for (var selector in object) {
    if (!object.hasOwnProperty(selector) || (skip && skip[selector])) continue;
    result = this.instruction(selector, parent, memo) || this.node(selector, parent, memo, 1);
    if ((value = object[selector])) {
      var type = this.typeOf(value);
      if (type === 'string') this.node(value, result, memo, 3);
      else this[type](value, result, memo);
    }
  }
};
LSD.Fragment.prototype.string = function(object, parent, memo) {
  return this.node(object, parent, memo, 3);
};
LSD.Fragment.prototype.html = function(object, parent, memo) {
  if (!this._dummy) {
    this._dummy = document.createElement('div');
		/*@cc_on this._dummy.style.display = 'none';@*/
	}
	/*@cc_on document.body.appendChild(this._dummy);@*/
	this._dummy.innerHTML = object.toString();
	/*@cc_on document.body.removeChild(this._dummy);@*/
  return this.enumerable(this.slice.call(this._dummy.childNodes), parent, memo);
};
LSD.Fragment.prototype.selector = function(object, parent, memo) {
  return this.node(object, parent, memo, 1);
};
LSD.Fragment.prototype.render = function(object, parent, memo) {
  var type = this.typeOf(object);
  if (type === 'string') this.node(object, parent, memo, 3)
  else return this[type](object, parent, memo);
};
LSD.Fragment.prototype.typeOf = function(object, memo) {
  var type = typeof object;
  if (type == 'object') {
    if (typeof object.nodeType == 'number') return 'node';
    if (typeof object.length == 'number') return 'enumerable';
  }
  return type;
};
LSD.Fragment.prototype.slice        = Array.prototype.slice;
['appendChild', 'insertBefore', 'removeChild', 'inject', 'grab'].each(function(method) {
  LSD.Fragment.prototype[method] = LSD.Element.prototype[method];
});
LSD.Fragment.prototype.R_WORD       = /\w+/; 