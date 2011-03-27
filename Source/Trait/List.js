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
      multiple: false,
      unselect: null
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
    if (!(item = this.getItem(item)) && this.options.list.force) return false;
    var selected = this.selectedItem;
    this.setSelectedItem.apply(this, arguments); 
    this.fireEvent('set', [item, this.getItemIndex(item)]);
    var unselect = (this.options.unselect !== null) ? this.options.unselect : !this.options.multiple;
    if (unselect && (selected != item) && selected && selected.unselect) this.unselectItem(selected);
    item.select();
    return item;
  },
  
  unselectItem: function(item) {
    if (!(item = this.getItem(item)) || !this.isItemSelected(item)) return false;
    if (item.unselect) item.unselect();
    this.unsetSelectedItem.apply(this, arguments);
    this.fireEvent('unset', [item, this.getItemIndex(item)]);
    delete item;
  },
  
  setSelectedItem: function(item, type) {
    var property = (type || 'selected') + 'Item';
    if (this.options.list.multiple)  {
      property += 's';
      if (!this[property]) this[property] = [];
      this[property].push(item);
    } else this[property] = item
  },
  
  unsetSelectedItem: function(item, type) {
    var property = (type || 'selected') + 'Item';
    if (this.options.list.multiple)  {
      property += 's';
      if (this[property]) this[property].erase(item);
    } else delete this[property]
  },

  getSelectedItem: function() {
    return this.selectedItem || (this.selectedItems ? this.selectedItems.getLast() : null);
  },
  
  getSelectedItems: function(type) {
    if (this.selectedItems) return Array.prototype.slice.call(this.selectedItems, 0);
    return this.selectedItem ? [this.selectedItem] : [];
  },
  
  isItemSelected: function(item) {
    return this.selectedItems ? this.selectedItems.indexOf(item) > -1 : (this.selectedItem == item)
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
  
  getItem: function(item) {
    return (item && !item.select) ? this.findItemByValue(item) : item;
  },
  
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