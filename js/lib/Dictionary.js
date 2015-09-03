define(function(require, exports, module) {
	"use strict";

	var 
		Class = require('./class'),
		dict = require('text!dict');

	var parsed = null;

	var Dictionary = Class.extend({
		"init": function() {
			if (parsed === null) {
				parsed = JSON.parse(dict);
			}
		},
		"get": function() {
			return parsed;
		}
	});

	return Dictionary;

});