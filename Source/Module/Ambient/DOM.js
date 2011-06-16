/*
---
 
script: DOM.js
 
description: Provides DOM-compliant interface to play around with other widgets
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Module
  - LSD.Module.Events

provides:
  - LSD.Module.DOM
  - LSD.Module.DOM.findDocument

...
*/

!function() {

LSD.Module.DOM = new Class({
  options: {
    nodeType: 1,
  },
  
  initializers: {
    dom: function(options) {
      this.childNodes = [];
    }
  },
  
  contains: function(element) {
    while (element = element.parentNode) if (element == this) return true;
    return false;
  },
  
  getChildren: function() {
    return this.childNodes;
  },

  getRoot: function() {
    var widget = this;
    while (widget.parentNode) widget = widget.parentNode;
    return widget;
  },
  
  setParent: function(widget, index){
    if (!widget.lsd) widget = LSD.Module.DOM.find(widget);
    if (this.parentNode) this.dispose();
    if (!widget) return;
    this.parentNode = widget;
    this.fireEvent('setParent', [widget, widget.document])
    var siblings = widget.childNodes, length = siblings.length;
    if (siblings[0] == this) widget.firstChild = this;
    if (siblings[siblings.length - 1] == this) widget.lastChild = this;
    if (index == null) index = length - 1;
    if (index) {
      var previous = siblings[index - 1];
      if (previous) {
        previous.nextSibling = this;
        this.previousSibling = previous;
      }
    }
    if (index < length) {
      var next = siblings[index + 1];
      if (next) {
        next.previousSibling = this;
        this.nextSibling = next;
      }
    } 
    this.fireEvent('register', ['parent', widget]);
    widget.fireEvent('adopt', [this]);
    
    var start = previous ? (previous.sourceLastIndex || previous.sourceIndex) : widget.sourceIndex || (widget.sourceIndex = 1);
    var index = start;
    LSD.Module.DOM.walk(this, function(node) {
      node.sourceIndex = ++index;
      if (node.sourceLastIndex) node.sourceLastIndex += start;
      for (var parent = widget; parent; parent = parent.parentNode) {
        parent.sourceLastIndex = (parent.sourceLastIndex || parent.sourceIndex) ;
        var events = parent.$events.nodeInserted;
        if (!events) continue;
        for (var i = 0, j = events.length, fn; i < j; i++)
          if ((fn = events[i])) fn.call(parent, node);
      }
    }, this);
  },
  
  unsetParent: function(widget, index) {
    if (!widget) widget = this.parentNode;
    this.fireEvent('unregister', ['parent', widget]);
    this.removed = true;
    LSD.Module.DOM.walk(this, function(node) {
      widget.dispatchEvent('nodeRemoved', node);
    });
    var parent = this.parentNode, siblings = widget.childNodes;
    if (index == null) index = siblings.indexOf(this);
    var previous = siblings[index - 1], next = siblings[index + 1];
    if (previous && previous.nextSibling == this) {
      previous.nextSibling = next;
      if (this.previousSibling == previous) delete this.previousSibling;
    }
    if (next && next.previousSibling == this) {
      next.previousSibling = previous;
      if (this.nextSibling == next) delete this.nextSibling;
    }
    if (parent.firstChild == this) parent.firstChild = next;
    if (parent.lastChild == this) parent.lastChild = previous;
    delete this.parentNode, delete this.removed;
  },
  
  appendChild: function(widget, adoption) {
    if (!widget.quiet && (adoption !== false) && this.toElement()) (adoption || function() {
      this.element.appendChild(widget.toElement());
    }).apply(this, arguments);
    widget.setParent(this, this.childNodes.push(widget) - 1);
    delete widget.quiet;
    return true;
  },
  
  removeChild: function(child) {
    var index = this.childNodes.indexOf(child);
    if (index == -1) return false;
    child.unsetParent(this, index);
    this.childNodes.splice(index, 1);
    if (child.element && child.element.parentNode) child.element.dispose();
  },
  
  replaceChild: function(insertion, child) {
    var index = this.childNodes.indexOf(child);
    if (index == -1) return;
    this.removeChild(child);
    this.childNodes.splice(index, 0, insertion);
    insertion.setParent(this, index);
  },
  
  insertBefore: function(insertion, child) {
    var index = this.childNodes.indexOf(child);
    if (index == -1) 
      if (child) return;
      else index = this.childNodes.length;
    this.childNodes.splice(index, 0, insertion);
    insertion.setParent(this, index);
    if (!child) {
      if (index) insertion.toElement().inject(this.childNodes[index].toElement(), 'after')
      else this.toElement().appendChild(insertion.toElement())
    } else child.toElement().parentNode.insertBefore(insertion.toElement(), child.element);
  },

  cloneNode: function(children, options) {
    var clone = this.context.create(this.element, Object.merge({
      source: this.source,
      tag: this.tagName,
      pseudos: this.pseudos.toObject(),
      clone: true
    }, options));
    return clone;
  },
  
  setDocument: function(document) {
    LSD.Module.DOM.walk(this, function(child) {
      child.ownerDocument = child.document = document;
      child.fireEvent('register', ['document', document]);
      child.fireEvent('setDocument', document);
    });
    return this;
  },
  
  inject: function(widget, where, quiet) {
    if (!widget.lsd) {
      var instance = LSD.Module.DOM.find(widget, true)
      if (instance) widget = instance;
    }
    if (!this.pseudos.root) {
      this.quiet = quiet || (widget.documentElement && this.element && this.element.parentNode);
      if (where === false) widget.appendChild(this, false)
      else if (!inserters[where || 'bottom'](widget.lsd ? this : this.toElement(), widget) && !quiet) return false;
    }
    if (quiet !== true || widget.document) this.setDocument(widget.document || LSD.document);
    if (!this.pseudos.root) this.fireEvent('inject', this.parentNode);
    return this;
  },

  grab: function(el, where){
    inserters[where || 'bottom'](document.id(el, true), this);
    return this;
  },
  
  /*
    Wrapper is where content nodes get appended. 
    Defaults to this.element, but can be redefined
    in other Modules or Traits (as seen in Container
    module)
  */
  
  getWrapper: function() {
    return this.toElement();
  },
  
  write: function(content) {
    if (!content || !(content = content.toString())) return;
    var wrapper = this.getWrapper();
    if (this.written) for (var node; node = this.written.shift();) Element.dispose(node);
    var fragment = document.createFragment(content);
    this.written = Array.prototype.slice.call(fragment.childNodes, 0);
    wrapper.appendChild(fragment);
    this.fireEvent('write', [this.written])
    this.innerText = wrapper.get('text').trim();
    return this.written;
  },

  replaces: function(el){
    this.inject(el, 'after');
    el.dispose();
    return this;
  },
  
  onDOMInject: function(callback) {
    if (this.document) callback.call(this, this.document.element) 
    else this.addEvent('setDocument', callback.bind(this))
  },
  
  onElementDispose: function() {
    if (this.parentNode) this.dispose();
  },

  dispose: function() {
    var parent = this.parentNode;
    if (!parent) return;
    this.fireEvent('beforeDispose', parent);
    parent.removeChild(this);
    this.fireEvent('dispose', parent);
    return this;
  }
});

var inserters = {

  before: function(context, element){
    var parent = element.parentNode;
    if (parent) return parent.insertBefore(context, element);
  },

  after: function(context, element){
    var parent = element.parentNode;
    if (parent) return parent.insertBefore(context, element.nextSibling);
  },

  bottom: function(context, element){
    return element.appendChild(context);
  },

  top: function(context, element){
    return element.insertBefore(context, element.firstChild);
  }

};

LSD.Module.Events.addEvents.call(LSD.Module.DOM.prototype, {
  destroy: function() {
    if (this.parentNode) this.dispose();
  },
  
  element: {
    /*
      When dispose event comes from the element, 
      it is is already removed from dom
    */
    dispose: 'onElementDispose'
  }
});

Object.append(LSD.Module.DOM, {
  walk: function(element, callback, bind, memo) {
    var widget = element.lsd ? element : LSD.Module.DOM.find(element, true);
    if (widget) {
      var result = callback.call(bind || this, widget, memo);
      if (result) (memo || (memo = [])).push(widget);
    }
    for (var nodes = element.childNodes, node, i = 0; node = nodes[i]; i++) 
      if (node.nodeType == 1) LSD.Module.DOM.walk(node, callback, bind, memo); 
    return memo;
  },
  
  find: function(target, lazy) {
    return target.lsd ? target : ((!lazy || target.uid) && Element[lazy ? 'retrieve' : 'get'](target, 'widget'));
  },
  
  getID: function(target) {
    if (target.lsd) {
      return target.attributes.itemid;
    } else {
      return target.getAttribute('itemid');
    }
  }
});

}();

LSD.Options.document = {
  add: 'setDocument',
  remove: 'unsetDocument'
}