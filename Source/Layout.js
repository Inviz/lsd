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
    var widget = this.build(Object.append({}, opts, ), parent);
    //debugger
    if (parent) this.appendChild(widget, parent)
    if (layout) if (layout.charAt) widget.write(layout);
    else this.render(layout, widget, null, opts);
    return widget;
  },
  
  interpolate: function(string, object) {
    if (!object) object = this.options.interpolate;
    var self = this;
    return string.replace(/\\?\{([^{}]+)\}/g, function(match, name){
      if (match.charAt(0) == '\\') return match.slice(1);
      var value = object.call ? LSD.Interpolation.execute(name, object) : object[string];
      self.interpolated = true;
      return (value != null) ? value : '';
    });
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
    if (!method) method = this.options.method;
    var converted = element.uid && Element.retrieve(element, 'widget');
    if (converted && (method != 'clone')) var widget = converted;
    else var widget = this.context.use(element, opts, parent, method);
    var children = LSD.slice(element.childNodes);
    if (!widget && method == 'clone') var clone = element = element.cloneNode(false);
    if ((widget || clone) && parent) this.appendChild(widget || element, parent[0] || parent);
    this.render(children, clone ? [clone, parent] : widget || parent, method, opts);
    return widget || element;
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
  }
});

LSD.Layout.NodeTypes = {1: 'element', 3: 'textnode', 11: 'fragment'};
LSD.Layout.TextNodes = Array.fast('script', 'button', 'textarea', 'option', 'input');

Object.append(LSD.Layout, {
  /* 
    Parsers selector and generates options for layout 
  */
  parse: function(selector, parent) {
    var options = {};
    var parsed = (selector.Slick ? selector : Slick.parse(selector)).expressions[0][0]
    if (parsed.combinator != ' ') options.combinator = parsed.combinator;
    if (parsed.tag != '*') options.source = parsed.tag;
    if (parsed.id) (options.attributes || (options.attributes = {})).id = parsed.id
    if (parsed.attributes) for (var all = parsed.attributes, attribute, i = 0; attribute = all[i++];) {
      var value = attribute.value || LSD.Attributes.Boolean[attribute.key] || "";
      (options.attributes || (options.attributes = {}))[attribute.key] = value;
    }
    if (parsed.classes) options.classes = parsed.classes.map(Macro.map('value'));
    if (parsed.pseudos) {
      for (var all = parsed.pseudos, pseudo, i = 0; pseudo = all[i++];) {
        if (pseudo.type == 'element') {
          var relation = (parent[0] || parent).relations[pseudo.key];
          if (!relation) throw "Unknown pseudo element ::" + pseudo.key
          Object.append(options, LSD.Layout.parse(relation.layout, parent))
        } else return (options.pseudos || (options.pseudos = {})).push(pseudo.key);
      };
    }
    return options;
  },
  
  /* 
    Extracts options from a DOM element.
  */
  extract: function(element) {
    var options = {
      attributes: {},
      origin: element
    };
    for (var i = 0, attribute, name; (attribute = element.attributes[i++]) && (name = attribute.name);)
      options.attributes[name] = attribute.value || LSD.Attributes.Boolean[name] || "";

    if (options.attributes && options.attributes.inherit) {
      options.inherit = options.attributes.inherit;
      delete options.attributes.inherit;
    }

    if (element.id) options.attributes.id = element.id;

    var klass = options.attributes['class'];
    if (klass) {
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
  },
  
  mutate: function(element, parent) {
    var mutation = (parent[1] || parent).mutateLayout(element);
    if (mutation && mutation.indexOf) return LSD.Layout.parse(mutation, parent);
  },
  
  getSource: function(element) {
    source = LSD.toLowerCase(element.tagName);
    if (element.type && (element.type != source)) source += '-' + element.type;
    return source;
  }
});

['modify', 'augment', 'clone'].each(function(method) {
  LSD.Layout[method] = function(element, layout, options) {
    return new LSD.Layout(element, layout, Object.append({method: method}, options)).result;
  }
});


}();
