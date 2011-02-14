/*
---
 
script: Item.js
 
description: Easy way to have a list of children (to select from) or something like that.
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD
  - Ext/Class.Stateful

provides: 
  - LSD.Trait.Item
  - LSD.Trait.Item.State
  - LSD.Trait.Item.Stateful
 
...
*/

LSD.Trait.Item = new Class({
  options: {
    events: {
      _item: {
        setParent: 'setList',
        select: function() {
          this.listWidget.selectItem(this)
        }
      }
    }
  },
  
  initialize: function() {
    this.parent.apply(this, arguments);
    this.value = this.element.get('item') || $uid(this.element);
  },
  
  getValue: Macro.defaults(function() {
    return this.value;
  }),
  
  setList: function(widget) {
    if (!widget.addItem) 
      if (Element.type(widget))
        for (var parent = widget, widget = null; parent && !widget; widget = parent.retrieve('widget'), parent = parent.parentNode);
      else
        while (!widget.addItem) widget = widget.parentNode;
    if (widget.addItem) return widget.addItem(this)
  }
})

LSD.Trait.Item.State = Class.Stateful({
  selected: ['select', 'unselect']
});
LSD.Trait.Item.Stateful = [
  LSD.Trait.Item.State,
  LSD.Trait.Item
]