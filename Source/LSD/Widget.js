/*
---
 
script: Widget.js
 
description: Base widget with all modules included
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Type
  - LSD.Module.Accessories
  - LSD.Module.Ambient
  - LSD.Module.Graphics
  - LSD.Mixin.Value
  - LSD.Logger

provides: 
  - LSD.Widget
 
...
*/
  
/*
  ## Default options:
  
  ### key: 'widget'
  
  The key in element storage that widget will use to store itself.
  When set to false, widget is not written into element storage.
  
  ### destructable: true
  
  If a widget that was attached to element is getting attached to
  another element, it will destroy the old element.
  If a widget is as not `destructable`, it will only detach
  event handlers.
  
  ### inline: null
  
  Inline option makes the widget render `<div>` element when true,
  `<span>` when false, and tries using the widget tag name if 
  `inline` option is not set
*/

LSD.Widget = new LSD.Struct(LSD.Properties);
LSD.Widget.implement({
  initialize: function() {
    LSD.uid(this);
  },
  
  properties: {
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
    tag: function(value, state, old) {
      if (!this.options.source && this.prepared) {
        if (state && value) this.set('source', value)
        else if (old) this.unset('source', value);
      }
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
        if (role) {
          this.mixin(role);
          if ((this.sourced = this.captureEvent('setRole', role)))
            this.setOptions(this.sourced);
        }
        return role;
      } else {
        this.unmix(role);
        var options = this.sourced;
        if (options) {
          delete this.sourced;
          this.unsetOptions(options);
        }
      }
    },
    scope: function(value, state, old) {
      if (state) return LSD.Script.Scope.setScope(this, value)
      else if (old) LSD.Script.Scope.unsetScope(this, value);
    }
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
    this.pseudos.include(name);
    return this;
  },

  removePseudo: function(name) {
    this.pseudos.erase(name);
    return this;
  },
  
  addClass: function(name) {
    this.classes.include(name);
    return this;
  },

  removeClass: function(name){
    this.classes.erase(name);
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
    return this.captureEvent('getRelated', arguments) || this[name];
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
      if (j.operator ? !j.test(this.attributes[j.key] && this.attributes[j.key].toString()) : !(j.key in this.attributes)) return false;
    if (selector.classes) for (var i = 0, j; j = selector.classes[i]; i++) if (!this.classes[j.value]) return false;
    if (selector.pseudos) {
      for (var i = 0, j; j = selector.pseudos[i]; i++) {
        var name = j.key;
        if (this.pseudos[name]) continue;
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

  /*
    Attaches widget to a DOM element. If a widget was
    attached to some other element, it deattaches that first
  */

  attach: function(element) {
    if (element) {
      if (this.element) {
        if (this.built && this.element != element) this[this.options.destructable !== false ? 'destroy' : 'detach']();
      } else this.element = document.id(element);
    }
    if (!this.built) this.build();
    this.properties.set('element', this.element);
    if (this.options.key !== false) 
      this.element.store(this.options.key || 'widget', this).fireEvent('attach', this);
    /*
      Extracts and sets layout options from attached element
    */
    if (!this.extracted && this.options.extract !== false && (!this.built || this.origin)) {
      this.extracted = LSD.Module.Element.extract(element, this);
      this.setOptions(this.extracted);
    }
    return this.element;
  },

  detach: function(element) {
    if (this.options.key !== false) 
      this.element.eliminate(this.options.key || 'widget', this).fireEvent('detach', this)
    this.properties.unset('element', this.element);
    /*
      Unsets options previously extracted from the detached element
    */
    if (this.extracted) {
      this.unsetOptions(this.extracted);
      delete this.extracted, delete this.origin;
    }
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

  getElementTag: function(soft) {
    if (this.element) return LSD.toLowerCase(this.element.tagName);
    var options = this.options, element = options.element;
    if (element && element.tag) return element.tag;
    if (!soft) switch (options.inline) {
      case null: case undefined:
        return LSD.Layout.NodeNames[this.tagName] ? this.tagName : "div";
      case true:
        return "span";
      case false:
        return "div"
      default:
        return options.inline;
    }
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
})
