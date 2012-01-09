/*
---
 
script: Widget.js
 
description: Base widget with all modules included
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - Slick/Slick.Finder
  - LSD.Script/LSD.Struct.Stack

provides: 
  - LSD.Widget
 
...
*/
  
/*
  ## Default options:
  ### inline: null
  
  Inline option makes the widget render `<div>` element when true,
  `<span>` when false, and tries using the widget tag name if 
  `inline` option is not set
*/
LSD.Slick = window.Slick;
LSD.Widget = new LSD.Struct.Stack(LSD.Type);
LSD.Widget.Properties = {
  context: function(value, state, old) {
    var source = this.source;
    if (source) this.unset('source', source);
    if (state) {
      if (typeof value == 'string') {
        var camel = LSD.toClassName(value);
        this.factory = LSD.global[this.options.namespace][camel];
        if (!this.factory) throw "Can not find LSD.Type in " + ['window', this.options.namespace, camel].join('.');
      } else {
        this.factory = value;
      }
    }
    if (source) this.set('source', source);
  },
  tagName: function(value, state, old) {
    if (!this.source && this.prepared) {
      if (state && value) this.set('source', value)
      if (old) this.unset('source', old);
    }
    var previous = this.previousSibling, next = this.nextSibling, parent = this.parentNode;
    if (previous) {
      if (tag) {
        previous.matches.set('!+' + tag, this, null, null, true);
        previous.matches.set('++' + tag, this, null, null, true);
      }
      if (old) {
        previous.matches.unset('!+' + old, this, null, null, true);
        previous.matches.unset('++' + old, this, null, null, true);
      }
      for (var sibling = previous; sibling; sibling = sibling.previousSibling) {
        if (tag) {
          sibling.matches.set('!~' + tag, this, null, null, true);
          sibling.matches.set('~~' + tag, this, null, null, true);
        }
        if (old) {
          sibling.matches.unset('!~' + old, this, null, null, true);
          sibling.matches.unset('~~' + old, this, null, null, true);
        }
      }
    }
    if (next) {
      if (tag) {
        next.matches.set('+' + tag, this, null, null, true);
        next.matches.set('++' + tag, this, null, null, true);
      }
      if (old) {
        next.matches.unset('+' + old, this, null, null, true);
        next.matches.unset('++' + old, this, null, null, true);
      }
      for (var sibling = next; sibling; sibling = sibling.nextSibling) {
        if (tag) {
          sibling.matches.set('~' + tag, this, null, null, true);
          sibling.matches.set('~~' + tag, this, null, null, true);
        }
        if (old) {
          sibling.matches.unset('~' + old, this, null, null, true);
          sibling.matches.unset('~~' + old, this, null, null, true);
        }
      }
    }
    if (parent) {
      if (tag) parent.matches.set('>' + tag, this, null, null, true);
      if (old) parent.matches.unset('>' + old, this, null, null, true);
      for (sibling = parent; sibling; sibling = parent.parentNode) {
        if (tag) sibling.matches.set(tag, this, null, null, true);
        if (old) sibling.matches.unset(old, this, null, null, true);
      }
    }
  },
  localName: function(value, state, old) {
    
  },
  inline: function(value, state, old) {
    if (state) this.set('localName', value ? 'span' : 'div', true);
    if (typeof old != 'undefined') this.unset('localName', old ? 'span' : 'div', true);
  },
  source: function(value, state, old) {
    if (state && value) {
      var role = LSD.Module.Properties.getRole(this);
      if (role && this.role === role) return;
    }
    if (this.prepared) {
      if (state) {
        this.set('role', role);
      } else if (this.role) {
        this.unset('role', this.role);
      }
    }
  },
  role: function(value, state, old) {
    if (state) {
      if (role == null) role = this.getRole(this)
      if (role) this.mixin(role);
      return role;
    } else {
      this.unmix(role);
    }
  },
  scope: function(value, state, old) {
    if (state) return LSD.Script.Scope.setScope(this, value)
    else if (old) LSD.Script.Scope.unsetScope(this, value);
  },
  element: function() {
    if (this.key !== false) 
      Element[state ? 'store' : 'eliminate'](this.element, this.key || 'widget', this);
  },
  /*
    Extract and apply options from elements
  */
  origin: function(value, state, old, memo) {
    if (state) {
      if (!this.extracted && this.extracted !== false) {
        this.extracted = LSD.Module.Element.extract(value, this);
        this.mix(this.extracted, null, memo);
      }
    }
    if (state ? old : value) {
      if (this.extracted) {
        this.mix(this.extracted, null, memo, false);
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
  nextSibling: function(value, state, old, memo) {
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
  initialize: function() {
    this.lsd = ++LSD.UID; 
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

  build: function(query) {
    if (query) {
      if (query.nodeType) {
        var element = query; 
        query = {};
      }
    } else query = {};
    element = query.element = element || this.element;
    var options = this.options;
    this.fireEvent('beforeBuild', query);
    if (element) LSD.Module.Element.validate(this, query);
    if (this.parentNode) this.parentNode.dispatchEvent('beforeNodeBuild', [query, this]);
    var build = query.build;
    delete query.element, delete query.build;
    var attrs = {};
    for (var attribute in this.attributes) 
      if (this.attributes.has(attribute)) 
        attrs[attribute] = this.attributes[attribute];
    Object.merge(attrs, options.element, query.attributes);
    for (var attribute in attrs)
      if (this.attributes[attribute] != attrs[attribute]) 
        this.attributes.set(attribute, attrs[attribute]);
    var tag = query.tag || attrs.tag || this.getElementTag();
    delete attrs.tag; delete query.tag;
    if (!element || build) {
      element = this.element = new Element(tag, attrs.type ? {type: attrs.type} : null);
    } else {
      element = this.element = document.id(element);
    }
    for (var name in attrs) 
      if (name != 'type' || tag != 'input') {
        if (LSD.Attributes[name] == 'boolean') element[name] = true;
        element.setAttribute(name, attrs[name] === true ? name : attrs[name]);
      }
    var classes = [];
    if (this.tagName != tag) classes.push('lsd ', this.tagName);
    for (var name in this.classes) if (this.classes.has(name)) classes.include(name);
    if (classes.length) this.element.className = classes.join(' ');
    if (this.style) for (var property in this.style.element) this.element.setStyle(property, this.style.element[property]);
    this.attach(this.element);

    var role = LSD.Module.Properties.getRole(this);
    if (this.role !== role) 
      this.properties.set('role', role)

    if (this.properties.layout)
      this.addLayout('options', this.properties.layout, null, {lazy: true});

    if (this.origin && !this.options.clone && this.origin.parentNode && this.origin != this.element) 
      this.element.replaces(this.origin);

    if (this.options.traverse !== false && !this.options.lazy) {
      var nodes = LSD.slice((this.origin || this.element).childNodes);
      var opts = {};
      if (this.options.context) opts.context = this.options.context;
      if (this.options.clone) opts.clone = this.options.clone
      if (nodes.length) this.addLayout('children', nodes, null, opts);
      this.fireEvent('DOMChildNodesRendered');
    }
    return this.element;
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
    return this.options.key || 'widget';
  }
});

console.profile(123);
for (var i = 0; i < 2000; i++) new LSD.Widget({tagName: 'div', events: {
  click: function() {
    
  }
}})
console.profileEnd(123);
