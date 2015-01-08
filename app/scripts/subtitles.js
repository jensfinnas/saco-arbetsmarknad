
// Generate dynamic subtitles for specfic categories
var dynamicSubtitles = {
	'Utbildning': function(values) {
		var valuesSortedToday = values.slice(0).sort(function(a, b){ 
				return d3.descending(a.today, b.today);
			});
		var valuesSortedChange = values.slice(0).sort(function(a, b){ 
				return d3.descending(a.change, b.change);
			});

		var highest = valuesSortedToday[0];
		var lowest = valuesSortedToday[valuesSortedToday.length - 1];
		var diff = formatPercent(highest.today - lowest.today).replace("%","");
		var totalN = values.length;
		var increaseN = values.filter(function(d) { return d.change > 0 }).length;
		var decreaseN = values.filter(function(d) { return d.change < 0 }).length;
		var increaseShare = increaseN / totalN;
		var decreaseShare = decreaseShare / totalN;
		var strToday = 'Arbetslösheten är just nu högst bland akademiker utbildade inom ' + highest.nameFull.toLowerCase() + '. De har ' + diff + ' procentenheter högre arbetslöshet än personer inom ' + lowest.nameFull.toLowerCase() + '.<br/> ' ;	
		var strChange = 'Jämfört med samma tidpunkt förra året ';
		if (increaseShare > decreaseShare) {
			var shareStr = increaseShare == 1 ? 'samtliga' : increaseN + ' av ' + totalN; 
			strChange += 'ökar inom ' + shareStr + ' utbildningsgrupper.' 
		}
		else {
			var shareStr = decreaseShare == 0 ? 'samtliga' : decreaseN + ' av ' + totalN; 
			strChange += 'minskar arbetslöshet inom ' + shareStr + ' utbildningsgrupper.';	
		}
		return strToday + ' ' + strChange;
	},
	'Kön': function(values) {
		var valuesSortedToday = values.slice(0).sort(function(a, b){ 
			return d3.descending(a.today, b.today);
		});
		var valuesSortedChange = values.slice(0).sort(function(a, b){ 
			return d3.descending(a.change, b.change);
		});
		var highest = valuesSortedToday[0];
		var lowest = valuesSortedToday[valuesSortedToday.length - 1];
		var diff = formatPercent(highest.today - lowest.today).replace("%","");
		var changeMost = valuesSortedChange[0];
		var changeLeast = valuesSortedChange[valuesSortedChange.length - 1];
		var changeDiff = formatPercent(Math.abs(changeMost.change - changeLeast.change)).replace("%","");

		var str;
		if (diff == 0) {
			str = 'Arbetslösheten är i dag lika hög bland kvinnliga och manliga akademiker. Detta tillhör ovanligheterna. De senaste åren har kvinnors arbetslöshet varit lägre än mäns. '
		}
		else {
			str = 'Akademikernas arbetslöshet är ' + diff + ' procentenheter högre bland '+highest.nameFull.toLowerCase() + ' än bland '+ lowest.nameFull.toLowerCase() + '. ';	
			
			if (changeMost.nameFull == highest.nameFull) {
				str += 'Skillnaden har dessutom vuxit ';
			}
			else {
				str += 'Skillnaden däremot har minskat ';
			}
			str += ' med ' + changeDiff + ' procentenheter sedan förra året.';
		}

		return str;	
	},
	'Ålder': function() {
		return 'Här kommer en autogeneread text som beskriver vad grafen visar. Typ säga vilka som ökat mest.'	
	},
	'Födelseplats': function() {
		return 'Här kommer en autogeneread text som beskriver vad grafen visar. Typ säga vilka som ökat mest.'	
	}

}
