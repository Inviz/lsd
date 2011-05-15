/*
---
 
script: Choice.js
 
description: Mixin that adds List. Allows one item to be chosen and one selected (think navigating to a menu item to select)
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD.Mixin.List
 
provides: 
  - LSD.Mixin.Choice
 
...
*/


LSD.Mixin.Choice = new Class({
  chooseItem: function(item, temp) {
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
  }
});


LSD.Behavior.define(':choice', LSD.Mixin.Choice);