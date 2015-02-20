define(function(require, exports, module) {


	var 
		Class = require('./class');

	var StringSet = Class.extend({
		"init": function(set) {
			this.items = {};
			if (set) this.add(set);
		},
		"add": function(key) {
			if (typeof key === 'string') {
				this.items[key] = true;	
			} else if (key.length) {
				for(var i = 0; i < key.length; i++) {
					this.add(key[i]);
				}
			}
			return this;
		},
		"remove": function(key) {
			if (typeof key === 'string') {
				if (this.items.hasOwnProperty(key)) {
					delete this.items[key];
				}
			} else if (key.length) {
				for(var i = 0; i < key.length; i++) {
					this.remove(key[i]);
				}
			}
			return this;
		},
		"has": function(key) {
			return this.items.hasOwnProperty(key);
		},
		"asList": function() {
			var list = [];
			for(var key in this.items) {
				list.push(key);
			}
			return list;
		} 
	});

	return StringSet;

});