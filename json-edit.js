      // This is the starting value for the editor
      // We will use this to seed the initial editor 
      // and to provide a "Restore to Default" button.
      var starting_value = {
        name: "John Smith",
        age: 35,
        gender: "male",
        location: {
          city: "San Francisco",
          state: "California"
        },
        pets: [
          {
            name: "Spot",
            type: "dog",
            fixed: true
          },
          {
            name: "Whiskers",
            type: "cat",
            fixed: false
          }
        ]
      };
      
      // Initialize the editor
      var editor = new JSONEditor(document.getElementById('editor_holder'),{
        // Enable fetching schemas via ajax
        ajax: true,  
        // The schema for the editor
        schema: {
          $ref: "person.json"
        },        
        // Seed the form with a starting value
        startval: starting_value
      });
      
      // Hook up the submit button to log to the console
      document.getElementById('submit').addEventListener('click',function() {
        // Get the value from the editor
        console.log(editor.getValue());
      });
      
      // Hook up the Restore to Default button
      document.getElementById('restore').addEventListener('click',function() {
        editor.setValue(starting_value);
      });
      
      // Hook up the validation indicator to update its 
      // status whenever the editor changes
      editor.on('change',function() {
        // Get an array of errors from the validator
        var errors = editor.validate();
        
        var indicator = document.getElementById('valid_indicator');
        
        // Not valid
        if(errors.length) {
          indicator.className = 'label alert';
          indicator.textContent = 'not valid';
        }
        // Valid
        else {
          indicator.className = 'label success';
          indicator.textContent = 'valid';
        }
      });
  