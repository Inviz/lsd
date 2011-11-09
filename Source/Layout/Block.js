/*
---
 
script: Block.js
 
description: A conditional piece of layout
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Layout
  - LSD.Module.DOM
  - LSD.Script/LSD.Script.Scope

provides: 
  - LSD.Layout.Block
 
...
*/

/*
  A block is a part of layout that is rendered on condition.
  
  When layout is defined with selector object, a key in that 
  may contain an expression with a keyword that makes a block.
  
    {
      '.div.wrapper': {
        'if form::elements:invalid': {
          'p.alert': 'Form is not valid!'
        }
      }
    }
  
  In example above, `if` keyword is given `form::elements:invalid` 
  expression. Expression is then parsed and executed. If
  it returns truthy, the layout is rendered. LSD uses LSD.Script,
  a simple language that asynchronously evaluates expressions
  and updates layout as the values change in real time.
  
  If a condition was truthy and layout was rendered, the expression
  later may update value and make block no longer meet the condition.
  A rendered layout then gets removed from DOM, and later may be 
  inserted back without re-rendering.
  
  When layout is defined in HTML, it uses conditional comments to
  mark blocks of HTML to be displayed on condition. 
  
    <article itemscope itemprop="person">
      <h1 itemprop="name">Bob Marley</h1>
      <!-- if person.name == 'Bob Marley' -->
        <p> Hey there bob, long time no see! </P>
      <!-- else -->
        <p> Oh, you... {person.name}</p>
      <!-- end -->
    </article>
    
  A block gets removed from DOM if a condition doesnt match initially.
  A block may have its HTML block wrapped into its own comment making
  the layout rendering lazy. The comment element containing the lazy
  HTML will then be replaced with its rendered contents.
  
*/


LSD.Layout.Block = function(options) {
  this.options = options;
  this.id = ++LSD.Layout.Block.UID;
  this.$events = Object.clone(this.$events);
  this.element = options.element;
  this.widget = options.widget;
  this.expression = options.expression;
  this.parentBlock = options.parent;
  this.superBlock = options.superBlock;
  if (options.scope && options.scope != this.parentBlock) this.scope = options.scope
  LSD.Script.Scope(this);
  if (this.superBlock) {
    this.superBlock.addEvents({
      check: this.unmatch.bind(this),
      unmatch: this.unmatch.bind(this),
      miss: this.rematch.bind(this),
      detach: this.detach.bind(this),
      uncheck: this.rematch.bind(this)
    });
    if (this.permit()) this.attach();
  } else {
    if (this.parentBlock) {
      this.parentBlock.addEvents({
        uncheck: this.detach.bind(this),
        check: this.rematch.bind(this)
      });
    }
    if (options.collection) this.values = [];
    if (options.name) LSD.Template[options.name] = this;
    else this.attach();
  }
  if (options.layout) this.setLayout(options.layout, true);
};
LSD.Layout.Block.UID = 0;
LSD.Template = {};

LSD.Layout.Block.prototype = Object.append({
  block: true,
  nodeType: 11,
  
  permit: function() {
    for (var block = this; block = block.options.superBlock;)
      if (block.checked) return false;
    return true;
  },

  getVariable: function() {
    if (typeof this.variable == 'undefined') {
      if (this.options.collection) {
        this.expression = this.expression.replace(LSD.Layout.Block.rLoopAlias, function(m, name) {
          this.arguments = [name];
          return '';
        }.bind(this));
      }
      this.variable = LSD.Script.compile(this.expression, this, this, true);
    }
    return this.variable;
  },

  match: function() {
    if (this.permit() && (!this.options.expression || this.evaluate(true)))
      return this.check();
  },

  rematch: function() {
    if (!this.checked)
      return (this.parentScope ? this.match() : this.attach()) || this.fireEvent('miss');
  },

  unmatch: function(lazy) {
    if (!this.options.expression || this.evaluate(false))
      return this.uncheck(lazy);
    return this.fireEvent('unmatch');
  },

  check: function(lazy) {
    if (!this.checked) {
      this.checked = true;
      this.show();
      if (!lazy) this.fireEvent('check', arguments);
      return true;
    }
  },

  uncheck: function(lazy) {
    if (this.checked || this.checked == null) {
      this.checked = false;
      this.hide();
      if (!lazy) this.fireEvent('uncheck', arguments);
      return true;
    }  
  },

  attach: function() {
    if (!this.parentScope) {
      var widget = this.widget;
      var scope = this.scope || this.parentBlock;
      if (scope && widget)
        for (var parent = scope.nodeType ? scope.element : scope.options.origin; parent; parent = parent.parentNode)
          if (parent === widget.element) {
            var found = true;
            break;
          }
      LSD.Script.Scope.setScope(this, found ? scope : widget);
    }
    this.fireEvent('attach');
    return this.match();
  },

  detach: function() {
    if (this.parentScope)
      LSD.Script.Scope.unsetScope(this, this.parentScope);
    this.unmatch(true);
    this.fireEvent('detach');
  },

  evaluate: function(state) {
    var variable = this.getVariable();
    var value = variable.attach ? variable[state ? 'attach' : 'detach']().value : variable;
    if (this.value !== value) this.set(value);
    return this.validate();
  },

  validate: function(strict) {
    return ((strict ? this.value !== false : this.value != false) && this.value != null) ^ this.options.invert;
  },

  add: function(value) {
    return this.render.apply(this, arguments);
  },

  remove: function(value) {
    
  },

  set: function(value) {
    this.value = value;
    if (this.options.collection) {
      if (Type.isEnumerable(value)) {
        for (var i = 0, j = value.length; i < j; i++) {
          var context = this.add(value[i], {before: this.options.before});
        }
      } else {
        
      }
    } else {
      this[this.validate() ? 'check' : 'uncheck']();
    }
  },

  show: function(lazy) {
    var layout = this.layout;
    if (!layout) return;
    this.hidden = false;
    var collapsed = this.collapse(layout, true);
    if (Type.isEnumerable(layout)) {
      for (var i = 0, child; child = layout[i++];) {
        if (child.parentNode && child.parentNode.nodeType == 11) {
          lazy = false;
          break;
        }
      }
    }
    if (!lazy && !this.next) {
      var before = this.options.before;
      if (before && before.parentNode != this.element) before = null;
      if (!before && !this.options.name && this.options.origin) {
        for (var block = this; block; block = block.options.superBlock) {
          before = block.options.origin && block.options.origin.nextSibling;
          if (before) break;
        }
      }
    }
    var memo = { 
      before: before || this.next, 
      options: this.options.options, 
      plain: (lazy === true), 
      clone: !!this.options.original && !this.options.original.checked,
      scopes: [this],
      blocks: [this]
    };
    this.rendered = this.widget.addLayout(this.id, collapsed || layout, [this.widget, this.element], memo);
    if (collapsed) {
      this.rendered = this.collapse(this.rendered) || this.rendered;
    }
  },

  hide: function() {
    var layout = this.rendered || this.layout;
    if (!layout) return;
    this.widget.removeLayout(this.id, layout, null, {blocks: [this]});
    this.hidden = true;
  },

  render: function(args, options, widget) {
    if (args != null && !args.push) args = [args]; 
    if (!this.options.original) {
      var block = this.clone(widget, options, true);
    } else var block = this;
    for (var i = 0, argument; argument = this.arguments[i]; i++) {
      if (block.args && block.args[i] != null) block.variables.unset(argument, block.args[i]);
      if (args[i] != null) block.variables.set(argument, args[i]);
    }
    block.args = args;
    block.show();
    return block;
  },

  clone: function(parent, opts, shallow) {
    var layout = this.layout;
    if (!layout) return;
    var options = Object.append({layout: layout, original: this}, this.options, opts);
    if (options.walking && this.checked) {
      delete options.layout;
    }
    if (parent) {
      options.widget = parent[0] || parent;
      options.element = parent[1] || (parent.getWrapper && parent.getWrapper()) || parent.toElement();
    }
    var before = options.before;
    options.before = before ? (before.lsd ? before.toElement() : before) : this.options.origin && this.options.origin.nextSibling;
    if (shallow) delete options.expression;
    return new LSD.Layout.Block(options);
  },

  splice: function(block, layout, baseline) {
    var offset = 0;
    if (block.layout) {
      if (!layout) layout = this.layout;
      for (var i = 0, child, keyword; child = block.layout[i]; i++) {
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

  /*
    Checks out if a given layout is a single comment possibly
    surrounded by whitespace. If it's true, the comment node
    then removed and its contents is used as a HTML layout.
  */
  collapse: function(layout, execute) {
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
          if (validate && child.textContent.match(LSD.Layout.Block.rWhitespace)) break;
        default:  
          index = validate = null;
      }
    }
    if (index != null) {  
      var comment = layout[index];
      layout[index] = function() {
        var html = this.expand(comment.nodeValue);
        var args = LSD.slice(document.createFragment(html).childNodes);
        if (this.options.clean) return args;
        args.splice(0, 0, index, 1);
        layout.splice.apply(layout, args)
        args.splice(0, 2)
        return args;
      }.bind(this);
      if (execute) layout[index]();
      if (comment.parentNode) comment.parentNode.removeChild(comment);
      if (this.options.clean) layout = layout[index];
    } else {
      return false;
    }
    return layout;
  },

  setLayout: function(layout, soft) {
    this.layout = layout;
    if (this.checked) {
      this.show(true);
    } else if (!soft) this.hide();
  },

  getLayout: function(layout) {
    return this.layout;
  },

  expand: function(text) {
    var depth = 0;
    text = text.replace(LSD.Layout.Block.rComment, function(whole, start, end) {
      depth += (start ? 1 : -1);
      if (depth == !!start) return start ? '<!--' : '-->'
      return whole;
    });
    if (depth) throw "The lazy block is unbalanced"
    return text;
  },
  
  inject: LSD.Module.DOM.prototype.inject
}, Events.prototype);

// Match whitespace string
LSD.Layout.Block.rWhitespace = /^\s*$/;
// Match for-in (or each-from) expression in loop body
LSD.Layout.Block.rLoopAlias = /^\s*([^\s]*?)\s+(?:in|of|from)\s+/;
// Match boundaries of comments that use short notation, e.g. `<!- ->` 
LSD.Layout.Block.rComment = /(\<\!-)|(-\>)/g