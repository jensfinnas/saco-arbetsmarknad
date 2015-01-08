function initData(a){return a.data=a.data.map(function(a){for(key in a)a[key]="Månad"==key?parseDate(a[key]):a[key]/100;return a}).sort(function(a,b){return d3.ascending(a["Månad"],b["Månad"])}),a}function initCharts(){$(".chart").each(function(){var a=$(this),b=a.attr("id"),c=a.attr("data-columns").split(","),d={};a.hasAttr("data-charts")&&(d.charts=a.attr("data-charts").split(",")),a.hasAttr("data-month")&&"latest"!==a.attr("data-month")&&(d.date=parseDate(a.attr("data-month"))),a.hasAttr("data-width")&&(d.width=a.attr("data-width")),a.hasAttr("data-height")&&(d.height=a.attr("data-height")),a.hasAttr("data-show-change")&&(d.showChange="true"==a.attr("data-show-change")),a.hasAttr("data-sort")&&(d.sort=a.attr("data-sort")),"false"==d.sort&&(d.sort=!1),a.hasAttr("data-subtitle")&&(d.subtitle=a.attr("data-subtitle")),charts[b]=new BarChart(b,c,d)})}function getQueryString(a){a=a.replace(/[\[]/,"\\[").replace(/[\]]/,"\\]");var b=new RegExp("[\\?&]"+a+"=([^&#]*)"),c=b.exec(location.search);return null===c?"":decodeURIComponent(c[1].replace(/\+/g," "))}function sameYearAndMonth(a,b){return a.getFullYear()==b.getFullYear()&&a.getMonth()==b.getMonth()}function drawChartBuilderUI(){var a=d3.nest().key(function(a){return a.category}).entries(d3.values(dataObj.columns).filter(function(a){return"Månad"!==a.name}).sort(function(a,b){return d3.ascending(a.name,b.name)})),b=Handlebars.compile($("#template-columns").html());$("#columns").html(b(a));var c=dataObj.data.map(function(a){return{name:formatMonthYear(a["Månad"]),value:formatYearMonthDay(a["Månad"])}}).sort(function(a,b){return d3.descending(a.value,b.value)});c.unshift({name:"Senaste månaden",value:"latest"});var d=Handlebars.compile($("#template-months").html());$("#months").html(d(c)),$("#columns").children("li").click(function(){var a=$(this);a.parent("#columns").find(":checked").prop("checked",!1),a.next("ul").find("input").prop("checked",!0),chartBuilderUpdate()})}function chartBuilderUpdate(){var a=$("#columns :checked").map(function(){return $(this).val()}).toArray(),b=$("#months").val(),c=$("input[name=sort]:checked").val(),d=$("input[name=showChange]:checked").val(),e=$("#height").val(),f=window.location.href.replace("chartbuilder.html","")+"chart.html?columns="+a.join(",")+"&month="+b+"&sort="+c+"&showChange="+d+"&height="+e;$("#url").text(f),$("#iframe-parent iframe").remove();new pym.Parent("iframe-parent",f,{})}function initChartBuilder(){$.getJSON(dataUrl,function(a){dataObj=initData(a),drawChartBuilderUI(),$("#columns ul").first().find("input").prop("checked",!0),chartBuilderUpdate()})}function addUrlParamsToChart(){$("#chart").attr({"data-columns":getQueryString("columns"),"data-month":getQueryString("month"),"data-height":getQueryString("height"),"data-show-change":getQueryString("showChange"),"data-sort":getQueryString("sort")})}function initSingleChart(){if(isIframe)var a=new pym.Child;$.getJSON(dataUrl,function(b){dataObj=initData(b),addUrlParamsToChart(),initCharts(),isIframe&&a.sendHeight()})}function getListData(){var a=$.extend({},dataObj.data[dataObj.data.length-1]),b=new Date(a["Månad"].getFullYear()-1,a["Månad"].getMonth()),c=dataObj.data.first(function(a){return sameYearAndMonth(a["Månad"],b)}),d={};for(key in a){var e=dataObj.columns[key].category;"time"!==e&&"Övriga"!==e?d[key]=a[key]-c[key]:delete a[key]}var f=d3.entries(a),g=d3.entries(d);return{today:{highest:f.sort(function(a,b){return d3.descending(a.value,b.value)}),lowest:f.slice(0).sort(function(a,b){return d3.ascending(a.value,b.value)})},change:{highest:g.sort(function(a,b){return d3.descending(a.value,b.value)}),lowest:g.slice(0).sort(function(a,b){return d3.ascending(a.value,b.value)})}}}function initDashboardLists(a){var b=Handlebars.compile($("#template-list").html());$(".dashboard-list").each(function(){var c=$(this),d=c.attr("data-end"),e=c.attr("data-value");c.html(b({title:e+": "+d,items:a[e][d].slice(0,5)}))})}BarChart=function(){function a(a,b,c){var d=this;d.data=dataObj.data,d.columns=b,d.opts=$.extend({width:"auto",height:300,title:!1,subtitle:!1,sort:!1,showChange:!1,date:d.data[d.data.length-1]["Månad"]},c),d.subtitles=dynamicSubtitles,d.id="#"+a,d.columnDictionary=dataObj.columns,d.$el=$(d.id),d.opts.title&&d.$el.append($("<h3/>").attr("class","title").text(d.opts.title)),d.opts.subtitle&&d.$el.append($("<div/>").attr("class","subtitle")),d.chartContainers={},d.chartContainers.today=d.$el.append($("<div/>").attr("class","chart-today")),d.label={today:"Arbetslöshet",change:"Förändring"},d.$el.append($("<button/>").text("Visa förändring").click(function(){$(this).text(d.opts.showChange?"Visa förändring":"Visa läget just nu"),d.update(d.opts.showChange?{showChange:!1}:{showChange:!0})})),b&&0!=b.length||console.error("Error: Add an array of columns"),d.charts={},d.chartSetup={bindto:d.id+" .chart-today",size:{height:d.opts.height},padding:{},data:{x:"x",groups:[[d.label.today,d.label.change]],type:"bar",color:function(a,b){return b.id==d.label.change?b.value>0?"green":"red":a}},axis:{x:{type:"category",tick:{outer:!0}},y:{tick:{format:function(a){return formatPercent(a)}}}},grid:{y:{lines:[{value:0,text:""}]}},legend:{position:"inset",inset:{anchor:"top-right"}}},d.drawTodayChart(),d.opts.subtitle in d.subtitles&&(d.opts.subtitle=d.subtitles[d.opts.subtitle](d.values)),d.$el.find(".subtitle").html(d.opts.subtitle)}return a.prototype.drawTodayChart=function(){var a=this,b=a.chartSetup;b.data.columns=a.getValues(),a.charts.today=c3.generate(b)},a.prototype.getValues=function(){var a=this,b=a.data.first(function(b){return sameYearAndMonth(b["Månad"],a.opts.date)});0==b.length&&console.error("Date error");var c,d=a.opts.date.sameMonthLastYear();c=a.data.first(function(a){return sameYearAndMonth(a["Månad"],d)});var e=[];if(a.columns.forEach(function(d){try{e.push({name:a.columnDictionary[d].name_short,nameFull:a.columnDictionary[d].name,today:b[d],change:b[d]-c[d]})}catch(f){console.error("Invalid column ("+d+" )",f)}}),a.opts.sort)try{e.sort(function(b,c){return d3.ascending(b[a.opts.sort],c[a.opts.sort])})}catch(f){console.error("Invalid sort key.",f)}a.values=e.slice(0),e.unshift({name:"x",today:a.label.today,change:a.label.change});var g=[e.map(function(a){return a.name}),e.map(function(a){return a.today})];return a.opts.showChange&&g.push(e.map(function(a){return a.change})),g},a.prototype.update=function(a){var b=this;$.extend(b.opts,a),b.charts.today.load({columns:b.getValues()}),b.opts.showChange||b.charts.today.unload([b.label.change])},a}();var locale=d3.locale({decimal:",",thousands:" ",grouping:[3],currency:[""," kr"],dateTime:"%A %e %B %Y kl. %X",date:"%d.%m.%Y",time:"%H:%M:%S",periods:["AM","PM"],days:["måndag","tisdag","onsdag","torsdag","fredag","lördag","söndag"],shortDays:["må","ti","ons","to","fre","lö","sö"],months:["januari","februari","mars","april","maj","juni","juli","augusti","september","oktober","november","december"],shortMonths:["jan","feb","mars","apr","maj","jun","jul","aug","sept","okt","nov","dec"]}),parseDate=locale.timeFormat("%Y-%m-%d").parse;$.prototype.hasAttr=function(a){var b=$(this).attr(a);return"undefined"!=typeof b&&b!==!1},Array.prototype.first||(Array.prototype.first=function(a){"use strict";if(null==this)throw new TypeError;if("function"!=typeof a)throw new TypeError;for(var b=0;b<this.length;b++)if(a(this[b]))return this[b];return null}),Date.prototype.sameMonthLastYear=function(){return new Date(this.getFullYear()-1,this.getMonth(),1)},Handlebars.registerHelper("columnName",function(a){return dataObj.columns[a].name}),Handlebars.registerHelper("formatPercent",function(a){return formatPercent(a)});var formatPercent=locale.numberFormat(".1%"),formatPercentSmall=locale.numberFormat(".2%"),formatMonthYear=locale.timeFormat("%B %Y"),formatYearMonthDay=locale.timeFormat("%Y-%m-%d"),dataObj,charts={},isIframe=self!==top,key="1I7A8rydoRA6n28W6Tnt6nCpEYeUbI2J1dcVrEy54G7Y",mode="stage",dataUrl="https://s3-eu-west-1.amazonaws.com/tabletop-proxy/saco-arbetsmarknad-"+mode+"/"+key+".json",dynamicSubtitles={Utbildning:function(a){var b=a.slice(0).sort(function(a,b){return d3.descending(a.today,b.today)}),c=(a.slice(0).sort(function(a,b){return d3.descending(a.change,b.change)}),b[0]),d=b[b.length-1],e=formatPercent(c.today-d.today).replace("%",""),f=a.length,g=a.filter(function(a){return a.change>0}).length,h=a.filter(function(a){return a.change<0}).length,i=g/f,j=j/f,k="Arbetslösheten är just nu högst bland akademiker utbildade inom "+c.nameFull.toLowerCase()+". De har "+e+" procentenheter högre arbetslöshet än personer inom "+d.nameFull.toLowerCase()+".<br/> ",l="Jämfört med samma tidpunkt förra året ";if(i>j){var m=1==i?"samtliga":g+" av "+f;l+="ökar inom "+m+" utbildningsgrupper."}else{var m=0==j?"samtliga":h+" av "+f;l+="minskar arbetslöshet inom "+m+" utbildningsgrupper."}return k+" "+l},"Kön":function(a){var b,c=a.slice(0).sort(function(a,b){return d3.descending(a.today,b.today)}),d=a.slice(0).sort(function(a,b){return d3.descending(a.change,b.change)}),e=c[0],f=c[c.length-1],g=formatPercent(e.today-f.today).replace("%",""),h=d[0],i=d[d.length-1],j=formatPercent(Math.abs(h.change-i.change)).replace("%","");return 0==g?b="Arbetslösheten är i dag lika hög bland kvinnliga och manliga akademiker. Detta tillhör ovanligheterna. De senaste åren har kvinnors arbetslöshet varit lägre än mäns. ":(b="Akademikernas arbetslöshet är "+g+" procentenheter högre bland "+e.nameFull.toLowerCase()+" än bland "+f.nameFull.toLowerCase()+". ",b+=h.nameFull==e.nameFull?"Skillnaden har dessutom vuxit ":"Skillnaden däremot har minskat ",b+=" med "+j+" procentenheter sedan förra året."),b},"Ålder":function(){return"Här kommer en autogeneread text som beskriver vad grafen visar. Typ säga vilka som ökat mest."},"Födelseplats":function(){return"Här kommer en autogeneread text som beskriver vad grafen visar. Typ säga vilka som ökat mest."}};