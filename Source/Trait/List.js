/*
---
 
script: List.js
 
description: Trait that makes it simple to work with a list of item (and select one of them)
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD
  - Core/Element
  - Ext/Element.Properties.item
 
provides: 
  - LSD.Trait.List
 
...
*/


LSD.Trait.List = new Class({  
  options: {
    list: {
      endless: true,
      force: false,
      multiple: false
    },
    proxies: {
      container: {
        condition: function(widget) {
          return !!widget.setList
        }
      }
    },
    shortcuts: {
      previous: 'previous',
      next: 'next'
    },
    events: {
      attach: function() {
        var items = this.list.length ? this.list : this.options.list.items;
        if (items) this.setItems(items);
      }
    }
  },
  
  initialize: function() {
    this.widgets = [];
    this.list = [];
    this.parent.apply(this, arguments)
  },
  
  selectItem: function(item) {
    if (item && !item.render) item = this.findItemByValue(item);
    if (!item && this.options.list.force) return false;
    var selected = this.selectedItem;
    this.setSelectedItem.apply(this, arguments); 
    if ((selected != item) && selected && selected.unselect) selected.unselect();
    item.select();
    return item;
  },
  
  unselectItem: function(item) {
    if (this.selectedItem) {
      if (this.selectedItem.unselect) this.selectedItem.unselect();
      delete this.selectedItem;
    }
  },
  
  setSelectedItem: function(item) {
    this.selectedItem = item;
    this.fireEvent('set', [item, this.getItemIndex()]);
  },
  
  buildItem: Macro.defaults(function(value) {
    return new Element('div', {
      'class': 'lsd option', 
      'html': value.toString(), 
      'events': {
        click: function() {
          this.selectItem(value);
        }.bind(this)
      }
    });
  }),
  
  setItems: function(items) {
    this.list = [];
    this.widgets = [];
    items.each(this.addItem.bind(this));
    if (this.options.list.force) this.selectItem(items[0]);
    return this;
  },
  
  addItem: function(item) {
    if (item.setList) var data = item.getValue(), widget = item, item = data;
    if (!this.list.contains(item)) {
      this.list.push(item);
      if (widget) {
        widget.listWidget = this;
        this.widgets.push(widget);
      }
      return true;
    }
    return false;
  },
  
  makeItems: function() {
    var item, i = this.widgets.length;
    while (item = this.list[i++]) this.makeItem(item);
  },
	
  makeItem: function(item) {
    var widget = this.buildItem.apply(this, arguments);
    widget.item = widget.value = item;
    if (widget.setContent) widget.setContent(item)
    else widget.set('html', item.toString());
    return widget;
  },
  
  getItems: function() {
    return this.list;
  },
  
  hasItems: function() {
    return this.getItems() && (this.getItems().length > 0)
  },
  
  getSelectedItem: function() {
    return this.selectedItem;
  },
  
  getItemIndex: function(item) {
    return this.getItems().indexOf(item || this.selectedItem);
  },
  
  findItemByValue: function(value) {
    for (var i = 0, j = this.widgets.length; i < j; i++) {
      if (this.widgets[i].value == value) return this.widgets[i];
    }
    return null;
  },
  
  getItemValue: function(item) {
    for (var i = 0, j = this.widgets.length; i < j; i++) {
      if (this.widgets[i] == item) return this.list[i];
    }
    return null;
  },
  
  getActiveItem: function() {
    var active = (this.chosenItem || this.selectedItem);
    return active ? active.value : null;
  },

  next: function(e) {
    this.makeItems();
    var next = this.getItems()[this.getItemIndex(this.getActiveItem()) + 1];
    if (!next && this.options.list.endless) next = this.getItems()[0];
    if (this.selectItem(next, true, !!e)) {
      if (e && e.stop) e.stop();
      return !!this.fireEvent('next', [next]);
    }
    return false;
  },

  previous: function(e) {
    this.makeItems();
    var previous = this.getItems()[this.getItemIndex(this.getActiveItem()) - 1];
    if (!previous && this.options.list.endless) previous = this.getItems().getLast();
    if (this.selectItem(previous, true)) {
      if (e && e.stop) e.stop();
      return !!this.fireEvent('previous', [previous]);
    }
    return false;
  },
  
  sort: function(sort) {
    return this.getItems().sort(sort)
  },
  
  filter: function(filter) {
    return this.getItems().filter(filter)
  }
  
});