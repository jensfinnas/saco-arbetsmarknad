var numberOfListItems = 5;

// Get the highest/lowest current unemployment and biggest/smallest change
function getListData() {
	var _today = $.extend({}, dataObj.data[dataObj.data.length - 1]);
	var lastYearDate = new Date(_today['Månad'].getFullYear() - 1, _today['Månad'].getMonth());
	var lastYear = dataObj.data.first(function(d) {
		return sameYearAndMonth(d['Månad'],lastYearDate);
	});

	var _change = {};
	for (key in _today) {
		var cat = dataObj.columns[key].category;
		var columnName = dataObj.columns[key].column;
		// Exclude columns categorized with date and 'Övriga'
		if (cat !== 'time' && cat !== 'Övriga' && cat !== 'Antal' && columnName !== 'Övrig_utbildning') {
			_change[key] = _today[key] - lastYear[key];
		}
		else {
			delete _today[key];
		}
	}

	// Transform objects to arrays
	var today = d3.entries(_today);
	var change = d3.entries(_change);

	return {
		today: {
			highest: today.slice(0)
				.sort(function(a, b){ return d3.descending(a.value, b.value) })
				.slice(0,10)
			,
			lowest: today.slice(0)
				.sort(function(a, b){ return d3.ascending(a.value, b.value); })
				.slice(0,10)
		},
		change: {
			highest: change
				.sort(function(a, b){ return d3.descending(a.value, b.value); })				
				.filter(function(d, i) { return d.value > 0; }),
			lowest: change.slice(0)
				.sort(function(a, b){ return d3.ascending(a.value, b.value); })
				.filter(function(d) { return d.value < 0; })
		}
	}
}
function initTotals() {
	var d = getCurrentUnemployment();
	var $container = $("#total-unemployment");
	$container.find('.share').text(formatPercent(d['Samtliga']).replace('%',' procent'));
	$container.find('.total').text(d['Antal_arbetslosa']);
}
function initDashboardLists(listData) {
	var tt = Handlebars.compile( $("#template-list").html() );
	$('.dashboard-list').each(function() {
		var $el = $(this);
		var end = $el.attr('data-end');
		var value = $el.attr('data-value');
		var title = $el.attr('data-title');
		var emptyMessage = $el.attr('data-empty-message');

		$el.html( tt( {
			title: title,
			items: listData[value][end],
			value: value,
			emptyMessage: emptyMessage
		}));

		if (listData[value][end].length > numberOfListItems) {
			$el.find('.buttons').append(
				$('<button/>')
				.text('Visa hela listan')
				.attr('class', 'btn btn-all height-change')
				.click(function() {
					$(this).parents('.dashboard-list').addClass('show-all');
				})
				.prepend($('<span/>')
					.attr('class', 'glyphicon glyphicon-th-list')
					.attr('aria-hidden', 'true')
				)			
			);
			$el.find('.buttons').append(
				$('<button/>')
				.text('Visa färre')
				.attr('class', 'btn btn-fewer height-change')
				.click(function() {
					$(this).parents('.dashboard-list').removeClass('show-all');
				})			
			)
		}
	})
}
function getCurrentUnemployment() {
	return dataObj.data[dataObj.data.length - 1];
}

// Force redraw of chart when tab is clicked to get correct size
$("#dashboard a[role='tab']").on('shown.bs.tab', function() {
	var chartId = $(this).attr('aria-controls');
	charts[chartId + '-chart'].charts.today.flush();
});

// The string to be rendered in the lists on the dashboard
// Need to handle exception for education
Handlebars.registerHelper('formatListName', function(key) {
	var d = dataObj.columns[key];
	if (d.category == 'Utbildning') {
		return 'Utbildade inom ' + d.name.toLowerCase();
	}
	else if (d.category == 'Ålder') {
		return d.name
			.replace(' till ', '-')
			.replace(' år', '-åringar');
	}
	return d.name;
});


// Give rows after n an 'extra' class so that we can filter them
Handlebars.registerHelper('getRowClass', function(index) {
	return index < numberOfListItems ? '' : 'extra';
})
