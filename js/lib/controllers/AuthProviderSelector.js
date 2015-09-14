define(function(require, exports, module) {
	"use strict";

	var 
		$ = require('jquery'),
		Controller = require('./Controller'),
		dust = require('dust'),

		// Model = require('../models/Model'),
		// Group = require('../models/Group'),
		EventEmitter = require('../EventEmitter')
		;

	// var template = require('text!templates/OrgRoleSelector.html');



	var AuthProviderSelector = Controller.extend({

		"init": function(el, providerdata, selectedProviders) {

			var that = this;
			this.providerdata = providerdata;
			this.selectedProviders = selectedProviders;
			if (selectedProviders === null) {
				this.selectedProviders = ['all'];
			} else {
				if (selectedProviders.length === 0) {
					this.selectedProviders = ['none'];
				}
			}

			this._super(el, true);

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
			this.el.on("change", "input.selectgroup", function(e) {
				e.preventDefault(); e.stopPropagation();
				var t = $(e.currentTarget);
				// var ti = t.find('input');
				// ti.prop('checked', !ti.prop('checked'));
				// console.log("Changed input group!");
				that.updateDataFromInputControls();
			});

			this.el.on("click", "button.actSaveChanges", function(e) {
				e.preventDefault(); e.stopPropagation();
				// var t = $(e.currentTarget);
				// var ti = t.find('input');
				// ti.prop('checked', !ti.prop('checked'));
				// console.log("SAVE CHANGES!");
				that.updateDataFromInputControls();
				that.emit("save", that.selectedProviders);
			});


			// dust.loadSource(dust.compile(template, "OrgRoleSelector"));
			// this.ebind("click", ".orgSelector a", "actSelect");

		},

		"hasItem": function(x) {
			for (var i = 0; i < this.selectedProviders.length; i++) {
				if (this.selectedProviders[i] === x) {
					return true;
				}
			}
			return false;
		},

		"updateControlsFromData": function() {

			var proplist = ["all", "feide|all", "social|all", "feide|go", "feide|he", "feide|vgs"];
			var props = {};

			for (var i = 0; i < proplist.length; i++) {
				props[proplist[i]] = this.hasItem(proplist[i]);
			}

			this.el.find('input.selectgroup').each(function(i, item) {
				var e = $(item);
				var val = e.data('val');

				if (props.hasOwnProperty(val)) {
					e.prop("checked", props[val]);
				}
			});

			this.updateDataFromInputControls();
		},

		"updateDataFromInputControls": function() {

			var providers = [];

			var props = {};
			var listselections = {
				"sociallist": [],
				"otherlist": [],
				"orglistgo": [],
				"orglistvgs": [],
				"orglisthe": [],
			};

			this.el.find('input.selectgroup').each(function(i, item) {
				var e = $(item);
				var s = e.prop("checked");
				var val = e.data('val');
				props[val] = s;
			});

			var xfunc = function(i, item) {
				var e = $(item);
				var ep = e.closest('.providerentry');
				// console.log("Found list entry ", key, ep.data('id'));	
				if (e.prop("checked")) {
					// console.log("Found list entry ", key, ep.data('id'));	
					listselections[key].push(ep.data('id'));
				}
				
			};
			
			for(var key in listselections) {
				this.el.find('.' + key +  ' .providerentry input').each(xfunc);
			}


			if (props.all) {
				providers.push('all');
				this.el.find('.pgroupall').hide();
			} else {

				this.el.find('.pgroupall').show();

				providers = providers.concat(listselections.otherlist);

				if (props['social|all']) {
					providers.push('social|all');
					this.el.find('.sociallist').hide();
				} else {
					providers = providers.concat(listselections.sociallist);
					this.el.find('.sociallist').show();
				}

				if (props['feide|all']) {
					providers.push('feide|all');

					this.el.find('.pgroupfeide').hide();
					
				} else {
					this.el.find('.pgroupfeide').show();

					if (props['feide|he']) {
						providers.push('feide|he');
						this.el.find('.orglisthe').hide();
						
					} else {
						providers = providers.concat(listselections.orglisthe);
						this.el.find('.orglisthe').show();

					}

					if (props['feide|vgs']) {
						providers.push('feide|vgs');
						this.el.find('.orglistvgs').hide();
					} else {
						providers = providers.concat(listselections.orglistvgs);
						this.el.find('.orglistvgs').show();
						
					}

					if (props['feide|go']) {
						providers.push('feide|go');
						this.el.find('.orglistgo').hide();
					} else {
						providers = providers.concat(listselections.orglistgo);
						this.el.find('.orglistgo').show();
						
					}

				}






			}


			// console.error("Data is ", providers)
			// console.error("List selections", listselections);
			if(providers.length === 0) {
				providers.push('none');
			}
			this.selectedProviders = providers;
			// $(".debug").empty().append(JSON.stringify(providers, undefined, 2));

		},


		"initLoad": function() {

			var that = this;			
		 	// console.error("Loading AuthProviderSelector");

		 	// console.log((new Error()).stack);

		 	// console.log("Provciderdata is ", this.providerdata);

			return this.providerdata.onLoaded()
				.then(this.proxy("draw"))
				.then(function() {
					// that.updateDataFromInputControls();
					that.updateControlsFromData();
				})
				.then(that.proxy("_initLoaded"));

		},

		"getProviderExtraHTML": function(item) {
			var txt = '';
			var classes = [];
			var id = item.def.join('|');
			var active = this.hasItem(id);
			var checked = (active ? 'checked="checked"': '');
			if (active) {
				classes.push('list-group-item-info');
			}

			var iconImage = '';
			if (item.iconImage) {
				iconImage = '<img class="media-object" style="width: 32px; height: 32px" src="https://auth.dev.feideconnect.no/static/media/disco/' + item.iconImage + '" alt="...">';
			} else if (item.icon) {
				iconImage = '<i style="margin-left: 6px" class="' + item.icon + '"></i>';
			}
			// var datastr = 'data-id="' + Utils.quoteattr(this.entityID) + '" data-subid="' + Utils.quoteattr(this.entityID) + '" data-type="saml"';
			txt += '<a href="#" data-id="' + id + '" class="list-group-item providerentry ' + classes.join(' ') + '" >' +
					'<div class="pull-left"><input type="checkbox" ' + checked + ' /></div>' +
					'<div style="margin-left: 24px" class="media"><div class="media-left media-middle">' + 
					iconImage +
					'</div>' +
					'<div class="media-body"><p>' + item.title + '</p></div>' +
				'</div>' +
			'</a>';
			return txt;

		},


		"getProviderHTML": function(item) {
			var txt = '';
			var classes = [];
			var id = 'feide|realm|' + item.id;
			var active = this.hasItem(id);
			var checked = (active ? 'checked="checked"': '');
			if (active) {
				classes.push('list-group-item-info');
			}

			// var datastr = 'data-id="' + Utils.quoteattr(this.entityID) + '" data-subid="' + Utils.quoteattr(this.entityID) + '" data-type="saml"';
			txt += '<a href="#" data-id="' + id  + '" class="list-group-item providerentry ' + classes.join(' ') + '" >' +
					'<div class="pull-left"><input type="checkbox" ' + checked + '/></div>' +
					'<div style="margin-left: 24px" class="media"><div class="media-left media-middle">' + 
						'<img class="media-object" style="width: 32px; height: 32px" src="https://api.feideconnect.no/orgs/fc:org:' + item.id + '/logo" alt="...">' + 
					'</div>' +
					'<div class="media-body"><p>' + item.title + '</p></div>' +
				'</div>' +
			'</a>';
			return txt;

		},


		"draw": function() {
			var that = this, i;
			var txt = {
				'he': '',
				'vgs': '',
				'go': ''
			};
			var item, txtitem;

			// console.error("Ready.", this.providerdata.extra, this.providerdata.orgs);

			this.providerdata.orgs.sort(function(a, b) {
				var xa = (that.hasItem('feide|realm|' + a.id) ? 1 : 0);
				var xb = (that.hasItem('feide|realm|' + b.id) ? 1 : 0);
				return xb - xa;
			});
			
			for (i = 0; i < this.providerdata.orgs.length; i++) {
				item = this.providerdata.orgs[i];
				// console.error("item", item);
				txtitem = this.getProviderHTML(item);
				for (var j = 0; j < item.type.length; j++) {
					if (txt.hasOwnProperty(item.type[j])) {
						txt[item.type[j]] += txtitem;
					}
				}
				
			}
			// console.error("This is what we got: ", txt);

			this.el.find(".orglistgo").empty().append(txt.go);
			this.el.find(".orglistvgs").empty().append(txt.vgs);
			this.el.find(".orglisthe").empty().append(txt.he);


			txt.other = '';
			txt.social = '';

			for (i = 0; i < this.providerdata.extra.length; i++) {
				item = this.providerdata.extra[i];
				txtitem = this.getProviderExtraHTML(item);
				txt[item.def[0]] += txtitem;
				
			}


			this.el.find(".sociallist").empty().append(txt.social);
			this.el.find(".otherlist").empty().append(txt.other);


		}



	}).extend(EventEmitter);


	return AuthProviderSelector;
});