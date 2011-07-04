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
  - Sheet/SheetParser.Value

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
  if (layout) this.render(layout, widget);
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
    if (type) {
      var result = this[type](layout, parent, opts);
      if (!this.result) this.result = result;
      return result;
    }
  },
  
  // type handlers
  
  array: function(array, parent, opts) {
    for (var i = 0, result = [], length = array.length; i < length; i++) 
      result[i] = this.render(array[i], parent, opts)
    return result;
  },
  
  element: function(element, parent, opts, stack, last) {
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
          if ((group = value[tag]))
            for (var k = 0, possibility, sel; possibility = group[k++];) {
              var result = possibility[1];
              if ((!mutation || (result && !result.indexOf)) && (sel = possibility[0])) {
                if ((!sel.id && !sel.classes && !sel.attributes && !sel.pseudos) ? (tagName == sel.tag || j == 0) :
                  (Slick.matchSelector(element, sel.tag, sel.id, sel.classes, sel.attributes, sel.pseudos)))
                  if (!result || !result.call || (result = result(element)))
                    if (!result || !result.push) {
                      mutation = result || true;
                    } else (advanced || (advanced = [])).push(result);
              }
            }
    }
    // prepare options (once)
    if (!opts || !opts.lazy) {
      opts = Object.append({lazy: true}, opts);
      if (this.options.context && LSD.Widget.prototype.options.context != this.options.context)
        opts.context = this.options.context;
      if (this.options.interpolation) opts.interpolation = this.options.interpolation;
      var prepared = true;
    }
    // Create, clone or reuse a widget.
    if (!converted) {
      if (mutation) {
        var options = Object.append({}, opts, mutation.indexOf ? LSD.Layout.parse(mutation) : mutation);
        var widget = this.context.create(element, options);
      } else {
        var widget = this.context.convert(element, opts);
      }
    } else {
      var widget = cloning ? converted.cloneNode(false, opts) : converted;
    }
    // Append widget into parent widget without moving elements
    if (widget) {
      if (!widget.parentNode) {
        var override = function() {
          if (widget.toElement().parentNode == container) return;
          if (cloning)
            this.appendChild(container, widget.element)
          else if (widget.origin == element && element.parentNode && element.parentNode == container)
            element.parentNode.replaceChild(widget.element, element);
        }.bind(this);
        this.appendChild(ascendant, widget, opts, override)
      }
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
    // Collect mutations from a widget
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
    // Cleanup options if they prepared on this iteration
    if (prepared) {
      options = {};
      for (var option in opts) if (LSD.Layout.Inheritable[option]) options[option] = opts[option];
      opts = options;
    }
    // Render children
    for (var j = children.length - 1, child; j > -1 && (child = children[j]) && child.nodeType != 1; j--);
    for (var i = 0, child, previous, result, following; child = children[i]; i++) {
      // Pick up selectors targetting on a node's next siblings
      if (previous && i) {
        if ((group = previous.mutations['~'])) stack.push(['~', group]);
        if ((group = previous.mutations['+'])) stack.push(['+', group]);
      }
      previous = this[LSD.Layout.NodeTypes[child.nodeType]](child, newParent, opts, stack, i == j);
      if (!previous.lsd) previous = null;
    }
    // Put advanced selectors back to the stack
    if (advanced) for (var i = 0; group = advanced[i++];)
      if (group[0] != '+' || !last) stack.push(group);
    // Put back selectors for next siblings
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
    if (interpolated != null || cloning) {
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
    for (var nodes = LSD.slice(element.childNodes, 0), i = 0, node; node = nodes[i++];)
      this[LSD.Layout.NodeTypes[node.nodeType]](node, parent, opts);
  },
  
  string: function(string, parent, opts) {
    var element = parent[1];
    var interpolated = this.interpolate(string);
    if (interpolated != null) string = interpolated;
    if (!element || element == parent[0].element) {
      var textnode = parent[0].write(string);
    } else {
      var textnode = element.ownerDocument.createTextNode(element);
      element.appendChild(textnode);
    }
    return textnode;
  },
  
  object: function(object, parent, opts) {
    var result = {}, parsed, layout, branch;
    for (var selector in object) {
      layout = object[selector] === true ? null : object[selector];
      if ((parsed = LSD.Layout.extractKeyword(selector))) {
        branch = result[selector] = this.keyword(parsed.keyword, parsed.expressions, branch, layout, parent, opts);
      } else {
        branch = null;
        var result = this.selector(selector, parent, opts);
        result[selector] = !layout || [result, this.render(layout, result.lsd ? result : [parent[0] || parent, result], null, opts)];
      }
    }
    return result;
  },
  
  selector: function(string, parent, opts) {
    var options = Object.append({context: this.options.context}, opts, LSD.Layout.parse(string, parent[0] || parent));
    if (options.tag != '*' && (options.source || this.context.find(options.tag) || !LSD.Layout.NodeNames[options.tag])) {
      var widget = this.context.create(options), self = this;
      if (widget.element && widget.element.childNodes.length) var nodes = widget.element.childNodes;
      if (self) this.appendChild(parent[1] || parent, widget, opts, function() {
        self.appendChild(parent[0] || parent.toElement(), widget.toElement());
      });
      console.error('from string', nodes, widget.tagName, widget.element)
      options = {};
      for (var option in opts) if (LSD.Layout.Inheritable[option]) options[option] = opts[option];
      opts = options;
      if (nodes) this.array(nodes, [widget.element, widget], opts);
    } else {  
      var props = {}, tag = (options.tag == '*') ? 'div' : options.tag;
      if (options.id) props.id = options.id;
      var attributes = options.attributes;
      if (attributes) for (var attr, i = 0, l = attributes.length; i < l; i++){
        attr = attributes[i];
        if (props[attr.key] != null) continue;
        if (attr.value != null && attr.operator == '=') props[attr.key] = attr.value;
        else if (!attr.value && !attr.operator) props[attr.key] = props[attr.key];
      }
      var element = document.createElement(tag);
      for (var name in props) element.setAttribute(name, props[name]);
      if (options.classes) element.className = options.classes.join(' ');
      if (parent) this.appendChild(parent[0] || parent.toElement(), element);
    }
    return widget || element;
  },
  
  interpolate: function(string, object) {
    if (!object) object = this.options.interpolate;
    var interpolated = LSD.Interpolation.attempt(string, object);
    if (interpolated !== false) {
      this.interpolated = true;
      return interpolated;
    }
  },
  
  keyword: function(keyword, expression, holder, layout, parent, opts) {
    var options = {keyword: keyword, holder: holder, layout: layout, parent: parent, options: opts}
    switch (keyword) {
      case "if":
        options.expression = expression;
        break;
      case "unless":  
        options.expression = expression;
        options.inversed = true;
        break;
      case "elsif": case "elseif": case "else if":
        options.expression = expression;
        options.link = true;
        break;
      case "else":
        options.link = true;
    }
    return new LSD.Layout.Branch(options);
  },
  
  appendChild: function(parent, child, opts, override) {
    if (child.parentNode != parent) {
      if (opts && opts.before) {
        var before = !parent.lsd && opts.before.toElement ? opts.before.toElement() : opts.before;
        parent.insertBefore(child, before, override);
      } else {
        parent.appendChild(child, override);
      }
      if (child.lsd) {
        var doc = child.parentNode.document;
        if (child.document != doc) child.setDocument(doc);
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

LSD.Layout.Branch = function(options) {
  this.options = options;
  if (options.link) {
    if (!options.holder) throw "Alternative branch is missing its original branch"
    options.holder.addEvents({
      check: this.unmatch.bind(this),
      uncheck: this.match.bind(this)
    });
  }
  this.addEvents({
    check: this.show.bind(this),
    uncheck: this.hide.bind(this)
  });
};

LSD.Layout.Branch.prototype = Object.append({
  match: function() {
    if (!this.checked && this.condition()) this.fireEvent('check', arguments);
  },
  unmatch: function() {
    if (this.checked) this.fireEvent('uncheck', arguments);
  },
  condition: function() {
    return (this.options.expression) ^ this.options.inverse;
  },
  show: function() {
    return this.layout.add(this.options.layout, this.options.parent, this.options.options);
  },
  hide: function() {
    return this.layout.remove(this.options.layout, this.options.parent, this.options.options);
  }
}, Events.prototype);

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
LSD.Layout.Inheritable = Array.fast('context', 'interpolation', 'clone', 'lazy');

LSD.Layout.rExpressions = /^\s*(if|else|call|els[e ]*if|unless)(?:$|\s+(.*?)\s*$)/
Object.append(LSD.Layout, {
  extractKeyword: function(input) {
    var match = input.match(LSD.Layout.rExpressions);
    if (match) return {keyword: match[1], expression: SheetParser.Value.translate(match[2])};
  },
  
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
    if (parsed.tag != '*' && parsed.combinator != '::')
      if (parsed.tag.indexOf('-') > -1) 
        options.source = parsed.tag.split('-');
      else
        options.tag = parsed.tag;
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
  
  getSource: function(options, tagName) {
    if (options && options.localName) {
      var source = LSD.toLowerCase(options.tagName);
      var type = options.getAttribute('type');
      if (type) (source.push ? source : [source]).push(type);
    } else {
      var source;
      if (tagName) (source ? (source.push ? source : (source = [source])).push(tagName) : (source = tagName));
      if (options) {
        var type = options.type;
        if (type) (source ? (source.push ? source : (source = [source])).push(type) : (source = type));
        var kind = options.kind;
        if (kind) (source ? (source.push ? source : (source = [source])).push(kind) : (source = kind));
      }
    }
    return source;
  }
});