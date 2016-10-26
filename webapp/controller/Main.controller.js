sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/thirdparty/d3",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/format/DateFormat",
	"sap/m/MessageToast"
], function(Controller, d3, JSONModel, DateFormat, MessageToast) {
	"use strict";

	return Controller.extend("de.tammenit.ui.npm.downloads.controller.Main", {
		
		onInit: function() {
			var oModel = new JSONModel({
				from: "",
				to: ""
			});
			this.getView().setModel(oModel);
			
			var oViewModel = new JSONModel({
				panelExpanded: false,
				panelHeaderText: "Date Range"
			});
			this.getView().setModel(oViewModel, "viewModel");
		},
		
		onAfterRendering: function() {
			var htmlCtrl = this.getView().byId("htmlCtrl");
			var strHtml = '	<div id="container" class="sapUiSmallMargin" height="100%">' +
				'<svg id="svg" class="chart" width="100%" height="100%">' +
				'<g id="svgG" transform="translate(0, 0)">' +
				'</g>' +
				'</svg>' +
				'</div>';
			htmlCtrl.setContent(strHtml);
			
			this.main("https://api.npmjs.org/downloads/range/last-month/n-odata-server");
		},
		
		onRefreshData: function(oEvt) {
			var from = this.getView().getModel().getProperty("/from");	
			var to = this.getView().getModel().getProperty("/to");
			var df = DateFormat.getDateInstance({pattern: 'yyyy-MM-dd'});
			from = df.format(from);
			to = df.format(to);

			this.getView().getModel("viewModel").setProperty("/panelExpanded", false);
			
			this.getData(from, to);
		},

		xDay: function(date) {
			var day = date.split("-");
			day = day[day.length - 1];
			return day;
		},

		processData: function(data) {
			var that = this;

			var margin = {
					top: 20,
					right: 30,
					bottom: 30,
					left: 40
				},
				newHeight = jQuery("#" + this.getView().byId("page").getId() + "-cont").height() - margin.top - margin.bottom,
				width = jQuery("#" + this.getView().byId("page").getId() + "-cont").width() - margin.left - margin.right,
				height = newHeight - 50 - margin.top - margin.bottom;
			var x = d3.scale.ordinal()
				.domain(data.downloads.map(function(d) {
					return d.day;
				}))
				.rangeRoundBands([0, width], .1);
			var y = d3.scale.linear()
				.domain([0, d3.max(data.downloads, function(d) {
					return d.downloads;
				})])
				.range([height, 0]);

			var xAxis = d3.svg.axis()
				.scale(x)
				.tickValues(x.domain().filter(function(d, i) {
					return !(i % 1);
				}))
				.tickFormat(function(d) {
					return that.xDay(d);
				})
				.orient("bottom");
			var yAxis = d3.svg.axis()
				.scale(y)
				.orient("left");

			var chart = d3.select("#svg").selectAll("g").remove();

			chart = d3.select("#svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			chart.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + height + ")")
				.call(xAxis);
			chart.append("g")
				.attr("class", "y axis")
				.call(yAxis);

			var gs = chart.selectAll(".bar")
				.data(data.downloads)
				.enter()
				.append("g")
				.attr("class", "g");

			var rects = gs.append("rect")
				.attr("class", "bar")
				.attr("x", function(d) {
					return x(d.day);
				})
				.attr("y", function(d) {
					return y(d.downloads);
				})
				.attr("height", function(d) {
					return height - y(d.downloads);
				})
				.attr("width", x.rangeBand());

			gs.append("text")
				.attr("x", function(d) {
					return x(d.day) + x.rangeBand() / 2;
				})
				.attr("y", function(d) {
					return y(d.downloads) + 5;
				})
				.attr("dy", ".75em")
				.text(function(d) {
					return d.downloads;
				});

			// Add a tooltip with the date
			gs
				.append("title")
				.text(function(d) {
					var text = "Date: " + d.day + "\n" +
						"Value: " + d.downloads;
					return text;
				});

			// show sum
			var sum = 0;
			data.downloads.forEach(function(obj, idx) {
				sum += obj.downloads;
			});
			
			that.getView().getModel("viewModel").setProperty("/panelHeaderText", "Date Ragne, Sum of downloads: " + sum );

			/*
			d3.select("#container").selectAll("#sum").remove();
			d3.select("#container")
				.append("div")
				.attr("id", "sum")
				.text("Sum: " + sum);
			*/
		},

		getData: function(from, to) {
			/*  d3.select("body").selectAll("#dateResult")
			∫    .remove();
			  d3.select("body")
			    .append("div")
			      .attr("id", "dateResult")
			      .text("Dates: " + from + ", to: " + to);
			*/

			var url = "https://api.npmjs.org/downloads/range/";
			url += from + ":" + to;
			url += "/n-odata-server";
			this.main(url);
		},

		main: function(url) {
			var that = this;
			//d3.json("https://api.npmjs.org/downloads/range/2016-02-08:2016-03-07/n-odata-server", 
			d3.json(url,
				function(err, jsonData) {
					d3.select("container").selectAll("#err")
						.remove();
					err = err || jsonData.error;
					if (!err) {
						//console.log(jsonData);
						that.processData(jsonData);
					} else {
						//console.log(err);
						MessageToast.show(err);
					}
				});
		}
		
	});
});