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

LSD.Element = new LSD.Struct.Stack(LSD.Properties);
LSD.Element.prototype.onChange = function(key, value, state, old, memo) {
  var ns         = this.document || LSD.Document.prototype,
      states     = ns.states,
      definition = states[key],
      stack      = this._stack && this._stack[key];
  if (!definition) return value;
  if (state && (!stack || stack.length === 1) && typeof this[definition[0]] != 'function') {    
    var compiled = states._compiled || (states._compiled = {});
    var methods = compiled[key] || (compiled[key] = LSD.Element.compileState(key, definition, ns));
    for (var method in methods) this._set(method, methods[method]);
  }
  if (value || old) {
    if ((ns.attributes[key]) !== Boolean) {
      if (memo !== 'classes' && key !== 'built')
        this.classList[value && state ? 'set' : 'unset'](key, true, 'states');
    } else {
      if (memo !== 'attributes') 
        if (value && state) this.attributes.set(key, true, 'states')
        else this.attributes.unset(key, undefined, 'states')
    }
  }
  if (stack && stack.length === 0) {
    var methods = states._compiled[key];
    for (var method in methods) this._unset(method, methods[method]);
  }
  return value;
};
LSD.Element.prototype.__properties = {
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
    var previous = this.previousElementSibling, next = this.nextElementSibling, parent = this.parentNode;
    if (previous) {
      if (value) {
        previous.matches.add('!+', value, this);
        previous.matches.add('++', value, this);
      }
      if (old) {
        previous.matches.remove('!+', old, this);
        previous.matches.remove('++', old, this);
      }
      for (var sibling = previous; sibling; sibling = sibling.previousElementSibling) {
        if (value) {
          sibling.matches.add('!~', value, this);
          sibling.matches.add('~~', value, this);
        }
        if (old) {
          sibling.matches.remove('!~', old, this);
          sibling.matches.remove('~~', old, this);
        }
      }
    }
    if (next) {
      if (value) {
        next.matches.add('+', value, this);
        next.matches.add('++', value, this);
      }
      if (old) {
        next.matches.remove('+', old, this);
        next.matches.remove('++', old, this);
      }
      for (var sibling = next; sibling; sibling = sibling.nextElementSibling) {
        if (value) {
          sibling.matches.add('~', value, this);
          sibling.matches.add('~~', value, this);
        }
        if (old) {
          sibling.matches.remove('~', old, this);
          sibling.matches.remove('~~', old, this);
        }
      }
    }
    if (parent) {
      if (value) parent.matches.add('>', value, this);
      if (old) parent.matches.remove('>', old, this);
      for (sibling = parent; sibling; sibling = parent.parentNode) {
        if (value) sibling.matches.add(' ', value, this);
        if (old) sibling.matches.remove(' ', old, this);
      }
    }
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
    if (element) element.lsd = this.lsd;
    if (old) delete old.lsd;
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
              ? new LSD.Script({name: 'concat', input: script, type: 'function'}) 
              : script[0]
            : attribute.value;
        if (script) {
          name = null;
          script = null;
        }
      }
      for (var i = 0, clses = value.className.split(' '), cls; cls = clses[i++];)
        (extracted.classes || (extracted.classes = {}))[cls] = true;
      for (var key in extracted) {
        if (key === 'classes') key = 'classList';
        var val = extracted[key];
        if (typeof val == 'object')
          for (var subkey in val) 
            this[key].set(subkey, val[subkey], memo, true);
        else this.set(key, val, memo, true);
      }
    }
    if (old && extracted) {
      for (var key in extracted) {
        if (key === 'classes') key = 'classList';
        var val = extracted[key];
        if (typeof val == 'object')
          for (var subkey in val) 
            this[key].unset(subkey, val[subkey], memo, true);
        else this.unset(key, val, memo, true);
      }
      delete this.extracted;
    }
  },
  sourceIndex: function(value, old, memo) {
    if (memo !== false) for (var node = this, next, nodes, i = 0; node; node = next) {
      next = node.firstChild || node.nextSibling;
      while (!next && (node = node.parentNode)) {
        if (value) node.sourceLastIndex = value + i;
        next = node.nextSibling;
      }
      if (next) next.reset('sourceIndex', value + ++i, false)
    }
    return value || old;
  },
  firstChild: function(value, old) {
    if (value)
      value.reset('sourceIndex', (this.sourceIndex || 0) + 1);
  },
  previousSibling: function(value, old) {
    if (value) this.reset('sourceIndex', (value.sourceLastIndex || value.sourceIndex || 0) + 1);
  },
  previousElementSibling: function(value, old) {
    for (var i = 0, node, method; i < 2; i++) {
      if (i) node = old, method = 'remove';
      else node = value, method = 'add';
      if (node) {
        node.matches[method]('!+', this.tagName, this, true);
        node.matches[method]('++', this.tagName, this, true);
        for (var sibling = this; sibling = sibling.previousElementSibling;) {
          sibling.matches[method]('!~', this.tagName, this, true);
          sibling.matches[method]('~~', this.tagName, this, true);
        }
      }
    }
  },
  nextElementSibling: function(value, old) {
    for (var i = 0, node, method; i < 2; i++) {
      if (i) node = old, method = 'remove';
      else node = value, method = 'add';
      if (node) {
        node.matches[method]('+', this.tagName, this, true);
        node.matches[method]('++', this.tagName, this, true);
        for (var sibling = node; sibling; sibling = sibling.nextElementSibling) {
          sibling.matches[method]('~', this.tagName, this, true);
          sibling.matches[method]('~~', this.tagName, this, true);
        }
      }
    }
  },
  parentNode: function(value, old) {
    if (!value) this.unset('sourceIndex', this.sourceIndex);
    for (var i = 0, node, method; i < 2; i++) {
      if (i) node = old, method = 'remove';
      else node = value, method = 'add';
      if (node) {
        this.matches[method]('!>', node.tagName, node, true);
        node.matches[method]('>', this.tagName, this, true);
        for (var parent = node; parent; parent = parent.parentNode) {
          this.matches[method]('!', parent.tagName, parent, true);
          parent.matches[method](' ', this.tagName, this, true);
        }
      }
    }
  },
  built: function(value, old) {
    if (old) {
      this.fireEvent('beforeDestroy');
      if (this.parentNode) this.dispose();
      var element = this.element;
      if (element) element.destroy();
    }
    if (value) {
      if (this.origin && !this.clone) {
        var element = this.origin;
      } else {
        var element = document.createElement(this.localName);
        var attributes = this.attributes, classes = this.classList;
        var skip = attributes._skip; 
        for (var name in attributes) {
          if (this.attributes.hasOwnProperty(name) && (skip == null || !skip[name])) {
            var val = attributes[name];
            element.setAttribute(name, val);
            if (val === true) element[name] = true;
          }
        }
        if (classes && classes.className != element.className) 
          element.className = classes.className;
      }
      this.set('element', element)
    }
    if (value) this.mix('childNodes.built', value);
    if (old) this.mix('childNodes.built', old, null, false);
  },
  className: 'classList._name',
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
  value: function(value, old, memo) {
    if (this.checked === true || typeof this.checked == 'undefined')
      this.reset('nodeValue', value);
  },
  name: function(value, old) {
    
  },
  type: function(value, old) {

  },
  radiogroup: function(value, old) {

  }
};
LSD.Element.prototype.localName = 'div';
LSD.Element.prototype.tagName = null;
LSD.Element.prototype.className = '';
LSD.Element.prototype.nodeType = 1;
LSD.Element.prototype._parent = false;
LSD.Element.prototype._preconstruct = ['allocations', 'childNodes', 'variables', 'attributes', 'classList', 'events', 'matches', 'proxies', 'relations'];
LSD.Element.prototype.__initialize = function(/* options, element, selector */) {
  LSD.UIDs[this.lsd = ++LSD.UID] = this;
  if (this.built == null) LSD.Element.prototype.mix({
    built: false,
    hidden: false,
    disabled: false
  }, null, '_set');
  for (var i = 0, args = arguments, j = args.length, arg; i < j; i++) {
    if (!(arg = args[i])) continue;
    if (typeof arg == 'string') {
      this.setSelector(arg);
    } else if (arg.nodeType) {
      this.set('origin', arg);
    } else {
      var options = arg;
    }
  }
  return options;
};
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
LSD.Element.prototype.cloneNode = function(children) {
  return (this.document || LSD.Document.prototype).createElement({
    origin: this.element,
    tag: this.tagName,
    clone: true
  });
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
    case "class":           return this.className;
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
LSD.Element.prototype.addClass = function(name) {
  this.classList.set(name, true);
  return this;
};
LSD.Element.prototype.removeClass = function(name) {
  this.classList.unset(name, true);
  return this;
};
LSD.Element.prototype.hasClass = function(name) {
  return this.classList[name]
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
  for (var klass in this.classList) if (this.classList.has(klass))  selector += '.' + klass;
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
      classes    = selector.classes,
      id         = selector.id,
      tag        = selector.tag;
  if (tag && tag !== '*') this.set('tagName', tag)
  if (attributes)
    for (var i = 0, attribute; attribute = attributes[i++];)
      this.attributes[method](attribute.key, attribute.value);
  if (classes)
    for (var i = 0, klass; klass = classes[i++];)
      this.classList[method](klass.value, true);
  if (id) this.attributes[method]('id', id);
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
      if (!this.classList || !this.classList[j.value]) return false;
  if (selector.pseudos) {
    for (var i = 0, j; j = selector.pseudos[i]; i++) {
      var name = j.key;
      if (this[name]) continue;
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
LSD.Element.compileState = function(key, definition) {
  var obj = {};
  obj[definition[0]] = function() {
    return this.reset(key, true);
  };
  obj[definition[1]] = function() {
    return this.reset(key, false);
  };
  return obj;
};