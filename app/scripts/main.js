// Prepares json data from server
function initData(resp) {
	// Turn strings into numbers in dataset
	resp.data = resp.data.map(function(row) {
		for (key in row) {
			if (key == "Månad") {
				row[key] = parseDate(row[key]);
			}
			else {
				row[key] = +row[key];
			}
		}
		return row;
	});
	return resp;
}

// Draw chart
// Usage: new BarChart(#myContainer, [groupA, groupB], {})
BarChart = (function() {
	function BarChart(id, columns, opts) {
		var self = this;
    self.data = dataObj.data;
    self.columns = columns;

    // Set defaults
		self.opts = jQuery.extend({
      width: 'auto',
      height: 300,
      charts: ['today', 'change'],
      title: '',
      subtitle: '',
      date: self.data[self.data.length - 1]['Månad']
    }, opts);
    self.id = '#' + id; // The chart element has to have an id
    self.columnDictionary = dataObj.columns; // An object with column names and properties
    self.$el = $(self.id); // The element that wraps the chart
    self.chartContainers = {}; // Store chart containers here (jquery)
    self.chartContainers.today = self.$el.append($('<div/>').attr('class', 'chart-today'));
    self.chartContainers.change = self.$el.append($('<div/>').attr('class', 'chart-change'));
    if (!columns || columns.length == 0) {
    	console.error('Error: Add an array of columns');
    }
    self.charts = {}; // Store C3 chart obj here

    // Define chart settings that are same for both chart types here
    self.chartSetup = {
    	size: {},
  		data: {
  			x: 'x',
  			type: 'bar'
  		},
  		axis: {
  			x: {
  				type: 'category' // this needed to load string x value
  			},
  			y: {
  				tick: {}
  			}
      }
  	}

  	// Draw the charts listed in charts array
  	if ($.inArray('today', opts.charts) > -1) {
	    self.drawTodayChart();
  	}
  	if ($.inArray('change', opts.charts) > -1) {
	    self.drawChangeChart();
  	}
	}

	BarChart.prototype.drawTodayChart = function() {
		var self = this;
		var chartOpts = self.chartSetup;
		chartOpts.size.height = self.opts.height;
		chartOpts.bindto = self.id + ' .chart-today';
		chartOpts.data.columns = self.getValues();
		chartOpts.axis.y.tick.format = function(d) { return formatPercent(d / 100); };
		self.charts.today = c3.generate(chartOpts);
	}
	BarChart.prototype.drawChangeChart = function() {
		var self = this;
		var chartOpts = self.chartSetup;
		chartOpts.size.height = self.opts.height * .7;
		chartOpts.bindto = self.id + ' .chart-change';
		// Get data
		chartOpts.data.columns = self.getValues('change');

		// Set minimum 
		var minimumRange = 0.05;
		var arr = chartOpts.data.columns[1].slice(0);
		arr.shift();
		chartOpts.axis.y.min = Math.min(-minimumRange, d3.min(arr));
		chartOpts.axis.y.max = Math.max(minimumRange, d3.max(arr));
		
		// Set y axis format
		chartOpts.axis.y.tick.format = function(d) { return formatPercentSmall(d / 100) };
		
		// Set bar color
		chartOpts.data.color = function(color,d) { 
			return d.value > 0 ? 'green' : 'red';
		}

		chartOpts.grid = {
			y: {
				lines: [ { value: 0, text: '' } ]
			}
		}
		self.charts.change = c3.generate(chartOpts);

		
	}

	BarChart.prototype.getValues = function(type) {
		var self = this;

		// Get the right month row from data
		var row = self.data.first(function(d) {
			return sameYearAndMonth(d['Månad'], self.opts.date);
		});
		if (row.length == 0) {
			console.error('Date error');
		}

		// Get last years numbers when we are displaying change
		var rowLastYear;
		if (type == 'change') {
			var dateLastYear = self.opts.date.sameMonthLastYear();
			rowLastYear = self.data.first(function(d) {
				return sameYearAndMonth(d['Månad'], dateLastYear);
			});
		}

		// Filter the selected row to an array of values 
		var values = ['Arbetslöshet'];
		var columnNames = ['x'];
		self.columns.forEach(function(column) {
			try {
				if (type == 'change') {
					// Compare unemployment now with same month last year
					values.push(row[column] - rowLastYear[column]);
				}
				else {
					values.push(row[column]);	
				}	
				columnNames.push(self.columnDictionary[column].name_short);
			}
			catch(err) {
				console.error('Invalid column (' + column +' )', err);
			}
		});
		return [columnNames, values];
	}
	return BarChart;
})();

// Iterates all charts with 'chart' class and appends charts 
// based on data- attributes
function initCharts() {
	$('.chart').each(function() {
		var $el = $(this);
		var id = $el.attr('id');
		var columns = $el.attr('data-columns').split(',');
		var opts = {};
		if ($el.hasAttr('data-charts')) opts.charts = $el.attr('data-charts').split(',');
		if ($el.hasAttr('data-month') && $el.attr('data-month') !== 'latest') {
			opts.date = parseDate($el.attr('data-month'));
		};
		if ($el.hasAttr('data-width')) opts.width = $el.attr('data-width');
		if ($el.hasAttr('data-height')) opts.width = $el.attr('data-height');
		charts[id] = new BarChart(id, columns, opts);
	})
}

// UTILS
var locale = d3.locale({
  "decimal": ",",
  "thousands": "\xa0",
  "grouping": [3],
  "currency": ["", " kr"],
  "dateTime": "%A %e %B %Y kl. %X",
  "date": "%d.%m.%Y",
  "time": "%H:%M:%S",
  "periods": ["AM", "PM"],
  "days": ["måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag", "söndag"],
  "shortDays": ["må", "ti", "ons", "to", "fre", "lö", "sö"],
  "months": ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"],
  "shortMonths": ["jan", "feb", "mars", "apr", "maj", "jun", "jul", "aug", "sept", "okt", "nov", "dec"]
})
var parseDate = locale.timeFormat("%Y-%m-%d").parse;

// Get query string
function getQueryString(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(location.search);
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

// Check if a jQuery object has an attribute
$.prototype.hasAttr = function(name) {
	var attr = $(this).attr(name);
	return typeof attr !== typeof undefined && attr !== false;
}

// Get the first match in array
if (!Array.prototype.first) 
{ 
   Array.prototype.first = function(predicate) 
   { 
     "use strict";    
     if (this == null) 
       throw new TypeError();       
     if (typeof predicate != "function") 
       throw new TypeError();  
      
     for (var i = 0; i < this.length; i++) { 
       if (predicate(this[i])) { 
         return this[i]; 
       } 
     }       
     return null; 
   } 
}

// Extend Date object with last year function that gets the first day of the same month last year
Date.prototype.sameMonthLastYear = function() {
	return new Date(this.getFullYear() - 1, this.getMonth(), 1);
}

// Takes two dates and checks if month and year matches
function sameYearAndMonth(d1, d2) {
	return (
		d1.getFullYear() == d2.getFullYear() &&
		d1.getMonth() == d2.getMonth()
	);
};

// Formating
var formatPercent = locale.numberFormat('.1%');
var formatPercentSmall = locale.numberFormat('.2%');
var formatMonthYear = locale.timeFormat('%B %Y');
var formatYearMonthDay = locale.timeFormat('%Y-%m-%d');

// INIT
var dataObj;
var charts = {};
var isIframe = self !== top;

// Get data
var key = '1I7A8rydoRA6n28W6Tnt6nCpEYeUbI2J1dcVrEy54G7Y';
var mode = 'stage';
var dataUrl = 'https://s3-eu-west-1.amazonaws.com/tabletop-proxy/saco-arbetsmarknad-' + mode + '/' + key + '.json';



