JSONEditor.defaults.editors.upload = JSONEditor.AbstractEditor.extend({
  getNumColumns: function() {
    return 4;
  },
  build: function() {
    var self = this;
    this.title = this.header = this.label = this.theme.getFormInputLabel(this.getTitle());
    if (this.schema.description) {
        this.description = this.theme.getFormInputDescription(this.schema.description);
    }

    var inputContainer = document.createElement('div');
    inputContainer.className = 'upload-input';

    // Input that holds the base64 string;
    var inputType = this.options.showInput ? 'text' : 'hidden';
    this.input = this.theme.getFormInputField(inputType);
    inputContainer.appendChild(this.input);

    // File uploader
    var boxUploader = this.getButton('','upload','');
    boxUploader.className = "box-upload";
    inputContainer.appendChild(boxUploader);

    // Don't show uploader if this is readonly
    if(!this.schema.readOnly && !this.schema.readonly) {

      if(!this.jsoneditor.options.upload) throw "Upload handler required for upload editor";

      this.uploader = this.theme.getFormInputField('file');
      this.uploader.addEventListener('change',function(e) {
        e.preventDefault();
        e.stopPropagation();

        if(this.files && this.files.length) {
          var fr = new FileReader();
          fr.onload = function(evt) {
            self.preview_value = evt.target.result;
            self.refreshPreview();
            self.onChange(true);
            fr = null;
          };
          fr.readAsDataURL(this.files[0]);
        }
      });
    }

    boxUploader.appendChild(this.uploader);
    this.control = this.theme.getFormControl(this.label, inputContainer, this.description);
    this.container.appendChild(this.control);
    this.addUploadPreview(inputContainer);
    this.addDeleteButton(inputContainer);
  },

  postBuild: function() {
    this.setupWatchListeners();
    this.setValue(this.getDefault(), true);
    this.updateHeaderText();
    this.register();
    this.onWatchedFieldChange();
  },


  refreshPreview: function() {
    var self = this;
    var file = this.uploader.files[0];
    self.theme.removeInputError(self.uploader);
    if (self.theme.getProgressBar) {
        self.progressBar = self.theme.getProgressBar();
        self.control.appendChild(self.progressBar);
    }

    self.jsoneditor.options.upload(self.path, file, {
        success: function(url) {
          self.setValue(url);
          if(self.parent) self.parent.onChildEditorChange(self);
          else self.jsoneditor.onChange();
          if (self.progressBar) self.control.removeChild(self.progressBar);

        },
        failure: function(error) {
          self.theme.addInputError(self.uploader, error);
          if (self.progressBar) self.control.removeChild(self.progressBar);
        },

        updateProgress: function(progress) {
          if (self.progressBar) {
            if (progress) self.theme.updateProgressBar(self.progressBar, progress);
            else self.theme.updateProgressBarUnknown(self.progressBar);
          }
        }
    });
  },

  addDeleteButton:function(container){
    var self = this;
    this.delete_button = this.getButton('','delete','');
    this.delete_button.style.display='inline-block';
    this.delete_button.style.position='static';

    this.delete_button.addEventListener('click',function(e) {
      self.setValue("");
    });
    container.appendChild(this.delete_button);
  },

  addUploadPreview : function(container){
    this.link_holder = this.theme.getLinksHolder();
    this.link_holder.style.display =  "inline-block";
    container.appendChild(this.link_holder);
    if(this.schema.links) {
      for(var i=0; i<this.schema.links.length; i++) {
        var link = this.getImgLink(this.schema.links[i]);
        var preview = this.getImgPreview(this.schema.links[i]);
        this.link_holder.appendChild(link);
        if(this.jsoneditor.options.initPopOver){
          this.jsoneditor.options.initPopOver(link, preview);
        }
      }
    }
  },

  getImgLink:function(){
    var b = this.getButton('','preview','');
    return b;
  },

  getImgPreview: function(data) {
    var value = this.value;

    var compiler = this.jsoneditor.compileTemplate(data.href,this.template_engine);
    var url =  compiler({ 'self' :  value, 'url': value });
    var pop = this.getPopOverContent(url);
    return pop;

  },
  refreshImgPreview : function(url){
    if(!url || url.length < 1 || typeof url == 'undefined' ){
      this.link_holder.style.display = 'none';
      this.delete_button.style.display = 'none';
    }else{
      this.link_holder.style.display = 'inline-block';
      this.delete_button.style.display = 'inline-block';
    }

    if (this.link_holder){
      for (var i = 0;  i < this.link_holder.children.length; i++){
        if(this.jsoneditor.options.updatePopOver){
          var pop = this.getPopOverContent(url);
          this.jsoneditor.options.updatePopOver(this.link_holder.children[i], pop);
        }
      }
    }
  },

  getPopOverContent: function(url){
    return  "<div><img class='popover-img-preview' src='"+url+"'/></div>";
  },

  enable: function() {
    if(this.uploader) this.uploader.disabled = false;
    this._super();
  },
  disable: function() {
    if(this.uploader) this.uploader.disabled = true;
    this._super();
  },
  setValue: function(val) {
    if(this.value !== val) {
      this.value = val;
      this.input.value = this.value;
      this.refreshImgPreview(this.value);
      this.onChange();
    }
  },

  destroy: function() {
    if(this.preview && this.preview.parentNode) this.preview.parentNode.removeChild(this.preview);
    if(this.title && this.title.parentNode) this.title.parentNode.removeChild(this.title);
    if(this.input && this.input.parentNode) this.input.parentNode.removeChild(this.input);
    if(this.uploader && this.uploader.parentNode) this.uploader.parentNode.removeChild(this.uploader);

    this._super();
  }
});
