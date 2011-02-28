LSD.Action.Update = new LSD.Action({
  enable: function(target, content, method) {
    if (target.empty) target.empty();
    if (target.setContent) target.setContent(content)
    else if (target.set) target.set('html', content)
    return target;
  }
});