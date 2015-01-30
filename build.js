({
	baseUrl: "js",
	paths: {
		"bower"     : '../bower_components',
		"text"      : '../bower_components/text/text',
		"templates" : '../templates/',
		"dust"      : '../bower_components/dustjs-linkedin/dist/dust-full.min',
		"class"     : "lib/class",
	},
	shim: {
		"dust": {
			"exports": "dust"
		}
	},
	name: "../bower_components/almond/almond",
	include: "main-dev",
	out: "dist/app.min.js"
})