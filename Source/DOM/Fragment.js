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

/*
  Fragment is a piece of layout, like a rendered template
  or parsed HTML response, that is an array and a node
  at the same time. A fragment array contains all 
  rendered top level nodes, and a fragment node is an
  abstraction for those nodes to insert or remove the
  nodes just as if it was a single node. 
*/

LSD.Fragment = function(argument) {
  if (!this.render) return LSD.Fragment.apply(new LSD.Fragment, arguments)
  if (this.nodeType) {
    this.childNodes = this;
    this.variables = new LSD.Object.Stack;
  }
  var length = arguments.length;
  if (!length) return;
  if (length === 1)
    if (argument.nodeType === 11 && !argument.lsd) this.enumerable(argument.childNodes)
    else this[typeof argument == 'string' ? 'html' : this.typeOf(argument)](argument);
  else this.enumerable(arguments);
  return this;
}
LSD.Fragment.prototype = new LSD.ChildNodes.Virtual;
LSD.Struct.implement.call(LSD.Fragment, LSD.Node.prototype);
LSD.Fragment.prototype.nodeType = 11;
/*
  Render method accepts any objects and translates them 
  into LSD objects that resemble regular DOM.
*/
LSD.Fragment.prototype.render = function(object, parent, memo) {
  var type = this.typeOf(object);
  if (type === 'string') this.node(object, parent, memo, 3)
  else return this[type](object, parent, memo);
};
/*
  Nodes may be of different types: textnodes, elements, fragments, 
  instructions and documents.
  Processing a node may result in 3 scenarios:
    * Element node is converted into LSD.Element
    * Element node was already an LSD.Element and not converted
    * Element node was already an LSD.Element and was cloned
*/
LSD.Fragment.prototype.node = function(object, parent, memo, nodeType) {
  var uid      = object.lsd,
      widget   = object.mix ? object : uid && LSD.UIDs[uid], 
      children = object.childNodes;
  if (!nodeType) nodeType = object.nodeType || 1;
  if (!parent) parent = this;
  if (!widget) switch (nodeType) {
    case 8: case 3:
      if ((widget = this.instruction(object, parent, memo)))
        return widget;
    default:
      widget = (parent && parent.document || LSD.Document.prototype).createNode(nodeType, object, this);
  } else if (memo && memo.clone) 
    widget = widget.cloneNode();
  if (widget.parentNode != parent) parent.appendChild(widget, memo);
  if (children)
    for (var i = 0, child, array = this.slice.call(children, 0), previous; child = array[i]; i++)
      this.node(child, widget, memo);
  return widget;
};
/*
  Instruction is a forgotten type of node that was used
  to instruct a DOM tree with a special command
  (XML stylesheets were embedded that way with <? ?> syntax).
  
  If a fragment processes a comment it checks if it holds an
  instruction or not - by finding the first word and trying
  to find the method with that name. So an `<!-- if a -->`
  is treated like instruction, parsed and evaluated. 
  It starts observing variable named "a" and if it finds
  it as truthy, it triggers output. But if an instruction
  is paired with another (e.g. `<!-- end -->`) the nodes
  between them become a conditional fragment. Instruction
  itself is a fragment, and it gets filled with those nodes.
  So fragment capabilities of instruction are used when
  its condition is met and nodes get displayed or hidden.
  
  Linked instructions (e.g. if-elsif-else-end) recieve
  `next` and `previous` links that trigger chained execution.
*/
LSD.Fragment.prototype.instruction = function(object, parent, memo, connect) {
  if (typeof object.nodeType == 'number') {
    var origin = object;
    object = origin.nodeValue;
/*
  Instruction supports `<? ?>` syntax for instructions,
  but be wary that it may not cross-browser compatible.
*/
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
  Enumerables dont imply any semantics in templates. 
  Each element of an array (or collection, or arguments, 
  or a fragment) is rendered.
*/
LSD.Fragment.prototype.enumerable = function(object, parent, memo) {
  for (var i = 0, length = object.length, instruction, previous; i < length; i++)
    this[this.typeOf(object[i])](object[i], parent, memo);
};
/*
  Fragments accept plain javascripts objects for a template.
  Each key in an object holds a selector or instruction,
  and values are used as children.
  
  When keys may possibly clash in one objects (e.g. 
  it's impossible to have many values in a single
  object with the same `li` key), arrays come in handy,
  so clashing keys may be put in separate objects
  
  LSD.Fragment({
    'h1': 'Title',
    'if a > 1': {
      'button': 'A BIG'
    }, 
    'else': {
      'menu': [
        {li: 'Buy eggs'},
        {li: 'Buy milk'}
      ]
    }
  })
  
*/
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
/*
  A rendered string produces a text node
*/
LSD.Fragment.prototype.string = function(object, parent, memo) {
  return this.node(object, parent, memo, 3);
};
/*
  Fragments accept raw html, that gets parsed and each
  node is translated into a widget separately.
  Fragment constructor treats strings as html by default,
  although strings in objects and calls to .render() will
  render text nodes instead
*/
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
/*
  Type checking plays the role of a method dispatcher.
  Each possible type of input has a corresponding
  function that processes object in a appropriate fashion.
*/
LSD.Fragment.prototype.typeOf = function(object) {
  if (object) {
    if (typeof object.nodeType == 'number') return 'node';
    if (typeof object.item == 'function' && typeof object.length == 'number') return 'enumerable';
  }
  return typeof object;
};
/*
  When fragment encounters instruction that is known
  to be a boundary of a conditional block, it goes back
  in stack of rendered nodes and finds the matching
  instruction to register node range. All nodes between
  instructions are assigned to the found range so it
  can be used as a fragment. It also turns instructions
  render the fragment instead of outputting the results
*/
LSD.Fragment.prototype.connect = function(instruction, write) {
  if (instruction.parentNode == this || instruction.parentNode == this.parentNode) {
    for (var l = this._length, j = l - 1, node; k == null && (--j > -1);)
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
LSD.Fragment.prototype.R_WORD = /\w+/; 