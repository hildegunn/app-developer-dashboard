define(function(require, exports, module) {

	"use strict";
	var 
		Class = require('./class'),
		Dictionary = require('./Dictionary'),
		utils  = require('./utils'),
		dust = require('dust');

	var TemplateEngine = Class.extend({
		"init": function(template) {
			this.index = utils.guid();
			// console.log("Template got index " + this.index);
			dust.loadSource(dust.compile(template, this.index));
		},
		"loadPartial": function(id, template) {
			dust.loadSource(dust.compile(template, id));
		},
		"getIndex": function() {
			return this.index;
		},
		"render": function(el, view) {
			var that = this;
			return new Promise(function(resolve, reject) {
				dust.render(that.index, view, function(err, out) {
					if (err) { return reject(err); }
					el.append(out);
					resolve();
				});
			});
		}

	});

	dust.filters.acceptnewline = function(value) {
		
		return value.replace(/[\r\n]{2,}/g, '<br /><br />');
	}

	return TemplateEngine;

});