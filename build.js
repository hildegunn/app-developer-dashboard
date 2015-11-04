({
	baseUrl: "app/js",
	paths: {
		"bower": '../../bower_components',
		"text": '../../bower_components/text/text',
		"templates": '../../templates/',
		"dust": '../../bower_components/dustjs-linkedin/dist/dust-full.min',
		"class": "lib/class",
		"jquery": "../../bower_components/jquery/dist/jquery.min",
		"dict": "_",
		"es6-promise": "../../bower_components/es6-promise/promise",
		"bootstrap": "../../bower_components/bootstrap/dist/js/bootstrap.min"
	},
	shim: {
		"dust": {
			"exports": "dust"
		},
		"bootstrap": {
			"deps": ["jquery"]
		}
	},
	name: "../../bower_components/almond/almond",
	include: "main",
	insertRequire: ["main"],
	out: "app/dist/app.min.js"
})
