// Renders the chart builder interface
function drawChartBuilderUI() {
	// Aggegate columns by category
	var columnContext = d3.nest()
		.key(function(d) { return d.category})
		.entries(
			d3.values(dataObj.columns)
				.filter(function(d) {
					return d.name !== 'Månad';
				})
				.sort(function(a, b){ return d3.ascending(a.name, b.name); })
		);

	// Compile html for columns list
	var columnHtml = Handlebars.compile( $("#template-columns").html() );
	$('#columns').html( columnHtml(columnContext) );

	// Get a an array of months
	var monthContext = dataObj.data.map(function(d) {
		return {
			name: formatMonthYear(d['Månad']),
			value: formatYearMonthDay(d['Månad'])
		}
	})
	.sort(function(a, b){ return d3.descending(a.value, b.value); });
	monthContext.unshift({ name: 'Senaste månaden', value: 'latest' });

	// Compile html for months list
	var monthHtml = Handlebars.compile( $("#template-months").html() );
	$('#months').html( monthHtml(monthContext) );	

	// Select all siblings when header is clicked
	$('#columns').children('li').click(function() {
		var $el = $(this);
		$el.parent('#columns').find(':checked').prop('checked', false);
		$el.next('ul').find('input').prop('checked', true);
		chartBuilderUpdate();
	})
}

// Updates
function chartBuilderUpdate() {
	var columns = $('#columns :checked')
		.map(function() { return $(this).val(); })
		.toArray();
	var month = $('#months').val();
	var sort = $('input[name=sort]:checked').val();
	var showChange = $('input[name=showChange]:checked').val();

	var height = $('#height').val();
	var url = window.location.href.replace('chartbuilder.html','') + 'chart.html' + 
		'?columns=' + columns.join(',') +
		'&month=' + month + 
		'&sort=' + sort +
//		'&showChange=' + showChange +
		'&height=' + height;

	$('#url').text(url);
	$("#iframe-parent iframe").remove();
	var pymParent = new pym.Parent('iframe-parent', url, {});
}

function initChartBuilder() {
	$.getJSON(dataUrl, function(resp) {
		dataObj = initData(resp);
		drawChartBuilderUI();
		$("#columns ul").first().find('input').prop('checked', true);
		chartBuilderUpdate();
	});	
} 
