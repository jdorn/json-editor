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
*  A compatible CSS Framework for styling (bootstrap 2/3, foundation 3/4/5, or jqueryui)

Usage
--------------

### Initialize

```javascript
$("#editor_holder").jsoneditor({
  schema: {
    type: "object",
    properties: {
      name: {
        type: "string"
      }
    }
  }
});
```

### Get/Set Value

```javascript
// Set the editor's value with a JSON object
$("#editor_holder").jsoneditor('value',{name: "John Smith"});

// Get the editor's current value as a JSON object
var value = $("#editor_holder").jsoneditor('value');
console.log(value.name) // Will log "John Smith"
```

### Validate

When feasible, JSON Editor won't let users enter invalid data.  
However, in some cases it is still possible to enter data that doesn't validate against the schema.
For those instances, you can use the `validate` method to check if the data is valid or not.

```javascript
// Validate the editor's current value against the schema
$("#editor_holder").jsoneditor('validate',function(errors) {
  if(errors) {
    // if it's not valid, errors will contain an array of objects, each with a `path` and `message` property
    console.log(errors);
  }
  else {
    // It's valid!
  }
});
```

### Listen for Changes

The `change` event is fired whenever the editor's value changes.  When using macro templates, multiple `change` events may fire in quick succession.

```javascript
$("#editor_holder").on('change',function() {});
```

### Destroy

This removes the editor HTML from the DOM and prepares everything for garbage collection.

```javascript
$("#editor_holder").jsoneditor('destroy');
```

JSON Schema Support
-----------------
JSON Editor supports a subset of the JSON Schema draft specification.

The following JSON schema keywords are supported.  All other keywords from the specification will be ignored.

*  default
*  definitions
*  description
*  enum (for type `string` only)
*  exclusiveMaximum
*  exclusiveMinimum
*  format
*  id
*  items
*  maxItems
*  maximum
*  maxLength
*  minItems
*  minimum
*  minLength
*  multipleOf
*  pattern
*  properties
*  title
*  type
*  uniqueItems
*  $ref

Most of these keywords behave as described in the specification, but several have caveats, which are described below.

In addition, there are a few custom keywords supported which are not in the spefication:

*  editor
*  options
*  template
*  vars

### Types

The following schema types are supported:

*  array
*  boolean
*  integer
*  number
*  object
*  string

Compound types are not supported.

### Arrays

JSON Editor only supports arrays with a single `items` schema.  In other words, every element in the array must have the same structure.  For example:

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

JSON Editor supports the following values for the `format` parameter for fields of type `string`.

*  color
*  date
*  datetime
*  datetime-local
*  email
*  hidden
*  month
*  number
*  range
*  tel
*  text
*  textarea
*  time
*  url
*  week

JSON Editor uses HTML5 input types, so polyfills might be required for full functionality in older browsers.

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

Themes
----------------
JSON Editor can integrate with several different CSS frameworks out of the box.

The currently supported themes are:

*  html (the default)
*  bootstrap2
*  bootstrap3
*  foundation3
*  foundation4
*  foundation5
*  jqueryui

The default theme is `html`, which doesn't use any special class names or styling.
This default can be changed by setting the `$.jsoneditor.theme` variable.

You can also override the default on a per-instance basis by passing a `theme` parameter in when initializing:

```js
$("#editor_holder").jsoneditor({
  schema: schema,
  theme: 'jqueryui'
});
```

It's possible to create your own custom themes as well.  Look at any of the existing theme classes for examples.

Template Macros
------------------
A unique feature of JSON Editor is the support for template macros.  This lets you specify a field's value in terms of other fields.  Templates only work for fields of type `string`.

JSON Editor supports the following template engines out of the box:

*  ejs
*  handlebars
*  hogan
*  markup
*  mustache
*  swig
*  underscore

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

Editors
-----------------

JSON Editor uses resolver functions to determine which editor to use for a particular schema or subschema.  
The default resolver function uses the `type` schema keyword to choose the editor to use.

There is an editor for each primitive JSON type.  An additional `table` editor is included, which provides a more compact way to edit arrays.

You can add your own resolver functions easily.  Let's say you want all schemas of type `array` to use the `table` editor.

```js
// Add a resolver function to the beginning of the resolver list
// This will make it run before any other resolver functions
$.jsoneditor.resolvers.unshift(function(schema) {
  // If this schema is of type `array`, use the table editor
  if(schema.type && schema.type === "array") {
    return "table";
  }
  
  // If the resolver function returns a falsy value or a non-existant editor, the next resolver function will be used.
});
```

There is a special schema keyword `editor` which takes precedence over all the resolver functions when set.
For example, this schema will use the `table` editor, no matter what the resolver functions are.

```json
{
  type: "array",
  editor: "table",
  items: {
    type: "number"
  }
}
```

You can create your own custom editors as well.  Look at any of the existing editors for examples.

### Editor Options

Editors can accept options which alter the behavior in some way.

Right now, there is only 1 supported option

*  `collapsed` - If set to true for the `object`, `array`, or `table` editor, child editors will be collapsed by default.

```json
{
  "type": "object",
  "options": {
    "collapsed": true
  },
  "properties": {
    "name": {
      "type": "string" 
    }
  }
}
```
