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
    if (layout.getLayout) layout = layout.getLayout();
    var type = (layout.push) ? 'array' : (layout.item && ('length' in layout)) ? 'children' : 
      layout.nodeType ? LSD.Layout.NodeTypes[layout.nodeType] : layout.indexOf ? 'string' : 'object';
    var result = this[type](layout, parent, opts, memo);
    if (!this.result) this.result = result;
    return result;
  },
  
  // type handlers
  
  array: function(array, parent, opts, memo) {
    for (var i = 0, result = [], length = array.length; i < length; i++) 
      result[i] = this.render(array[i], parent, opts, memo)
    return result;
  },
  
  element: function(element, parent, opts, memo) {
    // Prepare options and run walker (once per element tree)
    if (!opts || !opts.lazy) return this.walk(element, parent, opts, memo);
    /*
      Match all selectors in the stack and find a right mutation
    */
    var stack = memo.stack, index = stack.length;
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
      if (advanced) memo.advanced = advanced;
    }
    var converted = element.uid && Element.retrieve(element, 'widget');
    var cloning = (opts && opts.clone) || this.options.clone, group;
    var ascendant = parent[0] || parent, container = parent[1] || parent.toElement();
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
        this.appendChild(ascendant, widget, memo, override)
      }
    } else {
      if (cloning) var clone = element.cloneNode(false);
      if (cloning || (ascendant.origin ? (ascendant.origin == element.parentNode) : (!element.parentNode || element.parentNode.nodeType == 11))) 
        this.appendChild(container, clone || element, memo);
    }
    return widget || clone || element;
  },
  
  children: function(children, parent, opts, memo) {
    if (!memo) memo = {};
    var stack = memo.stack = this.pushMutations(parent, memo.stack);
    for (var j = children.length - 1, child; j > -1 && (child = children[j]) && child.nodeType != 1; j--);
    var args = [null, parent, opts, memo];
    for (var i = 0, child, previous, result = []; child = children[i]; i++) {
      /*
        Pick up selectors targetting on a node's next siblings
      */
      if (previous && i) {
        if ((group = previous.mutations['~'])) stack.push(['~', group]);
        if ((group = previous.mutations['+'])) stack.push(['+', group]);
      }
      memo.last = (i == j);
      memo.first = (i == 0);
      args[0] = child;
      /*
        If the child is element, walk it again and render it there, otherwise render it right away
      */
      previous = (child.nodeType == 1 ? this.walk : this.render).apply(this, args);
      if (!previous.lsd) previous = null;
    }
    
    delete memo.last; delete memo.first;
    this.popMutations(parent, stack)
    return children;
  },
  
  textnode: function(element, parent, opts) {
    var cloning = (opts && opts.clone || this.options.clone);
    if (cloning) var clone = element.cloneNode();
    this.appendChild(parent, clone || element);
    LSD.Interpolation.textnode(clone || element, this.options.interpolate, parent[0] || parent);
    return clone || element;
  },
  
  comment: function(comment, parent, opts, memo) {
    var keyword = Element.retrieve(comment, 'keyword');
    this.appendChild(parent, comment, memo);
    if (keyword) return keyword === true ? comment : keyword;
    else keyword = this.keyword(comment.nodeValue, parent, opts, memo, comment);
    if (keyword) {
      Element.store(comment, 'keyword', keyword);
      if (keyword !== true) (memo.branches || (memo.branches = [])).push(keyword);
      return keyword;
    } else return comment;
  },
  
  fragment: function(element, parent, opts) {
    return this.children(element.childNodes, parent, opts);
  },
  
  string: function(string, parent, opts) {
    var element = parent[1] || parent.toElement();
    var textnode = element.ownerDocument.createTextNode(string);
    this.appendChild(element, textnode);
    LSD.Interpolation.textnode(textnode, this.options.interpolate, parent[0] || parent);
    return textnode;
  },
  
  object: function(object, parent, opts, memo) {
    var result = {}, layout, branch;
    for (var selector in object) {
      layout = object[selector] === true ? null : object[selector];
      if (!memo) memo = {};
      if ((branch = this.keyword(selector, parent, opts, memo))) {
        (memo.branches || (memo.branches = [])).push(branch);
        branch.setLayout(layout);
        result[selector] = [branch, layout];
      } else {
        if (branch && memo && memo.branches && memo.branches[memo.branches.length - 1] == branch) memo.branches.pop();
        var rendered = this.selector(selector, parent, opts);
        result[selector] = [rendered, !layout || this.render(layout, rendered.lsd ? rendered : [parent[0] || parent, rendered], null, opts)];
      }
    }
    return result;
  },
  
  selector: function(string, parent, opts) {
    var options = Object.append({context: this.options.context}, opts, LSD.Layout.parse(string, parent[0] || parent));
    if (!options.tag || (options.tag != '*' && (options.source || this.context.find(options.tag) || !LSD.Layout.NodeNames[options.tag]))) {
      var allocation = options.allocation;
      if (allocation) var widget = (parent[0] || parent).allocate(allocation.type, allocation.kind, allocation.options);
      else var widget = this.context.create(options), self = this;
      if (widget.element && widget.element.childNodes.length) var nodes = LSD.slice(widget.element.childNodes);
      this.appendChild(parent, widget, opts, function() {
        self.appendChild(parent, widget.toElement());
      });
      options = {};
      for (var option in opts) if (LSD.Layout.Inheritable[option]) options[option] = opts[option];
      opts = options;
      if (nodes && nodes.length) this.children(nodes, [widget, widget.element], opts);
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
      if (parent) this.appendChild(parent, element);
    }
    return widget || element;
  },
  
  keyword: function(text, parent, opts, memo, element) {
    var parsed = LSD.Layout.extractKeyword(text);
    if (!parsed) return;
    var keyword = LSD.Layout.Keyword[parsed.keyword];
    if (!keyword) return;
    var options = keyword(parsed.expression);
    var parentbranch = memo.branches && memo.branches[memo.branches.length - 1];
    if (options.ends || options.link) {
      if (!(options.superbranch = (memo.branches && memo.branches.pop()))) 
        throw "Alternative branch is missing its original branch";
      var node = options.superbranch.options.element;
      if (node) {
        for (var layout = []; (node = node.nextSibling) != element;) layout.push(node);
        options.superbranch.setLayout(layout);
      }
      if (element && options.superbranch.options.clean) {
        element.parentNode.removeChild(element);
        element = options.superbranch.options.element;
        if (element) element.parentNode.removeChild(element);
      }
      if (options.ends) return true;
    }
    if (options.branch) {
      options.keyword = parsed.keyword;
      options.parent = parentbranch;
      options.widget = parent[0] || parent;
      options.element = element;
      options.options = opts;
      return new LSD.Layout.Branch(options);
    } else {
      if (options.layout) {
        return this.render(options.layout);
      }
    }
  },
  
  /* 
    Remove rendered content from DOM. It only argument from DOM, keeping
    all of its contents untouched. 
  */
  remove: function(layout, parent, memo) {
    return this.set(layout, parent, memo, false)
  },

  /*
    Re-add once rendered content that was removed
  */
  add: function(layout, parent, memo) {
    return this.set(layout, parent, memo, true)
  },

  set: function(layout, parent, memo, state) {
    var method = state ? 'appendChild' : 'removeChild', value;
    switch (typeOf(layout)) {
      case "array": case "collection":
        for (var i = 0, j = layout.length; i < j; i++)
          if ((value = layout[i])) {
            this[method](parent, value, memo);
            if (value.nodeType == 8) {
              var keyword = Element.retrieve(value, 'keyword');
              if (keyword && keyword !== true) keyword[state ? 'attach' : 'detach']();
            }
          }
        break;
      case "object":
        for (var key in layout)
          if ((value = layout[key])) {
            value = value[0]
            if (!value) return;
            this[method](parent, value, memo);
            if (value.nodeType == 8) {
              var keyword = Element.retrieve(value, 'keyword');
              if (keyword && keyword !== true) keyword[state ? 'attach' : 'detach']();
            }
          }
        break;
      case "widget": case "string":
        this[method](parent, layout);
    }
    return layout;
  },
  
  appendChild: function(parent, child, memo, override) {
    if (parent.push) parent = parent[child.lsd ? 0 : 1] || parent;
    if (!child.lsd && parent.lsd) parent = parent.toElement();
    if (child.parentNode == parent) return;
    if (memo && memo.before) {
      var before = memo.before;
      if (!parent.lsd) {
        if (before.lsd) before = before.toElement();
        parent = before.parentNode;
      };
      parent.insertBefore(child, before, override);
    } else {
      parent.appendChild(child, override);
    }
    if (child.lsd) {
      var doc = parent.document;
      if (child.document != doc) child.setDocument(doc);
    }
    return true;
  },
  
  removeChild: function(parent, child, override) {
    if (parent.push) parent = parent[child.lsd ? 0 : 1] || parent;
    if (!child.lsd && parent.lsd) parent = parent.toElement();
    if (child.parentNode != parent) return;
    parent.removeChild(child, override);
    return true;
  },
  
  inheritOptions: function(opts) {
    var options = {};
    for (var option in opts) if (LSD.Layout.Inheritable[option]) options[option] = opts[option];
    return options;
  },

  prepareOptions: function(opts) {
    opts = Object.append({lazy: true}, opts);
    if (this.options.context && LSD.Widget.prototype.options.context != this.options.context)
      opts.context = this.options.context;
    if (this.options.interpolation) opts.interpolation = this.options.interpolation;
    return opts;
  },
  
  pushMutations: function(parent, stack) {
    if (stack && parent[1] && parent[1] != parent[0].element) return stack;
    var widget = parent[0] || parent;
    var group;
    if (stack) {
      /* 
        Collect mutations from a widget
      */
      if (widget) {
        if ((group = widget.mutations[' '])) stack.push([' ', group]);
        if ((group = widget.mutations['>'])) stack.push(['>', group]);
      }
    } else {  
      stack = [];
      if (widget) {
        if ((group = widget.mutations['>'])) stack.push(group);
        for (var node = widget, group; node; node = node.parentNode)
          if ((group = node.mutations[' '])) stack.push(group);
        //for (var node = ascendant; node; node = node.previousSibling) {
        //  if ((group = node.mutations['+'])) stack.push(group);
        //  if ((group = node.mutations['-'])) stack.push(group);
        //}
      }
    }
    return stack;
  },
  
  popMutations: function(parent, stack) {
    if (parent[1] && parent[1] != parent[0].element) return stack;
    var widget = parent[0] || parent;
    if (!widget) debugger
    var group;
    if (widget && stack) {
      if ((group = widget.mutations[' '])) 
        for (var j = stack.length; --j > -1;)
          if (stack[j][1] == group) {
            stack.splice(j, 1)
            break;
          }
      if ((group = widget.mutations['>'])) 
        for (var j = stack.length; --j > -1;)
          if (stack[j][1] == group) {
            stack.splice(j, 1)
            break;
          }
    }
  },
  
  walk: function(element, parent, opts, memo) {
  
    if (!opts || !opts.lazy) var prepared = opts = this.prepareOptions(opts);
  
    var ascendant = parent[0] || parent;
    /*
      Retrieve the stack if the render was not triggered from the root of the layout
    */
    if (!memo) memo = {};
    var stack = memo.stack;
    if (!stack) stack = memo.stack = this.pushMutations(parent, memo.stack);
    /* 
      Render the given element
    */
    var children = LSD.slice(element.childNodes);
    var ret = this.element(element, parent, opts, memo);
    if (ret.lsd) var widget = ret;
    else if (ret.branch) {
      (memo.branches || (memo.branches = [])).push(ret);
    } else if (opts.clone) var clone = ret;
    /* 
      Put away selectors in the stack that should not be matched against widget children
    */
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
    /*
      Collect mutations that advanced with this element AND are looking for children
    */
    var advanced = memo.advanced;
    if (advanced) {
      for (var i = 0, group; group = advanced[i]; i++) {
        switch (group[0]) {
          case ' ': case '>':
            advanced.splice(i--, 1);
            stack.push(group);
            break;
        }
      }
      delete memo.advanced;
    }
    /* 
      Put away reversed direction option, since it does not affect child nodes
    */
    var before = memo.before;
    if (before) delete memo.before;
    /*
      Scan element for microdata
    */
    var itempath = memo.itempath;
    var scope = LSD.Microdata.element(element, widget || ascendant, itempath && itempath[itempath.length - 1]);
    if (scope) (itempath || (itempath = memo.itempath = [])).push(scope);
    if (widget && itempath) widget.itempath = itempath;
    /*
      Prepare parent array - first item is a nearest parent widget and second is a direct parent element
    */
    var newParent = [widget || ascendant, clone || (widget && widget.element) || element];
    var ascendant = parent[0] || parent;
    /*
      Put away prepared options and leave only the inheritable ones
    */
    if (prepared) opts = this.inheritOptions(opts);
    /*
      Iterate children
    */
    var first = memo.first, last = memo.last;
    if (children.length) this.children(children, newParent, opts, memo);
    /*
      Restore reversed insertion direction
    */
    if (before) memo.before = before;
    /* 
      Put advanced selectors back to the stack
    */
    if (advanced) for (var i = 0; group = advanced[i++];)
      if (group[0] != '+' || !last) stack.push(group);
    /*
      Put back selectors for next siblings
    */
    if (!last) {
      if (following) for (var i = 0; group = following[i++];) stack.push(group);
      if (direct) for (var i = 0; group = direct[i++];) stack.push(group);
    }
    /*
      Reduce the microdata path
    */
    if (scope) itempath.pop();
    return ret;
  }
});
LSD.Layout.Branch = function(options) {
  this.options = options;
  this.id = ++LSD.Layout.Branch.UID;
  this.$events = Object.clone(this.$events);
  if (options.superbranch) {
    options.superbranch.addEvents({
      check: this.unmatch.bind(this),
      uncheck: this.match.bind(this)
    });
    if (!options.superbranch.checked ^ this.options.invert) this.match();
  } else if (options.expression || options.show) {
    this.match();
  } else if (options.template) {
    LSD.Template[options.template] = this;
  }
};
LSD.Layout.Branch.UID = 0;
LSD.Template = {};

LSD.Layout.Branch.prototype = Object.append({
  branch: true,
  getInterpolation: function() {
    if (this.interpolation) return this.interpolation;
    this.interpolation = LSD.Interpolation.compile(this.options.expression, this, this.options.widget, true);
    return this.interpolation;
  },
  match: function() {
    if (this.options.expression) {
      var value = this.getInterpolation().attach().value;
      if ((value == null) ^ this.options.invert) return;
    }
    this.check();
  },
  unmatch: function(lazy) {
    if (this.options.expression) {
      var value = this.interpolation.value;
      this.interpolation.detach()
      if ((value == null) ^ this.options.invert) return;
    }
    this.uncheck(lazy);
  },
  check: function(lazy) {
    if (!this.checked) {
      this.checked = true;
      this.show();
      if (!lazy) this.fireEvent('check', arguments);
    }
  },
  uncheck: function(lazy) {
    if (this.checked || this.checked == null) {
      this.checked = false;
      this.hide();
      if (!lazy) this.fireEvent('uncheck', arguments);
    }  
  },
  set: function(value) {
    this[((value != false && value != null) ^ this.options.invert) ? 'check' : 'uncheck']();
  },
  show: function() {
    var layout = this.layout;
    if (!layout) return;
    if (layout.length) for (var i = 0, child, keyword, depth = 0; child = layout[i]; i++) {
      if (child.call) {
        if (layout === this.layout) layout = layout.slice(0);
        var result = child.call(this);
        if (result) {
          for (var branch = this; branch; branch = branch.options.parent) branch.dirty = true;
          if (result.length) layout.splice.apply(layout, [i, 1].concat(result))
          else layout[i] = result;
        }
      }
    }
    var before = this.options.element && this.options.element.nextSibling;
    var rendered = this.options.widget.addLayout(this.id, layout, this.options.widget, this.options.options, {before: before});
    if (result) this.validate(rendered)
    if (rendered) this.layout = rendered;
  },
  hide: function() {
    var layout = this.layout;
    if (!layout) return;
    this.options.widget.removeLayout(this.id, layout, this.options.widget, this.options.options);
  },
  splice: function(branch, layout, baseline) {
    var offset = 0;
    if (branch.layout) {
      if (!layout) layout = this.layout;
      for (var i = 0, child, keyword; child = branch.layout[i]; i++) {
        var index = layout.indexOf(child);
        if (index > -1) {
          var keyword = Element.retrieve(child, 'keyword');
          if (keyword && keyword !== true) {
            offset += this.splice(keyword, layout);
          }
          layout.splice(index, 1);
          i--;
        }
      }
    }
    return offset;
  },
  validate: function(layout) {
    var validate = true;
    for (var index, child, i = 0; child = layout[i]; i++) {
      switch ((child = layout[i]).nodeType) {
        case 8:
          if (validate)
            if (index != null) validate = index = null;
            else index = i;
          var keyword = Element.retrieve(child, 'keyword');
          if (keyword && keyword !== true) i += this.splice(keyword, layout, i)
          break;
        case 3:
          if (validate && child.textContent.match(LSD.Layout.rWhitespace)) break;
        default:  
          index = validate = null;
      }
    }
    if (index != null) {  
      var comment = layout[index];
      layout[index] = function() {
        return LSD.slice(document.createFragment(this.expand(comment.nodeValue)).childNodes);
      };
      comment.parentNode.removeChild(comment);
      if (this.options.clean) layout = layout[index];
    }
    return layout;
  },
  setLayout: function(layout) {
    this.layout = layout.push ? this.validate(layout) : layout;
    if (this.checked) {
      this.show();
    } else this.hide();
  },
  getLayout: function(layout) {
    return this.layout;
  },
  attach: function() {
    if ((this.options.expression && !this.options.link) || !this.options.superbranch.checked) this.match(true);
    //this.show();
  },
  detach: function() {
    if (this.options.expression && !this.options.link) this.unmatch(true);
    this.hide()
  },
  expand: function(text) {
    var depth = 0;
    text = text.replace(LSD.Layout.rComment, function(whole, start, end) {
      depth += (start ? 1 : -1);
      if (depth == !!start) return start ? '<!--' : '-->'
      return whole;
    });
    if (depth) throw "The lazy branch is unbalanced"
    return text;
  }
}, Events.prototype);

LSD.Layout.rComment = /(\<\!-)|(-\>)/g
LSD.Layout.rWhitespace = /^\s*$/;

LSD.Layout.NodeTypes = {1: 'element', 3: 'textnode', 8: 'comment', 11: 'fragment'};
LSD.Layout.NodeNames = Array.object('!doctype', 'a', 'abbr', 'acronym', 'address', 'applet', 'area', 
'article', 'aside', 'audio', 'b', 'base', 'bdo', 'big', 'blockquote', 'body', 'br', 'button', 'canvas', 
'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'command', 'datalist', 'dd', 'del', 'details',
'dfn', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'frame',
'frameset', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'iframe', 
'img', 'input', 'ins', 'keygen', 'kbd', 'label', 'legend', 'li', 'link', 'map', 'mark', 'menu', 'meta', 
'meter', 'nav', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'pre', 'progress', 
'q', 'rp', 'rt', 'ruby', 's', 'samp', 'script', 'section', 'select', 'small', 'source', 'span', 'strike', 
'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 
'time', 'title', 'tr', 'ul', 'var', 'video', 'wbr');
LSD.Layout.Inheritable = Array.object('context', 'interpolation', 'clone', 'lazy');

LSD.Layout.Keyword = {
  'if': function(expression) {
    return {branch: true, expression: expression};
  },
  'unless': function(expression) {
    return {branch: true, expression: expression, invert: true};
  },
  'elsif': function(expression) {
    return {branch: true, expression: expression, link: true};
  },
  'else': function() {
    return {branch: true, link: true};
  },
  'build': function(expression) {
    var options = {layout: {}};
    options.layout[parsed.expression] = true;
    return options;
  },
  'template': function(expression) {
    return {branch: true, template: expression, clean: true}
  },
  'end': function(expression) {
    return {ends: true}
  }
};

LSD.Layout.rExpression = /^\s*([a-z]+)(?:\s(.*?))?\s*$/;
Object.append(LSD.Layout, {
  extractKeyword: function(input) {
    var match = input.match(LSD.Layout.rExpression);
    if (match && LSD.Layout.Keyword[match[1]])
      return {keyword: match[1], expression: match[2]};
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
          options.allocation = LSD.Module.Allocations.prepare(parsed.tag, parsed.classes, parsed.attributes, parsed.pseudos);
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
      (options.pseudos || (options.pseudos = [])).push(pseudo.key);
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