/*
---
 
script: Fragment.js
 
description: A subset of nodes, a template or a parsed html string
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Element
  - LSD.Node
  - LSD.ChildNodes

provides: 
  - LSD.Fragment
 
...
*/

LSD.Fragment = function(argument, parent) {
  if (this.nodeType) {
    this.childNodes = this;
    this.variables = new LSD.Object.Stack;
  }
  var length = arguments.length;
  if (!length) return;
  if (length === 1 || (parent == null || parent.lsd))
    if (argument.nodeType === 11 && !argument.lsd) this.enumerable(argument.childNodes)
    else this[typeof argument == 'string' ? 'html' : this.typeOf(argument)](argument);
  else this.enumerable(arguments);
}
LSD.Fragment.prototype = new LSD.ChildNodes.Virtual;
LSD.Struct.implement.call(LSD.Fragment, LSD.Node.prototype);
LSD.Fragment.prototype.nodeType = 11;
LSD.Fragment.prototype.render = function(object, parent, memo) {
  var type = this.typeOf(object);
  if (type === 'string') this.node(object, parent, memo, 3)
  else return this[type](object, parent, memo);
};
LSD.Fragment.prototype.node = function(object, parent, memo, nodeType) {
  var uid      = object.lsd,
      widget   = uid && LSD.UIDs[uid], 
      children = object.childNodes;
  if (!nodeType) nodeType = object.nodeType
  if (!parent) parent = this;
  if (!widget) switch (nodeType) {
    case 8: case 3:
      if ((widget = this.instruction(object, parent, memo)))
        return widget;
    default:
      widget = (parent && parent.document || LSD.Document.prototype).createNode(nodeType, object);
  } else if (memo && memo.clone) 
    widget = widget.cloneNode();
  if (widget.parentNode != parent) parent.appendChild(widget, memo);
  if (children)
    for (var i = 0, child, array = this.slice.call(children, 0), previous; child = array[i]; i++)
      this.node(child, widget, memo);
  return widget;
};
LSD.Fragment.prototype.instruction = function(object, parent, memo, connect) {
  if (typeof object.nodeType == 'number') {
    var origin = object;
    object = origin.nodeValue;
    if (object.charAt(0) == '?') {
      var length = object.length;
      if (object.charAt(length - 1) == '?') object = object.substring(1, length - 2);
    }
  }
  if (memo) memo.range = this;
  if (typeof object == 'string') {
    var chr = object.charAt(0);
    switch (chr) {
      case '-': case '=': case '!':
        object = object.substr(1);
        break;
      default:
        chr = null;
        var word = object.match(this.R_WORD);
        if (!word || !(word = word[0]) || (!LSD.Script.Boundaries[word] && !LSD.Script.prototype.lookup.call(parent, word)))
          return false;
        
    }
    var instruction = this.node(object, parent, memo, 5), node;
    if (origin) instruction.set('origin', origin);
    if (chr) instruction.set('mode', chr);
    if (word === 'end') instruction.closed = true;
    if (LSD.Script.Boundaries[word] && (node = this.connect(instruction, connect))) {
      node.set('next', instruction);
      instruction.set('previous', node)
    }
    return instruction;
  }
};  
/*
  When fragment encounters instruction that is known
  to be a boundary of a conditional block, it goes back
  in stack of rendered nodes and finds the matching
  instruction to register node range.
*/
LSD.Fragment.prototype.connect = function(instruction, write) {
  if (instruction.parentNode == this || instruction.parentNode == this.parentNode) {
    for (var l = this.__length, j = l - 1, node; k == null && (--j > -1);)
      if ((node = this[j]).nodeType == 5 && !node.next && !node.closed)
        if (write !== false) 
          for (var k = j + 1; k < l - 1; k++)
            node.set(k - j - 1, this[k]);
        else break;
  } else {
    for (var node = instruction; node = node.previousSibling;) 
      if (node.nodeType == 5 && !node.next)
        if (write !== false) 
          for (var child = node; (child = child.nextSibling) && child != instruction;)
            node.push(child);
        else break;
  }
  if (!node) throw "Can't find an instruction to connect with " + instruction.name
  node.closed = true;
  return node;
}
LSD.Fragment.prototype.enumerable = function(object, parent, memo) {
  for (var i = 0, length = object.length, instruction, previous; i < length; i++)
    this[this.typeOf(object[i])](object[i], parent, memo);
};
LSD.Fragment.prototype.object = function(object, parent, memo) {
  var skip = object._skip, value, result, ancestor;
  for (var selector in object) {
    if (!object.hasOwnProperty(selector) || (skip && skip[selector])) continue;
    if (!(result = this.instruction(selector, parent, memo, false)))
      result = this.node(selector, parent, memo, 1);
    if ((value = object[selector])) {  
      var type = this.typeOf(value);
      if (type === 'string') this.node(value, result, memo, 3);
      else this[type](value, result, memo);
      if (result.nodeType == 5 && LSD.Script.Boundaries[result.name]) result.closed = true;
    }
  }
};
LSD.Fragment.prototype.string = function(object, parent, memo) {
  return this.node(object, parent, memo, 3);
};
LSD.Fragment.prototype.html = function(object, parent, memo) {
  if (!this._dummy) {
    this._dummy = document.createElement('div')
    /*@cc_on this._dummy.style.display = 'none' @*/
  }
  /*@cc_on document.body.appendChild(this._dummy) @*/
  this._dummy.innerHTML = object.toString();
  /*@cc_on document.body.removeChild(this._dummy) @*/
  return this.enumerable(this.slice.call(this._dummy.childNodes), parent, memo);
};
LSD.Fragment.prototype.selector = function(object, parent, memo) {
  return this.node(object, parent, memo, 1);
};
LSD.Fragment.prototype.typeOf = function(object) {
  var type = typeof object;
  if (type == 'object') {
    if (typeof object.nodeType == 'number') return 'node';
    if (typeof object.length == 'number') return 'enumerable';
  }
  return type;
};
LSD.Fragment.prototype.R_WORD = /\w+/; 