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
		// Exclude columns categorized with date and 'Övriga'
		if (cat !== 'time' && cat !== 'Övriga') {
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
			highest: today.sort(function(a, b){ return d3.descending(a.value, b.value); }),
			lowest: today.slice(0).sort(function(a, b){ return d3.ascending(a.value, b.value); })
		},
		change: {
			highest: change
				.sort(function(a, b){ return d3.descending(a.value, b.value); })				
				.filter(function(d) { return d.value > 0; }),
			lowest: change.slice(0)
				.sort(function(a, b){ return d3.ascending(a.value, b.value); })
				.filter(function(d) { return d.value < 0; })
		}
	}
}
function initDashboardLists(listData) {
	var tt = Handlebars.compile( $("#template-list").html() );
	$('.dashboard-list').each(function() {
		var $el = $(this);
		var end = $el.attr('data-end');
		var value = $el.attr('data-value');
		var title = $el.attr('data-title');

		$el.html( tt( {
			title: title,
			items: listData[value][end].slice(0,5)
		}) );
	})
	

}