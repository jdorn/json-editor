JSONEditor.defaults.propertySorters.propertyOrder = function (editors) {
  var property_order = Object.keys(editors);
  return property_order.sort(function (a, b) {
    var ordera = editors[a].schema.propertyOrder;
    var orderb = editors[b].schema.propertyOrder;
    if (typeof ordera !== "number") ordera = 1000;
    if (typeof orderb !== "number") orderb = 1000;

    return ordera - orderb;
  });
};

JSONEditor.defaults.propertySorters.native = function (editors) {
  var property_order = Object.keys(editors);
  return property_order.sort();
};
