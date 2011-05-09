/*
---
 
script: Layout.js
 
description: A logic to render (and nest) widgets out of the key-value hash or dom tree
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - More/Object.Extras
  - LSD.Interpolation

provides: 
  - LSD.Layout
 
...
*/

!function() {
  
/* 
  Layout takes any tree-like structure and tries
  to build layout that representats that structure.
  
  The structure can be an objects with keys as selectors
  and values with other objects, arrays and strings.
  
  You can also build a widget tree from DOM. Layout will
  extract attributes and classes from elements. There are
  three methods of conversion element to widget:
  
  * Augment - Tries to use element in widget with minimal
              changes. (default)
  * Modify  - Builds widget with new element and replaces 
              the original element (fallback, destructive)
  * Clone   - Builds new element, original element untouched
*/

LSD.Layout = function(widget, layout, options) {
  this.setOptions(options);
  this.context = LSD[this.options.context.capitalize()];
  if (widget) if (!layout && !widget.lsd) {
    layout = widget;
    widget = null;
  } else if (!widget.lsd) widget = this.convert(widget);
  if (layout) this.result = this.render(layout, widget);
};

LSD.Layout.prototype = Object.append(new Options, {
  
  options: {
    method: 'augment',
    fallback: 'modify',
    context: 'element',
    interpolate: null
  },
  
  render: function(layout, parent, method, opts) {
    if (!layout.lsd) {
      var type = layout.push ? 'array' : layout.nodeType ? LSD.Layout.NodeTypes[layout.nodeType] : layout.indexOf ? 'string' : 'object';
      if (type) return this[type](layout, parent, method, opts);
    } else if (parent) return this.appendChild(layout, parent);
  },
  
  materialize: function(selector, layout, parent, opts) {
    var widget = this.build(Object.append({}, opts, this.parse(selector, parent)), parent);
    //debugger
    if (parent) this.appendChild(widget, parent)
    if (layout) if (layout.charAt) widget.write(layout);
    else this.render(layout, widget, null, opts);
    return widget;
  },
  
  /* 
    Parsers selector and generates options for layout 
  */
  
  interpolate: function(string, object) {
    if (!object) object = this.options.interpolate;
    var self = this;
    return string.replace(/\\?\{([^{}]+)\}/g, function(match, name){
      if (match.charAt(0) == '\\') return match.slice(1);
      var value = object.call ? LSD.Interpolation.interpolate(name, object) : object[string];
      self.interpolated = true;
      return (value != null) ? value : '';
    });
  },
  
  parse: function(selector, parent) {
    if (!this.parsed) this.parsed = {};
    else if (this.parsed[selector]) return this.parsed[selector];
    var options = {};
    var parsed = Slick.parse(selector).expressions[0][0]
    if (parsed.tag != '*') options.source = parsed.tag;
    if (parsed.id) (options.attributes || (options.attributes = {})).id = parsed.id
    if (parsed.attributes) parsed.attributes.each(function(attribute) {
      var value = attribute.value || LSD.Attributes.Boolean[attribute.key] || "";
      (options.attributes || (options.attributes = {}))[attribute.key] = value;
    });
    if (parsed.classes) options.classes = parsed.classes.map(Macro.map('value'));
    if (parsed.pseudos) {
      options.pseudos = [];
      parsed.pseudos.each(function(pseudo) {
        if (pseudo.type == 'element') {
          var relation = (parent[0] || parent).relations[pseudo.key];
          if (!relation) throw "Unknown pseudo element ::" + pseudo.key
          Object.append(options, this.parse(relation.layout, parent))
        } else return options.pseudos.push(pseudo.key);
      }, this);
    }
    switch (parsed.combinator) {
      case '^':
        options.inherit = 'full';
        break;
      case '>':
        options.inherit = 'partial';
    }
    return (this.parsed[selector] = options);
  },
  
  convert: function(element, parent, mutated, opts) {
    if (mutated == null) mutated = this.mutate(element, parent);
    if (mutated || this.isConvertable(element, parent)) return this.make(element, parent, mutated, opts);
  },
  
  patch: function(element, parent, mutated, opts) {
    if (this.isAugmentable(element, parent, mutated)) return this.make(element, parent, mutated, opts, true);
  },
  
  make: function(element, parent, mutated, opts, reuse) {
    var extracted = mutated || (LSD.Layout.extract(element));
    return this.build(Object.append({}, opts, extracted), parent && parent.call ? parent(element) : parent, reuse ? element : null)
  },
  
  build: function(options, parent) {
    var tag = options.source || options.tag, attributes = options.attributes;
    if (attributes) {
      if ('type' in attributes) tag += "-" + attributes.type;
      if ('kind' in attributes) tag += "-" + attributes.kind;
      var interpolate = this.options.interpolate;
      for (var name in attributes) if (interpolate) attributes[name] = this.interpolate(attributes[name]);
    }
    Object.merge(options, {layout: {render: false}});
    if (options.inherit && parent) {
      if (parent.options) {
        var source = parent.options.source;
        if (!source) {
          var bits = [parent.tagName, parent.getAttribute('type')]
          if (options.inherit == 'full') bits.push(parent.getAttribute('kind'))
          source = bits.filter(function(bit) { return bit }).join('-');
        }
      } else if (parent.indexOf) var source = parent;
      if (source) tag = source + '-' + tag
    }
    var args = Array.prototype.slice.call(arguments, 0);
    args.splice(1, 1); //remove parent
    LSD.Layout.current = this;
    return this.context.create.apply(this.context, [tag].concat(args));
  },
  
  /*
    Tries given method. Retries with fallback.
  */
  
  translate: function(method) {
    var args = Array.prototype.slice.call(arguments, 1);
    return this[method].apply(this, args) || (this.options.fallback && this[this.options.fallback].apply(this, args));
  },
  
  // methods
  
  /* 
    Replaces an element with a widget. Also replaces
    all children widgets when possible. 
  */
  modify: function(element, parent, mutated) {
    var converted = this.convert(element, parent, mutated);
    if (converted) {
      var replacement = converted.toElement();
      replacement.replaces(element);
      var node, next = element.firstChild;
      while (node = next) {
        next = next.nextSibling;
        replacement.appendChild(node);
      }
    }
    return converted;
  },
  
  /*
    Augment tries to avoid making changes to element
    at all costs and tries to use the whole tree. Used
    as a primary method in regular HTML applications.
  */
  augment: function(element, parent, mutated, opts) {
    return this.patch(element, parent, mutated, opts);
  },
  
  /*
    Creates an independent widget tree and replaces
    the original DOM leaving it unchanged. Useful
    to keep an element as a template and clone it
    many times after. Textnodes are cloned too.
  */
  
  clone: function(element, parent, mutated, opts) {
    var converted = this.convert(element, parent, mutated, opts)
    if (parent && parent.call) parent = parent(element);
    if (parent) {
      if (converted) {
        converted.inject(parent[0] || parent);
      } else {
        (parent.toElement ? parent.toElement() : parent).appendChild(element.cloneNode(false));
      }
    }
    return converted;
  },
  
  // type handlers
  
  string: function(string, parent, method, opts) {
    return this.materialize(string, {}, parent, opts);
  },
  
  array: function(array, parent, method, opts) {
    return array.map(function(widget) { return this.render(widget, parent, method, opts)}.bind(this));
  },
  
  elements: function(elements, parent, method, opts) {
    return elements.map(function(widget) { return this.render(widget, parent, method, opts)}.bind(this));
  },
  
  element: function(element, parent, method, opts) {
    var converted = element.uid && Element.retrieve(element, 'widget');
    var skip = (method === false);
    if (!method) method = this.options.method;
    var augmenting = (method == 'augment'), cloning = (method == 'clone');
    var children = LSD.slice(element.childNodes);
    if (!converted || !augmenting) {
      var ascendant = (parent && parent[1]) || parent;
      var mutated = this.mutate(element, ascendant);
      if (mutated || this.isConvertable(element, ascendant)) {
        var widget = this.translate(method, element, ascendant, mutated, opts);
      } else if (cloning) {  
        var clone = element.cloneNode(false);
      }
    } else var widget = converted;
    var child = widget || clone;
    if (cloning) {
      var textnode = LSD.Layout.TextNodes[LSD.toLowerCase(element.tagName)];
      if (textnode) this.render(children, clone ? [clone, parent] : widget || parent, method)
    }
    if (parent && child) this.appendChild(child, parent[0] || parent);
    if (!textnode) this.render(children, clone ? [clone, parent] : widget || parent, method, opts);
    return clone || widget || element;
  },
  
  textnode: function(element, parent, method) {
    if (!method) method = this.options.method;
    if (method != 'augment') {
      var value = element.textContent;
      if (this.options.interpolate) var interpolated = this.interpolate(value);
      var textnode = element.ownerDocument.createTextNode(interpolated || value);
      if (method != 'clone') {
        if (interpolated != null && interpolated != value) element.parentNode.replaceChild(textnode)
      } else this.appendChild(textnode, parent[0] || parent)
    }
    return textnode || element;
  },
  
  fragment: function(element, parent, method, opts) {
    return this.walk(element, parent, method, opts);
  },
  
  object: function(object, parent, method, opts) {
    var widgets = [];
    for (var selector in object) {
      widgets.push(this.materialize(selector, object[selector] === true ? null : object[selector], parent, opts));
    }
    return widgets;
  },
  
  walk: function(element, parent, method, opts) {
    for (var nodes = Array.prototype.slice.call(element.childNodes, 0), i = 0, node; node = nodes[i++];) {
      if (node.nodeType && node.nodeType != 8) this.render(node, parent, method, opts);
    }
  },
  
  find: function(element, root, opts) {
    var selected = element.getElementsByTagName("*");
    for (var children = [], i = 0, j = selected.length; i < j; i++) children[i] = selected[i];
    var found = {};
    var getParent = function(node) {
      var parent = null;
      while (node = node.parentNode) if (node == element || node.uid && (parent = found[node.uid])) break;
      return parent || root;
    };
    for (var i = 0, child; child = children[i++];) {
      var widget = this.render(child, getParent, false, opts);
      if (widget && widget.element) found[widget.element.uid] = widget;
    }
  },
  
  appendChild: function(child, parent) {
    if (child.nodeType && (!parent.call || (child.element && (parent = parent(child.element))))) {
      if (!child.parentNode || (child.parentNode != parent && child.parentNode != parent.element)) { 
        if (child.toElement) child.toElement();
        if (parent.toElement) parent.toElement();
        if (child.element && parent.element) {
          child.inject(parent, child.element.parentNode ? false : 'bottom')
        } else (parent.element || parent).appendChild(child.element || child);
      }
    }
  },
  
  // mutations
  
  merge: function(first, second) {
    var result = {layout: first.layout}, id, combinator;
    result.source = second.source || first.source;
    if (combinator = (second.combinator || first.combinator)) result.combinator = combinator;
    if (second.attributes || first.attributes) result.attributes = Object.append({}, first.attributes, second.attributes);
    if (second.classes || first.classes) result.classes = Array.concat([], first.classes || [], second.classees || []);
    if (second.pseudos || first.pseudos) result.pseudos = Array.concat([], first.pseudos || [], second.pseudos || []);
    return result;
  },
  
  mutate: function(element, parent) {
    if (!(parent && (parent = parent[1] || parent) && parent.mutateLayout)) return false;
    var mutation = parent.mutateLayout(element, this);
    if (mutation) return this.merge(LSD.Layout.extract(element), mutation.indexOf ? this.parse(mutation, parent) : mutation);
  },
  
  // redefinable predicates
  
  isConvertable: function(element, parent) {
    return !!this.context.find(LSD.toLowerCase(element.tagName));
  },
  
  isAugmentable: function(element, parent, mutated) {
    if (element.nodeType != 1) return true;
    var tag = LSD.toLowerCase(element.tagName);
    if (!mutated) {
      var type = element.getAttribute('type');
      var source = (type && type != tag) ? tag + '-' + type : tag;
    } else var source = mutated.source;
    var klass = this.context.find(LSD.toLowerCase(source));
    if (!klass) return;
    var opts = klass.prototype.options;
    return !opts || !opts.element || !opts.element.tag || (opts.element.tag == tag);
  }
  
});

LSD.Layout.NodeTypes = {1: 'element', 3: 'textnode', 11: 'fragment'};
LSD.Layout.TextNodes = Array.fast('script', 'button', 'textarea', 'option', 'input');

/* 
  Extracts options from a DOM element.
  
  Following selectors considered equal:
  
  footer#bottom.left
  div.lsd.footer.id-bottom.left
  div.tag-footer.id-bottom.left
  div.tag-footer[id=bottom][class=left]
*/

LSD.Layout.extract = function(element) {
  var options = {
    attributes: {},
    origin: element
  };
  var tag = LSD.toLowerCase(element.tagName);
  if (tag != 'div') options.source = tag;
  
  for (var i = 0, attribute, name; (attribute = element.attributes[i++]) && (name = attribute.name);)
    options.attributes[name] = attribute.value || LSD.Attributes.Boolean[name] || "";
    
  if (options.attributes && options.attributes.inherit) {
    options.inherit = options.attributes.inherit;
    delete options.attributes.inherit;
  }
  
  if (element.id) options.attributes.id = element.id;
  
  var klass = options.attributes['class'];
  if (klass) {
    klass = klass.replace(/^lsd\s+(?:tag-)?([a-zA-Z0-9-_]+)\s?/, function(m, tag) {
      options.source = tag;
      return '';
    })
    options.classes = klass.split(/\s+/).filter(function(name) {
      switch (name.substr(0, 3)) {
        case "is-":
          if (!options.pseudos) options.pseudos = [];
          options.pseudos.push(name.substr(3, name.length - 3));
          break;
        case "id-":
          options.attributes.id = name.substr(3, name.length - 3);
          break;
        default:
          return true;
      }
    })
    delete options.attributes['class'];
  }
  return options;
};

['modify', 'augment', 'clone'].each(function(method) {
  LSD.Layout[method] = function(element, layout, options) {
    return new LSD.Layout(element, layout, Object.append({method: method}, options)).result;
  }
});


}();
