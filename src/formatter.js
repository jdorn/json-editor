JSONEditor.Formatter = Class.extend({
  init: function (options) {
    this.defaultString = options.defaultString;
    this.formatCallback = options.format;
  },

  format: function (key, variables) {
    var text = "";

    // Retrieve the text given by the user
    if (typeof this.formatCallback === "function") text = this.formatCallback(key, variables);

    // Get default text if no textCallback is provided or it didn't return text
    if (!text) {
      // Get text
      text = this.defaultString[key];

      // Use variables if specified
      if (variables instanceof Array) {
        for (var i = 0; i < variables.length; i++)
          text = text.replace("{{" + i + "}}", variables[i]);
      }
    }

    return text;
  }
});