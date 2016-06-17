define(function(require, exports, module) {
	"use strict";

	var
		$ = require('jquery'),
		Controller = require('../controllers/Controller'),
		Dictionary = require('../Dictionary'),
		EventEmitter = require('../EventEmitter'),
		TemplateEngine = require('bower/feideconnectjs/src/TemplateEngine'),

		moment = require('bower/momentjs/moment');

	// var template = require('text!templates/OrgRoleSelector.html');


	var xsort = function(a, b) {
		if (a.count > b.count) {
			return -1;
		}
		if (a.count < b.count) {
			return 1;
		}
		return 0;
	}


	var template = require('text!templates/Statistics.html');

	var Statistics = Controller.extend({

		"init": function(feideconnect, clientid) {
			var that = this;
			this.feideconnect = feideconnect;
			this.clientid = clientid;

			this.dict = new Dictionary();
			this.template = new TemplateEngine(template, this.dict);

			this.data = [];
			this.processed = {};
			this.processedFilled = [];
			this.authsources = {};
			this.total = 0;
			this.first = null;
			this.last = null;

			this._super(undefined, true);
		},

		"initLoad": function() {

			var that = this;
			return this.loadData()
				.then(that.proxy("_initLoaded"));
		},

		"loadData": function() {
			var that = this;
			return this.feideconnect.getClientStats(this.clientid, {"num_days": 4})
				.then(function(data) {
					that.data = data;
				})
				.then(that.proxy("process"))
				.then(that.proxy("draw"))
				.catch(function(err) {
					console.error("Error processing statistics", err);
				});
		},


		"insertProcessedItem": function(idx, timeslot, data) {
			if (!this.processed[idx]) {
				this.processed[idx] = {
					"timeslot": timeslot,
					"authsources": {},
					"total": 0
				};
			}
			if (!this.processed[idx].authsources[data.authsource]) {
				this.processed[idx].authsources[data.authsource] = 0;
			}
			if (!this.authsources[data.authsource]) {
				this.authsources[data.authsource] = 0;
			}

			this.processed[idx].authsources[data.authsource] += data.login_count;
			this.processed[idx].total += data.login_count;
			this.authsources[data.authsource] += data.login_count;
			this.total += data.login_count;

			console.log("ADDING TOTAL ", this.total);

			if (this.first === null) {
				this.first = timeslot;
			}
			if (timeslot.isBefore(this.first)) {
				this.first = timeslot;
			}
			if (this.last === null) {
				this.last = timeslot;
			}
			if (timeslot.isAfter(this.last)) {
				this.last = timeslot;
			}

		},

		"process": function() {
			var that = this;
			return new Promise(function(resolve, reject) {

				for(var i = 0; i < that.data.length; i++) {
					var timeslot = moment(that.data[i].timeslot);
					var timeidx = timeslot.format('YYYY-MM-DD HH');
					console.log("INSERT " + timeidx + that.data[i]);
					that.insertProcessedItem(timeidx, moment(timeidx + ':00'), that.data[i])
				}

				if (that.first === null) {
					return;
				}

				var ix = 0;
				var fillrunn = that.first.clone();
				while (that.last.isAfter(fillrunn)) {
					// if (ix++ > 10) { break; }
					var fidx = fillrunn.format('YYYY-MM-DD HH');
					if (that.processed[fidx]) {
						that.processedFilled.push(that.processed[fidx]);
					} else {
						that.processedFilled.push({
							"total": 0,
							"authsources": {},
							"timeslot": fillrunn.clone()
						});
					}
					fillrunn.add(1, "hour");
				}



				// that.processed = that.data;
				resolve();
			});
		},

		"draw": function() {
			var that = this;
			var dataset = [];
			for(var i = 0; i < this.processedFilled.length; i++) {
				var x = this.processedFilled[i];
				dataset.push([x.timeslot.toDate(), x.total ]);
				console.log (x.timeslot.format('YYYY-MM-DD HH') + ' ' + x.total)
			}
			console.log(this.processed);
			console.log("DATASET", dataset);


			var authsourcesData = [];
			for(var key in this.authsources) {
				authsourcesData.push({
					"authsource": key,
					"count": this.authsources[key]
				});
			}

			authsourcesData.sort(xsort);

			var view = {
				"authsources": authsourcesData,
				"total": this.total
			};
			console.log("View", view, this.authsources);
			this.el.empty();
			return this.template.render(this.el, view)
				.then(function() {

					$.plot(that.el.find("#statplot"), [dataset], {
						grid: {
						},
						bars: {
							show: true,
							barWidth : 60*60*1000
						},
						xaxis: {
							"color": "#ccc",
							// timezone: "browser",
							// tickSize: 1,
							// from: now.clone().startOf('day').valueOf(),
							// to: now.clone().endOf('day').valueOf(),
							mode: "time"
						}
					});
				});


		},

		"getStats": function(clientid) {
			var that = this;
			return this.processed;
		}


	}).extend(EventEmitter);


	return Statistics;
});