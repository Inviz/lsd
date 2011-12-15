LSD.Module.Templates = new LSD.Object({
});

LSD.Module.Templates.implement({
  onChange: function(name, value, state, old, memo) {
    if (state) {
      if (parent == null) parent = [this, (this.wrapper = this.getWrapper())];
      else if (parent && parent.nodeType && !parent.lsd) parent = [this, parent];
      if (!memo) memo = {};
      var old = this.layouts[name];
      if (old) {
        this.document.layout.add(old, parent, memo)
      } else {
        if (memo.elements == null) memo.elements = true
        old = this.document.layout.render(layout, parent, memo);
        if (name != null) this.layouts[name] = old;
      }
      if (memo.promised) {
        memo.promised = false;
        this.addEvent('DOMChildNodesRendered:once', function() {
          this.document.layout.realize(old)
        });
      }
      return old;
    } else {
      if (parent == null) parent = [this, this.wrapper];
      else if (parent && parent.nodeType && !parent.lsd) parent = [this, parent];
      if (name != null) var old = this.layouts[name];
      return this.document.layout.remove(old || layout, parent, memo);
    }
  }
})