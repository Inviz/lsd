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
  
  moveTo: function(widget) {
    if (widget == this.parentNode) {
      unset.call(this, widget);
    } else {
      if (this.parentNode) this.dispose();
      return true;
    }
  },
  
  setParent: function(widget, index){
    if (!widget.lsd) widget = LSD.Module.DOM.find(widget);
    if (!widget) return;
    if (this.moveTo(widget)) {
      this.parentNode = widget;
      this.fireEvent('setParent', [widget, widget.document])
      var changed = true;
    }
    set.call(this, widget, index);
    //console.error('set next sibling', this.element, this.tagName, next)
    if (changed) {
      this.fireEvent('register', ['parent', widget]);
      widget.fireEvent('adopt', [this]);
    }
    var previous = this.previousSibling;
    var start = previous ? (previous.sourceLastIndex || previous.sourceIndex) : widget.sourceIndex || (widget.sourceIndex = 1);
    var sourceIndex = start;
    LSD.Module.DOM.walk(this, function(node) {
      node.sourceIndex = ++sourceIndex;
      if (node.sourceLastIndex) node.sourceLastIndex += start;
      for (var parent = widget; parent; parent = parent.parentNode) {
        parent.sourceLastIndex = (parent.sourceLastIndex || parent.sourceIndex) ;
        if (!changed) continue;
        var events = parent.$events.nodeInserted;
        if (!events) continue;
        for (var i = 0, j = events.length, fn; i < j; i++)
          if ((fn = events[i])) fn.call(parent, node);
      }
    }, this);
  },
  
  unsetParent: function(widget, index) {
    if (!widget) widget = this.parentNode;
    LSD.Module.DOM.walk(this, function(node) {
      widget.dispatchEvent('nodeRemoved', node);
    });
    this.fireEvent('unregister', ['parent', widget]);
    this.removed = true;
    unset.call(this, widget, index); 
    delete this.parentNode;
    delete this.removed;
  },
  
  appendChild: function(widget, override) {
    if (!widget.quiet && (override !== false) && this.toElement()) (override || function() {
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
    var widget = child;
    if (widget && !widget.lsd)
      if (!child.uid || !(widget = child.retrieve('widget')))
        for (var item = child, stack = [item.nextSibling]; item = stack.pop();)
          if (item.uid && (widget = item.retrieve('widget'))) {
            if (widget == this) widget = null;
            break;
          } else {
            if ((widget = item.nextSibling)) stack.push(widget);
            else stack.push(item.parentNode);
          }
    var index = widget ? this.childNodes.indexOf(widget) : this.childNodes.length;
    if (index == -1) return;
    this.childNodes.splice(index, 0, insertion);
    insertion.setParent(this, index);
    if (!child) {
      if (index) insertion.toElement().inject(this.childNodes[index - 1].toElement(), 'after')
      else this.toElement().appendChild(insertion.toElement())
    } else this.toElement().insertBefore(insertion.toElement(), child.element || child);
    return this;
  },

  cloneNode: function(children, options) {
    var clone = this.context.create(this.element.cloneNode(children), Object.merge({
      source: this.source,
      tag: this.tagName,
      pseudos: this.pseudos.toObject(),
      traverse: !!children
    }, options));
    return clone;
  },
  
  setDocument: function(document, revert) {
    LSD.Module.DOM.walk(this, function(child) {
      if (revert) {
        delete child.ownerDocument;
        delete child.document;
      } else child.ownerDocument = child.document = document;
      child.fireEvent(revert ? 'unregister' : 'register', ['document', document]);
      child.fireEvent(revert ? 'unsetDocument' : 'setDocument', document);
    });
    return this;
  },
  
  unsetDocument: function(document) {
    return this.setDocument(document, true);
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
    if (where == 'after' || where == 'before') widget = this.parentNode;
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
  
  watchInjection: function(callback) {
    this.addEvent('setDocument', callback);
    if (this.document) callback.call(this, this.document.element)
  },
  
  unwatchInjection: function(callback) { 
    this.removeEvent('setDocument', callback);
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

var set = function(widget, index) {
  var siblings = widget.childNodes, length = siblings.length;
  if (siblings[0] == this) widget.firstChild = this;
  if (siblings[siblings.length - 1] == this) widget.lastChild = this;
  if (index == null) index = length - 1;
  var previous = siblings[index - 1], next = siblings[index + 1];
  if (previous) {
    previous.nextSibling = this;
    this.previousSibling = previous;
  }
  if (next) {
    next.previousSibling = this;
    this.nextSibling = next;
  }
};

var unset = function(widget, index) {
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
};

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