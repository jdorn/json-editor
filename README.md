JSON Editor
===========

![JSON Schema -> HTML Editor -> JSON](https://raw.github.com/jdorn/json-editor/master/jsoneditor.png)

JSON Editor will create an HTML editor from a JSON Schema and output JSON data that matches the schema.
It supports a large subset of JSON Schema and can integrate with several popular CSS frameworks (bootstrap, foundation, and jQueryUI).

Check out an example: http://rawgithub.com/jdorn/json-editor/master/example.html

Download the [production version][min] or the [development version][max].

[min]: https://raw.github.com/jdorn/json-editor/master/dist/jquery.jsoneditor.min.js
[max]: https://raw.github.com/jdorn/json-editor/master/dist/jquery.jsoneditor.js

Requirements
-----------------

*  A recent version of jQuery
*  A modern browser

### Optional Requirements

*  A compatible javascript template engine (Mustache, Underscore, Hogan, Handlebars, Swig, Markup, or EJS)
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

If you want to set an initial value for the editor, pass in a `startval` parameter.

```javascript
$("#editor_holder").jsoneditor({
  schema: {
    type: "object",
    properties: {
      name: {
        type: "string"
      }
    }
  },
  startval: {
    "name": "Jane Doe"
  }
});
```

JSON Editor does the initialization asynchronously, so before using any of the following API methods, you must listen for the `ready` event.

```javascript
$("#editor_holder").jsoneditor({schema: schema}).on('ready',function() {
  // Do something here
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

You can use the `validate` method to check if the data is valid or not.

```javascript
// Validate the editor's current value against the schema
$("#editor_holder").jsoneditor('validate',function(errors) {
  if(errors) {
    // if it's not valid, errors will contain an array of objects, 
    // each with a `path` and `message` property
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

This removes the editor HTML from the DOM and frees up memory.

```javascript
$("#editor_holder").jsoneditor('destroy');
```

JSON Schema Support
-----------------
JSON Editor supports most of the JSON Schema [core][core] and [validation][validation] specifications.  The [hyper-schema][hyper] specification is not supported.

[core]: http://json-schema.org/latest/json-schema-core.html
[validation]: http://json-schema.org/latest/json-schema-validation.html
[hyper]: http://json-schema.org/latest/json-schema-hypermedia.html

The following schema keywords are __NOT__ supported and will be ignored:

*  additionalItems
*  additionalProperties
*  allOf
*  anyOf
*  dependencies
*  not
*  oneOf
*  patternProperties

Everything else behaves as described in the specification, but a few have caveats.  These are described below.

In addition, JSON Editor has the following 4 custom schema keywords, which are also described below.

*  editor
*  options
*  template
*  vars

The eventual goal of this project is to provide support for 100% of the JSON Schema specification,
so this list of caveats and unsupported keywords will get smaller over time.

### Types

The following schema types are supported:

*  array
*  boolean
*  integer
*  number
*  object
*  string

Compound types are not supported.

#### Arrays

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

### Enum

The `enum` property is only supported for schemas of type `string`, `number`, and `integer`.

### References and Definitions

JSON Editor supports references to external urls and local definitions.  Here's an example showing both:

```json
{
  "type": "object",
  "properties": {
    "name": {
      "title": "Full Name",
      "$ref": "#/definitions/name"
    },
    "location": {
      "$ref": "http://mydomain.com/geo.json"
    }
  },
  "definitions": {
    "name": {
      "type": "string",
      "minLength": 5
    }
  }
}
```

Local references must point to the `definitions` object of the root node of the schema and can't be nested.
So, both `#/customkey/name` and `#/definitions/name/first` will throw an exception.

External urls are loaded with an AJAX request, so they must either be on the same domain or have the correct HTTP cross domain headers.
```

### Required

If a field is marked as not required, there will be an "add/remove" link.  

As per the spec, the `required` attribute only cares that the property exists and doesn't look at the value at all.

Some other JSON Schema based editors require a non-empty value in order to validate against `required`, but JSON Editor does not.

The proper way to require a non-empty value is to use the `minLength` or `minItems` schema keywords.

### Formats

JSON Editor supports the following values for the `format` parameter for schemas of type `string`.  They will work with schemas of type `integer` and `number` as well, but some formats may produce weird results (e.g. "email").

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

JSON Editor uses HTML5 input types, so some of these may render as basic text input in older browsers.

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

```javascript
$.jsoneditor.theme = 'foundation5';
```

You can override this default on a per-instance basis by passing a `theme` parameter in when initializing:

```js
$("#editor_holder").jsoneditor({
  schema: schema,
  theme: 'jqueryui'
});
```

It's possible to create your own custom themes as well.  Look at any of the existing theme classes for examples.

Template Macros
------------------
A unique feature of JSON Editor is the support for template macros.  This lets you specify a field's value in terms of other fields.  
Templates only work for fields of type `string`, `integer`, and `number`.

JSON Editor uses a barebones template engine by default (simple `{{variable}}` replacement only).

You can use another template engine by setting `$.jsoneditor.template` to one of the following supported libraries:

*  ejs
*  handlebars
*  hogan
*  markup
*  mustache
*  swig
*  underscore

```javascript
$.jsoneditor.template = 'handlebars';
```

Here's an example template macro that generates an email address based on a first and last name:

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "object",
      "properties": {
        "first": {
          "type": "string"
        },
        "last": {
          "type": "string"
        }
      }
    },
    "email": {
      "title": "Generated Email",
      "type": "string",
      "template": "{{ fname }}.{{ lname }}@domain.com",
      "vars": {
        "fname": "name.first",
        "lname": "name.last"
      }
    }
  }
}
```

Any time the `fname` or `lname` field is changed, the `generated_email` field will re-calculate its value.

Any variables you want to use in the template must be declared in the `vars` object.  
By default, the variable paths (`name.first` and `name.last` in this example) are relative to the root schema.
You can make the variable paths relative to any ancestor node with a schema `id` defined as well.  This is especially useful within arrays.  Here's an example:

```json
{
    "type": "array",
    "items": {
        "id": "http://example.com/person",
        "type": "object",
        "properties": {
            "address": {
                "type": "object",
                "properties": {
                  "city": {
                    "type": "string"
                  },
                  "state": {
                    "type": "string"
                  }
                }
            },
            "location": {
                "type": "string",
                "template": "{{city}}, {{state}}",
                "vars": {
                    "city": ["http://example.com/person","address.city"],
                    "state": ["http://example.com/person","address.state"]
                }
            }
        }
    }
}
```

In this example, the `location` field will be generated using the `city` and `state` fields from each row.

Custom Template Engines
============

If you need to support multiple template engines for whatever reason, you can override the global `$.jsoneditor.template` setting on a per-instance basis:

```js
$("#editor_holder").jsoneditor({
  schema: schema,
  template: 'hogan'
});
```

It's also possible to use a custom template engine by using an object with a `compile` method.  For example:

```js
$.jsoneditor.template = {
  compile: function(template) {
    // Compile should return a render function
    return function(vars) {
      // A real template engine would render the template here
      var result = template;
      return result;
    }
  }
};
```

Editors
-----------------

JSON Editor uses resolver functions to determine which editor to use for a particular schema or subschema.  
The default resolver function uses the `type` schema keyword to choose the editor to use.  So, `{"type": "integer"}` will use the `integer` editor.

There is an editor for each primitive JSON type.  An additional `table` editor is included, which provides a more compact way to edit arrays.  Custom editors can be added as well (look at existing ones for examples).

Let's say you make a custom `date` editor and want any schema with `format` set to `date` to use this instead of the `string` editor.  You can do this by adding a resolver function:

```js
// Add a resolver function to the beginning of the resolver list
// This will make it run before any other resolver functions
$.jsoneditor.resolvers.unshift(function(schema) {
  if(schema.format === "date") {
    return "date";
  }
  
  // If no valid editor is returned, the next resolver function will be used
});
```

There is a special schema keyword `editor` which takes precedence over all the resolver functions when set.
For example, this schema will use the `table` editor, no matter what the resolver functions are.

```json
{
  "type": "array",
  "editor": "table",
  "items": {
    "type": "number"
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
