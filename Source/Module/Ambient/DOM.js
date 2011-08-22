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
  constructors: {
    dom: function(options) {
      this.nodeType = options.nodeType || 1;
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
  
  setParent: function(widget, index){
    if (!widget.lsd) widget = LSD.Module.DOM.find(widget);
    if (!widget) return;
    var changed = this.properties.set('parent', widget);
    set.call(this, widget, index);
    var previous = this.previousSibling;
    var start = previous ? (previous.sourceLastIndex || previous.sourceIndex) : widget.sourceIndex || (widget.sourceIndex = 1);
    var sourceIndex = start;
    LSD.Module.DOM.each(this, function(node) {
      node.sourceIndex = ++ sourceIndex;
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
    LSD.Module.DOM.each(this, function(node) {
      widget.dispatchEvent('nodeRemoved', node);
    });
    this.removed = true;
    unset.call(this, widget, index); 
    this.properties.unset('parent', widget);
    delete this.removed;
  },
  
  appendChild: function(child, element) {
    if (child.lsd) {
      child.parentNode = this;
      var result = this.captureEvent('appendChild', arguments);
      if (result === false) return false;
    }
    if (element !== false) {
      if (element == null) element = this.element || this.toElement();
      if (child.lsd && child.getParentElement) element = child.getParentElement(element, this);
      var node = child.lsd ? (child.element || child.toElement()) : child;
      if (node.parentNode != element) element.appendChild(node);
    }
    if (child.lsd) {
      // set parent 'for real' and do callbacks
      child.setParent(this, this.childNodes.push(child) - 1);
      if (this.document && child.properties.document != this.document) 
        child.properties.set('document', this.document);
      if (this.document.rendered && !child.rendered) child.render()
    }
    return true;
  },
  
  removeChild: function(child, element) {
    var widget = LSD.Module.DOM.find(child, true);
    if (widget) {
      child = widget.element;
      var index = this.childNodes.indexOf(widget);
      if (index > -1) {
        widget.unsetParent(this, index);
        this.childNodes.splice(index, 1);
      }
    }
    if (child && child.parentNode) child.parentNode.removeChild(child)
  },
  
  replaceChild: function(insertion, child) {
    var index = this.childNodes.indexOf(child);
    if (index == -1) return;
    this.removeChild(child);
    this.childNodes.splice(index, 0, insertion);
    insertion.setParent(this, index);
  },
  
  insertBefore: function(insertion, node) {
    var widget = LSD.Module.DOM.findNext(node);
    var index = widget && widget != this ? this.childNodes.indexOf(widget) : this.childNodes.length;
    if (index == -1) return;
    this.childNodes.splice(index, 0, insertion);
    if (!node) {
      if (index) insertion.toElement().inject(this.childNodes[index - 1].toElement(), 'after')
      else this.toElement().appendChild(insertion.toElement())
    } else this.toElement().insertBefore(insertion.toElement(), node.element || node);
    insertion.setParent(this, index);
    return this;
  },

  cloneNode: function(children, options) {
    var clone = this.factory.create(this.element.cloneNode(children), Object.merge({
      source: this.source,
      tag: this.tagName,
      pseudos: this.pseudos.toObject(),
      traverse: !!children
    }, options));
    return clone;
  },
  
  inject: function(node, where) {
    if (!node.lsd) {
      var instance = LSD.Module.DOM.find(node, true);
      if (instance) widget = instance;
    } else var widget = node;
    if (where === false) {
      if (widget) widget.appendChild(this, false);
    } else if (!inserters[where || 'bottom'](widget ? this : this.toElement(), widget || node)) return false;
    if (widget && widget.rendered) widget.render();
    return this;
  },

  grab: function(node, where){
    if (!node.lsd) {
      var instance = LSD.Module.DOM.find(widget, true);
      if (instance) widget = instance;
    } else var widget = node;
    if (where === false) {
      if (widget) this.appendChild(widget, false);
    } else if (!inserters[where || 'bottom'](widget || node, widget ? this : this.toElement())) return false;
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
  
  write: function(content, hard) {
    if (!content || !(content = content.toString())) return;
    var wrapper = this.getWrapper();
    if (hard && this.written) for (var node; node = this.written.shift();) Element.dispose(node);
    var fragment = document.createFragment(content);
    var written = LSD.slice(fragment.childNodes);
    if (!hard && this.written) this.written.push.apply(this.written, written);
    else this.written = written;
    wrapper.appendChild(fragment);
    this.fireEvent('write', [written, hard])
    this.innerText = wrapper.get('text').trim();
    return written;
  },

  replaces: function(el){
    this.inject(el, 'after');
    el.dispose();
    return this;
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
  if (siblings[0] == this) widget.properties.write('first', this);
  if (siblings[siblings.length - 1] == this) widget.properties.write('last', this);
  if (index == null) index = length - 1;
  var previous = siblings[index - 1], next = siblings[index + 1];
  if (previous) {
    previous.properties.write('next', this);
    this.properties.write('previous', previous);
  }
  if (next) {
    next.properties.write('previous', this);
    this.properties.write('next', next);
  }
};

var unset = function(widget, index) {
  var parent = this.parentNode, siblings = widget.childNodes;
  if (index == null) index = siblings.indexOf(this);
  var previous = siblings[index - 1], next = siblings[index + 1];
  if (previous) {
    previous.properties.write('next', next);
    this.properties.unset('previous', previous);
  }
  if (next) {
    if (previous) this.properties.write('next', previous);
    next.properties.unset('previous', this);
  }
  if (parent.firstChild == this) {
    if (next) parent.properties.write('first', next);
    else parent.properties.unset('first', this);
  }
  if (parent.lastChild == this) {
    if (previous) parent.properties.write('last', previous);
    else parent.properties.unset('last', this);
  }
};

/*
  `inject` and `grab` methods accept optional argument that defines
  the position where the element should be placed.
  
  These are the unedited duplicate of mootools element inserters.
  All of the manipilations boil down to either `insertBefore` or
  `appendChild`.
*/

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

Object.append(LSD.Module.DOM, {
  dispose: function(node) {
    
  },
  
  destroy: function(node) {
    var child = LSD.Module.DOM.identify(node);
    LSD.Module.DOM.walk(child.element, function(element) {
      var widget = element.uid && LSD.Module.DOM.find(element, true);
      if (widget) widget.destroy(true);
    });
    Element.destroy(child.element);
  },
  
  clone: function(node, parent, before) {
    var child = LSD.Module.DOM.identify(node);
    parent = (parent === true) ? [child.parent, child.element.parentNode] : parent || false;  
    before = before === true ? child.element : before || child.element.nextSibling;
    return child.parent.layout.render(child.element, parent, {clone: true}, {before: before});
  },
  
  walk: function(node, callback, bind, memo) {
    if (node.lsd) node = node.element || node.toElement();
    var result = callback.call(bind || this, node, memo);
    if (result !== false)
      for (var children = node.childNodes, child, i = 0; child = children[i]; i++) 
        if (child.nodeType == 1) LSD.Module.DOM.walk(child, callback, bind, memo);
    return memo;
  },
  
  each: function(node, callback, bind, memo) {
    var widget = node.lsd ? node : LSD.Module.DOM.find(node, true);
    if (widget) {
      var result = callback.call(bind || this, widget, memo);
      if (result === false) return memo;
      if (result) (memo || (memo = [])).push(widget);
    }
    for (var children = node.childNodes, child, i = 0; child = children[i]; i++) 
      if (child.nodeType == 1) LSD.Module.DOM.each(child, callback, bind, memo); 
    return memo;
  },
  
  find: function(node, lazy) {
    return node.lsd ? node : ((!lazy || node.uid) && Element[lazy ? 'retrieve' : 'get'](node, 'widget'));
  },
  
  identify: function(node) {
    var widget = LSD.Module.DOM.find(node);
    if ((node.lsd ? widget : widget && widget.element) == node) 
      return {element: widget.element, widget: widget, parent: widget.parentNode};
    else 
      return {element: node, parent: widget};
  },

  getID: function(node) {
    if (node.lsd) {
      return node.attributes.itemid;
    } else {
      return node.getAttribute('itemid');
    }
  },
  
  findNext: function(node) {
    var widget = node;
    if (widget && !widget.lsd)
      if (!node.uid || !(widget = node.retrieve('widget')))
        for (var item = node, stack = [item.nextSibling]; item = stack.pop();)
          if (item.uid && (widget = item.retrieve('widget'))) {
            break;
          } else {
            if ((widget = item.nextSibling)) stack.push(widget);
            else stack.push(item.parentNode);
          }
    return widget;
  }
});

}();

LSD.Options.document = {
  add: function(document) {
    this.properties.set('document', document)
  },
  remove: function(document) {
    this.properties.unset('document', document)
  }
};