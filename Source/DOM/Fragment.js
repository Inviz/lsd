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

LSD.Fragment = function(object, parent, document) {
  if (!this.render) return LSD.Fragment.apply(new LSD.Fragment, arguments)
  this.childNodes = this;
  switch (arguments.length) {
    case 0: break;
    case 1:
      if (object.nodeType === 11 && !object.lsd) this.enumerable(object.childNodes)
      else this[typeof object == 'string' ? 'html' : this.typeOf(object)](object);
      break;
    default:
      if (document && document.nodeType == 9) {
        this.document = document;
        this.enumerable(object, parent, document);
      } else this.enumerable(arguments);
  }
}
LSD.Fragment.prototype = new LSD.ChildNodes.Virtual;
LSD.Struct.implement.call(LSD.Fragment, LSD.Node.prototype);
LSD.Fragment.prototype.nodeType = 11;
/*
  Render method accepts any objects and translates them 
  into LSD objects that resemble regular DOM.
*/
LSD.Fragment.prototype.render = function(object, parent, meta) {
  var type = this.typeOf(object);
  if (type === 'string') this.node(object, parent, meta, 3)
  else return this[type](object, parent, meta);
};
/*
  Nodes may be of different types: textnodes, elements, fragments, 
  instructions and documents.
  Processing a node may result in 3 scenarios:
    * Element node is converted into LSD.Element
    * Element node was already an LSD.Element and was reused
    * Element node was already an LSD.Element and was cloned
*/
LSD.Fragment.prototype.node = function(object, parent, meta, nodeType) {
  if (!parent) parent = this;
  var uid      = object.lsd,
      widget   = object.mix ? object : uid && LSD.UIDs[uid], 
      children = object.childNodes;
  if (!nodeType) nodeType = object.nodeType || 1;
  if (!widget) {
    if (nodeType === 8 && (widget = this.instruction(object, parent, meta)))
      return widget;
    var document = this.document || (parent && parent.document) || LSD.Document.prototype;
    widget = document.createNode(nodeType, object, null, this);
  } else if (meta && meta.clone) 
    widget = widget.cloneNode();
  if (widget.parentNode != parent) {
    if (meta < -1) widget._followed = true;
    parent.appendChild(widget, meta);
    delete widget._followed;
  }
  if (children && children.length)
    for (var i = 0, array = children, j = array.length; i < j; i++)
      this.node(array[i], widget, i - j);
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
  
  Linked instructions (e.g. if-elsif-else-end) have
  `next` and `previous` properties that reference 
  objects in chan and allow chained execution.
*/
LSD.Fragment.prototype.instruction = function(object, parent, meta, connect) {
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
    var boundary = LSD.Script.Boundaries[word];
    var fragment = boundary && connect !== false ? this.fragment : this;
    if (parent == this && boundary) parent = fragment;
    var instruction = fragment.node(object, parent, meta, 7), node;
    if (origin) instruction.set('origin', origin);
    if (chr) instruction.set('mode', chr);
    if (word === 'end') instruction.closed = true;
    if (boundary) {
      instruction.boundary = true;
      if ((node = fragment.connect(instruction, connect))) {
        node.set('next', instruction);
        instruction.set('previous', node)
      }
    }
    return instruction;
  }
};
/*
  Enumerables dont imply any semantics in templates. 
  Each element of an array (or collection, or arguments, 
  or a fragment) is rendered.
*/
LSD.Fragment.prototype.enumerable = function(object, parent, meta) {
  var fragment = this;
  for (var i = 0, length = object.length, instruction, previous; i < length; i++) {
    var result = fragment[this.typeOf(object[i])](object[i], parent, meta);
    if (result.nodeType > 6)
      if (result.name == 'end' || (result.boundary && result.closed)) 
        fragment = result.fragment || this;
      else fragment = result;
  }
  return fragment;
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
LSD.Fragment.prototype.object = function(object, parent, meta) {
  var skip = object._skip, value, result, bound;
  var fragment = this;
  for (var selector in object) {
    if (!object.hasOwnProperty(selector) || (skip && skip[selector])) continue;
    if (!(result = fragment.instruction(selector, parent, meta, false)))
      result = fragment.node(selector, parent, meta, 1);
    if (result.nodeType > 6)
      if (result.name == 'end') fragment = result.fragment || this;
      else fragment = result;
    if ((value = object[selector])) {  
      var type = fragment.typeOf(value);
      if (type == 'string') fragment.node(value, result, meta, 3);
      else fragment[type](value, result, meta);
      if (result.nodeType == 7 && result.boundary) {
        if (bound) bound.closed = true;
        bound = result;
      }
    }
    if (fragment == result) fragment = this;
  }
  if (bound) {
    bound.closed = true;
  }
  return fragment;
};
/*
  A rendered string produces a text node
*/
LSD.Fragment.prototype.string = function(object, parent, meta) {
  return this.node(object, parent, meta, 3);
};
/*
  Fragments accept raw html, that gets parsed and each
  node is then translated into a widget.
  Fragment constructor treats strings as html by default,
  although strings in objects and calls to .render() will
  render text nodes instead
*/
LSD.Fragment.prototype.html = function(object, parent, meta) {
  if (!this._dummy) {
    this._dummy = document.createElement('div')
    /*@cc_on this._dummy.style.display = 'none' @*/
  }
  /*@cc_on document.body.appendChild(this._dummy) @*/
  this._dummy.innerHTML = object.toString();
  /*@cc_on document.body.removeChild(this._dummy) @*/
  return this.enumerable(this._dummy.childNodes, parent, meta);
};
/*
  Type checking plays the role of a method dispatcher.
  Each possible type of input has a corresponding
  function that processes object in a appropriate fashion.
*/
LSD.Fragment.prototype.typeOf = function(object) {
  if (object != null) {
    if (typeof object.nodeType == 'number') 
      return 'node';
    if ((typeof object.item == 'function' || object.push) && typeof object.length == 'number') 
      return 'enumerable';
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
  if (!instruction) debugger
  var fragment = instruction && instruction.fragment || this.fragment || this;
  var l = fragment._length
  var j = l - 1;
  for (var node; k == null && (--j > -1);)
    if ((node = fragment[j]).nodeType == 7 && !node.next && !node.closed)
      if (write !== false) 
        for (var k = j + 1; k < l - 1; k++)
          node.set(k - j - 1, fragment[k], null, 'connect');
      else break;
  if (!node) throw "Can't find an instruction to connect with " + instruction.name
  node.closed = true;
  return node;
}
LSD.Fragment.prototype.R_WORD = /[a-zA-Z][a-zA-Z0-9]*/;
LSD.Fragment.prototype._properties.parentNode = function(value, old, meta) {
  this.mix('variables', value && value.variables, meta, old && old.variables);
};