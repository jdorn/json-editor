JSONEditor.defaults.languages.en = {
  /**
   * When a property is not set
   */
  error_notset: "Property must be set",
  /**
   * When a string must not be empty
   */
  error_notempty: "Value required",
  /**
   * When a value is not one of the enumerated values
   */
  error_enum: "Value must be one of the enumerated values",
  /**
   * When a value doesn't validate any schema of a 'anyOf' combination
   */
  error_anyOf: "Value must validate against at least one of the provided schemas",
  /**
   * When a value doesn't validate
   * @variables This key takes one variable: The number of schemas the value does not validate
   */
  error_oneOf: 'Value must validate against exactly one of the provided schemas. It currently validates against {{0}} of the schemas.',
  /**
   * When a value does not validate a 'not' schema
   */
  error_not: "Value must not validate against the provided schema",
  /**
   * When a value does not match any of the provided types
   */
  error_type_union: "Value must be one of the provided types",
  /**
   * When a value does not match the given type
   * @variables This key takes one variable: The type the value should be of
   */
  error_type: "Value must be of type {{0}}",
  /**
   *  When the value validates one of the disallowed types
   */
  error_disallow_union: "Value must not be one of the provided disallowed types",
  /**
   *  When the value validates a disallowed type
   * @variables This key takes one variable: The type the value should not be of
   */
  error_disallow: "Value must not be of type {{0}}",
  /**
   * When a value is not a multiple of or divisible by a given number
   * @variables This key takes one variable: The number mentioned above
   */
  error_multipleOf: "Value must be a multiple of {{0}}",
  /**
   * When a value is greater than it's supposed to be (exclusive)
   * @variables This key takes one variable: The maximum
   */
  error_maximum_excl: "Value must be less than {{0}}",
  /**
   * When a value is greater than it's supposed to be (inclusive
   * @variables This key takes one variable: The maximum
   */
  error_maximum_incl: "Value must at most {{0}}",
  /**
   * When a value is lesser than it's supposed to be (exclusive)
   * @variables This key takes one variable: The minimum
   */
  error_minimum_excl: "Value must be greater than {{0}}",
  /**
   * When a value is lesser than it's supposed to be (inclusive)
   * @variables This key takes one variable: The minimum
   */
  error_minimum_incl: "Value must be at least {{0}}",
  /**
   * When a value have too many characters
   * @variables This key takes one variable: The maximum character count
   */
  error_maxLength: "Value must be at most {{0}} characters long",
  /**
   * When a value does not have enough characters
   * @variables This key takes one variable: The minimum character count
   */
  error_minLength: "Value must be at least {{0}} characters long",
  /**
   * When a value does not match a given pattern
   */
  error_pattern: "Value must match the provided pattern",
  /**
   * When an array has additional items whereas it is not supposed to
   */
  error_additionalItems: "No additional items allowed in this array",
  /**
   * When there are to many items in an array
   * @variables This key takes one variable: The maximum item count
   */
  error_maxItems: "Value must have at most {{0}} items",
  /**
   * When there are not enough items in an array
   * @variables This key takes one variable: The minimum item count
   */
  error_minItems: "Value must have at least {{0}} items",
  /**
   * When an array is supposed to have unique items but has duplicates
   */
  error_uniqueItems: "Array must have unique items",
  /**
   * When there are too many properties in an object
   * @variables This key takes one variable: The maximum property count
   */
  error_maxProperties: "Object must have at most {{0}} properties",
  /**
   * When there are not enough properties in an object
   * @variables This key takes one variable: The minimum property count
   */
  error_minProperties: "Object must have at least {{0}} properties",
  /**
   * When a required property is not defined
   * @variables This key takes one variable: The name of the missing property
   */
  error_required: "Object is missing the required property '{{0}}'",
  /**
   * When there is an additional property is set whereas there should be none
   * @variables This key takes one variable: The name of the additional property
   */
  error_additional_properties: "No additional properties allowed, but property {{0}} is set",
  /**
   * When a dependency is not resolved
   * @variables This key takes one variable: The name of the missing property for the dependency
   */
  error_dependency: "Must have property {{0}}",
  /**
   * Button text to add an element
   */
  button_text_add: "add",
  /**
   * Button title to add an element
   */
  button_title_add: "add",
  /**
   * Button text to add a property/array element
   * @variables This key takes one variable: The name of the element to add
   */
  button_text_add_row: "{{0}}",
  /**
   * Button title to add a property/array element
   * @variables This key takes one variable: The name of the element to add
   */
  button_title_add_row: "Add {{0}}",
  /**
   * Button text to open the json structure editor
   */
  button_text_edit_json: "JSON",
  /**
   * Button text to open the json structure editor
   */
  button_title_edit_json: "Edit JSON",
  /**
   * Button text to select object properties
   */
  button_text_object_properties: "Properties",
  /**
   * Button text to select object properties
   */
  button_title_object_properties: "Object Properties",
  /**
   * Button text to upload a file
   */
  button_text_upload: "Upload",
  /**
   * Button title to upload a file
   */
  button_title_upload: "Upload",
  /**
   * Button text to delete an element
   */
  button_text_delete: "",
  /**
   * Button title to delete an element
   */
  button_title_delete: "Delete",
  /**
   * Button text to delete a property/array element
   * @variables This key takes one variable: The name of the element to delete
   */
  button_text_delete_row: "{{0}}",
  /**
   * Button title to delete a property/array element
   * @variables This key takes one variable: The name of the element to delete
   */
  button_title_delete_row: "Delete {{0}}",
  /**
   * Button text to delete the last property/array element
   * @variables This key takes one variable: The type of the element to delete
   */
  button_text_delete_last: "Last {{0}}",
  /**
   * Button title to delete the last property/array element
   * @variables This key takes one variable: The type of the element to delete
   */
  button_title_delete_last: "Delete Last {{0}}",
  /**
   * Button text to delete all properties/array elements
   */
  button_text_delete_all: "All",
  /**
   * Button title to delete all properties/array elements
   */
  button_title_delete_all: "Delete All",
  /**
   * Button text to move up an array element in the array editor
   */
  button_text_moveup: "",
  /**
   * Button title to move up an array element in the array editor
   */
  button_title_moveup: "Move up",
  /**
   * Button text to move down an array element in the array editor
   */
  button_text_movedown: "",
  /**
   * Button title to move down an array element in the array editor
   */
  button_title_movedown: "Move down",
  /**
   * Button text to collapse the array/object editor
   */
  button_text_collapse: "",
  /**
   * Button title to collapse the array/object editor
   */
  button_title_collapse: "Collapse",
  /**
   * Button text to expand the array/object editor
   */
  button_text_expand: "",
  /**
   * Button title to expand the array/object editor
   */
  button_title_expand: "Expand",
  /**
   * Button text to save an object
   */
  button_text_save: "Save",
  /**
   * Button title to save an object
   */
  button_title_save: "Save",
  /**
   * Button text to cancel editing
   */
  button_text_cancel: "Cancel",
  /**
   * Button title to cancel editing
   */
  button_title_cancel: "Cancel",
  /**
   * Placeholder for the input box in the object property selection
   */
  placeholder_object_property: "Property name..."
};
