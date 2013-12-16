/*! JSON Editor v0.2.0 - JSON Schema -> HTML Editor
 * By Jeremy Dorn - https://github.com/jdorn/json-editor/
 * Released under the MIT license
 *
 * Date: 2013-11-24
 */

/**
 * Requires jQuery.
 * Uses Bootstrap 2.X classnames for styling by default. Also supports Bootstrap 3 and jQueryUI.
 * A templating engine is required if you want to use macro templates.
 *
 * Supports a subset of the JSON Schema specification with a few extra
 * features and custom types as well.
 *
 * Example Usage:
 *
 * var schema = {
 *   type: "object",
 *   title: "Person",
 *   properties: {
 *     firstname: {
 *       type: "string"
 *     },
 *     age: {
 *       type: "integer"
 *     }
 *   }
 * };
 * $("#editor").jsoneditor({
 *   schema: schema
 * });
 *
 * $("#editor").jsoneditor('value',{
 *   firstname: "Jeremy",
 *   age: 24
 * });
 *
 * var value = $("#editor").jsoneditor('value');
 * console.log(value);
 *
 * $("#editor").jsoneditor('destroy');
 */

(function($) {  
