/*
---
 
script: Choice.js
 
description: Trait that completes List. Allows one item to be chosen and one selected (think navigating to a menu item to select)
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD.Trait.List
 
provides: 
  - LSD.Trait.Choice
 
...
*/


LSD.Trait.Choice = new Class({
  
  selectItem: function(item, temp) {
    if (temp !== true) return this.parent.apply(this, arguments)
    if (!(item = this.getItem(item)) && this.options.list.force) return false;
    var chosen = this.chosenItem;
    this.setSelectedItem(item, 'chosen');
    this.fireEvent('choose', [item, this.getItemIndex()]);
    if (item.choose() && chosen) chosen.forget();
    return item;
  },
  
  forgetChosenItem: function(item) {
    item = this.getItem(item) || this.chosenItem;
    if (item) item.forget();
    this.unsetSelectedItem(item, 'chosen');
  },
  
  selectChosenItem: function() {
    return this.selectItem(this.chosenItem)
  },

  getChosenItems: function() {
    return this.chosenItem || (this.chosenItems ? this.chosenItems.getLast() : null);
  },
  
  getChosenItems: function(type) {
    return this.chosenItems || (this.chosenItem && [this.chosenItem]);
  },
  
  getSelectedOptionPosition: function() {
    var height = 0;
    if (!this.selectedItem) return height;
    for (var i = 0, j = this.widgets.length; i < j; i++) {
      if (this.widgets[i] == this.selectedItem) break;
      height += this.widgets[i].getLayoutHeight();
    }
    return height
  }
});