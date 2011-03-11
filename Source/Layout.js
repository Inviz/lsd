/*
---
 
script: Layout.js
 
description: A logic to render (and nest) widgets out of the key-value hash or dom tree
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD

provides: [LSD.Layout]
 
...
*/

(function() {
  
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
  if (!layout) {
    layout = widget;
    widget = null;
  } else if (widget && widget.nodeName) widget = this.convert(widget);
  this.result = this.render(layout, widget);
};


LSD.Layout.prototype = Object.append(new Options, {
  
  options: {
    method: 'augment',
    fallback: 'modify',
    context: 'widget'
  },
  
  render: function(layout, parent, method) {
    var rendered = !!layout.layout;
    if (!rendered) {
      var type = layout.push ? 'array' : layout.nodeType ? LSD.Layout.NodeTypes[layout.nodeType] : layout.indexOf ? 'string' : 'object';
      var result = this[type](layout, parent, method);
    } else var result = layout;
    if (result) {
      if (parent && parent.call) parent = parent(result.element || layout, result);
      if (parent && (rendered || result != layout) && result.nodeType) {
        if (result.parentNode != parent) { 
          if (result.inject) result.inject(parent, 'bottom', (parent.nodeType == 1) && !parent.documentElement);
          else (parent.toElement ? parent.toElement() : parent).appendChild(result);
        }
      }
    };
    return result;
  },
  
  materialize: function(selector, layout, parent) {
    var widget = this.build(this.parse(selector))
    if (parent) this.render(widget, parent);
    if (layout && layout.charAt) widget.setContent(layout);
    else this.render(layout || {}, widget);
    return widget;
  },
  
  /* 
    Parsers selector and generates options for layout 
  */
  
  parse: function(selector) {
    if (!this.parsed) this.parsed = {};
    else if (this.parsed[selector]) return this.parsed[selector];
    var options = {};
    var parsed = Slick.parse(selector).expressions[0][0]
    if (parsed.tag != '*') options.source = parsed.tag;
    if (parsed.id) options.id = parsed.id
    if (parsed.attributes) parsed.attributes.each(function(attribute) {
      if (!options.attributes) options.attributes = {};
      options.attributes[attribute.key] = attribute.value || true;
    });
    if (parsed.classes) options.classes = parsed.classes.map(Macro.map('value'));
    if (parsed.pseudos) options.pseudos = parsed.pseudos.map(Macro.map('key'));
    switch (parsed.combinator) {
      case '^':
        options.inherit = 'full';
        break;
      case '>':
        options.inherit = 'partial';
    }
    return (this.parsed[selector] = options);
  },
  
  convert: function(element, transformed) {
    if (transformed == null) transformed = this.transform(element)
    if (transformed) return this.build(transformed);
    if (this.isConvertable(element)) return this.build(LSD.Layout.extract(element));
  },
  
  patch: function(element, transformed) {
    if (this.isAugmentable(element, transformed)) return this.build(transformed || LSD.Layout.extract(element), element)
  },
  
  build: function(options) {
    var mixins = [];
    var tag = options.source || options.tag || 'container'
    if (options.attributes) {
      if ('type' in options.attributes) tag += "-" + options.attributes.type;
      if ('kind' in options.attributes) tag += "-" + options.attributes.kind;
      for (var name in options.attributes) {
        var value = options.attributes[name];
        var bits = name.split('-');
        for (var i = bits.length - 1; i > -1; i--) {
          var obj = {};
          obj[bits[i]] = value;
          if (i == 0) Object.merge(options, obj);
          else value = obj;
        }
      }
    }
    if (!options.layout) options.layout = {};
    if (!options.layout.instance) options.layout.instance = true//this;
    if (options.inherit) {
      var source = parent.options.source;
      if (!source) {
        var bits = [parent.options.tag, parent.getAttribute('type')]
        if (options.inherit == 'full') bits.push(parent.getAttribute('kind'))
        source = bits.filter(function(bit) { return bit }).join('-');
      }
      tag = source + '-' + tag
    }

    mixins.unshift(tag);
    return this.context.create.apply(this.context, [mixins].concat(Array.prototype.splice.call(arguments, 0)));
  },
  
  // methods
  
  /* 
    Replaces an element with a widget. Also replaces
    all children widgets when possible. 
  */
  modify: function(element, parent, transformed) {
    var converted = this.convert(element, transformed);
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
  augment: function(element, parent, transformed) {
    var converted = this.patch(element, transformed)
    if (converted && converted.element) Converted[converted.element.uid] = converted;
    return converted;
  },
  
  /*
    Creates an independent widget tree and replaces
    the original DOM leaving it unchanged. Useful
    to keep an element as a template and clone it
    many times after. Textnodes are cloned too.
  */
  
  clone: function(element, parent) {
    var converted = this.convert(element)
    if (parent && parent.call) parent = parent(element);
    if (parent) {
      if (converted) {
        converted.inject(parent);
      } else {
        parent.toElement().appendChild(element.cloneNode());
      }
    }
    return converted;
  },
  
  // type handlers
  
  string: function(string, parent) {
    return this.materialize(string, {}, parent);
  },
  
  array: function(array, parent, method) {
    return array.map(function(widget) { return this.render(widget, parent, method)}.bind(this));
  },
  
  elements: function(elements, parent, method) {
    return elements.map(function(widget) { return this.render(widget, parent, method)}.bind(this));
  },
  
  element: function(element, parent, method) {
    var converted = element.uid && Converted[element.uid];
    var skip = (method === false);
    if (!method) method = this.options.method;
    var augment = (method == 'augment'), clone = (method == 'clone');
    if (!converted || !augment) {
      var transformed = this.transform(element);
      if (transformed || this.isConvertable(element)) {
        var widget = this[method](element, parent, transformed), success = !!widget;
        if (!widget && this.options.fallback) widget = this[this.options.fallback](element, parent, transformed);
      } else if (clone) {  
        var widget = element.cloneNode(false);
      }
    } else var widget = converted;
    if (augment && (success || !widget || converted)) {
      if (!skip && element.childNodes.length) this.find(element, widget);
    } else {
      this.walk(element, widget || parent);
    }
    return widget || element;
  },
  
  textnode: function(element, parent, method) {
    return ((method || this.options.method) == 'clone') ? element.cloneNode(false) : element;
  },
  
  fragment: function(element, parent, method) {
    return this.walk(element, parent, method);
  },
  
  object: function(object, parent) {
    var widgets = [];
    for (var selector in object) {
      widgets.push(this.materialize(selector, object[selector], parent));
    }
    return widgets;
  },
  
  walk: function(element, parent, method) {
    var node = element.firstChild;
    while (node) {
      if (node.nodeType) this.render(node, parent, method);
      node = node.nextSibling;
    }
  },
  
  find: function(element, root) {
    var selected = element.getElementsByTagName("*");
    for (var children = [], i = 0, j = selected.length; i < j; i++) children[i] = selected[i];
    var found = {};
    var getParent = function(node, result) {
      var parent = null;
      while (node = node.parentNode) if (node == element || node.uid && (parent = found[node.uid])) break;
      return parent || root
    };
    for (var i = 0, child; child = children[i++];) {
      var widget = this.render(child, getParent, false);
      if (widget && widget.element) found[widget.element.uid] = widget;
    }
  },
  
  // transformations
  
  merge: function(first, second) {
    var result = {layout: first.layout}, id, combinator;
    result.source = second.source || first.source;
    if (id = (second.id || first.id)) result.id = id;
    if (combinator = (second.combinator || first.combinator)) result.combinator = combinator;
    if (second.attributes || first.attributes) result.attributes = Object.append({}, first.attributes, second.attributes);
    if (second.classes || first.classes) result.classes = Array.concat([], first.classes || [], second.classees || []);
    if (second.pseudos || first.pseudos) result.pseudos = Array.concat([], first.pseudos || [], second.pseudos || []);
    return result;
  },
  
  transform: function(element) {
    
    for (var selector in Transformations) {
      var parsed = ParsedTransformations[selector] || (ParsedTransformations[selector] = Slick.parse(selector));
      if (Slick.match(element, parsed)) 
        return this.merge(LSD.Layout.extract(element), this.parse(Transformations[selector]));
    }
    return false;
  },
  
  // redefinable predicates
  
  isConvertable: function(element) {
    var memo = convertable[element.tagName];
    if (memo != null) return memo;
    var tagName = element.tagName;
    var tag = tags[tagName] || (tags[tagName] = tagName.toLowerCase());
    return (convertable[tagName] = !!this.context[tag.capitalize()]);
  },
  
  isAugmentable: function(element, transformed) {
    if (element.nodeType != 1) return true;
    var tag = tags[element.tagName] || (tags[element.tagName] = element.tagName.toLowerCase());
    var source = transformed ? transformed.source : tag;
    var memo = augmentable[source];
    var klass = (memo != null) ? memo : (augmentable[source] = this.context[source.capitalize()] || false);
    if (!klass) return;
    var opts = klass.prototype.options;
    return !opts || ((opts.element && opts.element.tag) ? (opts.element.tag == tag) : (!opts.tag || opts.tag == tag))
  }
});

LSD.Layout.NodeTypes = {1: 'element', 3: 'textnode', 11: 'fragment'};

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
  var tag = element.tagName.toLowerCase()
  if (tag != 'div') options.source = tag;
  if (element.id) options.id = element.id;
  for (var i = 0, attribute; attribute = element.attributes[i++];) {
    var value = ((attribute.value != attribute.name) && attribute.value);
    options.attributes[attribute.name] = (value == null) ? true : value;
  }
  if (options.attributes && options.attributes.inherit) {
    options.inherit = options.attributes.inherit;
    delete options.attributes.inherit;
  }
  var klass = options.attributes['class'];
  if (klass) {
    klass = klass.replace(/^lsd (?:tag-)?([a-zA-Z0-9-_]+)\s?/, function(m, tag) {
      options.source = tag;
      return '';
    })
    options.classes = klass.split(' ').filter(function(name) {
      var match = /^(is|id)-(.*?)$/.exec(name)
      if (match) {
        switch (match[1]) {
          case "is":
            if (!options.pseudos) options.pseudos = [];
            options.pseudos.push(match[2]);
            break;
          case "id":
            options.id = match[2];
        }
      }
      return !match;
    })
    delete options.attributes['class'];
  }
  return options;
};

var tags = {};
var convertable = {};
var augmentable = {};
var Converted = LSD.Layout.converted = {};
var Transformations = LSD.Layout.Transformations = {};
var ParsedTransformations = {};

['modify', 'augment', 'clone'].each(function(method) {
  LSD.Layout[method] = function(element, layout, options) {
    return new LSD.Layout(element, layout, Object.append({method: method}, options)).result;
  }
});


})();
