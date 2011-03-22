/*
---
 
script: Layout.js
 
description: A logic to render (and nest) widgets out of the key-value hash or dom tree
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - More/Object.Extras

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
  if (!layout) {
    layout = widget;
    widget = null;
  } else if (widget && widget.localName) widget = this.convert(widget);
  this.result = this.render(layout, widget);
};
LSD.Layout.prototype = Object.append(new Options, {
  
  options: {
    method: 'augment',
    fallback: 'modify',
    context: 'widget',
    interpolate: null
  },
  
  render: function(layout, parent, method, opts) {
    if (!layout.layout) {
      var type = layout.push ? 'array' : layout.nodeType ? LSD.Layout.NodeTypes[layout.nodeType] : layout.indexOf ? 'string' : 'object';
      return this[type](layout, parent, method, opts);
    } else if (parent) return this.appendChild(layout, parent);
  },
  
  materialize: function(selector, layout, parent, opts) {
    var widget = this.build(Object.append({}, opts, this.parse(selector)), parent);
    if (parent) this.render(widget, parent, null, opts);
    if (layout) if (layout.charAt) widget.setContent(layout);
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
			var value = object.call ? object(name) : object[name];
			self.interpolated = true;
			return (value != undefined) ? value : '';
		});
  },
  
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
  
  convert: function(element, parent, transformed, opts) {
    if (transformed == null) transformed = this.transform(element, parent);
    if (transformed || this.isConvertable(element, parent)) return this.make(element, parent, transformed, opts);
  },
  
  patch: function(element, parent, transformed, opts) {
    if (this.isAugmentable(element, parent, transformed)) return this.make(element, parent, transformed, opts, true);
  },
  
  make: function(element, parent, transformed, opts, reuse) {
    var extracted = LSD.Layout.extract(element);
    if (transformed) extracted = extracted ? this.merge(extracted, transformed) : transformed;
    return this.build(Object.append({}, opts, extracted), parent && parent.call ? parent(element) : parent, reuse ? element : null)
  },
  
  build: function(options, parent) {
    var mixins = [];
    var tag = options.source || options.tag || 'container', attributes = options.attributes;
    if (attributes) {
      if ('type' in attributes) tag += "-" + attributes.type;
      if ('kind' in attributes) tag += "-" + attributes.kind;
      var interpolate = this.options.interpolate;
      for (var name in attributes) {
        var value = attributes[name];
        if (interpolate) value = attributes[name] = this.interpolate(value);
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
    if (!options.layout.instance) options.layout.instance = false;
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
    mixins.unshift(tag);
    var args = Array.prototype.slice.call(arguments, 0);
    args.splice(1, 1); //remove parent
    var result = this.context.create.apply(this.context, [mixins].concat(args));
    result.layout = this;
    return result;
  },
  
  /*
    Tries given method. Retries with fallback.
  */
  
  translate: function(method) {
    var args = Array.prototype.splice.call(arguments, 1);
    return this[method].apply(this, args) || (this.options.fallback && this[this.options.fallback].apply(this, args));
  },
  
  // methods
  
  /* 
    Replaces an element with a widget. Also replaces
    all children widgets when possible. 
  */
  modify: function(element, parent, transformed) {
    var converted = this.convert(element, parent, transformed);
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
  augment: function(element, parent, transformed, opts) {
    var converted = this.patch(element, parent, transformed, opts)
    if (converted && converted.element) Converted[converted.element.uid] = converted;
    return converted;
  },
  
  /*
    Creates an independent widget tree and replaces
    the original DOM leaving it unchanged. Useful
    to keep an element as a template and clone it
    many times after. Textnodes are cloned too.
  */
  
  clone: function(element, parent, transformed, opts) {
    var converted = this.convert(element, parent, transformed, opts)
    if (parent && parent.call) parent = parent(element);
    if (parent) {
      if (converted) {
        converted.inject(parent);
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
    var converted = element.uid && Converted[element.uid];
    var skip = (method === false);
    if (!method) method = this.options.method;
    var augmenting = (method == 'augment'), cloning = (method == 'clone');
    if (!converted || !augmenting) {
      var ascendant = (parent && parent[1]) || parent;
      var transformed = this.transform(element, ascendant);
      if (transformed || this.isConvertable(element, ascendant)) {
        var widget = this.translate(method, element, ascendant, transformed, opts);
      } else if (cloning) {  
        var clone = element.cloneNode(false);
      }
    } else var widget = converted;
    var child = widget || clone;
    if (parent && child) this.appendChild(child, parent[0] || parent);
    
    //if (augment && ((widget && widget.element == element) || !widget || converted)) {
    //  if (!skip && element.childNodes.length) this.find(element, widget);
    //} else {
      this.walk(widget && !element.parentNode ? widget.element : element, clone ? [clone, parent] : widget || parent, method, opts);
    //}
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
      widgets.push(this.materialize(selector, object[selector], parent, opts));
    }
    return widgets;
  },
  
  walk: function(element, parent, method, opts) {
    var node = element.firstChild;
    while (node) {
      if (node.nodeType) {
        var rendered = this.render(node, parent, method, opts);
        if (rendered.element && rendered.element.parentNode && !node.parentNode) node = rendered.element;
      }
      node = node.nextSibling;
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
      var element = parent.toElement ? parent.toElement() : parent;
      if (child.parentNode != parent && child.parentNode != element) { 
        if (child.element && parent.element) {
          child.inject(parent, false)
        } else element.appendChild(child.element || child);
      }
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
  
  transform: function(element, parent) {
    if (parent && parent.transformLayout) {
      var transformation = parent.transformLayout(element, this);
      if (transformation) return this.merge(LSD.Layout.extract(element), this.parse(transformation))
    }
    return false;
  },
  
  // redefinable predicates
  
  isConvertable: function(element, parent) {
    return !!this.context[LSD.toClassName(LSD.toLowerCase(element.tagName))];
  },
  
  isAugmentable: function(element, parent, transformed) {
    if (element.nodeType != 1) return true;
    var tag = LSD.toLowerCase(element.tagName);
    var klass = Object.getFromPath(this.context, LSD.toClassName(transformed ? transformed.source : tag));
    if (!klass) return;
    var opts = klass.prototype.options;
    return !opts || ((opts.element && opts.element.tag) ? (opts.element.tag == tag) : true)
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
  var tag = LSD.toLowerCase(element.tagName);
  if (tag != 'div') options.source = tag;
  if (element.id) options.id = element.id;
  for (var i = 0, attribute; attribute = element.attributes[i++];) {
    var value = (attribute.value == attribute.name) || attribute.value;
    options.attributes[attribute.name] = (value == null) ? true : value;
  }
  if (options.attributes && options.attributes.inherit) {
    options.inherit = options.attributes.inherit;
    delete options.attributes.inherit;
  }
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
          options.id = name.substr(3, name.length - 3);
          break;
        default:
          return true;
      }
    })
    delete options.attributes['class'];
  }
  return options;
};

LSD.Layout.extractID = function(element) {
  var id = element.id;
  var index = id.indexOf('_');
  if (index > -1) id = id.substr(index + 1, id.length - index)
  return id;
}

var Converted = LSD.Layout.converted = {};

['modify', 'augment', 'clone'].each(function(method) {
  LSD.Layout[method] = function(element, layout, options) {
    return new LSD.Layout(element, layout, Object.append({method: method}, options)).result;
  }
});


}();
