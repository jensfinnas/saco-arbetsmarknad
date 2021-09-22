// Prepares json data from server
function initData(resp) {
	// Turn strings into numbers in dataset
	resp.data = resp.data
	.map(function(row) {
		for (key in row) {
			if (key == "Månad") {
				row[key] = parseDate(row[key]);
			}
			else if (resp.columns[key].category == "Antal") {
				row[key] = + row[key];
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
      drawMobileVerison: true,
      date: self.data[self.data.length - 1]['Månad']
    }, opts);

    self.subtitles = dynamicSubtitles;

    // The chart element has to have an id
    self.id = '#' + id;

    // Get the right row from the data file
    self.row = self.data.first(function(d) {
			return sameYearAndMonth(d['Månad'], self.opts.date);
		});

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
    	self.$el.append($('<div/>')
    		.attr('class', 'subtitle')
    	);
    }

    // Store chart containers here (jquery)
    self.chartContainers = {};
    self.chartContainers.today = self.$el.append($('<div/>').attr('class', 'chart-today desktop'));
    self.label = {
    	today: formatMonthYear(self.opts.date).capitalize(),
    	change: 'Förändring',
    	lastYear: formatMonthYear(self.opts.date.sameMonthLastYear()).capitalize()
    }

	// Add 'show change' button
	var $viewButtons = $('<div/>').attr('class', 'view-buttons desktop');
	$viewButtons.append(
		$('<button/>')
			.text('Dölj förändring')
			.attr('class', 'btn btn-hide-change ' + (!self.opts.showChange ? 'active' : ''))
			.click(function() {
				$(this).addClass('active')
					.siblings('.btn-show-change')
					.removeClass('active');

				self.opts.showChange = false;
				self.update();
			})
		)

	$viewButtons.append(
		$('<button/>')
			.text('Visa förändring')
			.attr('class', 'btn btn-show-change ' + (self.opts.showChange ? 'active' : ''))
			.click(function() {
				$(this).addClass('active')
					.siblings('.btn-hide-change')
					.removeClass('active');
				self.opts.showChange = true;
				self.update();
			})
		)
	
	self.$el.append($viewButtons)



	// Add container for mobile version (plain table)
    self.$el.append($('<div/>').attr('class', 'data-table'));


	// Add source and time
	var $source = $('<div/>')
			.attr('class', 'source-time');
	$source.append(
		$('<small/>')
			.attr('class', 'source')
			.html('Källor: Arbetsförmedlingen och SCB/RAMS<br>Statistiken visar andelen som är öppet arbetslösa eller deltar i något arbetsmarknadsprogram.')
	);
	self.$el.append($source);


    if (!columns || columns.length == 0) {
    	console.error('Error: Add an array of columns');
    }
    self.charts = {}; // Store C3 chart obj here

    // Define chart settings that are same for both chart types here
    var colors = {};
    colors[self.label.today] = '#3F98A6';
    colors[self.label.change] = '#E38733';

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
//  			groups: [[self.label.today, self.label.change]],
  			type: 'bar',
  			colors: colors
  		},
  		axis: {
  			x: {
  				type: 'category', // this needed to load string x value
  				height: 50,
  				tick: {
  					outer: false
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

  	// Update subtitle
  	if (self.opts.subtitle in self.subtitles) {
  		var subtitle = self.subtitles[self.opts.subtitle](self.values);
  		self.opts.subtitle = subtitle;

  	}

  	self.$el.find('.subtitle').html(self.opts.subtitle);

	}

	// Draw chart
	BarChart.prototype.drawTodayChart = function() {
		var self = this;
		var values = self.getValues();
		// Hack: Remove "Samtliga" from chart data, assuming that it is placed last
		// in the array. 
		var chartValues = values.map(function(d) { return d.slice(0, -1) } )
		var chartOpts = self.chartSetup;
		var rotated = chartValues[0].length > 6;

		// Rotate chart if there are more than 6 columns
		if (rotated) {
			chartOpts.axis.rotated = chartValues[0].length;
			chartOpts.axis.x.height = 200;
		}
		chartOpts.data.columns = chartValues;

		// Set a fixed max value for the y axis so that it won't
		// change when last years numbers are shown
		chartOpts.axis.y.max = d3.max(chartValues[1].slice(1, chartValues[1].length).concat( chartValues[1].slice(1, chartValues[2].length) ))

		self.charts.today = c3.generate(chartOpts);

		// Add custom class to rotated axis for styling
		if (rotated) {
			self.chartContainers.today.find('.c3').addClass('rotated');
		}

		if (!self.opts.showChange) {
			self.charts.today.unload([self.label.lastYear]);
		}

		// Draw mobile version table only
		if (self.opts.drawMobileVerison) {
			var $table = $('<table/>').attr('class','table');
			var $tableHeader = $('<tr/>');
			$tableHeader.append($('<th/>').text('Grupp'));
			$tableHeader.append($('<th/>')
				.attr('class', 'text-right')
				.html('Arbetslöshet<br/>(' + self.label.today.toLowerCase() + ')'));
			$tableHeader.append($('<th/>')
				.attr('class', 'text-right')
				.text('Förändring (12 mån)'));
			$table.append($tableHeader);

			for (var i=1; i<values[0].length; i++) {
				var label = values[0][i];
				var today = values[1][i];
				var lastYear = values[2][i];
				var change = today - lastYear
				var $tr = $('<tr/>');
				$tr.append($('<td/>').attr('class', 'group').text(label));
				$tr.append($('<td/>').attr('class', 'today number').text(formatPercent(today)));
				$tr.append($('<td/>').attr('class', 'change number').text((change > 0 ? "+" : "") + formatPercent(change).replace("%"," %-enheter")));
				$table.append($tr);
			}
			self.$el.find('.data-table').append($table);
		}
	}

	// Returns value arrays for the chart based on the current
	// selection and sort.
	BarChart.prototype.getValues = function() {
		var self = this;

		// Get the right month row from data
		var row = self.row;

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
					nameFull: self.columnDictionary[column].name,
					today: row[column],
					lastYear: rowLastYear[column],
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
		// Store values to be used when we write dynamic subtitles
		self.values = values.slice(0);

		values.unshift({
			name: 'x',
			today: self.label.today,
			lastYear: self.label.lastYear
			//change: self.label.change
		});
		values.push({
			name: "Samtliga",
			nameFull: "Samtliga",
			today: row["Samtliga"],
			lastYear: rowLastYear["Samtliga"],
			change: row["Samtliga"] - rowLastYear["Samtliga"]

		})

		var resp = [
			values.map(function(d) { return d.name; }),
			values.map(function(d) { return d.today; }),
			values.map(function(d) { return d.lastYear; })
//			values.map(function(d) { return d.change; })
		];

		return resp;
	}

	BarChart.prototype.update = function() {
		var self = this;

		// Load new values
		self.charts.today
			.load({
				columns: self.getValues()
			});

		// Remove change
		if (!self.opts.showChange) {
			self.charts.today.unload([self.label.lastYear]);
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
		if ($el.hasAttr('data-show-change')) opts.showChange = $el.attr('data-show-change') !== 'false';
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

// Capitalize strings
String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

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

Handlebars.registerHelper('formatPercent', function(value, type) {
	var str = formatPercent(value);
	if (type == 'change') {
		str = str.replace('%',' procentenheter');
	}
  return str;
});

Handlebars.registerHelper('ifCond', function(v1, v2, options) {
  if(v1 === v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

// Formating
var formatPercent = locale.numberFormat('.1%');
var formatPercentUnit = locale.numberFormat('.1%');
var formatPercentSmall = locale.numberFormat('.2%');
var formatMonthYear = locale.timeFormat('%B %Y');
var formatYearMonthDay = locale.timeFormat('%Y-%m-%d');

// INIT
var dataObj;
var charts = {};
var isIframe = self !== top;

// Get data
var key = '1I7A8rydoRA6n28W6Tnt6nCpEYeUbI2J1dcVrEy54G7Y';
var mode = getQueryString('stage') == 'true' ? 'stage' : 'production';
var dataUrl = 'https://s3-eu-west-1.amazonaws.com/tabletop-proxy/saco-arbetsmarknad-' + mode + '/' + key + '.json';
