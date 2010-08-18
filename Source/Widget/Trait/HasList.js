Widget.Trait.List = new Class({	
  options: {
    list: {
      endless: true,
      force: false
    }
  },
  
  shortcuts: {
	  previous: 'previous',
	  next: 'next'
  },
  
  list: [],
  items: [],
  
  attach: Macro.onion(function() {  
    var items = this.items.length ? this.items : this.options.list.items;
    if (items) {
      this.setItems(items);
      if (this.options.force) this.select(items[0])
    }
  }),
  
  select: function(item) {
    if (item && !item.render) item = this.findItemByValue(item);
    if (!item && this.options.force) return false;
    var selected = this.selected;
    this.setSelectedItem.apply(this, arguments);  
    if ((selected != item) && selected && selected.unselect) selected.unselect();
    item.select();
    return item;
  },
  
  setSelectedItem: function(item, temp, programmatic) {
    this.selected = item;
    this.fireEvent('select', [item, this.getItemIndex()]);
  },
  
  buildItem: function(value) {
    return new Element('div', {
      'class': 'art option', 
      'html': value.toString(), 
      'events': {
        click: function() {
          this.select(value);
        }.bind(this)
      }
    });
  },
  
  setItems: function(items) {
    this.items = [];
    this.list = [];
    items.each(this.addItem.bind(this))
    return this;
  },
  
  addItem: function(item) {
    this.items.push(item);
  },
  
  makeItems: function() {
    var item, i = this.list.length;
    while (item = this.items[i++]) this.makeItem(item);
  },
  
  makeItem: function(item) {
    var option = this.buildItem.apply(this, arguments);
    option.item = item;
    option.render();
    this.list.push(option); 
    return option;
  },
  
  getItems: function() {
    return this.items;
  },
  
  hasItems: function() {
    return this.getItems() && (this.getItems().length > 0)
  },
  
  getSelectedItem: function() {
    return this.selected;
  },
  
  getItemIndex: function(item) {
    return this.getItems().indexOf(item || this.selected);
  },
  
  findItemByValue: function(value) {
    for (var i = 0, j = this.list.length; i < j; i++) {
      if (this.list[i].value == value) return this.list[i];
    }
    return null;
  },
  
  getActiveItem: function() {
    var active = (this.chosen || this.selected);
    return active ? active.value : null;
  },

	next: function(e) {
    this.makeItems();
	  var next = this.getItems()[this.getItemIndex(this.getActiveItem()) + 1];
	  if (!next && this.options.list.endless) next = this.getItems()[0];
	  if (this.select(next, true, !!e)) {
	    if (e && e.stop) e.stop();
    	return !!this.fireEvent('next', [next]);
	  }
	  return false;
	},

	previous: function(e) {
    this.makeItems();
	  var previous = this.getItems()[this.getItemIndex(this.getActiveItem()) - 1];
	  if (!previous && this.options.list.endless) previous = this.getItems().getLast();
	  if (this.select(previous, true)) {
	    if (e && e.stop) e.stop();
    	return !!this.fireEvent('previous', [previous]);
    }
	  return false;
	}
  
});