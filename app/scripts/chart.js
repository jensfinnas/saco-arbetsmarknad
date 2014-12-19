// Get url parameters and append as data-attributes to chart element
// We always initiate charts with data attributes
function addUrlParamsToChart() {
	$('#chart').attr({
		'data-columns': getQueryString('columns'),
		'data-month': getQueryString('month'),
		'data-charts': getQueryString('charts'),
		'data-height': getQueryString('height')
	})
}

//INIT
// Init pym.js for iframe responsiveness if embeded
if (self !== top) {
	var pymChild = new pym.Child();
}
// Get data and init chart
$.getJSON(dataUrl, function(resp) {
	dataObj = initData(resp);
	addUrlParamsToChart();
	initCharts();
	pymChild.sendHeight();
});