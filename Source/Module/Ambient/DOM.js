/*
---
 
script: DOM.js
 
description: Provides DOM-compliant interface to play around with other widgets
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Module
  - LSD.Module.Events
  - LSD.Module.Proxies

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
    var old = this.properties.parent;
    var length = widget.childNodes.length;
    if (old)
      if (old != widget) {
        old.removeChild(this, false);
      } else {
        var previous = widget.childNodes.indexOf(this);
        if (previous != index) {
          var same = index == length - 1 && previous == index - 1;
          if (!same) unset.call(this, widget);
          widget.childNodes.splice(previous, 1);
          if (index > previous) index--;
          if (same) return;
        } else return
      }
    this.properties.set('parent', widget);
    this.properties.set('scope', widget, null, true);
    set.call(this, widget, index);
  },
  
  unsetParent: function(widget, index) {
    if (!widget) widget = this.parentNode;
    LSD.Module.DOM.each(this, function(node) {
      widget.dispatchEvent('nodeRemoved', node);
    });
    this.removed = true;
    unset.call(this, widget, index); 
    this.properties.unset('parent', widget);
    this.properties.unset('scope', widget, null, true);
    delete this.removed;
  },
  
  appendChild: function(child, element, bypass) {
    if (child.nodeType == 11) 
      return LSD.Module.DOM.setFragment(this, child, element, bypass);
    if (child.lsd && !child.parentNode) child.parentNode = this;
    if (bypass !== true) {
      var proxy = LSD.Module.Proxies.perform(this, child, bypass);
      if (proxy) {
        if (proxy.element != null) element = proxy.element;
        if (proxy.widget && child.lsd && proxy.widget != this) {
          if (proxy.before)
            return proxy.widget.insertBefore(child, proxy.before, element, true);
          else
            return proxy.widget.appendChild(child, element, true);
        }
        if (proxy.before) 
          return this.insertBefore(child, proxy.before, null, true)
      } else if (proxy === false) {
        if (child.parentNode) child.parentNode.removeChild(child);
        return false;
      }
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
      if (this.document) {
        if (child.document != this.document)
          child.properties.set('document', this.document);
        if (this.document.rendered && !child.rendered) 
          child.render()
      }
    }
    return true;
  },

  insertBefore: function(child, node, element, bypass) {
    if (child.nodeType == 11) 
      return LSD.Module.DOM.setFragment(this, child, element, bypass, node)
    if (child.lsd && !child.parentNode) child.parentNode = this;
    if (!bypass) {
      var proxy = LSD.Module.Proxies.perform(this, child);
      if (proxy) {
        if (proxy.element != null) {
          element = proxy.element;
          if (!proxy.widget && !proxy.before) return this.appendChild(child, element, true);
        }
        if (proxy.widget && child.lsd && proxy.widget != this) {
          if (proxy.before)
            return proxy.widget.insertBefore(child, proxy.before, element, true);
          else
            return proxy.widget.appendChild(child, element, true);
        }
        if (proxy.before) node = proxy.before;
      } else if (proxy === false) {
        if (child.parentNode) child.parentNode.removeChild(child);
        return false;
      }
    }
    if (element !== false) {
      if (element == null) element = node && node.lsd ? node.element || node.toElement() : node;
      var parent = element ? element.parentNode : node && node.parentNode || this.toElement();
      parent.insertBefore(child.lsd ? child.element || child.toElement() : child, element);
    }
    if (child.lsd) {
      if (node) var widget = node.lsd ? node : LSD.Module.DOM.findSibling(node, false, element);
      var index = widget && widget != this ? this.childNodes.indexOf(widget) : this.childNodes.length;
      if (index == -1) return;
      this.childNodes.splice(index, 0, child);
      child.setParent(this, index);
      if (this.document) {
        if (child.document != this.document)
          child.properties.set('document', this.document);
        if (this.document.rendered && !child.rendered) 
          child.render()
      }
    }
    return this;
  },
  
  removeChild: function(child, element) {
    var widget = child.lsd ? child : LSD.Module.DOM.find(child, true);
    if (widget) {
      child = widget.element;
      var index = this.childNodes.indexOf(widget);
      if (index > -1) {
        this.childNodes.splice(index, 1);
        widget.unsetParent(this, index);
      }
    }
    if (element !== false && child && child.parentNode) child.parentNode.removeChild(child)
  },
  
  replaceChild: function(insertion, child, element) {
    var index = this.childNodes.indexOf(child);
    if (index == -1) return;
    this.childNodes.splice(index, 1);
    child.unsetParent(this, index);
    if (element !== false && child && child.parentNode) child.parentNode.removeChild(child)
    this.childNodes.splice(index, 0, insertion);
    insertion.setParent(this, index);
  },

  cloneNode: function(children, options) {
    var clone = this.factory.create(this.element, Object.merge({
      source: this.source,
      tag: this.tagName,
      pseudos: this.pseudos.toObject(),
      traverse: !!children,
      clone: true
    }, options));
    return clone;
  },
  
  inject: function(node, where, invert) {
    if (invert) var subject = node, object = this;
    else var subject = this, object = node;
    if (!object.lsd) {
      switch (where) {
        case 'after':
          var instance = LSD.Module.DOM.findSibling(object, true, null, this);
          break;
        case 'before':
          var instance = LSD.Module.DOM.findSibling(object, false, null, this);
          break;
        default:
          var instance = LSD.Module.DOM.find(object);
      }
      if (instance) var widget = instance, element = object;
    } else var widget = object;
    if (where === false) {
      if (widget) widget.appendChild(subject, false);
    } else if (!inserters[where || 'bottom'](widget ? subject : subject.toElement(), widget || node, element)) return false;
    return this;
  },

  grab: function(node, where){
    return this.inject(node, where, true);
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
    if (previous == this) throw "Previous sibling link points to the same node inevitably causing infinite loop";
    previous.properties.write('next', this);
    this.properties.write('previous', previous);
  }
  if (next) {
    if (next == this) throw "Previous sibling link points to the same node inevitably causing infinite loop";
    next.properties.write('previous', this);
    this.properties.write('next', next);
  }
  
  var previous = this.previousSibling;
  
  var start = previous ? (previous.sourceLastIndex || previous.sourceIndex) : widget.sourceIndex || (widget.sourceIndex = 1);
  var sourceIndex = start;
  // Set source index for child nodes of the widget
  for (var stack = [node], node; node = stack.pop();) {
    node.properties.set('sourceIndex', ++sourceIndex);
    if (node.sourceLastIndex) node.properties.set('sourceLastIndex', node.sourceLastIndex )
  }
  LSD.Module.DOM.each(this, function(node) {
    node.sourceIndex = ++ sourceIndex;
    if (node.sourceLastIndex) node.sourceLastIndex += start;
    for (var parent = widget; parent; parent = parent.parentNode) {
      parent.sourceLastIndex = (parent.sourceLastIndex || parent.sourceIndex) ;
      //if (old == widget) continue;
      var events = parent.$events.nodeInserted;
      if (!events) continue;
      for (var i = 0, j = events.length, fn; i < j; i++)
        if ((fn = events[i])) fn.call(parent, node);
    }
  }, this);
  return index;
};

var unset = function(widget, index) {
  var parent = this.parentNode, siblings = widget.childNodes;
  if (index == null) index = siblings.indexOf(this);
  var previous = siblings[index - 1];
  var current = siblings[index];
  var next = current == this ? siblings[index + 1] : current;
  if (previous) {
    previous.properties.write('next', next);
    this.properties.unset('previous', previous);
  }
  if (next) {
    if (previous) this.properties.write('next', previous);
    next.properties.unset('previous', this);
  }
  if (parent.firstChild == this) parent.properties.write('first', next);
  if (parent.lastChild == this) parent.properties.write('last', previous);
  return index;
};

/*
  `inject` and `grab` methods accept optional argument that defines
  the position where the element should be placed.
  
  These are the unedited duplicate of mootools element inserters.
  All of the manipilations boil down to either `insertBefore` or
  `appendChild`.
*/

var inserters = LSD.Module.DOM.inserters = {
  before: function(context, element, node){
    var parent = element.parentNode;
    if (parent) return parent.insertBefore(context, element, node);
  },

  after: function(context, element, node){
    var parent = element.parentNode;
    if (parent) return parent.insertBefore(context, element.nextSibling, node && node.nextSibling);
  },

  bottom: function(context, element, node){
    return element.appendChild(context, node);
  },

  top: function(context, element, node){
    return element.insertBefore(context, element.firstChild, node);
  }
};

Object.append(LSD.Module.DOM, {
  setFragment: function(widget, fragment, element, bypass, before) {
    if (fragment.childNodes) {
      return widget.layout.render(fragment, [widget, element])
    } else {
      if (before) {
        fragment.next = before;
        if (before.lsd) {
          fragment.widget = before.parentNode;
          fragment.element = before.toElement().parentNode;
        } else {
          fragment.widget = LSD.Module.DOM.find(before.parentNode);
          fragment.element = before.parentNode;
        }
      } else {
        fragment.widget = widget;
        fragment.element = widget.toElement()
      }
      fragment.attach();
    }
  },
  
  dispose: function(node) {
    
  },
  
  destroy: function(node) {
    if (node.lsd) node = node.toElement()
    LSD.Module.DOM.walk(node, function(element) {
      var widget = element.uid && LSD.Module.DOM.find(element, true);
      if (widget) widget.destroy.call(widget, true);
    });
    Element.destroy(node);
  },
  
  'delete': function(node) {
    var child = LSD.Module.DOM.identify(node);
    if (child.widget && child.widget['delete']) var result = child.widget['delete']();
    LSD.Module.DOM.destroy(node)
    return result;
  },
  
  clone: function(node, parent, before) {
    var child = LSD.Module.DOM.identify(node);
    parent = (parent === true || parent == null) ? [child.parent, child.element.parentNode] : parent || false;  
    before = before === true ? child.element : before || child.element.nextSibling;
    return child.parent.document.layout.render(child.element, parent, {clone: true, before: before});
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
  
  findSibling: function(node, revert, limit, exclude) {
    var widget = node;
    var properties = revert ? ['previousSibling', 'lastChild'] : ['nextSibling', 'firstChild']
    if (widget && (!widget.lsd || widget === exclude))
      if (!node.uid || !(widget = Element.retrieve(node, 'widget') || widget === exclude))
        for (var item = node, stack = [item[properties[0]]], sibling, first, invert; item = stack.pop();) {
          if (item.push) {
            invert = true
            item = item[0]
          } else invert = false;
          if (!item.uid || !(widget = Element.retrieve(item, 'widget')) || widget === exclude) {
            if (exclude !== widget)
              if ((first = item[properties[1]]))
                stack.push([first]);
            widget = null;
            if (!(sibling = item[properties[0]])) {  
              if (!invert) {
                var parent = item.parentNode;
                if (!parent || parent === limit) break;
                stack.unshift(item.parentNode);
              }
            } else stack.push(sibling);  
          } else break;
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