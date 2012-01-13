/*
---
 
script: Widget.js
 
description: Base widget with all modules included
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - Slick/Slick.Finder
  - LSD.Struct.Stack

provides: 
  - LSD.Widget
 
...
*/

LSD.Slick = window.Slick;
LSD.Widget = LSD.Struct.Stack(LSD.Type);
LSD.Widget.Properties = {
  namespace: function() {
    
  },
  context: function(value, old) {
    
  },
  tagName: function(value, old) {
    if (!this.source && this.prepared) {
      if (value) this.set('source', value)
      if (old) this.unset('source', old);
    }
    if (value) {
      this.set('nodeName', value, null);
      this.set('localName', value, null, true);
    }
    if (old) {
      if (old) this.unset('nodeName', old, null);
      if (old) this.unset('localName', old, null, true);
    }
    var previous = this.previousSibling, next = this.nextSibling, parent = this.parentNode;
    if (previous) {
      if (value) {
        previous.matches.set('!+' + value, this, null, null, true);
        previous.matches.set('++' + value, this, null, null, true);
      }
      if (old) {
        previous.matches.unset('!+' + old, this, null, null, true);
        previous.matches.unset('++' + old, this, null, null, true);
      }
      for (var sibling = previous; sibling; sibling = sibling.previousSibling) {
        if (value) {
          sibling.matches.set('!~' + value, this, null, null, true);
          sibling.matches.set('~~' + value, this, null, null, true);
        }
        if (old) {
          sibling.matches.unset('!~' + old, this, null, null, true);
          sibling.matches.unset('~~' + old, this, null, null, true);
        }
      }
    }
    if (next) {
      if (value) {
        next.matches.set('+' + value, this, null, null, true);
        next.matches.set('++' + value, this, null, null, true);
      }
      if (old) {
        next.matches.unset('+' + old, this, null, null, true);
        next.matches.unset('++' + old, this, null, null, true);
      }
      for (var sibling = next; sibling; sibling = sibling.nextSibling) {
        if (value) {
          sibling.matches.set('~' + value, this, null, null, true);
          sibling.matches.set('~~' + value, this, null, null, true);
        }
        if (old) {
          sibling.matches.unset('~' + old, this, null, null, true);
          sibling.matches.unset('~~' + old, this, null, null, true);
        }
      }
    }
    if (parent) {
      if (value) parent.matches.set('>' + value, this, null, null, true);
      if (old) parent.matches.unset('>' + old, this, null, null, true);
      for (sibling = parent; sibling; sibling = parent.parentNode) {
        if (value) sibling.matches.set(value, this, null, null, true);
        if (old) sibling.matches.unset(old, this, null, null, true);
      }
    }
    return value;
  },
  localName: function(value, old) {
    return value;
  },
  inline: function(value, old) {
    if (typeof value != 'undefined') this.set('localName', value ? 'span' : 'div', null, true);
    if (typeof old != 'undefined') this.unset('localName', old ? 'span' : 'div', null, true);
  },
  source: function(value, old) {
    if (typeof value != 'undefined') this.set('role', role);
    if (typeof old != 'undefined') this.unset('role', this.role);
  },
  role: function(value, old) {
    if (value) {
      if (role == null) role = this.getRole(this)
      if (role) this.mixin(role);
      return role;
    } else {
      this.unmix(role);
    }
  },
  scope: function(value, old) {
    if (value) LSD.Script.Scope.setScope(this, value)
    if (old) LSD.Script.Scope.unsetScope(this, old);
  },
  element: function(element, old) {
    Element[element ? 'store' : 'eliminate'](element || old, 'widget', this);
    return element;
  },
  /*
    Extract and apply options from elements
  */
  origin: function(value, old, memo) {
    var extracted = this.extracted;
    if (value) {
      if (!this.extracted) {
        var tag = value.tagName.toLowerCase();
        this.extracted = {
          tagName: tag,
          localName: tag
        };
        for (var i = 0, attribute; attribute = value.attributes[i++];)
          (this.extracted.attributes || (this.extracted.attributes = {}))[attribute.name] = attribute.value;
        for (var i = 0, clses = value.className.split(' '), cls; cls = clses[i++];)
          (this.extracted.classes || (this.extracted.classes = {}))[cls] = true;
        this.mix(this.extracted, null, true, memo, true, true);
      }
    }
    if (old) {
      if (extracted) {
        this.mix(extracted, null, memo, false, true, true);
        delete this.extracted;
      }
    }
  },
  previousSibling: function(value, old) {
    if (value) {
      value.matches.set('!+' + this.tagName, this, null, null, true);
      value.matches.set('!+', this, null, null, true);
      value.matches.set('++' + this.tagName, this, null, null, true);
      value.matches.set('++', this, null, null, true);
      for (var sibling = this; sibling = sibling.previousSibling;) {
        sibling.matches.set('!~' + this.tagName, this, null, null, true);
        sibling.matches.set('!~', this, null, null, true);
        sibling.matches.set('~~' + this.tagName, this, null, null, true);
        sibling.matches.set('~~', this, null, null, true);
      }
    }
    if (old) {
      value.matches.unset('!+' + this.tagName, this, null, null, true);
      value.matches.unset('!+', this, null, null, true);
      value.matches.unset('++' + this.tagName, this, null, null, true);
      value.matches.unset('++', this, null, null, true);
      for (var sibling = this; sibling = sibling.previousSibling;) {
        sibling.matches.unset('!~' + this.tagName, this, null, null, true);
        sibling.matches.unset('!~', this, null, null, true);
        sibling.matches.unset('~~' + this.tagName, this, null, null, true);
        sibling.matches.unset('~~', this, null, null, true);
      }
    }
  },
  nextSibling: function(value, old) {
    if (value) {
      value.matches.set('+' + this.tagName, this, null, null, true);
      value.matches.set('+', this, null, null, true);
      value.matches.set('++' + this.tagName, this, null, null, true);
      value.matches.set('++', this, null, null, true);
      for (var sibling = value; sibling; sibling = sibling.nextSibling) {
        sibling.matches.set('~' + this.tagName, this, null, null, true);
        sibling.matches.set('~', this, null, null, true);
        sibling.matches.set('~~' + this.tagName, this, null, null, true);
        sibling.matches.set('~~', this, null, null, true);
      }
    }
    if (old) {
      old.matches.unset('+' + this.tagName, this, null, null, true);
      old.matches.unset('+', this, null, null, true);
      old.matches.unset('++' + this.tagName, this, null, null, true);
      old.matches.unset('++', this, null, null, true);
      for (var sibling = old; sibling; sibling = sibling.nextSibling) {
        sibling.matches.unset('~' + this.tagName, this, null, null, true);
        sibling.matches.unset('~', this, null, null, true);
        sibling.matches.unset('~~' + this.tagName, this, null, null, true);
        sibling.matches.unset('~~', this, null, null, true);
      }
    }
  },
  parentNode: function(value, old) {
    if (value) {
      this.matches.set('!>' + value.tagName, value, null, null, true);
      this.matches.set('!>', value, null, null, true);
      value.matches.set('>' + this.tagName, this, null, null, true);
      value.matches.set('>', this, null, null, true);
      for (var node = value; node; node = node.parentNode) {
        node.matches.set(this.tagName, this, null, null, true);
        node.matches.set(' ', this, null, null, true);
        this.matches.set('!' + node.tagName, node, null, null, true);
        this.matches.set('!', node, null, null, true);
      }
    }
    if (old) {
      this.matches.unset('!>' + old.tagName, old, null, null, true);
      this.matches.unset('!>', old, null, null, true);
      old.matches.unset('>' + this.tagName, this, null, null, true);
      old.matches.unset('>', this, null, null, true);
      for (var node = old; node; node = node.parentNode) {
        node.matches.unset(this.tagName, this, null, null, true);
        node.matches.unset(' ', this, null, null, true);
        this.matches.unset('!' + node.tagName, node, null, null, true);
        this.matches.unset('!', node, null, null, true);
      }
    }
  },
  focused: function(value, old) {
    if (value) this.set('parentNode.focused', value);
    if (old) this.unset('parentNode.focused', old);
  },
  rendered: function(value, old) {
    if (value) this.set('childNodes.rendered', value);
    if (old) this.unset('childNodes.rendered', old);
  },
  disabled: function(value, old) {
    if (value) this.set('childNodes.disabled', value);
    if (old) this.unset('childNodes.disabled', old);
  },
  root: function(value, old) {
    if (value) this.set('childNodes.root', value);
    if (old) this.unset('childNodes.root', old);
  },
  value: function(value, old) {
    
  },
  multiple: function(value, old) {
    if (value) {
      if (!this.values) this.set('values', new LSD.Array);
      this.set('value', this.values);
    } else {
      this.unset('value', this.values);
    }
  }
};

LSD.Widget.UID = 0;

LSD.Widget.implement({
  _preconstructed: ['allocations', 'attributes', 'children', 'events', 'matches', 'proxies', 'relations', 'states'],

  localName: 'div',
  tagName: null,
  
  namespace: LSD,
  
  initialize: function(element) {
    this.lsd = ++LSD.Widget.UID; 
  },
  
  properties: LSD.Widget.Properties,
  
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
  },
  
  getAttribute: function(name) {
    switch (name) {
      case "class":           return this.classes.join(' ');
      case "slick-uniqueid":  return this.lsd;
      default:                return this.attributes[name];
    }
  },
  
  getAttributeNode: function(name) {
    return {
      name: name,
      value: this.getAttribute(name),
      ownerElement: this
    }
  },

  setAttribute: function(name, value) {
    this.attributes.set(name, value);
    return this;
  },
  
  removeAttribute: function(name) {
    this.attributes.unset(name, this.attributes[name]);
    return this;
  },
  
  addPseudo: function(name){
    this.pseudos.set(name, true);
    return this;
  },

  removePseudo: function(name) {
    this.pseudos.unset(name, true);
    return this;
  },
  
  addClass: function(name) {
    this.classes.set(name, true);
    return this;
  },

  removeClass: function(name){
    this.classes.unset(name, true);
    return this;
  },
  
  hasClass: function(name) {
    return this.classes[name]
  },
  
  store: function(name, value) {
    this.storage[name] = value;
    return this;
  },

  retrieve: function(name, placeholder) {
    var value = this.storage[name];
    if (value == null) {
      if (placeholder != null) this.store(name, placeholder);
      return placeholder
    }
    return value;
  },

  eliminate: function(name, value) {
    delete this.storage[name];
    return this;
  },
  
  
  getElements: function(selector, origin) {
    return LSD.Slick.search(origin || this.getSelectorOrigin(selector), selector)
  },
  
  getElement: function(selector, origin) {
    return LSD.Slick.find(origin || this.getSelectorOrigin(selector), selector)
  },
  
  /*
    We have to figure the document before we do a .search
    to let Slick switch into the right mode and be prepared
  */
    
  getSelectorOrigin: function(selector) {
    if (!selector.Slick) selector = LSD.Slick.parse(selector);
    var first = selector.expressions[0][0];
    switch (first.combinator.charAt(0)) {
      case "$":
        return this.element;
      default:
        return this;
    }
  },

  getSelector: function() {
    var parent = this.parentNode;
    var selector = (parent && parent.getSelector) ? parent.getSelector() + ' ' : '';
    selector += this.tagName;
    if (this.attributes.id) selector += '#' + this.attributes.id;
    for (var klass in this.classes)  if (this.classes.has(klass))  selector += '.' + klass;
    for (var pseudo in this.pseudos) if (this.pseudos.has(pseudo)) selector += ':' + pseudo;
    for (var name in this.attributes) if (this.attributes.has(name))
      if (name != 'id') {
        selector += '[' + name;
        if (LSD.Attributes[name] != 'boolean') selector += '=' + this.attributes[name]
        selector += ']';
      }
    return selector;
  },
  
  getPseudoElementsByName: function(name) {
    return this[name];
  },
  
  test: function(selector) {
    if (typeof selector == 'string') selector = LSD.Slick.parse(selector);
    if (selector.expressions) selector = selector.expressions[0][0];
    if (selector.combinator == '::') {
      if (selector.tag && (selector.tag != '*')) {
        var group = this.expectations['!::'];
        if (!group || !(group = group[selector.tag]) || !group.length) return false;
      }
    } else {
      if (selector.tag && (selector.tag != '*') && (this.tagName != selector.tag)) return false;
    }
    if (selector.id && (this.attributes.id != selector.id)) return false;
    if (selector.attributes) for (var i = 0, j; j = selector.attributes[i]; i++) 
      if (!this.attributes || (j.operator ? !j.test(this.attributes[j.key] && this.attributes[j.key].toString()) : !(j.key in this.attributes))) 
        return false;
    if (selector.classes) 
      for (var i = 0, j; j = selector.classes[i]; i++) 
        if (!this.classes || !this.classes[j.value]) return false;
    if (selector.pseudos) {
      for (var i = 0, j; j = selector.pseudos[i]; i++) {
        var name = j.key;
        if (!this.pseudos || this.pseudos[name]) continue;
        var pseudo = pseudos[name];
        if (pseudo == null) pseudos[name] = pseudo = Slick.lookupPseudo(name) || false;
        if (pseudo === false || (pseudo && !pseudo.call(this, this, j.value))) return false;
      }
    }
    return true;
  },
  
  contains: function(element) {
    while (element = element.parentNode) if (element == this) return true;
    return false;
  },
  
  getChildren: function() {
    return this.childNodes;
  },

  toElement: function(){
    if (!this.built) this.build(this.origin);
    return this.element;
  },

  build: function() {
    var element = document.createElement(this.localName);
    for (var name in this.attributes)
      if (this.attributes.has(name))
        element.setAttribute(name, this.attributes[name])
    if (this.classes && this.classes.className != element.className) 
      element.className = this.classes.className;
    this.set('element', element)
    return element;
  },

  destroy: function() {
    this.fireEvent('beforeDestroy');
    if (this.parentNode) this.dispose();
    var element = this.element;
    if (element) {
      this.detach(element);
      element.destroy();
    }
    if (this.layouts.children) this.removeLayout('children');
    if (this.layouts.options) this.removeLayout('options');
    return this;
  },

  $family: function() {
    return 'widget';
  },
  
  _parent: false
});


