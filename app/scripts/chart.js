// Get url parameters and append as data-attributes to chart element
// We always initiate charts with data attributes
function addUrlParamsToChart() {
	$('#chart').attr({
		'data-columns': getQueryString('columns'),
		'data-month': getQueryString('month'),
		'data-height': getQueryString('height'),
		'data-show-change': getQueryString('showChange'),
		'data-sort': getQueryString('sort')
	})
}

//INIT
function initSingleChart() {
	// Init pym.js for iframe responsiveness if embeded
	if (isIframe) {
		var pymChild = new pym.Child();
	}
	// Get data and init chart
	$.getJSON(dataUrl, function(resp) {
		dataObj = initData(resp);
		addUrlParamsToChart();
		initCharts();
		if (isIframe) pymChild.sendHeight();
	});	
}
