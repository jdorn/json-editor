JSONEditor.defaults.languages.de = {
  /**
   * When a property is not set
   */
  error_notset: "Attribut muss gesetzt sein",
  /**
   * When a string must not be empty
   */
  error_notempty: "Eingabe benötigt",
  /**
   * When a value is not one of the enumerated values
   */
  error_enum: "Die Eingabe muss einem der aufgeführten Werte entsprechen",
  /**
   * When a value doesn't validate any schema of a 'anyOf' combination
   */
  error_anyOf: "Die Eingabe muss gegen mindestens eines der gegebenen Schemata validiert werden können",
  /**
   * When a value doesn't validate
   * @variables This key takes one variable: The number of schemas the value does not validate
   */
  error_oneOf: 'Die Eingabe muss gegen genau eines der gegebenen Schemata validiert werden können. Momentan können {{0}} Schemata validiert werden',
  /**
   * When a value does not validate a 'not' schema
   */
  error_not: "Die Eingabe darf nicht gegen das gegebene Schema validiert werden können",
  /**
   * When a value does not match any of the provided types
   */
  error_type_union: "Die Eingabe muss einem der gegebenen Typen entsprechen",
  /**
   * When a value does not match the given type
   * @variables This key takes one variable: The type the value should be of
   */
  error_type: "Die Eingabe muss vom Typ {{0}} sein",
  /**
   *  When the value validates one of the disallowed types
   */
  error_disallow_union: "Die Eingabe darf nicht einem der gegebenen Werte entsprechen",
  /**
   *  When the value validates a disallowed type
   * @variables This key takes one variable: The type the value should not be of
   */
  error_disallow: "Die Eingabe muss vom Typ {{0}} sein",
  /**
   * When a value is not a multiple of or divisible by a given number
   * @variables This key takes one variable: The number mentioned above
   */
  error_multipleOf: "Die Eingabe muss ein Vielfaches von {{0}} sein",
  /**
   * When a value is greater than it's supposed to be (exclusive)
   * @variables This key takes one variable: The maximum
   */
  error_maximum_excl: "Die Eingabe muss kleiner als {{0}} sein",
  /**
   * When a value is greater than it's supposed to be (inclusive
   * @variables This key takes one variable: The maximum
   */
  error_maximum_incl: "Die Eingabe darf höchstens {{0}} sein",
  /**
   * When a value is lesser than it's supposed to be (exclusive)
   * @variables This key takes one variable: The minimum
   */
  error_minimum_excl: "Die Eingabe muss größer als {{0}} sein",
  /**
   * When a value is lesser than it's supposed to be (inclusive)
   * @variables This key takes one variable: The minimum
   */
  error_minimum_incl: "Die Eingabe muss mindestens {{0}} sein",
  /**
   * When a value have too many characters
   * @variables This key takes one variable: The maximum character count
   */
  error_maxLength: "Die Eingabe darf höchstens {{0}} Zeichen lang sein",
  /**
   * When a value does not have enough characters
   * @variables This key takes one variable: The minimum character count
   */
  error_minLength: "Die Eingabe muss mindestens {{0}} Zeichen lang sein",
  /**
   * When a value does not match a given pattern
   */
  error_pattern: "Die Eingabe muss dem gegebenen Muster entsprechen",
  /**
   * When an array has additional items whereas it is not supposed to
   */
  error_additionalItems: "In diesem Feld sind keine weiteren Elemente erlaubt",
  /**
   * When there are to many items in an array
   * @variables This key takes one variable: The maximum item count
   */
  error_maxItems: "Das Feld darf höchstens {{0}} Element(e) beinhalten",
  /**
   * When there are not enough items in an array
   * @variables This key takes one variable: The minimum item count
   */
  error_minItems: "Das Feld muss mindestens {{0}} Element(e) beinhalten",
  /**
   * When an array is supposed to have unique items but has duplicates
   */
  error_uniqueItems: "Das Feld darf nur einzigartige Elemente beinhalten",
  /**
   * When there are too many properties in an object
   * @variables This key takes one variable: The maximum property count
   */
  error_maxProperties: "Das Objekt darf höchstens {{0}} Attribute haben",
  /**
   * When there are not enough properties in an object
   * @variables This key takes one variable: The minimum property count
   */
  error_minProperties: "Das Objekt muss mindestens {{0}} Attribute haben",
  /**
   * When a required property is not defined
   * @variables This key takes one variable: The name of the missing property
   */
  error_required: "Das Objekt beinhaltet nicht das benötigte Attribut '{{0}}'",
  /**
   * When there is an additional property is set whereas there should be none
   * @variables This key takes one variable: The name of the additional property
   */
  error_additional_properties: "Es sind keine weiteren Attribute erlaubt. {{0}} muss entfernt werden",
  /**
   * When a dependency is not resolved
   * @variables This key takes one variable: The name of the missing property for the dependency
   */
  error_dependency: "Das Attribut {{0}} ist zwingend erforderlich",
  /**
   * Button text to add an element
   */
  button_text_add: "Hinzufügen",
  /**
   * Button title to add an element
   */
  button_title_add: "Hinzufügen",
  /**
   * Button text to add a property/array element
   * @variables This key takes one variable: The name of the element to add
   */
  button_text_add_row: "{{0}}",
  /**
   * Button title to add a property/array element
   * @variables This key takes one variable: The name of the element to add
   */
  button_title_add_row: "{{0}} hinzufügen",
  /**
   * Button text to open the json structure editor
   */
  button_text_edit_json: "JSON",
  /**
   * Button text to open the json structure editor
   */
  button_title_edit_json: "JSON bearbeiten",
  /**
   * Button text to select object properties
   */
  button_text_object_properties: "Attribute",
  /**
   * Button text to select object properties
   */
  button_title_object_properties: "Objekt Attribute",
  /**
   * Button text to upload a file
   */
  button_text_upload: "Hochladen",
  /**
   * Button title to upload a file
   */
  button_title_upload: "Hochladen",
  /**
   * Button text to delete an element
   */
  button_text_delete: "",
  /**
   * Button title to delete an element
   */
  button_title_delete: "Löschen",
  /**
   * Button text to delete a property/array element
   * @variables This key takes one variable: The name of the element to delete
   */
  button_text_delete_row: "{{0}}",
  /**
   * Button title to delete a property/array element
   * @variables This key takes one variable: The name of the element to delete
   */
  button_title_delete_row: "{{0}} löschen",
  /**
   * Button text to delete the last property/array element
   * @variables This key takes one variable: The type of the element to delete
   */
  button_text_delete_last: "Letztes {{0}}-Element",
  /**
   * Button title to delete the last property/array element
   * @variables This key takes one variable: The type of the element to delete
   */
  button_title_delete_last: "Letztes {{0}}-Element löschen",
  /**
   * Button text to delete all properties/array elements
   */
  button_text_delete_all: "Alle",
  /**
   * Button title to delete all properties/array elements
   */
  button_title_delete_all: "Alle löschen",
  /**
   * Button text to move up an array element in the array editor
   */
  button_text_moveup: "",
  /**
   * Button title to move up an array element in the array editor
   */
  button_title_moveup: "Nach oben verschieben",
  /**
   * Button text to move down an array element in the array editor
   */
  button_text_movedown: "",
  /**
   * Button title to move down an array element in the array editor
   */
  button_title_movedown: "Nach unten verschieben",
  /**
   * Button text to collapse the array/object editor
   */
  button_text_collapse: "",
  /**
   * Button title to collapse the array/object editor
   */
  button_title_collapse: "Einklappen",
  /**
   * Button text to expand the array/object editor
   */
  button_text_expand: "",
  /**
   * Button title to expand the array/object editor
   */
  button_title_expand: "Ausklappen",
  /**
   * Button text to save an object
   */
  button_text_save: "Speichern",
  /**
   * Button title to save an object
   */
  button_title_save: "Speichern",
  /**
   * Button text to cancel editing
   */
  button_text_cancel: "Abbrechen",
  /**
   * Button title to cancel editing
   */
  button_title_cancel: "Abbrechen",
  /**
   * Placeholder for the input box in the object property selection
   */
  placeholder_object_property: "Attributname ..."
};
