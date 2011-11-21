/*
---
 
script: Layout.js
 
description: A logic to render (and nest) widgets out of the key-value hash or dom tree
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - LSD.Helpers
  - LSD.Script/*
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
  this.family = 'layout';
  if (widget) if (!layout && !widget.lsd) {
    layout = widget;
    widget = null;
  } else if (!widget.lsd) widget = this.convert(widget);
  if (layout) this.render(layout, widget, memo);
};

LSD.Layout.prototype = Object.append({
  $family: Function.from('layout'),
  
  render: function(layout, parent, memo) {
    if (layout.getLayout) layout = layout.getLayout();
    var elements = (layout.push && layout[0]) ? (!!layout[0].nodeType) : memo && memo.elements;
    if (layout.call && layout.apply) layout = layout.call(this, parent, memo);
    var type = layout.charAt ? (elements ? 'string' : 'selector') : 
               Type.isEnumerable(layout) ? ((layout.push && !elements) ? 'array' : 'children') :
               layout.nodeType ? LSD.Layout.NodeTypes[layout.nodeType] : 'object';
    var result = this[type](layout, parent, memo);
    if (!this.result) this.result = result;
    return result;
  },
  
  // type handlers
  
  array: function(array, parent, memo) {
    for (var i = 0, result = [], length = array.length; i < length; i++) {
      if (!memo) memo = {};
      result[i] = this.render(array[i], parent, memo)
    }
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
      
    If there is a succesful mutation match, a widget is created. Otherwise, function attempts to convert
    the node into widget (if the node is `<input type=text>` it will try to find `Input.Text` and 
    `Input` widgets). If there was no widget, but the layout is set to clone with `memo.clone`, 
    it clones the node.
    
    Then, it appends the result (widget or node) into a parent node.
  */
  
  element: function(element, parent, memo) {
    /*
      Prepare options and run walker (once per element tree)
    */
    if (!memo || !memo.walking) return this.walk(element, parent, memo);
    /*
      Match element against current stack of mutations to retrieve widget options
    */
    this.match(element, parent, memo);
    var group, converted = element.uid && Element.retrieve(element, 'widget');
    var ascendant = parent[0] || parent, container = parent[1] || parent.toElement();
    /* 
      Create, clone or reuse a widget.
    */
    if (!memo.defaults) memo.defaults = this.getOptions(memo, parent);
    if (memo.options) LSD.reverseMerge(memo.options, memo.defaults)
    if (!converted) {
      /* 
        Retrieve the widget type object that finds the appropriate classes for widgets
      */
      if (!memo.type) memo.type = this.getType(memo, parent);
      if (memo.options) {
        /*
          If there are options produced by the selector matching routine, it's a widget
        */
        var widget = memo.type.create(element, memo.options);
      } else {
        /* 
          Otherwise, try converting the element (will turn <input type=date> into Input.Date)
        */
        var widget = memo.type.convert(element, memo.defaults);
      }
      if (memo.clone && widget) widget.options.clone = memo.clone;
    } else {
      /*
        Reuse widget or create a a shallow copy of it
      */
      var widget = memo.clone ? converted.cloneNode(false, memo.defaults) : converted;
    }
    if (!widget && memo.clone) var clone = element.cloneNode(false);
    /*
      Find interpolations in element attributes and compile them
    */
    var scope = (memo.scopes && memo.scopes[memo.scopes.length - 1]) || widget || parent[0];
    LSD.Script.Interpolation((clone || element).attributes, scope, clone || element);
    /*
      Append a node to parent and notify the ancestors
    */
    if ((!converted || !widget.parentNode) || (memo && memo.clone))
      this.appendChild([ascendant, container], widget || clone || element, memo);
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
    children = LSD.slice(children);
    if (!memo.type) memo.type = this.getType(memo, parent);
    var ascendant = parent[0] || parent;
    if (memo.parent != ascendant) {
      memo.parent = ascendant;
      var pushed = true;
      this.push(parent, memo);
    }
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
        children[i] = previous = this.walk.apply(this, args);
        if (!previous.lsd) previous = null;
      } else {
        var result = this[child.nodeType ? LSD.Layout.NodeTypes[child.nodeType] : 'render'].apply(this, args);
        if (result != child && result !== true && result && !result.block) {
          if (result.push) {
            result.unshift(i, 1);
            children.splice.apply(children, result);
            i += result.length - 3; // 2 arguments added, 1 was already there
          } else {
            children[i] = result.lsd ? result.element : result;
          }
        }
        previous = null;
      }
    }
    delete memo.last; delete memo.first; 
    if (pushed) {
      this.pop(parent, memo);
      delete memo.parent;
    }
    return children;
  },
  
  /*
    Process a single textnode. It may be cloned and/or interpolated. Interpolation is a process
    of finding variable expressions in text content. LSD uses `{hello}` syntax to embed variables
    in text. There are multiple ways of adding values for those variables in widgets - selectors,
    field values, microdata and custom dictionaries.
  */
  
  textnode: function(element, parent, memo) {
    if (memo && memo.clone) {
      var interpolation = element.uid && Element.retrieve(element, 'interpolation');
      var clone = interpolation 
        ? element.ownerDocument.createTextNode(interpolation.placeholder)
        : element.cloneNode(false);
    }
    this.appendChild(parent, clone || element, memo);
    var scope = (memo && memo.scopes && memo.scopes[memo.scopes.length - 1]) || parent[0] || parent;
    LSD.Script.Interpolation(clone || element, scope);
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
    if (memo && memo.clone)
      var clone = comment.ownerDocument.createComment(comment.nodeValue);
    this.appendChild(parent, clone || comment, memo);
    keyword = this.keyword(comment.nodeValue, parent, memo, clone || comment, keyword);
    if (keyword) {
      if (keyword !== true) {
        (memo.blocks || (memo.blocks = [])).push(keyword);  
      } 
      Element.store(clone || comment, 'keyword', keyword);
      return keyword;
    };
    return clone || comment;
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
    return this.children(element.childNodes, parent, memo);
  },
  
  /*
    Create a text node from a string and try to interpolate it.
  */
  
  string: function(string, parent, memo) {
    if (memo && memo.lazy) {
      var regexp = LSD.Layout.regexpify(string);
      if (regexp) return new LSD.Layout.Promise.Textnode(this, regexp, parent, memo);
    }
    var element = parent[1] || parent.toElement();
    var textnode = element.ownerDocument.createTextNode(string);
    this.appendChild(parent, textnode, memo);
    var scope = (memo && memo.scopes && memo.scopes[memo.scopes.length - 1]) || parent[0] || parent
    LSD.Script.Interpolation(textnode, scope);
    return textnode;
  },
  
  /*
    Create a layout from a javascript object layout template. 
  */
  
  object: function(object, parent, memo) {
    var result = {}, layout, block;
    for (var selector in object) {
      layout = object[selector] === true || !object[selector] ? null : object[selector];
      if (!memo) memo = {};
      if ((block = this.keyword(selector, parent, memo))) {
        (memo.blocks || (memo.blocks = [])).push(block);
        block.setLayout(layout, true);
        result[selector] = [block, layout];
      } else {
        if (block && memo && memo.blocks && memo.blocks[memo.blocks.length - 1] == block) {
          memo.blocks.pop();
          block = null;
        }
        var rendered = this.selector(selector, parent, memo);
        var combinator = memo.combinator;
        if (combinator) delete memo.combinator;
        if (rendered.promise) {
          rendered.children = layout;
          result[selector] = [rendered, layout, combinator];
        } else {
          result[selector] = [rendered, !layout || this.render(layout, rendered.lsd ? rendered : [parent[0] || parent, rendered], memo), combinator];
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
        It make method skip all tests and build the widget with that source.
        It usually happens after element mutation and results in a source expression,
        which is basically another selector that has more information about the 
        widget class to be used.
      
      If a tag name in selector has dashes which makes the method treat it like a `source`
      option described above. For example, `p-more[name=signin]` does not imply `p` tag,
      but `p-more` source which translates to `P.More` class name. If the actual class
      object is not found by that name, a widget is created without specific role. 
        
      If a `memo.lazy` flag is set, the node is not rendered immediately. Function
      returns a `Promise` object that keeps all options around. Those options later
      may be passed to this `selector` method again to be finally built. Promise object
      is compatible with Proxy options object and is used that way by an `object` layout
      method. Proxies set expectation of an element that was meant to be rendered and 
      lets other parts of layout to be rendered. While those parts are rendered,
      the elements being processed and matched against all selectors that were promised.
      That allows layout engine to reuse DOM nodes that happen to match the selector
      instead of building its own new DOM nodes. 
  */
  
  selector: function(string, parent, memo) {
    if (string.match) var options = LSD.Module.Selectors.parse(string, parent);
    else var options = string;
    if (!memo) memo = {};
    if (!memo.type) memo.type = this.getType(memo, parent);
    var source = options.source;
    if (source && source.match && !source.match(LSD.Layout.rSource)) {
      delete options.source;
      Object.merge(options, LSD.Module.Selectors.parse(source, parent));
    }
    if (options.allocation || options.source || (options.tag && (memo.type.find(options.tag) || !LSD.Layout.NodeNames[options.tag]))) {
      var allocation = options.allocation;
      /* 
        If a pseudo class is recognized as allocatable widget, 
        it needs to retrieve the selectors that gives additional options
      */
      if (allocation) {
        if (memo.lazy) {
          var allocated = (parent[0] || parent).preallocate(allocation);
          /* 
            The node is prematurely built, because allocation is not lazy
          */
          if (allocated.nodeType) return allocated;
          if (!allocated.source) throw "Allocation of type " + allocation.type + " did not provide `source` selector to build nodes"
          allocated.options = memo.options = Object.merge(allocated.options || {}, options);
          delete allocated.options.allocation;
          allocated.options.stored = allocated.stored;
          var selector = allocated.selector || allocated.source;
          if (options.order) selector += options.order;
          if (options.combinator) selector = options.order + selector;
          /*
            Parse selector coming from allocation and make a promise
          */
          return this.selector(selector, parent, memo);
        } else {
          var widget = (parent[0] || parent).allocate(allocation);
          if (widget.parentNode) {
            if (widget.lsd) parent = [widget.parentNode, (widget.element && widget.element.parentNode) || widget.parentNode.element]
            else parent = [parent[0] || parent, widget.parentNode];
          }
        }
      } else {  
        if (!memo.defaults) memo.defaults = this.getOptions(memo, parent);
        var opts = Object.merge({}, memo.defaults, memo.options, options);
        if (options.combinator) {
          memo.combinator = options.combinator;
          delete options.combinator;
        }
        if (memo.lazy) return new LSD.Layout.Promise(this, string, true, parent, opts, memo);
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
      var tag = (!options.tag || options.tag == '*') ? 'div' : options.tag;
      var element = document.createElement(tag);
      var attributes = options.attributes;
      if (attributes) for (var name in attributes) element.setAttribute(name, attributes[name]);
      if (options.classes) element.className = LSD.Object.prototype.join.call(options.classes, ' ');
      if (parent) this.appendChild(parent, element, memo);
      if (options.content) element.innerHTML = options.content;
    }
    return widget || element;
  },
  
  keyword: function(text, parent, memo, element, origin) {
    var parsed = LSD.Layout.extractKeyword(text);
    if (!parsed) return;
    var keyword = LSD.Layout.Keyword[parsed.keyword];
    if (!keyword) return;
    var options = keyword(parsed.expression);
    if (options.ends || options.link) {
      if (!(options.superBlock = (memo.blocks && memo.blocks.pop()))) 
        throw "Alternative block is missing its original block";
      memo.scopes.pop();
      var node = options.superBlock.options.origin;
      if (node) {
        for (var layout = []; (node = node.nextSibling) != element;) layout.push(node);
        options.superBlock.options.before = element;
        if (layout.length > 0 && !options.superBlock.layout) 
          options.superBlock.setLayout(layout, options.superBlock.checked || options.superBlock.layout);
      }
      if (options.ends) return true;
    } 
    if (origin && origin.block || options.block) {
      options.keyword = parsed.keyword;
      if (memo.scopes)
        for (var i = memo.scopes.length, scope; scope = memo.scopes[--i];) {
          if (!options.scope) options.scope = scope
          if (scope.block) {
            options.parent = scope;
            break;
          }
        }
      options.widget = parent[0] || parent;
      options.element = parent[1] || parent.toElement();
      options.origin = element;
    }
    var block;
    if (origin) {
      options.walking = true;
      if (memo && memo.clone)
        block = origin.clone(parent, options);
      else
        block = origin;
    } else if (options.block) {
      block = new LSD.Layout.Block(options);
    } else if (options.layout) {
      block = this.render(options.layout);
    }
    if (block) {
      (memo.scopes || (memo.scopes = [])).push(block);
      return block;
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
    Add piece of layout into DOM. It also ensures that both parent and layout
    nodes are notified about insertion. 
  */
  add: function(layout, parent, memo) {
    return this.set(layout, parent, memo, true)
  },

  set: function(layout, parent, memo, state) {
    if (!memo) memo = {};
    if (layout.nodeType) {
      return this.manipulate(state, parent, layout);
    } else if (Type.isEnumerable(layout)) {
      if (layout[0] && !layout[0].lsd) layout = LSD.slice(layout);
      for (var i = 0, j = layout.length, value; i < j; i++)
        if ((value = layout[i])) this.manipulate(state, parent, value, memo);
    } else {
      for (var key in layout) {
        var value = layout[key], element;
        if (value && (element = value[0])) {
          var combinator = value[2];
          if (combinator) memo.combinator = combinator;
          this.manipulate(state, parent, element, memo);
          if (combinator) delete memo.combinator;
        }
      }
    }
    return layout;
  },
  
  manipulate: function(state, parent, child, memo) {
    if (child.nodeType == 1 && !child.lsd && child.uid) 
      child = Element.retrieve(child, 'widget') || child;
    if (state) {
      this.appendChild(parent, child, memo);
    } else {
      var node = child.parentNode;
      if (node) {
        var parents = [].concat(parent);
        parents[+!child.lsd] = node;
      }
      this.removeChild(parents || parent, child, memo)
    }
    return child;
  },
  
  /*
    Places a node in a parent node. The function appends node in the end of
    the parent node by default. Alternatively, a node given with `memo.before` 
    will be used as a place to insert before.
    
    A stack of proxies is retrieved from the widget. The stack is then
    be iterated and proxies are matched against the child node. Upon a succesful
    match, a proxy function returns an object with values that may specify a new
    `parent`, `override` or `before` variables for manipulation.
  */
  
  appendChild: function(parents, child, memo) {
    if (parents.push) var widget = parents[0], element = parents[1];
    else if (parents.lsd) var widget = parents, element = widget.element || widget.toElement();
    else var element = parents;
    if (child.lsd) {
      var parent = widget;
      if (!child.document && widget.document) child.document = child.ownerDocument = widget.document;
    } else var parent = element;
    var before;
    if (memo) {
      if (memo && memo.combinator) {
        var combinator = LSD.Layout.Combinators[memo.combinator];
        if (combinator) {
          var result = combinator(parent, child);
          if (result) {
            if (result.parent) {
              if (child.lsd) widget = result.parent;
              else element = result.parent;
            }
            if (result.before) before = result.before;
          }
        }
      }
      if (memo.bypass) {
        var bypass = memo.bypass;
        delete memo.bypass;
      }
      if (!before && memo.before) before = memo.before;
      if (memo.scopes && memo.scopes.length && child.lsd) {
        var layoutScope = child.layoutScope;
        child.layoutScope = memo.scopes && memo.scopes[memo.scopes.length - 1]
        child.properties.set('scope', child.layoutScope);
        if (layoutScope) child.properties.unset('scope', layoutScope);
      }
    }
    if (!child.lsd && child.parentNode != element) var added = true;
    if (before) {
      if (before !== true) {
        if (!parent.lsd) {
          if (before.lsd) before = before.toElement();
          parent = before.parentNode;
        };
        widget.insertBefore(child, before, null, bypass);
      }
    } else {
      widget.appendChild(child, element, bypass);
    }
    if ((!memo || !memo.walking) && added && (child.nodeType == 8 || child.nodeType == 1)) {
      this.notify(child, widget, true, memo);
    }
    return true;
  },
  
  removeChild: function(parents, child, memo) {
    if (parents.push) var widget = parents[0], element = parents[1];
    else if (parents.lsd) var widget = parents, element = widget.element || widget.toElement();
    else var element = parents;
    var parent = child.lsd ? widget : element;
    if (child.parentNode != parent) return;
    var element = child.lsd ? child.toElement() : child;
    if (!child.lsd && child.parentNode) var removed = true;
    if (removed && (child.nodeType == 8 || child.nodeType == 1)) 
      this.notify(child, widget, false, memo);
    widget.removeChild(child, element);
    return true;
  },
  
  notify: function(element, widget, state, memo) {
    var lsd = widget.element == element, parentscope;
    for (var stack, node = element; node; node = stack && stack.pop()) {
      if (node != element) {
        var next = node.nextSibling;
        if (next) (stack || (stack = [])).push(next);
      }
      switch (node.nodeType) {
        /*
          When a comment node is added or removed, it should be checked
          if it was previously recognized as a conditional layout block 
          and do the same action to it
        */
        case 8:
          if (!memo || memo.plain !== true) {
            var keyword = Element.retrieve(node, 'keyword');
            if (!superBlock) 
              var superBlock = memo && memo.blocks && memo.blocks[memo.blocks.length - 1];
            if (keyword && keyword !== true && (keyword.parentNode == widget || keyword.parentNode == superBlock || node == element))
              if (state ^ !!keyword.parentScope)
                keyword[state ? 'attach' : 'detach']();
          }
          break;
        /*
          When removed child is an element, it needs to be scanned
          for widgets and microdata to detach them cleanly
        */
        case 1:
          if (node.uid) {
            var itemprop = node.getAttribute('itemprop');
            if (itemprop) {
              //if (!parentscope) parentscope = LSD.Microdata.getScope(node);
              var scope = LSD.Microdata[state ? 'extract' : 'unload'](node, widget, true, itemprop);
              if (!state && scope && parent === true) parent = scope;
            }
            if (node != element) {
              var instance = Element.retrieve(node, 'widget');
              if (instance && (state ? !instance.parentNode : instance.parentNode == widget))
                widget[state ? 'appendChild' : 'removeChild'](instance, false);
            }
          };
          var first = node.firstChild;
          if (first) (stack || (stack = [])).push(first);
      }
    }
  },
  
  /* 
    Realize layout promises, reuse found elements and build 
    the ones that are missing
  */
  realize: function(layout) {
    if ((layout.indexOf && layout.match) || layout.nodeType) {
      return layout;
    } else if (Type.isEnumerable(layout)) {
      for (var i = 0, j = layout.length, value; i < j; i++)
        if ((value = layout[i])) layout[i] = this.realize(value);
    } else if (!layout.promise) {
      for (var key in layout) {
        var row = layout[key];
        var value = row[0]
        var children = row[1];
        if (value) {
          if (value.promise) {
            row[0] = value.result || value.realize();
            row[1] = children = value.advanced;
          }
          if (children && children !== true) this.realize(children);
        }
      }
      return layout;
    } else {
      return layout.result || layout.realize();
    }
  },
  
  /*
    Match all selectors in the stack and find the right mutation
  */
  match: function(element, parent, memo, soft) {
    var stack = memo.stack
    var options, advanced, tagName = LSD.toLowerCase(element.tagName);
    /* 
      Matching process happens twice. First time, it matches against 
      selectors on the stack with no regard to tag name (as `*`),
      and the other time it takes tag name into account
    */
    for (var i = stack.length, item, result, ary = ['*', tagName]; (item = stack[--i]) || (item === null);)
      if (item != null)
        for (var j = 0, value = item[1] || item, tag; tag = ary[j++];)
          if ((group = value[tag]))
            for (var k = 0, possibility, exp; possibility = group[k++];) {
              var exp = possibility[0], result = possibility[1];
              if ((!exp.classes && !exp.attributes && !exp.pseudos) 
                /* 
                  Quickly match tag and id, if other things dont matter
                */
                ? ((j == 0 || tagName == exp.tag) && (!exp.id || element.id == exp.id))
                /* 
                  Or do a full match
                */
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
                if (!result || !result.call || (result = result(element, parent[0] || parent))) {
                  if (!result) result = true;
                  if (result.push) {
                    (advanced || (advanced = [])).push(result);
                  } else if (!soft) {  
                    if (!options) options = this.getOptions(memo, parent);
                    if (result !== true) 
                      options = LSD.reverseMerge(options, result.match ? LSD.Module.Selectors.parse(result) : result);
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
        this.match(node, parent, memo, true);
        if (direct) {
          for (var j = 0, index; (index = direct[j++]) != null;) stack.splice(index, 1);
          direct.length = 0;
        }
        widget = node.uid && LSD.Module.DOM.find(node, true);
        if (widget) {
          if ((group = widget.mutations[' '])) stack.push([' ', group]);
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
        if (widget && (group = widget.mutations['>'])) 
          (direct || (direct = [])).push(stack.push(['>', group]) - 1);
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
        for (var j = stack.length, item; item = stack[--j];)
          if (item && item[1] == group) {
            stack.splice(j, 1)
            break;
          }
      if ((group = widget.mutations['>'])) 
        for (var j = stack.length, item; item = stack[--j];)
          if (item && item[1] == group) {
            stack.splice(j, 1)
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
    memo.walking = element;
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
    if (ret.lsd) {
      var widget = ret;
      (memo.scopes || (memo.scopes = [])).push(widget);
    } else if (ret.block) {
      (memo.blocks || (memo.blocks = [])).push(ret);
    } else if (memo.clone) {
      var clone = ret;
    }
    /* 
      Put away selectors in the stack that should not be matched against element's child nodes
    */
    var group, direct, following;
    for (var i = stack.length; group = stack[--i];) {
      switch (group[0]) {
        case '+':
          stack.splice(i, 1);
          break;
        case '~':
          (following || (following = [])).push(stack.splice(i, 1)[0]);
          break;
        case '>':
          (direct || (direct = [])).push(stack.splice(i, 1)[0]);
          break;
      }
    }
    /*
      Add a NULL boundary to make loops not walk stack too high
    */
    var boundary = stack.push(null) - 1;
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
    var itemprop = element.getAttribute('itemprop');
    if (itemprop) {
      if (!memo.itempath) {
        var path = LSD.Microdata.getScope(element)
        if (path) memo.itempath = [path];
      }
      var itempath = memo.itempath;
      var itemscope = LSD.Microdata.extract(element, widget || ascendant, itempath && itempath[itempath.length - 1], itemprop);
      if (itemscope) (itempath || (itempath = memo.itempath = [])).push(itemscope);
      if (widget && itempath) widget.itempath = itempath;
    }
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
    if (itemscope) itempath.pop();
    /*
      Notify widget that children are processed
    */
    if (widget) memo.scopes.pop();
    stack.splice(boundary, 1);
    if (widget) widget.fireEvent('DOMChildNodesRendered');
    return ret;
  },
  
  getOptions: function(memo, parent) {
    return {
      lazy: true,
      context: this.getContext(memo, parent)
    };
  },
  
  getType: function(memo, parent) {
    var context = this.getContext(memo, parent);
    if (typeof context == 'string') return LSD[LSD.toClassName(context)];
    return context;
  },
  
  getContext: function(memo, parent) {
    return memo.context || (parent && (parent[0] || parent).options.context) || (this.document && this.document.options.context)
  }
});
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
    Insert node as a first node at parent's level
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

// Check if a string is a simple source declaration, e.g. `grid-list-item`
LSD.Layout.rSource = /^[a-z-_0-9]+$/;

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

Object.append(LSD.Layout, {
  extractKeyword: function(input) {
    var match = input.match(LSD.Layout.rKeywordExpression);
    if (match && LSD.Layout.Keyword[match[1]])
      return {keyword: match[1], expression: match[2]};
  },
  
  getSource: function(options, tagName) {
    var tag = options.tagName;
    if (options && tag && !options.lsd) {
      var source = LSD.toLowerCase(tag);
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
  },
  
  regexpify: function(string) {
    var names;
    var source = string.replace(LSD.Script.Interpolation.rBoundaries, function(m, name) {
      if (!names) names = [];
      names.push(name);
      return '\\s*(.*?)\\s*'
    });
    if (names) {
      var regexp = new RegExp("^" + source + "$", 'mi');
      regexp.string = string;
      regexp._names = names;
      return regexp;
    }
  }
});

// Check if a string is an expression prepended with keyword, e.g. `if true`
LSD.Layout.rKeywordExpression = /^\s*([a-z]+)(?:\s(.*?))?\s*$/;

// List of special keywords in expressions to create a layout block
LSD.Layout.Keyword = {
  'if': function(expression) {
    return {block: true, expression: expression};
  },
  'unless': function(expression) {
    return {block: true, expression: expression, invert: true};
  },
  'elsif': function(expression) {
    return {block: true, expression: expression, link: true};
  },
  'else': function() {
    return {block: true, link: true};
  },
  'build': function(expression) {
    var options = {layout: {}};
    options.layout[parsed.expression] = true;
    return options;
  },
  'template': function(expression) {
    return {block: true, name: expression, clean: true}
  },
  'end': function(expression) {
    return {ends: true}
  },
  'for': function(expression) {
    return {block: true, collection: true, expression: expression}
  },
  'each': function(expression) {
    return {block: true, collection: true, expression: expression}
  }
};
