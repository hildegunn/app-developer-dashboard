define(function(require, exports, module) {


	var 
		Class = require('./class'),
		Dictionary = require('./Dictionary');



	var parsed = null;

	var TemplateEngine = Class.extend({
		"init": function() {
			if (parsed === null) {
				parsed = JSON.parse(dict);
			}
		},
		"get": function() {
			return parsed;
		}
	});

	return TemplateEngine;

});