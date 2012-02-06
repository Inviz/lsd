/*
---
 
script: Element.js
 
description: A single page element
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Struct.Stack

provides: 
  - LSD.Element
 
...
*/
LSD.Element = LSD.Struct.Stack(LSD.Type);
LSD.Element.Properties = {
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
    return element || old;
  },
  origin: function(value, old, memo) {
    var extracted = this.extracted;
    if (value && !extracted) {
      var tag = value.tagName.toLowerCase();
      extracted = this.extracted = {
        tagName: tag,
        localName: tag
      };  
      for (var i = 0, start, end, attribute, bit, exp, len, attributes = value.attributes, name, script; attribute = attributes[i++];) {
        loop: for (var j = 0; j < 2; j++) {
          start = end = undefined;
          bit = j ? attribute.value : attribute.name;
          len = bit.length;
          /*
            Finds various kind of interpolations in attributes.
            
            So far these are all valid interpolations:
            
            * <button title="Delete ${person.title}" />
            * <section ${itemscope(person), person.staff && class("staff")}></section>
            * <input type="range" value=${video.time} />
            
          */
          while (start != -1) {
            if (exp == null && (start = bit.indexOf('${', start + 1)) > -1) {
              if (script == null) script = []
              if (start > 0) script.push(bit.substring(end, start));
            }
            if (exp != null || start > -1) {
              if ((end = bit.indexOf('}', start + 1)) == -1) {
                exp = (exp || '') + (start == null ? ' ' + bit : bit.substr(start + 2, len - 2));
                start = undefined;
                continue loop;
              } else {
                exp = (exp || '') + bit.substring(start == null ? 0 : start + 2, end);
                start = undefined;
              }
            }
            if (exp != null) {
              script.push(LSD.Script(exp, this));
              if (start == null) start = -1
            }
          }
          if (exp != null) {
            if (len != end + 1) {
              script.push(bit.substring(end + 1))
              exp = null;
            } else exp += ' ' + bit.substring(end + 1)
          }
        }
        if (j === 0 && start === -1 && name == null) name = bit;
        if (script || exp == null)
          (extracted.attributes || (extracted.attributes = {}))[name || attribute.name] = script 
            ? script.length > 1 
              ? new LSD.Script.Function(script, this, null, 'concat') 
              : script[0]
            : attribute.value;
        if (script) {
          name = null;
          script = null;
        }
      }
      for (var i = 0, clses = value.className.split(' '), cls; cls = clses[i++];)
        (extracted.classes || (extracted.classes = {}))[cls] = true;
      this.mix(extracted, null, memo, true, true, true);
    }
    if (old && extracted) {
      this.mix(extracted, null, memo, false, true, true);
      delete this.extracted;
    }
    return value || old;
  },
  sourceIndex: function(value, old, memo) {
    if (memo !== false) for (var node = this, next, nodes, i = 0; node; node = next) {
      next = node.firstChild || node.nextSibling ;
      while (!next && (node = node.parentNode)) {
        node.reset('sourceLastIndex', value + i, false)
        next = node.nextSibling;
      }
      if (next) next.reset('sourceIndex', value + ++i, false)
    }
    return value || old;
  },
  sourceLastIndex: function(value, old, memo) {
    if (memo !== false) for (var node = this, next, nodes, i = 0; node; node = next) {
      next = node.nextSibling || node.parentNode;
      while (!next && (node = node.parentNode)) {
        node.reset('sourceLastIndex', value + i, false)
        next = node.nextSibling;
      }
      if (next) next.reset('sourceIndex', value + ++i, false)
    }
    return value || old;
  },
  lastChild: function(value, old) {
    if (value)
      this.reset('sourceLastIndex', value.sourceLastIndex || value.sourceIndex);
    return value || old;
  },
  firstChild: function(value, old) {
    if (value)
      value.reset('sourceIndex', (this.sourceIndex || 0) + 1);
    return value || old;
  },
  previousSibling: function(value, old) {
    for (var i = 0, node, method; i < 2; i++) {
      if (i) node = old, method = 'unset';
      else node = value, method = 'set';
      if (node) {
        node.matches[method]('!+', this, null, null, true);
        node.matches[method]('++', this, null, null, true);
        if (this.tagName) {
          node.matches[method]('!+' + this.tagName, this, null, null, true);
          node.matches[method]('++' + this.tagName, this, null, null, true);
        }
        for (var sibling = this; sibling = sibling.previousSibling;) {
          sibling.matches[method]('!~', this, null, null, true);
          sibling.matches[method]('~~', this, null, null, true);
          if (this.tagName) {
            sibling.matches[method]('!~' + this.tagName, this, null, null, true);
            sibling.matches[method]('~~' + this.tagName, this, null, null, true);
          }
        }
      }
    }
    if (value) this.reset('sourceIndex', (value.sourceLastIndex || value.sourceIndex || 0) + 1);
    return value || old;
  },
  nextSibling: function(value, old) {
    for (var i = 0, node, method; i < 2; i++) {
      if (i) node = old, method = 'unset';
      else node = value, method = 'set';
      if (node) {
        node.matches[method]('+', this, null, null, true);
        node.matches[method]('++', this, null, null, true);
        if (this.tagName) {
          node.matches[method]('+' + this.tagName, this, null, null, true);
          node.matches[method]('++' + this.tagName, this, null, null, true);
        }
        for (var sibling = node; sibling; sibling = sibling.nextSibling) {
          sibling.matches[method]('~', this, null, null, true);
          sibling.matches[method]('~~', this, null, null, true);
          if (this.tagName) {
            sibling.matches[method]('~' + this.tagName, this, null, null, true);
            sibling.matches[method]('~~' + this.tagName, this, null, null, true);
          }
        }
      }
    }
    return value || old;
  },
  parentNode: function(value, old) {
    if (!value) this.unset('sourceIndex', this.sourceIndex);
    for (var i = 0, node, method; i < 2; i++) {
      if (i) node = old, method = 'unset';
      else node = value, method = 'set';
      if (node) {
        if (node.tagName) this.matches[method]('!>' + node.tagName, node, null, null, true);
        this.matches[method]('!>', node, null, null, true);
        if (this.tagName) node.matches[method]('>' + this.tagName, this, null, null, true);
        node.matches[method]('>', this, null, null, true);
        for (var parent = node; parent; parent = parent.parentNode) {
          if (this.tagName) parent.matches[method](this.tagName, this, null, null, true);
          parent.matches[method]('*', this, null, null, true);
          if (parent.tagName) this.matches[method]('!' + parent.tagName, parent, null, null, true);
          this.matches[method]('!', parent, null, null, true);
        }
      }
    }
    return value || old;
  },
  built: function(value, old) {
    if (old) {
      this.fireEvent('beforeDestroy');
      if (this.parentNode) this.dispose();
      var element = this.element;
      if (element) element.destroy();
    }
    if (value) {
      var element = document.createElement(this.localName);
      var attributes = this.attributes, classes = this.classes;
      var skip = attributes._skip; 
      for (var name in attributes) {
        if (this.attributes.hasOwnProperty(name) && (skip == null || !skip[name])) {
          var value = attributes[name];
          element.setAttribute(name, value);
          if (value === true) element[name] = true;
        }
      }
      if (classes && classes.className != element.className) 
        element.className = classes.className;
      this.set('element', element)
    }
  },
  focused: function(value, old) {
    if (value) this.mix('parentNode.focused', value);
    if (old) this.mix('parentNode.focused', old, null, false);
  },
  rendered: function(value, old) {
    if (value) this.mix('childNodes.rendered', value);
    if (old) this.mix('childNodes.rendered', old, null, false);
  },
  disabled: function(value, old) {
    if (value) this.mix('childNodes.disabled', value);
    if (old) this.mix('childNodes.disabled', old, null, false);
  },
  document: function(value, old) {
    if (value) this.mix('childNodes.document', value);
    if (old) this.mix('childNodes.document', old, null, false);
  },
  root: function(value, old) {
    if (value) this.mix('childNodes.root', value);
    if (old) this.mix('childNodes.root', old, null, false);
  },
  multiple: function(value, old) {
    if (value) {
      if (!this.values) this.set('values', new LSD.Array);
      this.set('value', this.values);
    } else {
      this.unset('value', this.values);
    }
  },
  date: Date,
  type: function(value, old) {

  },
  radiogroup: function(value, old) {

  }
};
LSD.Element.prototype.localName = 'div';
LSD.Element.prototype.tagName = null;
LSD.Element.prototype.nodeType = 1;
LSD.Element.prototype._parent = false;
LSD.Element.prototype._preconstruct = ['allocations', 'childNodes', 'variables', 'attributes', 'classes', 'events', 'matches', 'proxies', 'pseudos', 'relations', 'states'];
LSD.Element.prototype.__initialize = function(options, element) {
  this.lsd = ++LSD.UID;
  if (!LSD.Element.prototype.states) LSD.Element.prototype.mix({
    states: {
      built: false,
      hidden: false,
      disabled: false
    }
  });
  if (options != null && typeof options.nodeType == 'number') {
    var memo = element;
    element = options;
    options = memo;
  }
  if (element != null && typeof element.nodeType == 'number')
    this.set('origin', element);
  return options;
};
LSD.Element.prototype.__properties = LSD.Element.Properties;
LSD.Element.prototype.appendChild = function(child) {
  this.childNodes.push(child)
  return this;
};
LSD.Element.prototype.insertBefore = function(child, before) {
  var index = this.childNodes.indexOf(before);
  if (index == -1) index = this.childNodes.length;
  this.childNodes.splice(index, 0, child);
  return this;
};
LSD.Element.prototype.removeChild = function(child) {
  var index = this.childNodes.indexOf(before);
  if (index > -1) this.childNodes.splice(index, 1);
  return this;
};
LSD.Element.prototype.replaceChild = function(child, old) {
  var index = this.childNodes.indexOf(old);
  if (index > -1) this.childNodes.splice(index, 1, child);
  return this;
};
LSD.Element.prototype.cloneNode = function(children, options) {
  var clone = this.factory.create(this.element, Object.merge({
    source: this.source,
    tag: this.tagName,
    pseudos: this.pseudos.toObject(),
    attributes: this.attributes.toObject(),
    traverse: !!children,
    clone: true
  }, options));
  return clone;
};
LSD.Element.prototype.inject = function(node, where) {
  return this.inserters[where || 'bottom'](this, node);
};
LSD.Element.prototype.grab = function(node, where){
  return this.inserters[where || 'bottom'](node, this);
};
LSD.Element.prototype.replaces = function(el) {
  this.inject(el, 'after');
  el.dispose();
  return this;
};
LSD.Element.prototype.dispose = function() {
  var parent = this.parentNode;
  if (!parent) return;
  this.fireEvent('beforeDispose', parent);
  parent.removeChild(this);
  this.fireEvent('dispose', parent);
  return this;
};
LSD.Element.prototype.click = function() {
  switch (this.type) {
    case 'radio':
      if (!this.checked) this.set('checked', true);
      break;
    case 'checkbox':
      this[this.checked === true ? 'unset' : 'set']('checked', true);
      break;
    case 'command':
  }
};
LSD.Element.prototype.getAttribute = function(name) {
  switch (name) {
    case "class":           return this.classes.join(' ');
    case "slick-uniqueid":  return this.lsd;
    default:                return this.attributes[name];
  }
};
LSD.Element.prototype.getAttributeNode = function(name) {
  return {
    name: name,
    value: this.getAttribute(name),
    ownerElement: this
  }
};
LSD.Element.prototype.setAttribute = function(name, value) {
  this.attributes.set(name, value);
  return this;
};
LSD.Element.prototype.removeAttribute = function(name) {
  this.attributes.unset(name);
  return this;
};
LSD.Element.prototype.addPseudo = function(name) {
  this.pseudos.set(name, true);
  return this;
};
LSD.Element.prototype.removePseudo = function(name) {
  this.pseudos.unset(name, true);
  return this;
};
LSD.Element.prototype.addClass = function(name) {
  this.classes.set(name, true);
  return this;
};
LSD.Element.prototype.removeClass = function(name) {
  this.classes.unset(name, true);
  return this;
};
LSD.Element.prototype.hasClass = function(name) {
  return this.classes[name]
};
LSD.Element.prototype.fireEvent = function() {
  return this.events.fire.apply(this.events, arguments);
};
LSD.Element.prototype.addEvent = function(name, fn, memo) {
  return this.events.add(name, fn, memo);
};
LSD.Element.prototype.removeEvent = function(name, fn, memo) {
  return this.events.remove(name, fn, memo);
};
LSD.Element.prototype.store = function(name, value) {
  this.storage[name] = value;
  return this;
};
LSD.Element.prototype.retrieve = function(name, placeholder) {
  var value = this.storage[name];
  if (value == null) {
    if (placeholder != null) this.store(name, placeholder);
    return placeholder
  }
  return value;
};
LSD.Element.prototype.eliminate = function(name, value) {
  delete this.storage[name];
  return this;
};
LSD.Element.prototype.getElements = function(selector) {
  return LSD.Slick.search(this, selector)
};
LSD.Element.prototype.getElement = function(selector) {
  return LSD.Slick.find(this, selector)
};
LSD.Element.prototype.getSelector = function() {
  var parent = this.parentNode;
  var selector = (parent && parent.getSelector) ? parent.getSelector() + ' ' : '';
  selector += this.tagName;
  if (this.attributes.id) selector += '#' + this.attributes.id;
  for (var klass in this.classes) if (this.classes.has(klass))  selector += '.' + klass;
  for (var pseudo in this.pseudos) if (this.pseudos.has(pseudo)) selector += ':' + pseudo;
  for (var name in this.attributes) if (this.attributes.has(name))
    if (name != 'id') {
      selector += '[' + name;
      if (LSD.Attributes[name] != 'boolean') selector += '=' + this.attributes[name]
      selector += ']';
    }
  return selector;
};
LSD.Element.prototype.setSelector = function(selector, state) {
  if (typeof selector == 'string') selector = Slick.parse(selector).expressions[0][0];
  var method     = state !== false ? 'set' : 'unset',
      attributes = selector.attributes, 
      pseudos    = selector.pseudos, 
      classes    = selector.classes,
      id         = selector.id;
  if (attributes)
    for (var i = 0, attribute; attribute = attributes[i++];)
      element.attributes[method](attribute.key, attribute.value);
  if (pseudos)
    for (var i = 0, pseudo; pseudo = pseudos[i++];)
      element.pseudos[method](pseudo.key, pseudo.value);
  if (classes)
    for (var i = 0, klass; klass = classes[i++];)
      element.classes[method](klass.value, true);
  if (id) element.attributes[method]('id', id);
};
LSD.Element.prototype.test = function(selector) {
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
};
LSD.Element.prototype.contains = function(element) {
  while (element = element.parentNode) if (element == this) return true;
  return false;
};
LSD.Element.prototype.getChildren = function() {
  return this.childNodes;
};
LSD.Element.prototype.toElement = function(){
  if (!this.built) this.build();
  return this.element;
};
LSD.Element.prototype.$family = function() {
  return 'widget';
};
LSD.Element.prototype.inserters = {

	before: function(context, element){
		var parent = element.parentNode;
		if (parent) parent.insertBefore(context, element);
	},

	after: function(context, element){
		var parent = element.parentNode;
		if (parent) parent.insertBefore(context, element.nextSibling);
	},

	bottom: function(context, element){
		element.appendChild(context);
	},

	top: function(context, element){
		element.insertBefore(context, element.firstChild);
	}

};