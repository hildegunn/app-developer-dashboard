/**
 * This utility object contains a few function that is used in various placed, and is more generic functions.
 */
define(function(require, exports, module) {

	"use strict";
	/* jslint bitwise: true */
	/* jshint ignore:start */


	var utils = {
		"guid": function() {
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = Math.random()*16|0;
				var v = c === 'x' ? r : (r & 0x3 | 0x8);
				return v.toString(16);
			});
		},

		"getKeys": function(obj) {
			var list = [];
			if (typeof obj !== "object") {
				return list;
			}
			for(var key in obj) {
				if (obj.hasOwnProperty(key)) {
					list.push(key);
				}
			}
			return list;
		},
		
	    // Normalize search term.
	    "normalizeST": function(searchTerm) {
	        var x = searchTerm.toLowerCase().replace(/[^a-zæøåA-ZÆØÅ ]/g, '');
	        if (x === '') {
	            return null;
	        }
	        return x;
	    },

	    "stok" : function(str) {
	        // console.log("STR", str);
	        if (str === null) {return true;}
	        if (str.length > 2) { return true; }
	        return false;
	    },
	};



	return utils;
	/* jshint ignore:end */
});
