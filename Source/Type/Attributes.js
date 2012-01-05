LSD.Attributes = {
  tabindex: Number,
  width:    Number,
  height:   Number,
  readonly: Boolean,
  disabled: Boolean,
  hidden:   Boolean,
  checked:  Boolean,
  multiple: Boolean,
  'class': function(value) {
    value.trim().split(' ').each(this.addClass.bind(this));
  },
  style: function(value) {
    value.trim().split(/\s*;\s*/).each(function(definition) {
      this.setStyle.apply(this, definition.split(/\s*:\s*/))
    }, this);
  }
};

LSD.Type.Pseudos = LSD.Struct.Stack();
LSD.Type.Pseudos.implement({
  onChange: function(name, value, state, old, memo) {
    if ((!memo || memo === 'states') && LSD.States[name])
      this._parent.states[state ? 'set' : 'unset'](name, true, 'pseudos');
  }
})

LSD.Type.Classes = LSD.Struct.Stack();
LSD.Type.Classes.implement({
  onChange: function(name, value, state, old, memo) {
    if ((!memo || memo === 'states') && LSD.States[name]) 
      this._parent.states[state ? 'set' : 'unset'](name, true, 'classes');
    if (this._parent.element)
      this._parent.element[state ? 'addClass' : 'removeClass'](name);
  }
})


LSD.Type.Attributes = LSD.Struct.Stack(LSD.Attributes);
LSD.Type.Attributes.implement({
  onChange: function(name, value, state, old, memo) {
    if ((!memo || memo === 'states') && LSD.States[name]) 
      this._parent.states[state ? 'set' : 'unset'](name, true, 'attributes');
    if (this._parent.element && (name != 'type' || LSD.toLowerCase(this._parent.element.tagName) != 'input')) {
      if (state) this._parent.element.setAttribute(name, value === true ? name : value);
      else this._parent.element.removeAttribute(name);
      if (value === true) this._parent.element[name] = state;
    }
    if (name.substr(0, 5) == 'data-') {
      var property = name.substring(5);
      if (typeof value != 'undefined') this.dataset[state ? 'set' : 'unset'](property, value);
      if (typeof old != 'undefined') this.dataset.unset(property, old);
    }
    return value;
  }
});

LSD.Type.Dataset = LSD.Struct.Stack();
LSD.Type.Variables = LSD.Struct.Stack()