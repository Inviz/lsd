/*
---
 
script: Layout.js
 
description: A logic to render (and nest) widgets out of the key-value hash or dom tree
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - LSD.Interpolation
  - LSD.Helpers
  - LSD.Microdata
  - More/Object.Extras

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
  
  render: function(layout, parent, opts, memo) {
    var type = layout.push ? 'array' : layout.nodeType ? LSD.Layout.NodeTypes[layout.nodeType] : layout.indexOf ? 'string' : 'object';
    if (type) {
      var result = this[type](layout, parent, opts, memo);
      if (!this.result) this.result = result;
      return result;
    }
  },
  
  // type handlers
  
  array: function(array, parent, opts, memo) {
    for (var i = 0, result = [], length = array.length; i < length; i++) 
      result[i] = this.render(array[i], parent, opts, memo)
    return result;
  },
  
  element: function(element, parent, opts, memo) {
    // Prepare options and run walker (once per element tree)
    if (!opts || !opts.lazy) {
      opts = Object.append({lazy: true}, opts);
      if (this.options.context && LSD.Widget.prototype.options.context != this.options.context)
        opts.context = this.options.context;
      if (this.options.interpolation) opts.interpolation = this.options.interpolation;
      var prepared = true;
      if (!memo) memo = {};
      memo.callback = function(element, parent, opts, memo) {
        if (prepared) {
          var options = {};
          for (var option in opts) if (LSD.Layout.Inheritable[option]) options[option] = opts[option];
          opts = options;
          prepared = null;
        }
        return this[LSD.Layout.NodeTypes[element.nodeType]].call(this, element, parent, opts, memo);
      };
      return LSD.Layout.walk.call(this, element, parent, opts, memo);
    }
    var converted = element.uid && Element.retrieve(element, 'widget');
    var cloning = (opts && opts.clone) || this.options.clone, group;
    var ascendant = parent[0] || parent, container = parent[1] || parent.toElement();
    // Create, clone or reuse a widget.
    if (!converted) {
      if (memo.mutation) {
        var options = Object.append({}, opts, memo.mutation.indexOf ? LSD.Layout.parse(memo.mutation) : memo.mutation);
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
        this.appendChild(ascendant, widget, memo, override)
      }
    } else {
      if (cloning) var clone = element.cloneNode(false);
      if (cloning || (ascendant.origin == element.parentNode)) this.appendChild(container, clone || element, memo);
    }
    return widget || clone || element;
  },
  
  textnode: function(element, parent, opts) {
    var cloning = (opts && opts.clone || this.options.clone);
    if (cloning) {
      var textnode = element.cloneNode();
      this.appendChild(parent[1] || parent.toElement(), textnode)
    }
    LSD.Interpolation.textnode(textnode || element, this.options.interpolate, parent[0] || parent);
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
    var textnode = element.ownerDocument.createTextNode(string);
    this.appendChild(element, textnode);
    LSD.Interpolation.textnode(textnode, this.options.interpolate, parent[0] || parent);
    return textnode;
  },
  
  object: function(object, parent, opts) {
    var result = {}, parsed, layout, branch;
    for (var selector in object) {
      layout = object[selector] === true ? null : object[selector];
      if ((parsed = LSD.Layout.extractKeyword(selector))) {
        branch = this.keyword(parsed.keyword, parsed.expression, branch, layout, parent, opts);
        result[selector] = [branch, layout, parent, opts];
      } else {
        branch = null;
        var rendered = this.selector(selector, parent, opts);
        result[selector] = !layout || [rendered, this.render(layout, rendered.lsd ? rendered : [parent[0] || parent, rendered], null, opts)];
      }
    }
    return result;
  },
  
  selector: function(string, parent, opts) {
    var options = Object.append({context: this.options.context}, opts, LSD.Layout.parse(string, parent[0] || parent));
    if (options.tag != '*' && (options.source || this.context.find(options.tag) || !LSD.Layout.NodeNames[options.tag])) {
      var allocation = options.allocation;
      if (allocation) (parent[0] || parent).allocate(allocation.type, allocation.kind, allocation.options);
      var widget = this.context.create(options), self = this;
      if (widget.element && widget.element.childNodes.length) var nodes = widget.element.childNodes;
      this.appendChild(parent[0] || parent, widget, opts, function() {
        self.appendChild(parent[1] || parent.toElement(), widget.toElement());
      });
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
      if (parent) this.appendChild(parent[1] || parent.toElement(), element);
    }
    return widget || element;
  },
  
  keyword: function(keyword, expression, holder, layout, parent, opts) {
    var options = {keyword: keyword, holder: holder, layout: layout, widget: parent[0] || parent, options: opts};
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
  
  set: function(layout, parent, state) {
    var method = state ? 'appendChild' : 'removeChild', value;
    switch (typeOf(layout)) {
      case "array": case "collection": 
        for (var i = 0, j = layout.length; i < j; i++)
          if ((value = layout[i])) this[method](parent, value);
        break;
      case "object":
        for (var key in layout)
          if ((value = layout[key])) this[method](parent, value);
        break;
      case "widget": case "string":
        this[method](parent, layout);
    }
  },
  
  /* 
    Remove rendered content from DOM. It only argument from DOM, keeping
    all of its contents untouched. 
  */
  
  remove: function(layout) {
  
  },
  
  appendChild: function(parent, child, memo, override) {
    if (child.parentNode != parent) {
      if (memo && memo.before) {
        var before = !parent.lsd && memo.before.toElement ? opts.before.toElement() : memo.before;
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

LSD.Layout.walk = function(element, parent, opts, memo) {
  var ascendant = parent[0] || parent;
  // Retrieve the stack if the render was not triggered from the root of the layout
  if (!memo) memo = {};
  var stack = memo.stack;
  if (!stack) {
    stack = memo.stack = [];
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
    memo.mutation = mutation;
  }
  var children = LSD.slice(element.childNodes);
  var ret = memo.callback.call(this, element, parent, opts, memo);
  if (ret)
    if (ret.lsd) var widget = ret;
    else if (opts.clone) var clone = ret;
  if (mutation) delete memo.mutation;
  // Put away reversed direction option, since it does not affect child nodes
  if (memo.before) {
    var before = memo.before; 
    delete memo.before;
  }
  // Scan element for microdata
  var itempath = memo.itempath;
  var scope = LSD.Microdata.element(element, widget || ascendant, itempath && itempath[itempath.length - 1]);
  if (scope) (itempath || (itempath = memo.itempath = [])).push(scope);
  if (widget && itempath) widget.itempath = itempath;
  // Prepare parent array - first element is a nearest parent widget and second is a direct parent element
  var newParent = [widget || ascendant, clone || (widget && widget.element) || element];
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
  var ascendant = parent[0] || parent;
  // Render children
  for (var j = children.length - 1, child; j > -1 && (child = children[j]) && child.nodeType != 1; j--);
  var first = memo.first, last = memo.last;
  for (var i = 0, child, previous, args, result, following; child = children[i]; i++) {
    // Pick up selectors targetting on a node's next siblings
    if (previous && i) {
      if ((group = previous.mutations['~'])) stack.push(['~', group]);
      if ((group = previous.mutations['+'])) stack.push(['+', group]);
    }
    memo.last = (i == j);
    memo.first = (i == 0);
    args = [child, newParent, opts, memo];
    previous = (child.nodeType == 1 ? LSD.Layout.walk : memo.callback).apply(this, args);
    if (!previous.lsd) previous = null;
  }
  delete memo.last; delete memo.first;
  // Restore reversed insertion direction
  if (before) memo.before = before;
  // Put advanced selectors back to the stack
  if (advanced) for (var i = 0; group = advanced[i++];)
    if (group[0] != '+' || !last) stack.push(group);
  // Put back selectors for next siblings
  if (!last) {
    if (following) for (var i = 0; group = following[i++];) stack.push(group);
    if (direct) for (var i = 0; group = direct[i++];) stack.push(group);
  }
  // Reduce the microdata path
  if (scope) itempath.pop();
  return ret;
}

LSD.Layout.Branch = function(options) {
  this.options = options;
  if (options.link) {
    if (!options.holder) throw "Alternative branch is missing its original branch"
    options.holder.addEvents({
      check: this.unmatch.bind(this),
      uncheck: this.match.bind(this)
    });
  }
  if (this.options.expression) this.interpolation = LSD.Interpolation.compile(this.options.expression, this, this.options.widget, true)
};

LSD.Layout.Branch.prototype = Object.append({
  branch: true,
  match: function() {
    if (!this.checked && this.condition()) {
      this.show();
      this.fireEvent('check', arguments);
    }
  },
  unmatch: function() {
    if (this.checked) {
      this.hide();
      this.fireEvent('uncheck', arguments);
    }
  },
  condition: function() {
    return (this.options.expression) ^ this.options.inverse;
  },
  show: function() {
    return this.options.widget.layout.add(this.options.layout, this.options.widget, this.options.options);
  },
  hide: function() {
    return this.options.widget.layout.remove(this.options.layout, this.options.widget, this.options.options);
  }
}, Events.prototype);

LSD.Layout.NodeTypes = {1: 'element', 3: 'textnode', 8: 'comment', 11: 'fragment'};
LSD.Layout.NodeNames = Array.object('!doctype', 'a', 'abbr', 'acronym', 'address', 'applet', 'area', 
'article', 'aside', 'audio', 'b', 'base', 'bdo', 'big', 'blockquote', 'body', 'br', 'button', 'canvas', 
'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'command', 'datalist', 'dd', 'del', 'details',
'dfn', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'frame',
'frameset', 'h1', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'iframe', 'img', 'input', 'ins', 
'keygen', 'kbd', 'label', 'legend', 'li', 'link', 'map', 'mark', 'menu', 'meta', 'meter', 'nav', 
'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'pre', 'progress', 'q', 
'rp', 'rt', 'ruby', 's', 'samp', 'script', 'section', 'select', 'small', 'source', 'span', 'strike', 
'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 
'time', 'title', 'tr', 'ul', 'var', 'video', 'wbr');
LSD.Layout.Inheritable = Array.object('context', 'interpolation', 'clone', 'lazy');

LSD.Layout.rExpressions = /^\s*(if|else|call|els[e ]*if|unless)(?:$|\s+(.*?)\s*$)/
Object.append(LSD.Layout, {
  extractKeyword: function(input) {
    var match = input.match(LSD.Layout.rExpressions);
    if (match) return {keyword: match[1], expression: match[2]};
  },
  
  /* 
    Parsers selector and generates options for layout 
  */
  parse: function(selector, parent) {
    var options = {};
    var expressions = (selector.Slick ? selector : Slick.parse(selector)).expressions[0];
    var parsed = expressions[0];
    if (parsed.combinator != ' ') {
      if (parsed.combinator == '::') {
        if (LSD.Allocations[parsed.tag]) {
          options.allocation = LSD.Module.Allocations.prepare(options, parsed.tag, parsed.classes, parsed.attributes, parsed.pseudos);
        } else {
          var relation = (parent[0] || parent).relations[parsed.tag];
          if (!relation) throw "Unknown pseudo element ::" + parsed.tag;
          var source = relation.getSource();
          if (source) Object.append(options, LSD.Layout.parse(source, parent[0] || parent));
        }
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