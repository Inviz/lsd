/*
---

script: Element.js

description: A single page element

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Struct
  - LSD.Stack
  - LSD.Properties.Events
  - LSD.Properties.Proxies
  - LSD.Node
  - LSD.Document

provides:
  - LSD.Element
...
*/

/*
  Elements in HTML are pretty powerful, although implementations of browser
  DOM are not consistent between browsers, and it often needs another layer
  of abstraction with reliable API. Be it god object a la jQuery, or wrappers
  like in mootools, they only go so far in empowering standart elements,
  because they still rely on DOM features that are not customizible enough.

   LSD has a different approach of building a "perfect DOM" by reimplementing
  all element features in objects that are under full control of a
  programmer. When most of the Element features are implemented in a
  compatible way, the code that works with regular elements may work with
  elements implemented in javascript.

   Simple re-implementation of browser DOM is nothing new, projects like
  jsdom do it with moderate success. What makes LSD different is that every
  property in every object is observable, objects are customizable, and
  there's an infrastructure for observing selectors, assigning and
  dispatching values, scripting language and compued properties, and a built
  in set of various plugins.

   LSD builds a tree of elements identical to tree of regular elements and
  gets powerful observing and introspection capabilities almost for free.
*/

LSD.Element = new LSD.Struct(LSD.Properties, 'Stack');
LSD.Element.prototype.onChange = function(key, value, memo, old) {
  var ns         = this.document || LSD.Document.prototype,
      states     = ns.states,
      definition = states[key],
      stack      = this._stack && this._stack[key];
  if (this._inherited[key] && this.childNodes)
    for (var i = 0, child; child = this.childNodes[i++];) {
      child.set(key, value, memo, true);
      if (typeof old != 'undefined') child.unset(key, old, memo, true);
    }
  if (!definition) return
  if (typeof value != 'undefined' && (!stack || stack.length === 1) && typeof this[definition[0]] != 'function') {
    var compiled = states._compiled || (states._compiled = {});
    var methods = compiled[key];
    if (!methods) {
      compiled[key] = methods = {};
      methods[definition[0]] = function(memo) {
        return this.change(key, true, memo);
      };
      methods[definition[1]] = function(memo) {
        return this.change(key, false, memo);
      };
    }
    for (var method in methods) this._set(method, methods[method]);
  }
  if (value || old)
    if ((ns.attributes[key]) !== Boolean) {
      if (memo !== 'classes' && key !== 'built')
        this.classList.mix(key, value, 'states', old);
    } else {
      if (memo !== 'attributes')
        this.attributes.mix(key, value, 'states', old);
    }
  if (stack && stack.length === 0) {
    var methods = states._compiled[key];
    for (var method in methods) this._unset(method, methods[method]);
  }
};
LSD.Element.prototype.__properties = {
  /*
    Role is an object that defines the widget behavior. Roles, unlike mixins
    are exclusive, so element can have only one role at time. An element
    finds the role if it was given a string and mix in the found object. If a
    role object is an observable object, it subscribes the element for
    changes in it. When a role is changed from one to another, stack objects
    perform all manipulations on state and only the properties that are
    different between two roles will trigger observer callbacks.

     Role may be a string, to be used as "search terms" for role lookup. LSD
    provides a handy mechanism of finding the right class for an element. It
    takes tag name, `type`, `kind` and `id` attributes into account. It tries
    to find the role by tag name, then in looks for a sub-role based on
    `type` attribute, then it checks if there's a customized sub-role by the
    name that goes in `kind` attribute, and finally tries to find a subclass
    by `id` attribute. If it doesn't find the sub-role, it uses matching role
    it could find.

     It powers up form controls widget, where datepicker tries to find
    `input.date` role. And if it's not there, it tries `input` which in terms
    of html is a text input. `input.datetime-local`.
  */
  role: function(value, old, memo) {
    var roles = (this.document || LSD.Document.prototype).roles
    if (!roles) return;
    if (typeof value == 'string')
      value = typeof roles[value] == 'undefined' ? roles.get(value) : roles[value];
    if (typeof old == 'string') old = roles[old];
    this.mix(value, null, memo, old, false, true);
  },

  type: function(value, old, memo) {
    this.setRoleBit(1, value);
  },

  kind: function(value, old, memo) {
    this.setRoleBit(2, value);
  },

  id: function(value, old, memo) {
    this.setRoleBit(3, value);
  },
/*
  Tag name is an element role category. Most of the categories have only
  one role, but some have a family of sub-roles like `input` or `menu`.
  Sub roles are accessible by specifying `type` and `kind` attributes.
*/
  tagName: function(value, old, memo) {
    this.mix('nodeName', value, memo, old);
    this.mix('localName', value, memo, old, true);
/*
  LSD.Element figures out its tag name before it is placed in DOM, so
  following code doesn't run initially. It only runs if an element was in DOM
  and its tag name was changed, so selectors that matched that element before
  dont match it anymore, and maybe there're some other selectors that match
  the element with the new tag name.

   LSD supports all CSS3 combinators and also ones that were added in Slick,
  reverse combinator and its friends. Instead of matching lots of selectors
  against lots of elements many times per second, LSD stores callbacks in a
  specific way, and allows elements register themselves in other elements by
  applicable combinators and run callbacks if such a combinator/tag pair was
  expected. So a few loops below do exactly that, register new tag name and
  unregister old tag name in surroinding elements. Observable selectors are
  built on top of these simple setters.
*/
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
    this.setRoleBit(0, value);
  },
/*
  Each widget builds its own element, and it's good when tag name of a
  widget matches tag name of element. But in some situations like in custom
  form fields implementations standart elements dont provide the desired
  level of customization, so one may need an element with no strings
  attached and they use `localName` property to specify a desired tag name
  in DOM.
*/
  localName: function(value, old) {
    return value;
  },
/*
  `inline` property is a shortcut that lets to reset element tag name to
  neutral `span` or `div` element (true and false values respectively).
  It's only used when no localName is given.
*/
  inline: function(value, old, memo) {
    var revert = this.tagName != this.localName;
    if (typeof value != 'undefined')
      this.set('localName', value ? 'span' : 'div', memo, revert);
    if (typeof old != 'undefined')
      this.unset('localName', old ? 'span' : 'div', memo, revert);
  },
/*
  LSD.Element writes a single property into a real element that helps to tell
  if a node has related LSD.Element instantiated or not.
*/
  element: function(element, old) {
    if (element) element.lsd = this.lsd;
    if (old) delete old.lsd;
  },
/*
  LSD.Element can be assigned an origin, a real DOM element that should be
  used as a source of a tag name and attributes. When a `clone` property is
  set to true, the origin will not be used or altered. LSD.Element will
  create its own copy of an origin to use as its element. If `clone` is not
  set, origin will be used as an element.
*/
  origin: function(value, old, memo) {
    if (!memo) memo = 'origin';
    var originated = this.originated;
    if (value && !originated) {
      opts = this.originated = {};
      if (value.tagName)
        var tag = opts.tagName = opts.localName = value.tagName.toLowerCase();
      if (value.lsd) {
        var attributes = value.attributes, skip = attributes._skip;
        for (var attribute in attributes) {
          if (attributes.hasOwnProperty(attribute) && !skip[attribute]) {
            if (!opts.attributes) opts.attributes = {};
            opts.attributes[attribute] = attributes[attribute];
          }
        }
      } else {
        var start, end, bit, exp, len, name, script;
        for (var i = 0, attr, attrs = value.attributes; attr = attrs[i++];) {
          loop: for (var j = 0; j < 2; j++) {
            start = end = undefined;
            bit = j ? attr.value : attr.name;
            len = bit.length;
/*
  Finds various kind of interpolations in
  DOM element attributes.

  So far these are all valid interpolations:

  * <button title="Delete ${person.title}" />
  * <section ${itemscope(person), person.staff && class("staff")}></section>
  * <input type="range" value=${video.time} />

  Browser parses some of those like multiple weird attributes,
  but those mostly are harmless, except perhaps the ">" character.
  Following routine glues them together into an expression and
  compiles an LSD.Script reprensentation of it targetted at
  the attribute or element
*/
            while (start != -1) {
              if (exp == null && (start = bit.indexOf('${', start + 1)) > -1) {
                if (script == null) script = []
                if (start > 0) script.push(bit.substring(end + 1, start));
              }
              if (exp != null || start > -1) {
                if ((end = bit.indexOf('}', start + 1)) == -1) {
                  exp = (exp || '') + (start == null ? ' ' + bit : bit.substr(start + 2, len - 2));
                  start = undefined;
                  continue loop;
                } else {
                  exp = (exp || '') + bit.substring(start == null ? 0 : start + 2, end);
                }
              }
              if (exp != null) script.push(LSD.Script(exp, this));
              if (start == null || (start > -1 && bit.indexOf('${', start + 1) == -1)) {
                start = -1;
              } else exp = null;
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
            (opts.attributes || (opts.attributes = {}))[name || attr.name] = script
              ? script.length > 1
                ? new LSD.Script({name: 'concat', input: script, type: 'function'})
                : script[0]
              : attr.value;
          if (script) name = script = null;
        }
      }
      for (var i = 0, clses = value.className.split(' '), cls; cls = clses[i++];)
        (opts.classes || (opts.classes = {}))[cls] = true;
      for (var key in opts) {
        if (key === 'classes') key = 'classList';
        var val = opts[key];
        if (typeof val == 'object')
          for (var subkey in val)
            this[key].set(subkey, val[subkey], memo, true);
        else this.set(key, val, memo, true);
      }
      if (!this.fragment && value.childNodes.length) {
        var fragment = new LSD.Fragment;
        fragment.enumerable(Array.prototype.slice.call(value.childNodes), this)
        this.fragment = fragment;
      }
    }
    if (old && opts) {
      for (var key in opts) {
        if (key === 'classes') key = 'classList';
        var val = opts[key];
        if (typeof val == 'object')
          for (var subkey in val)
            this[key].unset(subkey, val[subkey], memo, true);
        else this.unset(key, val, memo, true);
      }
      delete this.originated;
    }
  },
/*
  LSD.Element may use an element given as `origin`, when `clone` option is
  not set to true. When it decides that it needs to build a new element, it
  tries its best to do it right, because its `tagName` (and often `type`
  attribute, and sometimes even `name` attribute) can't be easily changed
  later in all browsers. There's a whole section in HTML5 spec dedicated to
  how to store previous names of form elements, before they had their name
  changed, so proper attributes and tag names is kind of a big deal.

   LSD tries to abstract away element's tagName, name and type attributes.
  LSD does not use element names directly, because it submits forms virtually
  and has the power to alias names (which is useful when dealing with nested
  attributes and arrays). But having different tag name for an element in DOM
  and in LSD means that there may be selectors that either only match
  LSD.Element, or DOM element, but not both. That is a problem when dealing
  with CSS stylesheets (e.g. they target for `input[type=text]`, but in fact
  operate with a `span` element that tries hard to look as a text input). LSD
  Stylesheet can compensate for mismatch by observing selectors and finding
  where rules did not match and assigning styles explicitly.
*/
  built: function(value, old, memo) {
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
        var attrs = this.attributes, classes = this.classList;
        var skip = attrs._skip;
        for (var name in attrs) {
          if (attrs.hasOwnProperty(name) && (skip == null || !skip[name])) {
            element.setAttribute(name, attrs[name]);
            if (attrs[name] === true) element[name] = true;
          }
        }
        if (classes && classes.className != element.className)
          element.className = classes.className;
      }
      this.set('element', element)
    }
    this.mix('childNodes.built', value, memo, old);
  },
/*
  Javascript DOM is known for its unfriendly implementation of accessibility
  features and specificially focus control. There're many ways to lose focus,
  but hard to track in all browsers, and it makes developers invent dirty
  hacks for older browsers.

   Unlike DOM elements, any LSD.Element may be focused, but not every element
  may be `activeElement` in document. When a person presses `tab` key on his
  keyboard, LSD looks for a closest element that may become `activeElement`,
  a form control or a link (in less restrictive environments like Windows)
  and focuses it and all its parents. Each of the parent recieve an optional
  `memo` with an element that become `activeElement`.

   What's different between LSD focus stack and DOM focus, is that when focus
  changes between controls of a single form, the form itself never loses
  focus so it can be styled and animated consistently. Focus observers based
  on DOM events often have race conditions that are hidden behind delayed
  callbacks. LSD can synchronously focus the specific subtree and blur
  previously focused subtree without affecting focused state of common
  ancestors.

   Focusing a subtree instead of a single node is useful for nested
  interfaces like dialog overlays, slide-out panels, multi-window
  environments, in focus-driven navigation and lots of other applications.
*/
  focused: function(value, old, memo) {
    if (memo === this) return;
    if (value)
      this.mix('parentNode.focused', value, memo || this, true);
    if (value && !memo && this.ownerDocument)
      this.ownerDocument.change('activeElement', this, false);
    if (old)
      this.mix('parentNode.focused', old, memo || this, false);
  },
  rendered: function(value, old) {
  },
  disabled: function(value, old) {
  },
  root: function(value, old) {
  },
/*
  Good DOM collections are sorted so nodes in collection are in the order of
  appearance in DOM. When an element is removed from DOM, it is removed from
  collection as well. In order to pull this off, each node should know it's
  position in document. That's why LSD.Element is made to maintain a
  `sourceIndex` property that is a number. Each time something happens to the
  DOM, numbers are updated, callbacks are fired and collections get gently
  resorted with swaps.
*/
  sourceIndex: function(value, old, memo) {
    var index = value == null ? old - 1 : value;
    if (memo !== false) for (var node = this, next, nodes, i = 0; node; node = next) {
      for (next = node.firstChild || node.nextSibling;
          !next && (node = node.parentNode); next = node.nextSibling)
        if (value) node.sourceLastIndex = index + i;
      if (next) next.change('sourceIndex', index + ++i, false)
    }
  },
/*
  LSD.Element uses LSD.ChildNodes primitive that creates a special observable
  collection that links objects in the collection together with links from
  DOM1 (`previousSibling`, `nextSibling`) and from DOM2
  (`previousElementSibling`, `nextElementSibling`). LSD.Element uses both
  kinds of links to register the node in surrounding nodes to match possible
  observing selectors and remap the indecies of nodes to trigger LSD.NodeList
  collections resorts.
*/
  firstChild: function(value, old) {
    if (value) value.change('sourceIndex', (this.sourceIndex || 0) + 1);
  },
  previousSibling: function(value, old, memo) {
    if (value) this.change('sourceIndex', (value.sourceLastIndex || value.sourceIndex || 0) + 1, memo);
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
  parentNode: function(value, old, memo) {
    if (!value) {
      if (memo !== 'overwrite' && memo !== 'collapse') this.unset('sourceIndex', this.sourceIndex, memo);
    } else this.mix('variables', value.variables, memo, true, true);
    if (old) this.mix('variables', old.variables, memo, false, true)
    for (var property in this._inherited) {
      if (value && value[property]) this.set(property, value[property], memo, true);
      if (old && old[property]) this.unset(property, old[property], memo, true);
    }
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
      this.mix('nodeValue', value, memo, old)
  },
  /*
    A change in `textContent` of a text node or explicit override of
    `textContent` property in node bubbles up to all parent nodes and updates
    their text content properties. A special `memo` parameter is used to
    avoid recursion.
  */
  textContent: function(value, old, memo) {
    if (memo !== 'textContent') for (var node = this; node = node.parentNode;) {
      var children = node.childNodes;
      var content = children.textContent;
      if (content != null) {
        for (var text = '', child, i = 0; child = children[i++];)
          if (child.textContent != null) text += child.textContent;
        node.set('textContent', text, 'textContent');
        node.unset('textContent', content, 'textContent');
        children.textContent = text;
      }
    }
    this.mix('nodeValue', value, memo, old, true);
  },
  /*
    Different types of elements have different strategies to define value.
    The strategy may be defined dynamically by providing a
    `nodeValueProperty` with the name of a property that should be trated as
    value. If it's not given `textContent` will be used as `nodeValue`.
  */
  nodeValueProperty: function(value, old) {
    if (value) this.watch(value, 'nodeValue');
    console.error([this.nodeValue, value, this.href])
    if (old) this.unwatch(old, 'nodeValue');
  },
  src:    'request.url',
  href:   'request.url',
  action: 'request.url',
  /*
    Microdata object is one of inheritable values. When a child node defines
    its own scope object by using `itemscope` property, the widget will hold
    links to both object coming from parent node and own object, but only use
    the latter. If a widget loses the `itemscope` attribute, it'll lose its
    own scope object and fall back to an object inherited from parent
    element.
  */
  microdata: function(value, old, memo) {
    this.mix('variables', value, memo, old, true);
  },
  itemscope: function(value, old, memo) {
    if (value) this.set('nodeValue', this._construct('microdata'), memo);
    if (old) this.unset('nodeValue', this.microdata, memo);
  },
  itemprop: function(value, old, memo) {
    if (value) this.watch('nodeValue', 'parentNode.microdata.' + value);
    if (old) this.unwatch('nodeValue', 'parentNode.microdata.' + old);
  },
  itemtype: function(value, old) {

  },
  itemid: function(value, old) {

  },
  itemref: function() {

  }
};
LSD.Element.implement(LSD.Node.prototype)
LSD.Element.prototype.localName = 'div';
LSD.Element.prototype.tagName = null;
LSD.Element.prototype.className = '';
LSD.Element.prototype.nodeType = 1;
LSD.Element.prototype._inherited = {'drawn': 1, 'built': 1, 'hidden': 1, 'disabled': 1, 'root': 1, 'microdata': 1};
LSD.Element.prototype._preconstruct = ['childNodes', 'proxies', 'variables', 'attributes', 'classList', 'events', 'matches', 'relations'];
LSD.Element.prototype.__initialize = function(/* options, element, selector, document */) {
  LSD.UIDs[this.lsd = ++LSD.UID] = this;
  if (this.classList) {
    this.classes = this.classList;
    this.childNodes._prefilter = this.proxies._bouncer
  }
  for (var i = arguments.length; --i > -1;) {
    if ((arg = arguments[i])) switch (typeof arg) {
      case 'string':
        this.setSelector(arg);
        break;
      case 'object':
        switch (arg.nodeType) {
          case 1:
            var origin = arg;
            break;
          case 9:
            this.document = this.ownerDocument = arg;
            break;
          case 11:
            this.fragment = arg;
            break;
          default:
            var options = arg;
        }
    }
  }
  if (origin) this.set('origin', origin);
  return options;
};
LSD.Element.prototype.setRoleBit = function(key, value) {
  var bits = (this.roleBits || (this.roleBits = {})), autorole = this.autorole;
  bits[key] = value;
  for (var i = 0, role; i < 4; i++)
    if (bits[i]) role = (role ? role + '-' : '') + bits[i];
  this.autorole = role;
  this.set('role', role)
  if (autorole != null) this.unset('role', autorole)
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
  this.attributes.change(name, value);
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
  this.events.mix(name, fn, memo);
  return this;
};
LSD.Element.prototype.addEvents = function(events, memo) {
  this.events.mix(events, null, fn, memo);
  return this;
};
LSD.Element.prototype.removeEvent = function(name, fn, memo) {
  this.events.mix(name, fn, memo, false);
  return this;
};
LSD.Element.prototype.removeEvents = function(events, memo) {
  this.events.mix(events, null, memo, false);
  return this;
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
  } else return value;
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
  for (var klass in this.classList)
    if (this.classList.has(klass)) selector += '.' + klass;
  for (var name in this.attributes)
    if (this.attributes.has(name) && name != 'id') {
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
    if (selector.tag && (selector.tag != '*')
    && (this.tagName != selector.tag)) return false;
  }
  if (selector.id && (this.attributes.id != selector.id)) return false;
  if (selector.attributes) for (var i = 0, j; j = selector.attributes[i]; i++)
    if (!this.attributes || (j.operator
      ? !j.test(this.attributes[j.key] && this.attributes[j.key].toString())
      : !(j.key in this.attributes))) return false;
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
LSD.Element.prototype.onChildSet = function(value, index, state, old, memo) {
  for (var children = this.childNodes, text = '', child, i = 0; child = children[i++];)
    if (child.textContent != null) text += child.textContent;
  this.set('textContent', text);
  if (children.textContent != null) this.unset('textContent', children.textContent);
  children.textContent = text;
};

LSD.Document.prototype.mix('states', {
  built:     ['build',      'destroy'],
  hidden:    ['hide',       'show'],
  disabled:  ['disable',    'enable'],
  active:    ['activate',   'deactivate'],
  focused:   ['focus',      'blur'],
  selected:  ['select',     'unselect'],
  chosen:    ['choose',     'forget'],
  checked:   ['check',      'uncheck'],
  open:      ['collapse',   'expand'],
  started:   ['start',      'finish'],
  empty:     ['unfill',     'fill'],
  invalid:   ['invalidate', 'validate'],
  editing:   ['edit',       'save'],
  placeheld: ['placehold',  'unplacehold'],
  invoked:   ['invoke',     'revoke']
})

LSD.Element.prototype._set('built', false);
LSD.Element.prototype._set('hidden', false);
LSD.Element.prototype._set('disabled', false);
LSD.Element.prototype._set('focused', false);