JSON Editor
===========

JSON Schema -> HTML Editor -> JSON

If you have structured JSON data and need a web-based editor for it, JSON Editor can help you out.

Define your data structure using JSON Schema and let JSON Editor do the rest.

Check out an example: http://rawgithub.com/jdorn/json-editor/master/example.html

Download the [production version][min] or the [development version][max].

[min]: https://raw.github.com/jdorn/json-editor/master/dist/jquery.jsoneditor.min.js
[max]: https://raw.github.com/jdorn/json-editor/master/dist/jquery.jsoneditor.js

Requirements
-----------------

*  A recent version of jQuery
*  A modern browser

### Optional Requirements

*  A javascript template engine for macro support (Mustache, Underscore, Hogan, Handlebars, Swig, Markup, or EJS)
*  A compatible CSS Framework for styling (bootstrap, foundation, or jqueryui)

Usage
--------------

```javascript
// Initialize the editor with a JSON schema
$("#editor_holder").jsoneditor({
  schema: {
    type: "object",
    properties: {
      //...
    }
  }
});

// Set the editor's value with a JSON object
$("#editor_holder").jsoneditor('value',some_json_object);

// Get the editor's current value as a JSON object
console.log($("#editor_holder").jsoneditor('value'));

// Validate the editor's current value against the schema
$("#editor_holder").jsoneditor('validate',function(err) {
  // err will be undefined if the value is valid
  if(err) {
    // if it is not valid, err will contain an array of errors, each with a `path` and `message` property
    console.log(err);
  }
});

// Listen to changes on the editor
$("#editor_holder").on('change',function() {});

// Destroy the editor completely
$("#editor_holder").jsoneditor('destroy');
```

JSON Schema Support
-----------------
JSON Editor supports a subset of the JSON Schema draft specification.

The following schema types are supported:

*  object
*  array
*  string
*  boolean
*  number
*  integer

Compound types are not supported.

The following JSON schema keywords are supported.  All other keywords will be ignored.

*  id
*  title
*  description
*  default
*  enum (for type `string` only)
*  properties
*  items
*  $ref
*  definitions
*  format (for type `string` only)
*  minimum
*  exclusiveMinimum
*  maximum
*  exclusiveMaximum
*  multipleOf
*  minItems
*  maxItems
*  uniqueItems
*  minLength
*  maxLength
*  pattern

### Arrays

JSON Editor only supports arrays with a single `items` schema.  In other words, every element in the array must follow the same format.  For example:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "parameters": {
      "name": {
        "type": "string"
      }
    }
  }
}
```
### References and Definitions

Currently, JSON Editor only supports schema references to the root node in the format `#/definitions/DEFINITION_NAME`.  For example:

```json
{
  "type": "object",
  "properties": {
    "name": {
      "$ref": "#/definitions/name"
    }
  },
  "definitions": {
    "name": {
      "type": "string",
      "title": "Name"
    }
  }
}
```

### Formats

JSON Editor supports the following values for the `format` parameter:

*  text
*  textarea
*  hidden
*  email
*  url
*  tel
*  number
*  range
*  date
*  month
*  week
*  time
*  datetime
*  datetime-local
*  color

JSON Editor uses HTML5 Input types, so polyfills might be required for full functionality in some browsers.

Here is an example that will show a color picker in browsers that support it:

```json
{
  "type": "object",
  "properties": {
    "color": {
      "type": "string",
      "format": "color"
    }
  }
}
```

The `minimum`, `maximum`, and `multipleOf` schema keywords only affect the UI when the format is set to `range`.  For example, this will show a slider from 10 to 50:

```json
{
  "type": "object",
  "properties": {
    "age": {
      "type": "number",
      "format": "range",
      "minimum": 10,
      "maximum": 50
    }
  }
}
```

Template Macros
------------------
A unique feature of JSON Editor is the support for template macros.  This lets you specify a field's value in terms of other fields.  Templates only work for fields of type `string`.

JSON Editor supports the following template engines out of the box:

*  mustache
*  handlebars
*  hogan
*  swig
*  underscore
*  ejs
*  markup


```json
{
  "type": "object",
  "id": "person",
  "properties": {
    "fname": {
      "title": "First Name",
      "type": "string"
    },
    "lname": {
      "title": "Last Name",
      "type": "string"
    },
    "generated_email": {
      "title": "Generated Email",
      "type": "string",
      "template": "{{ fname }}.{{ lname }}@domain.com",
      "vars": {
        "fname": "person.fname",
        "lname": "person.lname"
      }
    }
  }
}
```

Any time the `fname` or `lname` field is changed, the `generated_email` field will re-calculate its value.  The   `generated_email` field cannot be edited directly.

Any variables you want to use in the template must be declared in the `vars` object.  The key is the variable name and the value is the dot separated path to the field, starting at an ancestor node that has an `id` specified.  

If there are no ancestor nodes with an `id` specified, the special keyword `root` can be used to refer to the outermost object.  For example:

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "name2": {
      "type": "string",
      "template": "{{name}}",
      "vars": {
        "name": "root.name"
      }
    }
  }
}
```

JSON Editor will auto-detect which template engine to default to based on what libraries are loaded on the page.  You can manually set the default template engine anytime by doing:

```js
$.jsoneditor.template = 'handlebars';
```

You can override this default on a per-instance basis by passing a `template` parameter in when initializing:

```js
$("#editor_holder").jsoneditor({
  schema: schema,
  template: 'hogan'
});
```

It's also possible to use a custom templating engine by setting `$.jsoneditor.template` to an object with a `compile` method.

Themes
----------------
JSON Editor can integrate with several different CSS frameworks out of the box.

The currently supported themes are:

*  bootstrap2 (the default)
*  bootstrap3
*  foundation4
*  foundation5
*  jqueryui

The default theme is `bootstrap2`, but this can be changed by setting the `$.jsoneditor.theme` variable.

You can override the default on a per-instance basis by passing a `theme` parameter in when initializing:

```js
$("#editor_holder").jsoneditor({
  schema: schema,
  theme: 'jqueryui'
});
```

There are plans to add additional themes for Foundation 4/5, jQuery Mobile, and Skeleton in the near future.


Editors
-----------------
Each primitive type has its own editor.  A different editor can be used by setting the `editor` property.  The only other editor included is the `table` editor, which is a more compact version of the `array` editor.  Here is an example:

```json
{
  "type": "array",
  "editor": "table",
  "items": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string"
      }
    }
  }
}
```

It is possible to add your own custom editors as well.  Look at any of the included editor classes for examples.

### Editor Options

Some editors accept options which alter the behavior in some way.

Right now, there is only 1 supported option

*  `collapsed` - If set to true for the `object`, `array`, or `table` editor, child editors will be collapsed by default.

```json
{
  "type": "object",
  "options": {
    "collapsed": true
  },
  "properties": {

  }
}
```
