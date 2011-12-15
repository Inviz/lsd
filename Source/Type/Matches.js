
LSD.Module.Matches = LSD.Struct.Group({
  'expectations': '.expectations'
});

LSD.Module.Matches.implement({
  onChange: function(name, value, state, old, memo) {
    if (typeof expression == 'string') expression = Slick.parse(key).expressions[0][0];
    if (selector.indexOf) selector = LSD.Slick.parse(selector);
    if (state) {
      if (typeof callback != 'function')
        return this.test(selector);
      if (selector.indexOf) selector = LSD.Slick.parse(selector);
      if (!depth) depth = 0;
      selector.expressions.each(function(expressions) {
        var matcher = function(widget, state) {
          if (expressions[depth + 1]) widget.matches[state ? 'set' : 'unset'](selector, callback, depth + 1)
          else callback(widget, state)
        };
        matcher.callback = callback;
        this.expectations.set(expressions[depth], matcher);
      }, this);
    } else {
      if (!depth) depth = 0;
      selector.expressions.each(function(expressions) {
        this.expectations.unset(expressions[depth], callback, false, function(widget) {
          if (expressions[depth + 1]) widget.unmatch(selector, callback, depth + 1)
          else callback(widget, false)
        });
      }, this);
    }
  }
});