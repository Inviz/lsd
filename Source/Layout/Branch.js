/*
---
 
script: Branch.js
 
description: A conditional piece of layout
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Layout
  - LSD.Module.Interpolations

provides: 
  - LSD.Layout.Branch
 
...
*/

/*
  A branch is a part of layout that is rendered on condition.
  
  When layout is defined with selector object, a key in that 
  may contain an expression with a keyword that makes a branch.
  
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
  later may update value and make branch no longer meet the condition.
  A rendered layout then gets removed from DOM, and later may be 
  inserted back without re-rendering.
  
  When layout is defined in HTML, it uses conditional comments to
  mark blocks of HTML to be displayed on condition. 
  
    <article itemscope itemprop="person">
      <h1 itemprop="name">Bob Marley</h1>
      <!-- if person.name == 'Bob Marley' -->
        <p> Hey there bob, long time no see! </P>
      <!-- else -->
        <p> Oh, you... #{person.name}</p>
      <!-- end -->
    </article>
    
  A block gets removed from DOM if a condition doesnt match initially.
  A branch may have its HTML block wrapped into its own comment making
  the layout rendering lazy. The comment element containing the lazy
  HTML will then be replaced with its rendered contents.
  
*/


LSD.Layout.Branch = function(options) {
  this.options = options;
  this.id = ++LSD.Layout.Branch.UID;
  this.$events = Object.clone(this.$events);
  this.element = options.element;
  this.widget = options.widget;
  this.expression = options.expression;
  this.parentNode = options.parent || options.widget;
  if (options.layout) this.setLayout(options.layout, true);
  if (options.collection) this.values = [];
  if (options.superbranch) {
    options.superbranch.addEvents({
      check: this.unmatch.bind(this),
      uncheck: this.match.bind(this)
    });
    if (!options.superbranch.checked ^ this.options.invert) this.match();
  } else if (options.expression || options.show) {
    this.match();
  } else if (options.name) {
    LSD.Template[name] = this;
  }
};
LSD.Layout.Branch.UID = 0;
LSD.Template = {};

LSD.Layout.Branch.prototype = Object.append({
  branch: true,
  getInterpolation: function() {
    if (typeof this.interpolation == 'undefined') {
      if (this.options.collection) {
        this.expression = this.expression.replace(LSD.Layout.Branch.rLoopAlias, function(m, name) {
          this.arguments = [name];
          return '';
        }.bind(this));
      }
      this.interpolation = LSD.Script.compile(this.expression, this, this, true);
    }
    return this.interpolation;
  },
  match: function() {
    if (this.options.expression && !this.evaluate(true)) return;
    this.check();
  },
  unmatch: function(lazy) {
    if (this.options.expression && !this.evaluate(false)) return;
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
  evaluate: function(state) {
    var interpolation = this.getInterpolation();
    var value = interpolation.attach ? interpolation[state ? 'attach' : 'detach']().value : interpolation;
    if (this.value !== value) this.set(value);
    return this.validate(true);
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
    if (!this.next) this.next = this.options.origin && this.options.origin.nextSibling;
    if (this.options.collection) {
      if (Type.isEnumerable(value)) {
        for (var i = 0, j = value.length; i < j; i++) {
          var context = this.add(value[i], {before: this.next});
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
    if (Type.isEnumerable(layout)) for (var i = 0, child, keyword, depth = 0; child = layout[i]; i++) {
      if (child.call) {
        if (layout === this.layout) layout = layout.slice(0);
        var result = child.call(this);
        if (result) { 
          if (result.length) layout.splice.apply(layout, [i, 1].concat(result))
          else layout[i] = result;
        }
      }
    }
    var before = this.options.before || this.options.origin && this.options.origin.nextSibling;
    if (before && before.parentNode != this.element) before = null;
    var memo = { 
      before: before, 
      options: this.options.options, 
      plain: (lazy === true), 
      clone: !!this.options.original && !this.options.original.checked,
      interpolations: this,
      branches: [this]
    };
    this.rendered = this.widget.addLayout(this.id, layout, [this.widget, this.element], memo);
    if (result) this.collapse(this.rendered)
  },
  render: function(args, options, widget) {
    if (args != null && !args.push) args = [args]; 
    if (!this.options.original) {
      var branch = this.clone(widget, options, true);
    } else var branch = this;
    for (var i = 0, argument; argument = this.arguments[i]; i++) {
      if (branch.args && branch.args[i] != null) branch.removeInterpolator(argument, branch.args[i]);
      if (args[i] != null) branch.addInterpolator(argument, args[i]);
    }
    branch.args = args;
    branch.show();
    return branch;
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
    return new LSD.Layout.Branch(options);
  },
  hide: function() {
    var layout = this.rendered || this.layout;
    if (!layout) return;
    this.widget.removeLayout(this.id, layout);
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
  /*
    Checks out if a given layout is a single comment possibly
    surrounded by whitespace. If it's true, the comment node
    then removed and its contents is used as a HTML layout.
  */
  collapse: function(layout) {
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
          if (validate && child.textContent.match(LSD.Layout.Branch.rWhitespace)) break;
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
      };
      if (comment.parentNode) comment.parentNode.removeChild(comment);
      if (this.options.clean) layout = layout[index];
    } else {
      return false;
    }
    return layout;
  },
  setLayout: function(layout, soft) {
    this.layout = layout.push && this.collapse(layout) || layout;
    if (this.checked) {
      this.show(true);
    } else if (!soft) this.hide();
  },
  getLayout: function(layout) {
    return this.layout;
  },
  attach: function() {
    if ((this.options.expression && !this.options.link) || !this.options.superbranch.checked) this.match(true);
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
}, LSD.Module.Interpolations.prototype, Events.prototype);

LSD.Layout.Branch.rWhitespace = /^\s*$/;
LSD.Layout.Branch.rLoopAlias = /^\s*([^\s]*?)\s+(?:in|of|from)\s+/;