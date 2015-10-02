define(function(require, exports, module) {
	"use strict";	

	var Class = require('lib/class');

	var Model = Class.extend({
		"init": function(props) {
			for(var key in props) {
				this[key] = props[key];
			}
		},
		"getStorable": function(limit) {
			var res = {};

			var selected = {};
			if (limit) {
				for (var i = 0; i < limit.length; i++) {
					selected[limit[i]] = true;
				}
			}


			for(var key in this) {
				if (typeof this[key] !== 'function') {

					if (limit && !selected.hasOwnProperty(key)) {
						continue;
					}

					res[key] = this[key];
				}
			}

			return res;
		},
		"has": function(key) {
			return this.hasOwnProperty(key) && typeof this[key] !== 'function';
		},
		"getView": function() {
			var res = {};
			for(var key in this) {
				if (typeof this[key] !== 'function') {
					res[key] = this[key];
				}
			}

			return res;
		}
	});


	return Model;
});

