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
  extract attributes and classes from elements. 
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
    clone: false,
    context: 'element',
    interpolate: null
  },
  
  $family: Function.from('layout'),
  
  render: function(layout, parent, opts) {
    var type = layout.push ? 'array' : layout.nodeType ? LSD.Layout.NodeTypes[layout.nodeType] : layout.indexOf ? 'string' : 'object';
    if (type) return this[type](layout, parent, opts);
  },
  
  materialize: function(selector, layout, parent, opts) {
    var options = Object.append({context: this.options.context}, opts, LSD.Layout.parse(selector, parent[0] || parent));
    if (options.tag != '*' && (this.context.find(options.tag) || !LSD.Layout.NodeNames[options.tag])) {
      var widget = this.context.create(options);
      if (parent) this.appendChild(parent[0] || parent, widget, opts, function() {
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
  
  string: function(string, parent, opts) {
    return this.materialize(string, {}, parent, opts);
  },
  
  array: function(array, parent, opts) {
    for (var i = 0, result = [], length = array.length; i < length; i++) 
      result[i] = this.render(array[i], parent, opts)
    return result;
  },
  
  element: function(element, parent, opts, stack, revert, last) {
    var converted = element.uid && Element.retrieve(element, 'widget');
    var children = LSD.slice(element.childNodes);
    var cloning = (opts && opts.clone) || this.options.clone, group;
    var ascendant = parent[1] || parent, container = parent[0] || parent.toElement();
  
    // Retrieve the stack if the render was not triggered from the root of the layout
    if (!stack) {
      stack = [];
      if ((group = ascendant.mutations['>'])) stack.push(group);
      for (var node = ascendant; node; node = node.parentNode)
        if ((group = node.mutations[' '])) stack.push(group);
      //for (var node = ascendant; node; node = node.previousSibling) {
      //  if ((group = node.mutations['+'])) stack.push(group);
      //  if ((group = node.mutations['-'])) stack.push(group);
      //}
    }
    
    // Match all selectors in the stack and find a right mutation
    var index = stack.length;
    if (index) {
      var mutation, advanced, tagName = LSD.toLowerCase(element.tagName);
      for (var i = index, item, result, ary = ['*', tagName]; item = stack[--i];)
        for (var j = 0, value = item[1] || item, tag; tag = ary[j++];)
          if ((group = value[tag])){
            for (var k = 0, possibility, sel; possibility = group[k++];) {
              var result = possibility[1];
              if ((!mutation || (result && !result.indexOf)) && (sel = possibility[0])) {
                if ((!sel.id && !sel.classes && !sel.attributes && !sel.pseudos) ? (tagName == sel.tag || j == 0) :
                  (Slick.matchSelector(element, sel.tag, sel.id, sel.classes, sel.attributes, sel.pseudos)))
                  if (!result || !result.call || (result = result(element, !revert)))
                    if (!result || !result.push) {
                      mutation = result || true;
                    } else (advanced || (advanced = [])).push(result);
              }
            }
          }
    }
    
    // Create, clone or reuse a widget.
    if (!converted) {
      var options = {traverse: false};
      if (!options.context && this.options.context) options.context = this.options.context;
      if (mutation) {
        Object.append(options, mutation.indexOf ? LSD.Layout.parse(mutation) : mutation);
        var widget = this.context.create(element, options);
      } else {
        var widget = this.context.convert(element, options);
      }
    } else {
      var widget = cloning ? converted.cloneNode(false, options) : converted;
    }
    // Append widget into parent widget without moving elements
    if (widget) {
      var override = function() {
        if (widget.toElement().parentNode == container) return;
        if (cloning) {
          this.appendChild(container, widget.element)
        } else if (widget.origin == element && element.parentNode && element.parentNode == container)
          element.parentNode.replaceChild(widget.element, element);
      }.bind(this);
      if (this.appendChild(ascendant, widget, opts, override))
        if (widget.document != ascendant.document) widget.setDocument(ascendant.document);
    } else {
      if (cloning) var clone = element.cloneNode(false);
      if (cloning || (ascendant.origin == element.parentNode)) this.appendChild(container, clone || element, opts);
    }    
    var newParent = [clone || (widget && widget.element) || element, widget || ascendant];
    
    // Put away selectors in the stack that should not be matched again widget children
    var group, direct, following;
    for (var i = stack.length; group = stack[--i];) {
      switch (group[0]) {
        case '+':
          stack.pop();
          break;
        case '~':
          (following || (following = [])).push(stack.pop());
          break;
        case '>':
          (direct || (direct = [])).push(stack.pop());
      }
    }
    if (opts && opts.before) {
      var before = opts.before; 
      delete opts.before;
    }
    // Collect the mutations from the converted widget
    if (widget) {
      if ((group = widget.mutations[' '])) stack.push([' ', group]);
      if ((group = widget.mutations['>'])) stack.push(['>', group]);
    }
    // Collect mutations that advanced with this element AND are looking for children
    if (advanced) for (var i = 0, group; group = advanced[i]; i++) {
      switch (group[0]) {
        case ' ': case '>':
          advanced.splice(i--, 1);
          stack.push(group);
          break;
      }
    }
    // Render children
    for (var i = 0, j = children.length - 2, child, previous, result, following; child = children[i]; i++) {
      if (previous) {
        if ((group = previous.mutations['~'])) stack.push(['~', group]);
        if ((group = previous.mutations['+'])) stack.push(['+', group]);
      }
      previous = this[LSD.Layout.NodeTypes[child.nodeType]](child, newParent, opts, stack, revert, i == j);
      if (!previous.lsd) previous = null;
    }
    // Put advanced selectors back to the stack
    if (advanced) for (var i = 0; group = advanced[i++];)
      if (group[0] != '+' || !last) stack.push(group);
    if (!last) {
      if (following) for (var i = 0; group = following[i++];) stack.push(group);
      if (direct) for (var i = 0; group = direct[i++];) stack.push(group);
    }
    if (before) opts.before = before;
    
    return widget || clone || element;
  },
  
  textnode: function(element, parent, opts) {
    var value = element.textContent;
    if (this.options.interpolate) var interpolated = this.interpolate(value);
    var cloning = (opts && opts.clone || this.options.clone);
    if (interpolated != null && interpolated != value || cloning) {
      var textnode = element.ownerDocument.createTextNode(interpolated || value);
      if (!cloning) element.parentNode.replaceChild(textnode, element);
      this.appendChild(parent[0] || parent.toElement(), textnode || element)
    }
    return textnode || element;
  },
  
  comment: function(element, parent) {
    //var text = element.innerText;
  },
  
  fragment: function(element, parent, opts) {
    return this.walk(element, parent, opts);
  },
  
  object: function(object, parent, opts) {
    var widgets = [];
    for (var selector in object) {
      widgets.push(this.materialize(selector, object[selector] === true ? null : object[selector], parent, opts));
    }
    return widgets;
  },
  
  walk: function(element, parent, opts) {
    for (var nodes = LSD.slice(element.childNodes, 0), i = 0, node; node = nodes[i++];) {
      if (node.nodeType && node.nodeType != 8) this.render(node, parent, opts);
    }
  },
  
  appendChild: function(parent, child, opts, override) {
    if (child.parentNode != parent) {
      if (opts && opts.before) {
        var before = !parent.lsd && opts.before.toElement ? opts.before.toElement() : opts.before;
        parent.insertBefore(child, before, override);
      } else {
        parent.appendChild(child, override);
      }
      return true;
    }
  },
  
  removeChild: function(parent, child, override) {
    if (child.parentNode != parent) {
      parent.removeChild(child, override);
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
  
  getSource: function(options, tagName) {
    if (options && options.localName) {
      var source = [LSD.toLowerCase(options.tagName)];
      var type = options.getAttribute('type');
      if (type) source.push(type);
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