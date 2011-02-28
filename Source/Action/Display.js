LSD.Action.Display = new LSD.Action({
  enable: function(target) {
    if (target.show) target.show();
    else if (target.setStyle) target.setStyle('display', target.retrieve('style:display') || '');
  },
  
  disable: function(target) {
    if (target.show) target.show();
    else if (target.setStyle) {
      target.store('style:display', target.getStyle('display'));
      target.setStyle('display', 'none');
    }
  }
})