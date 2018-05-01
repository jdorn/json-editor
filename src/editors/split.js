JSONEditor.defaults.editors.splitStrings = JSONEditor.defaults.editors.string.extend({
  getValue: function() {
    var split_by, opt=this.options.split_by;
    //Currently inferring split_by is regex, if in format "join_with|rest of regex", but could be explicit instead
    if(opt && opt.match && opt.match(/(([^\^\\[$.|?*+(){]|\\.)*)(\|.+)+/)){
      split_by=RegExp(opt);
    }else if(opt){
      split_by=opt;
    }else{
      split_by=/\s*,\s*/; 
    }  
    return this.value.split(split_by);
  },
  setValue: function(value,initial,from_template){
    var join_with, opt=this.options.split_by;
    //Currently inferring join_with from split_by, if in format "join_with|rest of regex", but could be explicit instead
    var match=opt && opt.match && opt.match(/(([^\^\\[$.|?*+(){]|\\.)*)(\|.+)+/);
    if(match && match[1]){
        join_with=match[1].replace(/\\(.)/g,"$1");
    }else if(opt){
      join_with=opt;
    }else{
      join_with=", "; 
    }
    return this._super(value.join(join_with), initial,from_template)  ;
  }
});
JSONEditor.defaults.editors.splitNumbers = JSONEditor.defaults.editors.splitStrings.extend({
  getValue: function() {
    return this._super().map(function(str){return parseFloat(str);});
  }
});
JSONEditor.defaults.editors.splitIntegers = JSONEditor.defaults.editors.splitStrings.extend({
  getValue: function() {
    return this._super().map(function(str){return parseFloat(str);});
  }
});
