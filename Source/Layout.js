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

LSD.Layout = function(widget, layout, memo) {
  this.origin = widget;
  if (widget) if (!layout && !widget.lsd) {
    layout = widget;
    widget = null;
  } else if (!widget.lsd) widget = this.convert(widget);
  if (layout) this.render(layout, widget, memo);
};

LSD.Layout.context = 'element';

LSD.Layout.prototype = Object.append({
  $family: Function.from('layout'),
  
  render: function(layout, parent, memo) {
    if (layout.getLayout) layout = layout.getLayout();
    var type = (layout.push) ? 'array' : (layout.item && ('length' in layout)) ? 'children' : 
      layout.nodeType ? LSD.Layout.NodeTypes[layout.nodeType] : layout.indexOf ? 'string' : 'object';
    var result = this[type](layout, parent, memo);
    if (!this.result) this.result = result;
    return result;
  },
  
  // type handlers
  
  array: function(array, parent, memo) {
    for (var i = 0, result = [], length = array.length; i < length; i++) 
      result[i] = this.render(array[i], parent, memo)
    return result;
  },
  
  /*
    Process single element. The ultimate goal is to create a widget to be used with the given
    element. But if the widget is not found, the element may still be used as a source of 
    microdata, or as an intermediate node in a complex mutation. It also handles cloning of nodes.
    
    If a method is invoked on an element directly, it postpones a processing and enters a `walk` 
    loop instead. The walk loop takes care about all the child node iteration and prepares the
    meta information to process an element in correct context of parents and siblings. Then it
    calls `element` method back with all the data in `memo`.
    
    An element then goes through a `match` routine, which iterates through things on the stack
    and matches selectors against a node. There are two results of this action:
      
    * A node may be mutated into a widget, if the mutation selector matches. A mutation provides
      options for the widget, to be initialized shortly after. If multiple mutations match, their
      options are merged together.
    * A node may advance complex mutation selectors. If a node is a `<li>` element, and there's a
      `li > a` selector on the stack, the match creates a new mutation `> a` to be used for 
      childnodes of the `<li>` element.
      
    If there was a succesful mutation a widget is created. Otherwise, function attempts to convert
    the node into widget (if the node is `<input type=text>` it will try to find `Input.Text` and 
    `Input` widgets). If there was no widget, but the layout is set to clone with `memo.clone`, 
    it clones the node.
    
    Then, it appends the result (widget or node) into a parent node.
  */
  
  element: function(element, parent, memo) {
    // Prepare options and run walker (once per element tree)
    if (!memo || !memo.walking) return this.walk(element, parent, memo);
    this.match(element, memo);
    var group, converted = element.uid && Element.retrieve(element, 'widget');
    var ascendant = parent[0] || parent, container = parent[1] || parent.toElement();
    // Create, clone or reuse a widget.
    if (!converted) {
      if (!memo.defaults) memo.defaults = this.getOptions(memo, parent);
      // Retrieve the widget type object that finds the appropriate classes for widgets
      if (!memo.type) memo.type = this.getType(memo, parent);
      if (memo.options) {
        // If there are options produced by the selector matching routine, it's a widget
        var widget = memo.type.create(element, memo.options);
      } else {
        // Otherwise, try converting the element (will turn <input type=date> into Input.Date)
        var widget = memo.type.convert(element, memo.defaults);
      }
    } else {
      var widget = memo.clone ? converted.cloneNode(false) : converted;
    }
    // Append widget into parent widget without moving elements
    if (widget) {
      this.appendChild(ascendant, widget, memo, function(container, child) {
        if (widget.origin == element && element.parentNode && element.parentNode == container) {
          element.parentNode.replaceChild(widget.element, element);
        } else if (!child.parentNode) return parent[1] || container;
        return false;
      });
    } else {
      if (memo.clone) var clone = element.cloneNode(false);
      this.appendChild(container, clone || element, memo);
    }
    return widget || clone || element;
  },
  
  /*
    Process child nodes of an element. Child node collection is actually an array,
    and should be given to the function as array. What makes `children` different from
    `array` is that it keeps track of sibling combinators like `~` and `+` and maintains
    the mutation stack, by collecting mutations and proxies from parent widget via `push` 
    & `pop`
  */
  
  children: function(children, parent, memo) {
    if (!memo) memo = {};
    if (!memo.type) memo.type = this.getType(memo, parent);
    var widget = (!parent[1] || parent[1] == parent[0].element);
    if (widget) this.push(parent, memo);
    for (var j = children.length - 1, child; j > -1 && (child = children[j]) && child.nodeType != 1; j--);
    var args = [null, parent, memo];
    for (var i = 0, child, previous, result = []; child = children[i]; i++) {
      /*
        Pick up selectors targetting on a node's next siblings
      */
      if (previous && i) {
        if ((group = previous.mutations['~'])) memo.stack.push(['~', group]);
        if ((group = previous.mutations['+'])) memo.stack.push(['+', group]);
      }
      memo.last = (i == j);
      memo.first = (i == 0);
      args[0] = child;
      /*
        If the child is element, walk it again and render it there, otherwise render it right away
      */
      if (child.nodeType == 1) {
        previous = this.walk.apply(this, args);
        if (!previous.lsd) previous = null;
      } else {
        this[LSD.Layout.NodeTypes[child.nodeType]].apply(this, args);
        previous = null;
      }
    }
    delete memo.last; delete memo.first;
    if (widget) this.pop(parent, memo)
    return children;
  },
  
  /*
    Process a single textnode. It may be cloned and/or interpolated. Interpolation is a process
    of finding variable expressions in text content. LSD uses `{hello}` syntax to embed variables
    in text. There are multiple ways of adding values for those variables in widgets - selectors,
    field values, microdata and custom dictionaries.
  */
  
  textnode: function(element, parent, memo) {
    if (memo && memo.clone) var clone = element.cloneNode(false);
    this.appendChild(parent, clone || element, memo);
    LSD.Interpolation.textnode(clone || element, parent[0] || parent);
    return clone || element;
  },
  
  /*
    Process a single comment node. LSD uses comments as boundaries of conditional blocks of HTML.
    A comment like `<!-- if hello -->` will make all contents after the comment definition on that
    level be displayed only if `hello` expression evaluates to true. Expressions are in fact
    interpolations that are bound to show or hide parts of layout.
  */
  
  comment: function(comment, parent, memo) {
    var keyword = Element.retrieve(comment, 'keyword');
    this.appendChild(parent, comment, memo);
    if (keyword) return keyword === true ? comment : keyword;
    else keyword = this.keyword(comment.nodeValue, parent, memo, comment);
    if (keyword) {
      Element.store(comment, 'keyword', keyword);
      if (keyword !== true) (memo.branches || (memo.branches = [])).push(keyword);
      return keyword;
    } else return comment;
  },
  
  /*
    Process a document fragment. The best way to build and process HTML DOM elements is to do
    all the things in memory first, and then inject the already-prepared element tree into the
    document. Fragments are used to create a virtual DOM tree from a HTML string via 
    document.createFragment(html). They are also useful, because they can operate on multiple nodes
    coming from a fragment. So there may be more than one root node parsed from HTML, but they
    are processed as a single fragment node.
  */
  
  fragment: function(element, parent, memo) {
    return this.children(LSD.slice(element.childNodes), parent, memo);
  },
  
  /*
    Creates a text node from a string and try to interpolate it.
  */
  
  string: function(string, parent, memo) {
    var element = parent[1] || parent.toElement();
    var textnode = element.ownerDocument.createTextNode(string);
    this.appendChild(element, textnode, memo);
    LSD.Interpolation.textnode(textnode, parent[0] || parent);
    return textnode;
  },
  
  /*
    Create from a javascript object layout template. 
  */
  
  object: function(object, parent, memo) {
    var result = {}, layout, branch;
    for (var selector in object) {
      layout = object[selector] === true || !object[selector] ? null : object[selector];
      if (!memo) memo = {};
      if ((branch = this.keyword(selector, parent, memo))) {
        (memo.branches || (memo.branches = [])).push(branch);
        branch.setLayout(layout, true);
        result[selector] = [branch, layout];
      } else {
        if (branch && memo && memo.branches && memo.branches[memo.branches.length - 1] == branch) {
          memo.branches.pop();
          branch = null;
        }
        var rendered = this.selector(selector, parent, memo);
        if (rendered.promise) {
          rendered.children = layout;
          result[selector] = [rendered, layout];
        } else {
          result[selector] = [rendered, !layout || this.render(layout, rendered.lsd ? rendered : [parent[0] || parent, rendered], null, memo)];
        }
      }
    }
    if (memo.predecessors) delete memo.predecessors;
    return result;
  },
  
  /*
    Builds a single node from a selector. It accepts raw selectors in form of strings
    and also options set. The result may be either element or widget.
    
    The method creates widget if:
    
      * If a tag name is not a standart HTML element tag name. A custom tag means widget.
      * A tag name and attributes combination matches a known widget class name 
        in current scope. e.g. `input[type=text][kind=colorful]` matches 
        `Input.Text.Colorful` class name. Only `type` and `kind` attribute have the 
        subclassing semantics.
      * Selector is given as parsed options object and `source` option is given. 
        It makes the method skip all tests and build the widget with that source.
        It often happens after element mutation and results in a source expression,
        which is basically another selector that has enough information about the 
        widget class to be used.
      
      If a tag name in selector has dashes which makes the method treat it like a `source`
      option described above. For example, `p-more[name=signin]` does not imply `p` tag,
      but `p-more` source which translates to P.More class name. If the actual class
      object is not found by that name, a widget is created without specific role. 
        
      If a `memo.lazy` flag is set, the node is not rendered immediately. Function
      returns a `Promise` object that keeps all options around. Those options later
      may be passed to this `selector` method again to be finally built. Promise object
      is compatible with Proxy options object and is used that way by an `object` layout
      method. Proxies set expectation of an element that was meant to be rendered and 
      lets other parts of layout to be rendered. While those parts are rendered,
      the elements being processed and matched against all promise expectations.
      That allows layout engine to reuse DOM nodes that happen to match the selector
      instead of building its own new DOM nodes. 
  */
  
  selector: function(string, parent, memo) {
    if (string.match) var options = LSD.Layout.parse(string, parent);
    else var options = string;
    if (!memo) memo = {};
    if (!memo.type) memo.type = this.getType(memo, parent);
    var source = options.source;
    if (source && source.match && !source.match(LSD.Layout.rSimpleSource)) {
      delete options.source;
      Object.merge(options, LSD.Layout.parse(source, parent));
    }
    if (options.allocation || options.source || (options.tag && (memo.type.find(options.tag) || !LSD.Layout.NodeNames[options.tag]))) {
      var allocation = options.allocation;
      // If a pseudo class is recognized as allocatable widget, 
      // it needs to retrieve the selectors that gives additional options
      if (allocation) {
        if (memo.lazy) {
          var allocated = (parent[0] || parent).preallocate(allocation);
          // The node is prematurely built, because allocation is not lazy
          if (allocated.nodeType) return allocated;
          if (!allocated.source) throw "Allocation of type " + allocation.type + " did not provide `source` selector to build nodes"
          memo.options = allocated;
          var selector = allocated.selector || allocated.source;
          if (options.order) selector += options.order;
          if (options.combinator) selector = options.order + selector;
          // Parse selector coming from allocation and pass the promise
          return this.selector(selector, parent, memo);
        } else {
          var widget = (parent[0] || parent).allocate(allocation.type, allocation.kind, allocation.options);
          if (widget.parentNode) {
            if (widget.lsd) parent = [widget.parentNode, (widget.element && widget.element.parentNode) || widget.parentNode.element]
            else parent = [parent[0] || parent, widget.parentNode];
          }
        }
      } else {  
        if (!memo.defaults) memo.defaults = this.getOptions(memo, parent);
        var opts = Object.append({}, memo.defaults, memo.options, options);
        if (memo.lazy) return new LSD.Layout.Promise(this, string, true, parent, opts, memo);
        if (options.combinator) {
          memo.combinator = options.combinator;
          delete options.combinator;
        }
        var widget = memo.type.create(opts);
      }
      if (widget.element && widget.element.childNodes.length) var nodes = LSD.slice(widget.element.childNodes);
      this.appendChild(parent, widget, memo, parent[1]);
      if (nodes && nodes.length) this.children(nodes, [widget, widget.element], memo);
    } else {  
      if (memo.options) {
        options = Object.merge(memo.options, options);
        delete memo.options;
      }
      if (options.combinator) {
        memo.combinator = options.combinator;
        delete options.combinator;
      }
      if (memo.lazy) return new LSD.Layout.Promise(this, string, false, parent, options, memo);
      var props = {}, tag = (!options.tag || options.tag == '*') ? 'div' : options.tag;
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
      if (options.classes) element.className = LSD.Object.prototype.join.call(options.classes, ' ');
      if (parent) this.appendChild(parent, element, memo);
      if (options.content) element.innerHTML = options.content;
    }
    return widget || element;
  },
  
  keyword: function(text, parent, memo, element) {
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
      return new LSD.Layout.Branch(options);
    } else {
      if (options.layout) {
        return this.render(options.layout);
      }
    }
  },
  
  /* 
    Remove rendered content from DOM. It only removes argument from DOM, keeping
    all of its contents untouched.
    
    The function accepts all kind of arguments, but it works best when paired with
    results of `render()`. This way the meta-constructs like conditions and loops
    will be preserved and gracefully removed.
  */
  remove: function(layout, parent, memo) {
    return this.set(layout, parent, memo, false)
  },

  /*
    Re-add once rendered content that was removed. When a `render`ed chunk of layout
    was removed, `add` is the function that will gracefully add it back. 
  */
  add: function(layout, parent, memo) {
    return this.set(layout, parent, memo, true)
  },

  set: function(layout, parent, memo, state) {
    switch (typeOf(layout)) {
      case "array": case "collection":
        for (var i = 0, j = layout.length, value; i < j; i++)
          if ((value = layout[i])) this.manipulate(state, parent, value, memo);
        break;
      case "object":
        for (var key in layout) {
          var value = layout[key];
          if (value && (value = value[0])) this.manipulate(state, parent, value, memo);
        }
        break;
      case "widget": case "string":  
        return this.manipulate(state, parent, layout);
    }
    return layout;
  },
  
  manipulate: function(state, parent, child, memo) {
    if (state) {
      this.appendChild(parent, child, memo);
    } else {
      this.removeChild(child.parentNode || parent, child, memo)
    }
    if (child.nodeType == 8) {
      var keyword = Element.retrieve(child, 'keyword');
      if (keyword && keyword !== true) keyword[state ? 'attach' : 'detach']();
    }
    return child;
  },
  
  /*
    Places a node in a parent node. The function appends node in the end of
    the parent node by default. Alternatively, a node given with `memo.before` 
    will be used as a place to insert before.
    
    `override` function may be used when a widget is inserted into another widget
    but DOM manipulation should be altered in some way. 
    
    A function may be given proxies stack with `memo.proxies`. The stack is then
    be iterated and proxies are matched against the child node. Upon a succesful
    match, a proxy function returns an object with values that may specify a new
    `parent`, `override` or `before` variables for manipulation.
  */
  
  appendChild: function(parents, child, memo, override) {
    if (parents.push) var widget = parents[0], element = parents[1];
    else if (parents.lsd) var widget = parents, element = widget.element || widget.toElement();
    else var element = parents;
    var parent = child.lsd ? widget : element, before;
    if (memo && memo.combinator) {
      var combinator = LSD.Layout.Combinators[memo.combinator];
      if (combinator) {
        var result = combinator(parent, child);
        if (result) {
          if (result.parent) parent = result.parent;
          if (result.before) before = result.before;
        }
      }
      delete memo.combinator;
    }
    if (memo && memo.proxies)
      proxy: for (var i = 0, group, proxies, close; group = memo.proxies[i++];) {
        proxies = group[1];
        close = element == group[0];
        for (var j = 0, proxy; proxy = proxies[j++];) {
          if (close || proxy.deep || proxy.element == element) {
            if (LSD.Module.Proxies.match(child, proxy, group[0])) {
              var result = LSD.Module.Proxies.invoke(parent, child, proxy, memo);
              if (result) {
                if (result.parent) parent = result.parent;
                if (result.override) override = result.override;
                if (result.before) before = result.before;
                break proxy
              } else if (result === false) return false;
            }
          }
        }
      }
    if (before || (memo && (before = memo.before))) {
      if (!parent.lsd) {
        if (before.lsd) before = before.toElement();
        parent = before.parentNode;
      };
      parent.insertBefore(child, before, override);
    } else {
      if (child.parentNode == parent) return;
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
  
  /* 
    Realize layout promises, reuse found elements and build 
    the ones that are missing
  */
  realize: function(layout, memo) {
    if (!memo) memo = {};
    if (layout.hasOwnProperty('length')) {
      for (var i = 0, j = layout.length, value; i < j; i++)
        if ((value = layout[i])) layout[i] = this.realize(value, memo);
    } else if (layout.nodeType) {
      return;
    } else if (!layout.promise) {
      for (var key in layout) {
        var row = layout[key];
        var value = row[0]
        var children = row[1];
        if (value) {
          if (value.promise) {
            row[0] = value.result || value.realize(memo);
            row[1] = children = value.advanced;
          }
          if (children && children !== true) this.realize(children, memo);
        }
      }
    } else {
      return layout.result || layout.realize(memo);
    }
  },
  
  /*
    Match all selectors in the stack and finds a right mutation
  */
  match: function(element, memo, soft) {
    var stack = memo.stack
    var options, advanced, tagName = LSD.toLowerCase(element.tagName);
    /* 
      Matching process happens twice. First time, it matches against 
      selectors on the stack with no regard to tag name (as `*`),
      and the other time it takes tag name into account
    */
    for (var i = stack.length, item, result, ary = ['*', tagName]; item = stack[--i];)
      for (var j = 0, value = item[1] || item, tag; tag = ary[j++];)
        if ((group = value[tag]))
          for (var k = 0, possibility, exp; possibility = group[k++];) {
            var exp = possibility[0], result = possibility[1];
            if ((!exp.classes && !exp.attributes && !exp.pseudos) 
              // Quickly match tag and id, if other things dont matter
              ? ((j == 0 || tagName == exp.tag) && (!exp.id || element.id == exp.id))
              // Or do a full match
              : (Slick.matchSelector(element, exp.tag, exp.id, exp.classes, exp.attributes, exp.pseudos)))
              /* 
                If selector matches, proceed and execute callback
                A callback may be a:
                
                * **string**, to be evaluated as a mutation selector
                  and parsed into options
                * **object**, with options for widget
                * **a function**, that may return a group of mutations
                  that should be applied to the following elements
                * **true**, to initialize widget on that element with 
                  no specific options.
                  
                An element may match more than one mutation. In 
                that case options extracted from parsing selectors
                will be merged together. 
                
                If callbacks produced options, the widget will 
                be initialized on that element with those options.
                
                `soft` parameter tells matcher to skip mutations
                and only advance selectors instead.
              */
              if (!result || !result.call || (result = result(element))) {
                if (!result) result = true;
                if (result.push) {
                  (advanced || (advanced = [])).push(result);
                } else if (!soft) {  
                  if (!options) options = this.getOptions(memo);
                  if (result !== true) 
                    options = LSD.reverseMerge(options, result.match ? LSD.Layout.parse(result) : result);
                }
              }
            }
    if (advanced) memo.advanced = advanced;      
    if (options) memo.options = options;
  },
  
  /*
    Collect mutations and proxies from the widget. When it is first called
    on a memo that doesnt have things collected from parent widgets,
    it attempts to walk up and restore the context. Restored mutation stack
    is limited to parents, so ~ and + combinators are not processed on parent
    nodes for speed. So only > and <space> combiantors will be collected. 
  */
  
  push: function(parent, memo) {
    var group, stack = memo.stack;
    if (stack) {
      var widget = parent[0] || parent;
      /* 
        Collect mutations from a widget
      */
      if ((group = widget.mutations[' '])) stack.push([' ', group]);
      if ((group = widget.mutations['>'])) stack.push(['>', group]);
      if (widget.proxies) (memo.proxies || (memo.proxies = [])).push([parent[1] || parent.element, widget.proxies]);
    } else {
      var element = parent[1] || parent.element;
      var stack = memo.stack = [], direct;
      for (var parents = [], node = element; node && node.nodeType == 1; node = node.parentNode) 
        parents.push(node);
      for (var i = parents.length, node, widget; node = parents[--i];) {
        this.match(node, memo, true);
        if (direct) {
          for (var j = 0, index; index = direct[j++];) stack.splice(index, 1);
          direct = null;
        }
        if (memo.advanced) {
          stack.push.apply(stack, memo.advanced);
          reduce: for (var j = stack.length; group = stack[--j];) {
            switch (group[0]) {
              case '+': case '~':
                stack.splice(j, 1);
                break;
              case '>':
                (direct || (direct = [])).push(j);
                break;
              default:
                break reduce;
            }
          }
          delete memo.advanced;
        }
        widget = node.uid && LSD.Module.DOM.find(node, true);
        if (widget) {
          if ((group = widget.mutations[' '])) stack.push([' ', group]);
          if (i == 0 && (group = widget.mutations['>'])) stack.push(['>', group]);
          if (widget.proxies) (memo.proxies || (memo.proxies = [])).push([node, widget.proxies]);
        }
      }
    }  
  },
  
  /*
    Remove proxies that were collected from given widget from 
    current stacks.
  */
  
  pop: function(parent, memo) {
    var group, widget = parent[0] || parent, stack = memo.stack;
    if (stack) {
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
    if (widget.proxies && memo.proxies) {
      for (var j = memo.proxies.length, group; group = memo.proxies[--j];)
        if (group[1] == widget.proxies) {
          memo.proxies.splice(j, 1);
          break;
        }
    }
  },
  
  walk: function(element, parent, memo) {
    var ascendant = parent[0] || parent;
    /*
      Retrieve the stack if the render was not triggered from the root of the layout
    */
    if (!memo) memo = {};
    memo.walking = true;
    var stack = memo.stack;
    if (!stack) {
      this.push(parent, memo);
      stack = memo.stack;
    }
    /* 
      Render the given element (may clone element or translate it to widget)
    */
    var children = LSD.slice(element.childNodes);
    var ret = this.element(element, parent, memo);
    if (ret.lsd) var widget = ret;
    else if (ret.branch) {
      (memo.branches || (memo.branches = [])).push(ret);
    } else if (memo.clone) var clone = ret;
    /* 
      Put away selectors in the stack that should not be matched against element's child nodes
    */
    var group, direct, following;
    reduce: for (var i = stack.length; group = stack[--i];) {
      switch (group[0]) {
        case '+':
          stack.pop();
          break;
        case '~':
          (following || (following = [])).push(stack.pop());
          break;
        case '>':
          (direct || (direct = [])).push(stack.pop());
          break;
        default:
          break reduce;
      }
    }
    /*
      Collect mutations that advanced with this element AND are looking for children
    */
    var advanced = memo.advanced;
    if (advanced) {
      map: for (var i = 0, group; group = advanced[i]; i++) {
        switch (group[0]) {
          case ' ': case '>':
            advanced.splice(i--, 1);
            stack.push(group);
            break;
          default:
            break map;
        }
      }
      delete memo.advanced;
    }
    delete memo.options;
    /* 
      Put away reversed insertion direction option, because it does not affect child nodes
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
      Iterate children
    */
    var first = memo.first, last = memo.last;
    if (children.length) this.children(children, newParent, memo);
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
      if (direct) for (var i = 0; group = direct[i++];) stack.push(group);
      if (following) for (var i = 0; group = following[i++];) stack.push(group);
    }
    /*
      Reduce the microdata path
    */
    if (scope) itempath.pop();
    /*
      Notify widget that children are processed
    */
    if (widget) widget.fireEvent('DOMChildNodesRendered')
    return ret;
  },
  
  getOptions: function(memo, parent) {
    return {
      lazy: true,
      context: memo.context || (parent && (parent[0] || parent).options.context) || LSD.Layout.context
    };
  },
  
  getType: function(memo, parent) {
    var context = memo.context || (parent && (parent[0] || parent).options.context) || LSD.Layout.context;
    return LSD[LSD.toClassName(context)];
  }
});

LSD.Layout.rSimpleSource = /^[a-z-_0-9]+$/;
/*
  Combinator methods are used in appendChild/removeChild manipulations.
  All of those (and more) are also implemented for matching in Slick. 
  
  When the layout is pattern matched, Slick first looks for nodes that
  satisfy selector expressions with combinator to reuse. But if it does
  not find those, LSD builds them there.
  
  Combinators preceeded with exclaimation mark, are Slick's invention.
  It logically inverts the meaning of combinator, so where a `+` means
  next node, `!+` means previous node.
*/
LSD.Layout.Combinators = {
  /*
    Insert a node next to the parent
  */
  '+': function(parent, child) {
    return {parent: parent.parentNode, before: parent.nextSibling};
  },
  /*
    Insert a node previous to the parent
  */
  '!+': function(parent, child) {
    return {parent: parent.parentNode, before: parent};
  },
  /*
    Insert node as a last node at parent's level
  */
  '~': function(parent, child) {
    return {parent: parent.parentNode};
  },
  /*
    Inwert node as a first node at parent's level
  */
  '!~': function(parent, child) {
    return {parent: parent.parentNode, before: parent.parentNode.firstChild};
  },
  /*
    Insert node as a first child
  */
  '^': function(parent, child) {
    return {before: parent.firstChild}
  }
};

/*
  ++ and ~~ combinators act as their + and ~ counterparts, but they also look
  back too. So `++` reads as `next child or previous child`. It makes sense
  for matching phase.
  
  Although, when a node is built, there's only one node that can not be inserted
  previously to the node and next to the same node simultaneously. So they insert
  ahead, just like `+` and `~`. 
*/
LSD.Layout.Combinators['++'] = LSD.Layout.Combinators['+'];
LSD.Layout.Combinators['~~'] = LSD.Layout.Combinators['~'];

/*
  When a lazy layout is set to render selector, it creates a promise object first.
  The promise object holds all variables required to really render the piece,
  but it postpones the rendering to future. The promise object is used as a proxy
  definition on widget, giving layout a chance to render other chunks of layout that
  are not lazy. When other chunks are rendered, they are matched against current
  proxies on a widget. And when there's a match, proxy (which is really a promise object)
  uses the matched node to and does not build a new one.
  
  Then, a `layout.realize()` call sets all promised objects to render if they didnt
  match any nodes built in other chunks of layout.
*/

LSD.Layout.Promise = function(layout, selector, lsd, parent, options, memo) {
  selector = selector.replace(LSD.Layout.Promise.rOrderCombinator, function(whole, match) {
    this.order = match;
    return "";
  }.bind(this))
  var parsed = Slick.parse(selector), expressions = parsed.expressions[0];
  // makes proxy deep - look into elements
  this.deep = true;
  this.layout = layout;
  this.options = options;
  this.promise = true;
  this.lsd = lsd;
  this[lsd ? 'selector' : 'mutation'] = selector;
  this.widget = parent[0] || parent;
  this.element = parent[1] || parent.element || parent.toElement();
  this.parent = parent;
  this.attach(memo);
};
LSD.Layout.Promise.rOrderCombinator = /\s*([+~])\s*$/;


LSD.Layout.Promise.prototype = {
  attach: function(memo) {
    this.memo = memo;
    if ((this.combinator = memo.combinator)) delete memo.combiantor;
    memo.promised = true;
    var predecessors = memo.predecessors
    if (predecessors) {
      this.predecessors = predecessors.slice(0);
      this.index = this.predecessors.length;
      // Look for previous promises that had + combinator and pair them with this promise
      for (var i = predecessors.length, predecessor; predecessor = predecessors[--i];) {
        if (predecessor.order == '+' && !predecessor.next) {
          this.previous = predecessor;
          this.previous.next = this;
          break;
        }
      }
    } else this.index = 0;
    if (this.order) {
      if (!predecessors) predecessors = memo.predecessors = [];
      predecessors.push(this);
    }
    // promise adds itself to the widget as proxy
    // so its properties are treated as proxy options.
    // `callback` method is called like if it was a proxy setting
    this.widget.addProxy('promise', this);
  },
  
  detach: function() {
    if (this.order) {
      var predecessors = this.memo && this.memo.predecessors;
      if (predecessors) 
        for (var i = predecessors.length, predecessor; predecessor = predecessors[--i];)
          if (predecessor == this) predecessors.splice(i, 1);
    }
    this.widget.removeProxy('promise', this)
  },
  
  advance: function(memo) {
    this.advanced = this.layout.render(this.children, this.result.lsd ? this.result : [this.widget, this.result], this.memo)
  },
  
  callback: function(child, proxy, memo) {
    proxy.realize(memo, child)
  },
  
  realize: function(memo, result) {
    this.detach();
    var stored = this.options.stored;
    if (stored) delete this.options.stored;
    if (!result) {
      if (this.previous && this.previous.result) this.before = this.previous.result.nextSibling;
      var before = this.before;
      if (before) {
        var old = memo.before;
        memo.before = before;
      }
      result = this.layout.selector(this.options, this.parent, memo);
      if (this.before) memo.before = old;
    }
    this.result = result;
    var predecessors = this.predecessors;
    if (predecessors)
      for (var i = predecessors.length, predecessor; predecessor = predecessors[--i];) {
        var before = predecessor.before;
        if ((predecessor.order == '+' && predecessor.next == this) || !predecessor.following || predecessor.following.index > this.index) {
          predecessor.before = result;
          predecessor.following = this;
        }
      }
    if (this.next) this.next.after = result;
    if (this.children) this.advance(memo);
    if (stored && result.store) {
      for (var name in stored) stored[name].call(this, result);
      result.store('allocation', stored);
      delete this.options.stored;
    }
  }
};

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
  setLayout: function(layout, soft) {
    this.layout = layout.push ? this.validate(layout) : layout;
    if (this.checked) {
      this.show();
    } else if (!soft) this.hide();
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
    if (expressions.length > 1) var order = expressions[expressions.length - 1].combinator;
    if (parsed.combinator != ' ') {
      if (parsed.combinator == '::') {
        if (LSD.Allocations[parsed.tag]) {
          var allocation = options.allocation = LSD.Module.Allocations.compile(parsed.tag, parsed.classes, parsed.attributes, parsed.pseudos);
          if (allocation.options && allocation.options.source) {
            var source = allocation.options.source;
            delete allocation.options.source
          }
        } else {
          var relation = (parent[0] || parent).relations[parsed.tag];
          if (!relation) throw "Unknown pseudo element ::" + parsed.tag;
          var source = relation.getSource();
        }  
        if (source && (!source.match || !source.match(rSIMPLE_SOURCE))) 
          Object.merge(options, LSD.Layout.parse(source, parent));
      } else options.combinator = parsed.combinator;
    }
    if (order && order != ' ') options.order = order;
    if (parsed.id) (options.attributes || (options.attributes = {})).id = parsed.id
    if (parsed.attributes) 
      for (var all = parsed.attributes, attribute, i = 0; attribute = all[i++];) {
        var value = attribute.value || LSD.Attributes[attribute.key] == 'number' || "";
        (options.attributes || (options.attributes = {}))[attribute.key] = value;
      }
    if (parsed.tag != '*' && parsed.combinator != '::')
      if (parsed.tag.indexOf('-') > -1) 
        options.source = parsed.tag.split('-');
      else {
        options.tag = parsed.tag;
        var source = LSD.Layout.getSource(options, options.tag);
        if (source.push) options.source = source;
      }
    if (parsed.classes) 
      for (var all = parsed.classes, pseudo, i = 0; klass = all[i++];) 
        (options.classes || (options.classes = {}))[klass.value] = true;
    if (parsed.pseudos) 
      for (var all = parsed.pseudos, pseudo, i = 0; pseudo = all[i++];) 
        (options.pseudos || (options.pseudos = {}))[pseudo.key] = true;
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