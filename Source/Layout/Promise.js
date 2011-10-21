/*
---

script: Promise.js

description: A logic to render (and nest) widgets out of the key-value hash or dom tree

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Layout

provides:
  - LSD.Layout.Promise

...
*/


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
  this.type = 'promise';
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

  advance: function() {
    this.memo.bypass = 'promise';
    this.advanced = this.layout.render(this.children, this.result.lsd ? this.result : [this.widget, this.result], this.memo)
  },

  callback: function(child, proxy) {
    proxy.realize(child)
  },

  realize: function(result) {
    var memo = {};
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
      var combinator = this.combinator;
      if (combinator) memo.combinator = combinator;
      memo.stored = stored;
      memo.bypass = 'promise';
      result = this.layout.selector(this.options, this.parent, memo);
      delete memo.stored;
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
    if (this.children) this.advance();
    if (stored && result.store) {
      for (var name in stored) stored[name].call(this, result);
      result.store('allocation', stored);
    }
  }
};

LSD.Layout.Promise.Textnode = function(layout, text, parent, memo) {
  this.layout = layout;
  this.regexp = text.indexOf ? LSD.Layout.regexpify(text) : text;
  this.string = this.regexp.string;
  this.container = false;
  this.parent = parent;
  this.memo = memo;
  this.promise = true;
  this.widget = parent[0] || parent;
  this.text = true;
  this.attach(memo)
};

LSD.Layout.Promise.Textnode.prototype = Object.append({}, LSD.Layout.Promise.prototype, {
  realize: function(result) {
    this.detach();
    if (result) {
      var string = result.nodeValue;
      var match = string.match(this.regexp);
      var object = {}
      for (var i = 0, bit; bit = match[i + 1]; i++)
        object[this.regexp._names[i]] = bit;
      if (i) {
        Element.store(result, 'interpolator', object);
        this.widget.addInterpolator(object)
      }
    } else {
      result = this.layout.string(this.string, this.parent);
    }
  }
});