define(function(require, exports, module) {
	"use strict";

	var
		Dictionary = require('../../Dictionary'),
		Controller = require('../Controller'),
		TemplateEngine = require('bower/feideconnectjs/src/TemplateEngine'),
		EventEmitter = require('../../EventEmitter'),
		utils = require('../../utils'),
		$ = require('jquery');


	var template = require('text!templates/OrgListSelector.html');


	var OrgListSelector = Controller.extend({
		"init": function(feideconnect, providerdata, orglist) {
			// console.error("org list selector..", providerdata);

			var that = this;
			this.providerdata = providerdata;
			this.dict = new Dictionary();
			this.template = new TemplateEngine(template, this.dict);

			this.orglist = orglist;

			this._super();

			this.el.on("click", ".providerentry", function(e) {
				e.stopPropagation();
				var t = $(e.currentTarget);
				var t2 = $(e.target);
				if (t2.prop("tagName") === 'INPUT') {
					return;
				}

				e.preventDefault();
				var ti = t.find('input');
				ti.prop('checked', !ti.prop('checked'));

			});

			this.el.on("click", ".actSaveChanges", function(e) {
				e.preventDefault();
				e.stopPropagation();
				that.emit("submit", that.updateDataFromInputControls());
				$(that.el).find(".modal").modal("hide");
			});



			this.initLoad();
		},

		"initLoad": function() {
			var that = this;
			return this.providerdata.onLoaded()
				.then(this.proxy("draw"))
				.then(function() {
					$("div#modalContainer").append(that.el);
				})
				.then(this.proxy("_initLoaded"));
		},

		"updateDataFromInputControls": function() {


			var selection = {};

			this.el.find('.providerentry input').each(function(i, item) {
				var e = $(item);
				var ep = e.closest('.providerentry');
				// console.log("Found list entry ", key, ep.data('id'));	
				if (e.prop("checked")) {
					// console.log("Found list entry ", key, ep.data('id'));	
					selection[ep.data('id')] = true;
				}

			});
			var keys = [];
			for (var key in selection) {
				keys.push('feide|realm|' + key);
			}
			return keys;
		},



		"makeSelection": function() {
			var that = this;
			return this.onLoaded()
				.then(function() {
					$(that.el).find(".modal").modal('show');
					return new Promise(function(resolve, reject) {

						that.on("submit", resolve);
						that.on("cancel", function() {
							resolve(null);
						});
					});
				});

		},
		"isSelected": function(org) {
			// console.error("ORGlist", org, this.orglist);
			for (var i = 0; i < this.orglist.length; i++) {
				if ('feide|realm|' + org === this.orglist[i]) {
					return true;
				}
			}
			return false;

		},

		"draw": function() {
			// console.error("organizations", this.providerdata.orgs);
			var i;
			var columns = [];
			var noc = 4;

			for (i = 0; i < noc; i++) {
				columns.push({
					"orgs": []
				});
			}
			for (i = 0; i < this.providerdata.orgs.length; i++) {
				var c = i % noc;
				this.providerdata.orgs[i].selected = this.isSelected(this.providerdata.orgs[i].id);
				columns[i % noc].orgs.push(this.providerdata.orgs[i]);
			}
			var view = {
				"columns": columns
			};
			// console.error("colmn", columns);

			this.el.children().detach();

			// console.error("Draw clientcreate", view);
			return this.template.render(this.el, view);
		}
	}).extend(EventEmitter);

	return OrgListSelector;
});
