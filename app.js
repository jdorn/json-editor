const express = require('express')
const app = express()
const path = require('path');
const fs = require('fs')
const Handlebars = require('handlebars');

const bodyParser = require('body-parser');

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use('/editor', express.static(path.join(__dirname, 'editor')))
app.use('/pages', express.static(path.join(__dirname, 'pages')));

Handlebars.registerHelper('compare', function (lvalue, rvalue, options) {

	if (arguments.length < 3)
		throw new Error("Handlerbars Helper 'compare' needs 2 parameters");

	var operator = options.hash.operator || "==";

	var operators = {
		'==': function (l, r) {
			return l == r;
		},
		'===': function (l, r) {
			return l === r;
		},
		'!=': function (l, r) {
			return l != r;
		},
		'<': function (l, r) {
			return l < r;
		},
		'>': function (l, r) {
			return l > r;
		},
		'<=': function (l, r) {
			return l <= r;
		},
		'>=': function (l, r) {
			return l >= r;
		},
		'typeof': function (l, r) {
			return typeof l == r;
		}
	}

	if (!operators[operator])
		throw new Error("Handlerbars Helper 'compare' doesn't know the operator " + operator);

	var result = operators[operator](lvalue, rvalue);

	if (result) {
		return options.fn(this);
	} else {
		return options.inverse(this);
	}

});

fs.readdir(path.join(__dirname, '/pages/hbs/partials'), function (err, files) {
	if (err) {
		console.error("Could not list the directory.", err);
		process.exit(1);
	}

	files.forEach(function (filename) {

		fs.readFile(path.join(__dirname, '/pages/hbs/partials', filename), 'utf-8', function (err, content) {
			if (err) {
				onError(err);
				return;
			}

			Handlebars.registerPartial(filename.replace('.hbs', ''), content);
		});
	});
});


app.get('/', function (req, res) {
	res.send('Hello World!')
})

app.get('/api/pages', function (req, res) {

	fs.readdir(path.join(__dirname, '/pages/data'), function (err, files) {
		if (err) {
			console.error("Could not list the directory.", err);
			process.exit(1);
		}

		var fileList = [];

		for (i = 0; i < files.length; i++) {
			fileList.push(files[i].replace('.json', ''))
		}

		res.json(fileList);
	})

})

app.get('/api/page/:pageName', function (req, res) {

	fs.readFile(path.join(__dirname, '/pages/data/' + req.params.pageName + '.json'), 'utf8', function (err, data) {
		if (err) {
			return console.log(err);
		}

		res.json(JSON.parse(data));
	});

})

app.post('/api/page/:pageName', function (req, res) {

	fs.writeFile(path.join(__dirname, '/pages/data/' + req.params.pageName + '.json'), JSON.stringify(req.body), function (err) {
		if (err) {
			return console.log(err);
		}

		fs.readFile(path.join(__dirname, '/pages/hbs/pages/' + req.body.template), 'utf8', function (err, source) {
			if (err) {
				return console.log(err);
			}

			var template = Handlebars.compile(source);

			var result = template(req.body);

			console.log("HBS Generated!");

			fs.writeFile(path.join(__dirname, '/pages/html/' + req.params.pageName + '.html'), result, function (err) {
				if (err) {
					return console.log(err);
				}

				console.log("HTML Saved!");


			});
		});

		console.log("JSON Saved!");
	});


	res.json({ 'status': 'success' });

})

app.listen(3000, function () {
	console.log('Example app listening on port 3000!')
})