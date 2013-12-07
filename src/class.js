  /* Simple JavaScript Inheritance
   * By John Resig http://ejohn.org/
   * MIT Licensed.
   */
  // Inspired by base2 and Prototype
  var Class;!function(){var a=!1,b=/xyz/.test(function(){})?/\b_super\b/:/.*/;Class=function(){},Class.extend=function(c){function g(){!a&&this.init&&this.init.apply(this,arguments)}var d=this.prototype;a=!0;var e=new this;a=!1;for(var f in c)e[f]="function"==typeof c[f]&&"function"==typeof d[f]&&b.test(c[f])?function(a,b){return function(){var c=this._super;this._super=d[a];var e=b.apply(this,arguments);return this._super=c,e}}(f,c[f]):c[f];return g.prototype=e,g.prototype.constructor=g,g.extend=arguments.callee,g}}();
