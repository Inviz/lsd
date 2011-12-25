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

LSD.Module.DOM = {
  constructors: {
    dom: function(options) {
      this.nodeType = options.nodeType || 1;
      this.childNodes = [];
    }
  },
  
  
  getSource: function(tagName) {
    var source = LSD.Layout.getSource(this.attributes, tagName === false ? null : tagName || this.options.source || this.tagName);
    return source && source.join ? source.join('-') : source;
  },

  getRole: function(tagName) {
    var source = LSD.Module.Properties.getSource(this, tagName);
    if (!source) return;
    if (this.attributes.type) source += '-' + this.attributes.type;
    if (this.attributes.kind) source += '-' + this.attributes.kind;
    return this.factory && this.factory.find(source);
  }
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