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
  this.origin = widget;
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
  
  $family: Function.from('layout'),
  
  render: function(layout, parent, method, opts) {
    var type = layout.push ? 'array' : layout.nodeType ? LSD.Layout.NodeTypes[layout.nodeType] : layout.indexOf ? 'string' : 'object';
    if (type) return this[type](layout, parent, method, opts);
  },
  
  materialize: function(selector, layout, parent, opts) {
    var options = Object.append({context: this.options.context}, opts, LSD.Layout.parse(selector, parent[0] || parent));
    if (options.tag != '*' && (this.context.find(options.tag) || !LSD.Layout.NodeNames[options.tag])) {
      var widget = this.context.create(options);
      if (parent) this.appendChild(parent[0] || parent, widget, function() {
        (parent[1] || parent.toElement()).appendChild(widget.toElement());
      });
      if (layout) if (layout.charAt) widget.write(layout);
      else this.render(layout, [widget], null, opts);
    } else {  
      var props = {}, tag = (options.tag == '*') ? 'div' : options.tag;
      if (options.id) props.id = options.id;
      var attributes = options.attributes;
      if (attributes) for (var attr, i = 0, l = attributes.length; i < l; i++){
        attr = attributes[i];
        if (props[attr.key] != null) continue;

        if (attr.value != null && attr.operator == '=') props[attr.key] = attr.value;
        else if (!attr.value && !attr.operator) props[attr.key] = true;
      }
      var element = document.createElement(tag);
      for (var name in props) element.setAttribute(name, props[name] == true ? name : props[name]);
      if (options.classes) element.className = options.classes.join(' ');
      if (parent) this.appendChild(parent[1] || parent.toElement(), element);
      if (layout) if (layout.charAt) element.innerHTML = layout;
      else this.render(layout, [parent[0] || parent, element], null, opts);
    }
    return widget;
  },
  
  interpolate: function(string, object) {
    if (!object) object = this.options.interpolate;
    var interpolated = LSD.Interpolation.attempt(string, object);
    if (interpolated !== false) {
      this.interpolated = true;
      return interpolated;
    } else return string;
  },
  
  // type handlers
  
  string: function(string, parent, method, opts) {
    return this.materialize(string, {}, parent, opts);
  },
  
  array: function(array, parent, method, opts) {
    for (var i = 0, result = [], length = array.length; i < length; i++) 
      result[i] = this.render(array[i], parent, method, opts)
    return result;
  },
  
  element: function(element, parent, method, opts) {
    var converted = element.uid && Element.retrieve(element, 'widget');
    var children = LSD.slice(element.childNodes), cloning = (method == 'clone');
    var options = Object.append({traverse: false, context: this.options.context}, opts);
    if (converted) var widget = cloning ? converted.cloneNode(false, options) : converted;
    else var widget = this.context.use(element, options, parent, method);
    var ascendant = parent[1] || parent, container = parent[0] || parent.toElement();
    if (widget) {
      var adoption = function() {
        if (widget.toElement().parentNode == container) return;
        if (cloning)
          container.appendChild(widget.element)
        else if (widget.origin == element && element.parentNode && element.parentNode == container)
          element.parentNode.replaceChild(widget.element, element);
      };
      if (this.appendChild(ascendant, widget, adoption))
        if (widget.document != ascendant.document) widget.setDocument(ascendant.document);
    } else {
      if (cloning) var clone = element.cloneNode(false);
      if (cloning || (ascendant.origin == element.parentNode)) this.appendChild(container, clone || element);
    }
    var newParent = [clone || (widget && widget.element) || element, widget || ascendant];
    for (var i = 0, child; child = children[i]; i++) 
      this[LSD.Layout.NodeTypes[child.nodeType]](child, newParent, method, opts);
    return widget || clone || element;
  },
  
  textnode: function(element, parent, method) {
    var value = element.textContent;
    if (this.options.interpolate) var interpolated = this.interpolate(value);
    if (interpolated != null && interpolated != value || method == 'clone') {
      var textnode = element.ownerDocument.createTextNode(interpolated || value);
      if (method != 'clone') element.parentNode.replaceChild(textnode, element);
      this.appendChild(parent[0] || parent.toElement(), textnode || element)
    }
    return textnode || element;
  },
  
  comment: function(element, parent, method) {
    //var text = element.innerText;
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
    for (var nodes = LSD.slice(element.childNodes, 0), i = 0, node; node = nodes[i++];) {
      if (node.nodeType && node.nodeType != 8) this.render(node, parent, method, opts);
    }
  },
  
  appendChild: function(parent, child, adoption) {
    if (child.parentNode != parent) {
      parent.appendChild(child, adoption);
      return true;
    }
  }
});

LSD.Layout.NodeTypes = {1: 'element', 3: 'textnode', 8: 'comment', 11: 'fragment'};
LSD.Layout.NodeNames = Array.fast('!doctype', 'a', 'abbr', 'acronym', 'address', 'applet', 'area', 
'article', 'aside', 'audio', 'b', 'base', 'bdo', 'big', 'blockquote', 'body', 'br', 'button', 'canvas', 
'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'command', 'datalist', 'dd', 'del', 'details',
'dfn', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'frame',
'frameset', 'h1', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'iframe', 'img', 'input', 'ins', 
'keygen', 'kbd', 'label', 'legend', 'li', 'link', 'map', 'mark', 'menu', 'meta', 'meter', 'nav', 
'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'pre', 'progress', 'q', 
'rp', 'rt', 'ruby', 's', 'samp', 'script', 'section', 'select', 'small', 'source', 'span', 'strike', 
'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 
'time', 'title', 'tr', 'ul', 'var', 'video', 'wbr');

Object.append(LSD.Layout, {
  /* 
    Parsers selector and generates options for layout 
  */
  parse: function(selector, parent) {
    var options = {};
    var parsed = (selector.Slick ? selector : Slick.parse(selector)).expressions[0][0];
    if (parsed.combinator != ' ') {
      if (parsed.combinator == '::') {
        var relation = (parent[0] || parent).relations[parsed.tag];
        if (!relation) throw "Unknown pseudo element ::" + parsed.tag;
        var source = relation.getSource();
        if (source) Object.append(options, LSD.Layout.parse(source, parent[0] || parent));
      } else options.combinator = parsed.combinator;
    } 
    if (parsed.tag != '*' && parsed.combinator != '::') {
      options[(parsed.tag.indexOf('-') > -1) ? 'source' : 'tag'] = parsed.tag;
    }
    if (parsed.id) (options.attributes || (options.attributes = {})).id = parsed.id
    if (parsed.attributes) for (var all = parsed.attributes, attribute, i = 0; attribute = all[i++];) {
      var value = attribute.value || LSD.Attributes.Boolean[attribute.key] || "";
      (options.attributes || (options.attributes = {}))[attribute.key] = value;
    }
    if (parsed.classes) options.classes = parsed.classes.map(Macro.map('value'));
    if (parsed.pseudos) for (var all = parsed.pseudos, pseudo, i = 0; pseudo = all[i++];) 
      (options.pseudos || (options.pseudos = {})).push(pseudo.key);
    return options;
  },
  
  /* 
    Extracts options from a DOM element.
  */
  extract: function(element) {
    var options = {
      attributes: {},
      tag: LSD.toLowerCase(element.tagName)
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
    if (mutation) return (mutation === true) || LSD.Layout.parse(mutation, parent);
  },
  
  getSource: function(options, tagName) {
    if (options && options.localName) {
      var source = [LSD.toLowerCase(options.tagName)];
      if (options.type) switch (options.type) {
        case "select-one": 
        case "select-multiple":
        case "textarea":
          break;
        default:
          source.push(options.type);
      };
    } else {
      var source = [];
      if (tagName) source.push(tagName);
      if (options) {
        var type = options.type;
        if (type) source.push(type);
        var kind = options.kind;
        if (kind) source.push(kind);
      }
    }
    return source.length && source;
  }
});