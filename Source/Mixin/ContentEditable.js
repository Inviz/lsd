/*
---
 
script: ContentEditable.js
 
description: Animated ways to show/hide widget
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD.Mixin
  - CKEditor/core._bootstrap
  - CKEditor/skins.kama.skin
  - CKEditor/lang.en
 
provides: 
  - LSD.Mixin.ContentEditable
...
*/

LSD.Mixin.ContentEditable = new Class({
  options: {
    ckeditor: {
      toolbarCanCollapse: false,
      linkShowAdvancedTab: false,
      linkShowTargetTab: false,
      invisibility: true,
      skin: 'orwik',
      toolbar: [['Bold', 'Italic', 'Strike', '-', 'Link', 'Unlink', '-', 'NumberedList', 'BulletedList', '-', 'Indent', 'Outdent', '-','Styles', '-', 'PasteFromWord', 'RemoveFormat']],
      removeFormatTags: 'dialog,img,input,textarea,b,big,code,del,dfn,em,font,i,ins,kbd,q,samp,small,span,strike,strong,sub,sup,tt,u,var,iframe',
      removeFormatAttributes: 'id,class,style,lang,width,height,align,hspace,valign',
      contentsCss: '/stylesheets/layout/application/iframe.css',
      extraPlugins: 'autogrow',
      customConfig: false,
      language: 'en',
      removePlugins: 'bidi,dialogadvtab,liststyle,about,elementspath,blockquote,popup,undo,colorbutton,colordialog,div,entities,filebrowser,find,flash,font,format,forms,horizontalrule,image,justify,keystrokes,maximize,newpage,pagebreak,preview,print,resize,save,scayt,smiley,showblocks,showborders,sourcearea,style,table,tabletools,specialchar,templates,wsc,a11yhelp,a11yhelp'
    }
  },
  
  getEditor: Macro.getter('editor', function() {
    var element = new Element('div', {styles: {position: 'absolute', top: -1000, left: -2000}}).inject(document.body);
    var editor = new CKEDITOR.editor( this.options.ckeditor, element, 2);
    
    //sometimes it may happen too quickly
    //if (editor.document && editor.container) hide();
    //if (editor.document) show();
    editor.on('focus', function() {
      if (this.editor) this.getEditorContainer().addClass('focus');
    }.bind(this));
    editor.on('blur', function() {
      if (this.editor) this.getEditorContainer().removeClass('focus');
    }.bind(this));
    editor.on('contentDom', function() {
      this.fireEvent('editorReady');
      console.log(this.getEditorContainer())
      this.getEditorContainer().replaces(this.element);
    }.bind(this));
    //editor.on('themeLoaded', hide);
    //editor.on('contentDom', show);
    //editor.on('afterSetData', function() {
    //  this.getEditorBody()
    //}.create({bind: this, delay: 100}))
    
    return editor;
  }),
  
  useEditor: function(callback) {
    if (this.editor && this.editor.document) callback.call(this.editor);
    this.addEvent('editorReady:once', callback);
    this.getEditor();
  },
  
  getEditorContainer: function() {
    return $(this.editor.container.$);
  },
  
  getEditorBody: function() {
    return this.editor.document.$.body;
  },
  
  getEditedElement: function() {
    return this.element;
  }
});

LSD.Behavior.define('[contentEditable=editor]', LSD.Mixin.ContentEditable);