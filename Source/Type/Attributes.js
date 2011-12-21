

LSD.Module.Pseudos = LSD.Struct.Stack();
LSD.Module.Pseudos.implement({
  onChange: function(name, value, state, old, memo) {
    if (!memo && LSD.States[name]) this._parent.states[state ? 'include' : 'erase'](name, 'pseudos');
  }
})

LSD.Module.Classes = LSD.Struct.Stack();
LSD.Module.Classes.implement({
  onChange: function(name, value, state, old, memo) {
    if (!memo && LSD.States[name]) this._parent.states[state ? 'include' : 'erase'](name, 'classes');
    if (this._parent.element) this._parent.element[state ? 'addClass' : 'removeClass'](name);
  }
})


LSD.Module.Attributes = LSD.Struct.Stack();
LSD.Module.Attributes.implement({
  onChange: function(name, value, state, old, memo) {
    if (!memo && LSD.States[name]) this._parent.states[state ? 'include' : 'erase'](name, 'attributes');
    value = LSD.Module.Attributes.resolve(name, value, this._parent);
    if (this._parent.element && (name != 'type' || LSD.toLowerCase(this._parent.element.tagName) != 'input')) {
      if (state) this._parent.element.setAttribute(name, LSD.Attributes[name] == 'boolean' ? name : value);
      else this._parent.element.removeAttribute(name);
      if (LSD.Attributes[name] == 'boolean') this._parent.element[name] = state;
    }
    if (name.substr(0, 5) == 'data-') {
      if (typeof value != 'undefined') this.dataset[state ? 'set' : 'unset'](name.substring(5), value);
      if (typeof old != 'undefined') this.dataset.unset(name.substring(5), old);
    }
    return value;
  }
});

LSD.Attributes = Object.append(, LSD.Attributes);

LSD.Module.Dataset = LSD.Struct.Stack();
LSD.Module.Variables = LSD.Struct.Stack()