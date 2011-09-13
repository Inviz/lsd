/*
---
 
script: Branch.js
 
description: A conditional piece of layout
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Layout

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
    this.interpolation = LSD.Script.compile(this.options.expression, this.options.widget, this, true);
    return this.interpolation;
  },
  match: function() {
    if (this.options.expression) {
      var interpolation = this.getInterpolation();
      if (interpolation && interpolation.attach) {
        var value = interpolation.attach().value;
      } else var value = interpolation;
      if ((value == null || value === false) ^ this.options.invert) return;
    }
    this.check();
  },
  unmatch: function(lazy) {
    if (this.options.expression) {
      var interpolation = this.interpolation;
      if (interpolation && interpolation.detach) {
        var value = interpolation.detach().value;
      } else var value = interpolation;
      if ((value == null || value === false) ^ this.options.invert) return;
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
    var before = this.options.origin && this.options.origin.nextSibling;
    var rendered = this.options.widget.addLayout(this.id, layout, [this.options.widget, this.options.element], {before: before, options: this.options.options, text: true});
    if (result) this.validate(rendered)
  },
  hide: function() {
    var layout = this.layout;
    if (!layout) return;
    this.options.widget.removeLayout(this.id, layout);
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
          if (validate && child.textContent.match(LSD.Layout.Branch.rWhitespace)) break;
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

LSD.Layout.Branch.rWhitespace = /^\s*$/;