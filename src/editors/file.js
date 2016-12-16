JSONEditor.defaults.editors.file = JSONEditor.defaults.editors.string.extend({
	refreshValue: function() {
		if(!FileReader){
			this.value=this.input && this.input.value;
			this.serialized=this.value;
			return;
		}
		if(this.input && this.input.files && this.input.files.length){
			var fr = new FileReader();
			fr.onload=(function(_this){
				return function(evt){
					_this.value=(evt.target.result);
					_this.serialized=(evt.target.result);
					if(_this.parent) _this.parent.onChildEditorChange(_this);
					else _this.jsoneditor.onChange();
					fr=null;
				}
			})(this);
			fr.readAsDataURL(this.input.files[0]);
			this.value="";//Pending async file load
			this.serialized = this.value;
		}else{
			this.value="";
			this.serialized ="";
		}
	}
});
