({
	baseUrl: "app/js",
	paths: {
		"bower": '../../bower_components',
		"text": '../../bower_components/text/text',
		"templates": '../../templates/',
		"dust": '../../bower_components/dustjs-linkedin/dist/dust-full.min',
		"dustjs-helpers": '../../bower_components/dustjs-helpers/dist/dust-helpers.min',
		"DustIntl": '../../bower_components/dust-helper-intl/dist/dust-intl',
		"class": "lib/class",
		"jquery": "../../bower_components/jquery/dist/jquery.min",
		"dict": "_",
		"es6-promise": "../../bower_components/es6-promise/promise",
		"bootstrap": "../../bower_components/bootstrap/dist/js/bootstrap.min",
		"selectize": "../../bower_components/selectize/dist/js/standalone/selectize",
		"flot": "../../bower_components/flot/jquery.flot.time"
	},
	shim: {
		"DustIntl": {
			"deps": ["dust"],
			"exports": "DustIntl"
		},
		"DustIntlData": {
			"deps": ["DustIntl"]
		},
		"bootstrap": {
			"deps": ["jquery"]
		},
		"flot": {
			"deps": ["jquery", "../../bower_components/flot/jquery.flot.js"]
		}
	},
	name: "../../bower_components/almond/almond",
	include: "main",
	insertRequire: ["main"],
	out: "app/dist/app.min.js"
})
