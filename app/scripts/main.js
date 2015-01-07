// Prepares json data from server
function initData(resp) {
	// Turn strings into numbers in dataset
	resp.data = resp.data
	.map(function(row) {
		for (key in row) {
			if (key == "Månad") {
				row[key] = parseDate(row[key]);
			}
			else {
				row[key] = row[key] / 100;
			}
		}
		return row;
	})
	// Sort so that latest value is last in array
	.sort(function(a, b){ 
		return d3.ascending(a['Månad'], b['Månad']); 
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
		self.opts = $.extend({
      width: 'auto',
      height: 300,
      title: false,
      subtitle: false,
      sort: false,
      showChange: false,
      date: self.data[self.data.length - 1]['Månad']
    }, opts);

    self.subtitles = dynamicSubtitles;

    // The chart element has to have an id
    self.id = '#' + id; 

    // An object with column names and properties
    self.columnDictionary = dataObj.columns; 

    // The element that wraps the chart
    self.$el = $(self.id); 

    // Add title
    if (self.opts.title) {
    	self.$el.append($('<h3/>')
    		.attr('class', 'title')
    		.text(self.opts.title)
    	);
    }

    // Add subtitle
    if (self.opts.subtitle) {
    	if (self.opts.subtitle in self.subtitles) {
    		self.opts.subtitle = self.subtitles[self.opts.subtitle]()
    	}
    	self.$el.append($('<div/>')
    		.attr('class', 'subtitle')
    		.html(self.opts.subtitle)
    	);
    }

    // Store chart containers here (jquery)
    self.chartContainers = {}; 
    self.chartContainers.today = self.$el.append($('<div/>').attr('class', 'chart-today'));
    self.label = {
    	today: 'Arbetslöshet',
    	change: 'Förändring'
    }

    // Add 'show change' button
    self.$el.append(
    	$('<button/>')
    		.text('Visa förändring')
    		.click(function() {
    			$(this).text(self.opts.showChange ? 'Visa läget just nu' : 'Visa förändring');
    			self.update(
    				self.opts.showChange ? 
	    			{
	    				showChange: false
	    			} 
	    			:
	    			{
	    				showChange: true
	    			}
    			);	
    		})
    	) 

    if (!columns || columns.length == 0) {
    	console.error('Error: Add an array of columns');
    }
    self.charts = {}; // Store C3 chart obj here

    // Define chart settings that are same for both chart types here
    self.chartSetup = {
    	bindto: self.id + ' .chart-today',
    	size: {
    		height: self.opts.height
    	},
    	padding: {
    		//bottom: self.opts.height * .1
    	},
  		data: {
  			x: 'x',
  			groups: [[self.label.today, self.label.change]],
  			type: 'bar',
  			color: function(color,d) { 
					if (d.id == self.label.change) {
						return d.value > 0 ? 'green' : 'red'; 
					}
					else {
						return color;
					}
				}
  		},
  		axis: {
  			x: {
  				type: 'category', // this needed to load string x value
  				tick: {
  					outer: true
  				}
  			},
  			y: {
  				tick: {
  					format: function(d) { return formatPercent(d); }
  				}
  			}
      },
      grid: {
  			y: {
  				lines: [ { value: 0, text: '' } ]
  			}
  		},
  		legend: {
        position: 'inset',
        inset: {
        	anchor: 'top-right'
        }
    	}
  	}

  	// Draw the charts listed in charts array
  	self.drawTodayChart();
	}

	// Draw chart
	BarChart.prototype.drawTodayChart = function() {
		var self = this;
		var chartOpts = self.chartSetup;
		chartOpts.data.columns = self.getValues();
		self.charts.today = c3.generate(chartOpts);
	}

	// Returns value arrays for the chart based on the current
	// selection and sort.
	BarChart.prototype.getValues = function() {
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
		var dateLastYear = self.opts.date.sameMonthLastYear();
			rowLastYear = self.data.first(function(d) {
				return sameYearAndMonth(d['Månad'], dateLastYear);
			});

		// Filter the selected row to an array of values 
		var values = []; 
		self.columns.forEach(function(column) {
			try {
				values.push({
					name: self.columnDictionary[column].name_short,
					today: row[column],
					change: row[column] - rowLastYear[column]
				});
			}
			catch(err) {
				console.error('Invalid column (' + column +' )', err);
			}
		});
		if (self.opts.sort) {
			try {
				values.sort(function(a, b){ return d3.ascending(a[self.opts.sort], b[self.opts.sort]); });
			}
			catch(err) {
				console.error('Invalid sort key.', err);
			}
		}
		values.unshift({
			name: 'x',
			today: self.label.today,
			change: self.label.change
		}); 

		var resp = [
			values.map(function(d) { return d.name; }),
			values.map(function(d) { return d.today; })
		];
		if (self.opts.showChange) {
			resp.push(values.map(function(d) { return d.change; }))
		};
		return resp;
	}

	BarChart.prototype.update = function(updatedOpts) {
		var self = this;
		$.extend(self.opts, updatedOpts);

		// Load new values
		self.charts.today
			.load({
				columns: self.getValues()
			});

		// Remove change 
		if (!self.opts.showChange) {
			self.charts.today.unload([self.label.change]);
		}
	}
	return BarChart;
})();

// Iterates all charts with 'chart' class and appends charts 
// based on data- attributes
function initCharts() {
	$('.chart').each(function() {
		var $el = $(this);

		// Mandatory settings
		var id = $el.attr('id');
		var columns = $el.attr('data-columns').split(',');
		
		// Optional settings
		var opts = {};
		if ($el.hasAttr('data-charts')) opts.charts = $el.attr('data-charts').split(',');
		if ($el.hasAttr('data-month') && $el.attr('data-month') !== 'latest') {
			opts.date = parseDate($el.attr('data-month'));
		};
		if ($el.hasAttr('data-width')) opts.width = $el.attr('data-width');
		if ($el.hasAttr('data-height')) opts.height = $el.attr('data-height');
		if ($el.hasAttr('data-show-change')) opts.showChange = $el.attr('data-show-change') == 'true';
		if ($el.hasAttr('data-sort')) opts.sort = $el.attr('data-sort');
		if (opts.sort == 'false') opts.sort = false;
		if ($el.hasAttr('data-subtitle')) opts.subtitle = $el.attr('data-subtitle');

		// Init chart
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

// Handlebars helpers
Handlebars.registerHelper('columnName', function(key) {
  return dataObj.columns[key].name;
});

Handlebars.registerHelper('formatPercent', function(value) {
  return formatPercent(value);
});

// Formating
var formatPercent = locale.numberFormat('.1%');
var formatPercentSmall = locale.numberFormat('.2%');
var formatMonthYear = locale.timeFormat('%B %Y');
var formatYearMonthDay = locale.timeFormat('%Y-%m-%d');

// Dynamic subtitles
dynamicSubtitles = {
	'Utbildning': function() {
		return 'Här kommer en autogeneread text som beskriver vad grafen visar. Typ säga vilka som ökat mest.'	
	},
	'Kön': function() {
		return 'Här kommer en autogeneread text som beskriver vad grafen visar. Typ säga vilka som ökat mest.'	
	},
	'Ålder': function() {
		return 'Här kommer en autogeneread text som beskriver vad grafen visar. Typ säga vilka som ökat mest.'	
	},
	'Födelseplats': function() {
		return 'Här kommer en autogeneread text som beskriver vad grafen visar. Typ säga vilka som ökat mest.'	
	}

}

// INIT
var dataObj;
var charts = {};
var isIframe = self !== top;

// Get data
var key = '1I7A8rydoRA6n28W6Tnt6nCpEYeUbI2J1dcVrEy54G7Y';
var mode = 'stage';
var dataUrl = 'https://s3-eu-west-1.amazonaws.com/tabletop-proxy/saco-arbetsmarknad-' + mode + '/' + key + '.json';



