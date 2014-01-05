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
// Set the editor's value
$("#editor_holder").jsoneditor('value',{name: "John Smith"});

// Get the editor's current value
var value = $("#editor_holder").jsoneditor('value');
console.log(value.name) // Will log "John Smith"
```

### Validate

When feasible, JSON Editor won't let users enter invalid data.
However, in some cases it is still possible to enter data that doesn't validate against the schema.

You can use the `validate` method to check if the data is valid or not.

```javascript
// Validate the editor's current value against the schema
var errors = $("#editor_holder").jsoneditor('validate');

if(errors.length) {
  // errors is an array of objects, each with a `path`, `property`, and `message` parameter
  // `property` is the schema keyword that triggered the validation error (e.g. "minLength")
  console.log(errors);
}
else {
  // It's valid!
}
```

By default, this will do the validation with the editor's current value.
If you want to use a different value, you can pass it in as a 2nd parameter.

```javascript
// Validate an arbitrary value against the editor's schema
var errors = $("#editor_holder").jsoneditor('validate',{
  value: {
    to: "test"
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

CSS Integration
----------------
JSON Editor can integrate with several popular CSS frameworks out of the box.

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


JSON Schema Support
-----------------

JSON Editor fully supports version 3 and 4 of the JSON Schema [core][core] and [validation][validation] specifications.  The [hyper-schema][hyper] specification is not supported.

[core]: http://json-schema.org/latest/json-schema-core.html
[validation]: http://json-schema.org/latest/json-schema-validation.html
[hyper]: http://json-schema.org/latest/json-schema-hypermedia.html

The following schema keywords have no effect on the generated form and are
only used during validation.

*  patternProperties
*  additionalProperties
*  dependencies
*  uniqueItems
*  disallow
*  extends
*  allOf
*  anyOf
*  oneOf
*  not

Some of the other keywords have caveats that affect their behavior:

*  enum
*  type
*  $ref
*  definitions
*  format

These caveats are described in detail below.

In addition to the keywords defined in the specification, 
JSON Editor adds 4 custom keywords which allows you to adjust
the generated HTML form in various ways:

*  editor
*  options
*  template
*  vars

These keywords are also described in detail below.

### enum

The `enum` property only affects the UI for schemas of type `string`, `number`, and `integer`.

### type

Version 3 of the JSON Schema specification allows for type to be an arbitrary schema.
This is not supported in JSON Editor.

```json
{
  "type": "object",
  "properties": {
    "simple": {
      "description": "Will show a text input",
      "type": "string"
    },
    "union": {
      "description": "Allows the user to switch the type with a dropdown",
      "type": ["string","number"]
    },
    "not_supported": {
      "description": "This will break",
      "type": [{
        "type": "number",
        "minimum": 5
      }]
    }
  }
}
```

### $ref and definitions

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

You can  optionally pass in the schemas for external urls during initialization:

```javascript
$("#editor").jsoneditor({
  schema: {
    "$ref": "http://mydomain.com/geo.json"
  },
  refs: {
    "http://mydomain.con/geo.json": {
      "type": "object",
      "properties": {
        "city": {
          "type": "string"
        }
      }
    }
  }
});
```

If JSON Editor sees an external url it doesn't already have a schema for, it will attempt to fetch it via Ajax.
If loading from Ajax, the url must either be on the same domain or return the correct HTTP cross domain headers.

### format

JSON Editor supports the following values for the `format` parameter for schemas of type `string`.  They will work with schemas of type `integer` and `number` as well, but some formats may produce weird results.

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

editor
-----------------

JSON Editor uses resolver functions to determine which editor to use for a particular schema or subschema.  

There is an editor for each primitive JSON type.  An additional `table` editor is included, which provides a more compact way to edit arrays.  Custom editors can be added as well (look at existing ones for examples).

Let's say you make a custom `date` editor and want any schema with `format` set to `date` to use this instead of the default `string` editor.  You can do this by adding a resolver function:

```js
// Add a resolver function to the beginning of the resolver list
// This will make it run before any other ones
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

### options

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


template and vars
------------------
A unique feature of JSON Editor is the support for template macros.  This lets you specify a field's value in terms of other fields.  
Templates only work for fields of type `string`, `integer`, and `number`.

JSON Editor uses a barebones template engine by default (simple `{{variable}}` replacement only).

You can change the default by setting `$.jsoneditor.template` to one of the following supported template engines:

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

You can set the template engine on a per-instance basis as well:

```js
$("#editor_holder").jsoneditor({
  schema: schema,
  template: 'hogan'
});
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

### Custom Template Engines

If one of the included template engines isn't sufficient, 
you can use a custom template engine with a `compile` method.  For example:

```js
var myengine = {
  compile: function(template) {
    // Compile should return a render function
    return function(vars) {
      // A real template engine would render the template here
      var result = template;
      return result;
    }
  }
};

// Set globally
$.jsoneditor.template = myengine;

// Set on a per-instance basis
$("#editor").jsoneditor({
  schema: schema,
  template: myengine
});
```
