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
    if (item && !item.render) item = this.findItemByValue(item);
    if (!item && this.options.list.force) return false;
    
    var chosen = this.chosenItem;
    this.setSelectedItem.apply(this, arguments);
    if (item.choose() && chosen) chosen.forget();
    return item;
  },
  
  forgetChosenItem: function() {
    if (this.chosenItem) this.chosenItem.forget();
    delete this.chosenItem;
  },
  
  setSelectedItem: function(item, temp) {
    if (!temp) return this.parent.apply(this, arguments);
    this.chosenItem = item;
    this.fireEvent('choose', [item, this.getItemIndex()]);
    return item;
  },
  
  selectChosenItem: function() {
    return this.selectItem(this.chosenItem)
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