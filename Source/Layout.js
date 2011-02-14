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
  * Replace - Builds widget with new element and replaces 
              the original element (fallback, destructive)
  * Clone   - Builds new element, original element untouched
*/

LSD.Layout = new Class({
  
  Implements: [Options],
  
  options: {
    method: 'augment',
    fallback: 'replace',
    context: 'widget'
  },
    
  initialize: function(widget, layout, options) {
    this.setOptions(options);
    this.context = LSD[this.options.context.capitalize()];
    if (layout) {
      this.render(layout, this.convert(widget) || widget)
    } else {
      this.render(widget);
    }
  },
  
  render: function(layout, parent) {
    var type = typeOf(layout);
    return type ? this[type](layout, parent) : layout;
  },
  
  materialize: function(selector, layout, parent) {
    var widget = this.build(this.parse(selector));
    if (!String.type(layout)) this.render(layout, widget);
    else widget.setContent(layout);
    return widget;
  },
  
  /* 
    Parsers selector and generates options for layout 
  */
  
  parse: function(selector) {
    var parsed = Slick.parse(selector).expressions[0][0]
    var options = {layout: {instance: this}}
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
    return options;
  },
  
  /* 
    Extracts options from a DOM element.
    
    Following selectors considered equal:
    
    footer#bottom.left
    div.lsd.footer.id-bottom.left
    div.tag-footer.id-bottom.left
    div.tag-footer[id=bottom][class=left]
  */
  
  extract: function(element) {
    var options = {
      attributes: {},
      origin: element,
      layout: {instance: this}
    };
    var tag = element.get('tag');
    if (tag != 'div') options.source = tag;
    if (element.id) options.id = element.id;
    for (var i = 0, attribute; attribute = element.attributes[i++];) {
      options.attributes[attribute.name] = ((attribute.value != attribute.name) && attribute.value) || true;
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
  },
  
  convert: function(element) {
    return (this.isConvertable(element)) ? this.build(this.extract(element)) : false;
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
          if (i == 0) $mixin(options, obj);
          else value = obj;
        }
      }
    }
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
  replace: function(element) {
    var converted = this.convert(element);
    if (converted) converted.toElement().replaces(element);
    return true;
  },
  
  /*
    Augment tries to avoid making changes to element
    at all costs and tries to use the whole tree. Used
    as a primary method in regular HTML applications.
  */
  augment: function(element) {
    if (this.isAugmentable(element)) return this.build(this.extract(element), element)
    return false;
  },
  
  /*
    Creates an independent widget tree and replaces
    the original DOM leaving it unchanged. Useful
    to keep an element as a template and clone it
    many times after. Textnodes are cloned too.
  */
  
  clone: function(element, parent) {
    var converted = this.convert(element);
    if (converted) {
      converted.inject(parent);
    } else {
      parent.toElement().appendChild(document.cloneNode(element));
    }
    return true;
  },
  
  // type handlers
  
  string: function(string, parent) {
    return this.materialize(string, {}, parent);
  },
  
  array: function(array, parent) {
    return array.map(function(widget) { return this.render(widget, parent)}.bind(this));
  },
  
  elements: function(elements, parent) {
    return elements.map(function(widget) { return this.render(widget, parent)}.bind(this));
  },
  
  element: function(element, parent) {
    if (this.isConvertable(element)) {
      var widget = this[this.options.method](element, parent);
      if (!widget && this.options.fallback) widget = this[this.options.fallback](element, parent)
    }
    var children = element.childNodes;
    if (children) for (var i = 0, node; node = children[i++];) this[node.nodeType == 1 ? 'element' : 'textnode'](node, widget);
    return widget || element;
  },
  
  object: function(object) {
    var widgets = [];
    for (var selector in object) widgets.push(this.materialize(selector, object[selector], parent));
    return widgets;
  },
  
  textnode: function(textnode, parent) {
    if (this.options.method == 'clone') parent.toElement().appendText(textnode)
    return true;
  },
  
  // redefinable predicates
  
  isConvertable: function(element) {
    return element.nodeType == 1 && element.tagName && !!this.context[element.tagName.capitalize()]
  },
  
  isAugmentable: function(element) {
    if (element.nodeType != 1) return true;
    var klass = this.context[element.tagName.capitalize()];
    if (!klass) return;
    var opts = klass.prototype.options.element;
    return !opts || !opts.tag || (opts.tag == element.tagName.toLowerCase());
  }
});

['replace', 'augment', 'clone'].each(function(method) {
  LSD.Layout[method] = function(element, layout, options) {
    return new LSD.Layout(element, layout, Object.append({method: method}, options));
  }
});