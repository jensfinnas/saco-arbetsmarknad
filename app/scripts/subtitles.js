var numberToText = {
	1: 'en',
	2: 'två',
	3: 'tre',
	4: 'fyra',
	5: 'fem',
	6: 'sex',
	7: 'sju',
	8: 'åtta',
	9: 'nio',
};
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
		var decreaseShare = decreaseN / totalN;
		var strToday = 'Bland personer med minst två års eftergymnasial utbildning är den öppna arbetslösheten just nu högst bland akademiker utbildade inom ' + highest.nameFull.toLowerCase() + '. De har ' + diff + ' procentenheter högre arbetslöshet än personer inom ' + lowest.nameFull.toLowerCase() + '.<br/> ' ;
		var strChange = 'Jämfört med samma tidpunkt förra året ';
		if (increaseShare > decreaseShare) {
			var shareStr = increaseShare == 1 ? 'samtliga' : numberToText[increaseN] + ' av ' + numberToText[totalN];
			strChange += 'ökar arbetslösheten inom ' + shareStr + ' utbildningsgrupper.'
		}
		else {
			var shareStr = decreaseShare == 0 ? 'samtliga' : numberToText[decreaseN] + ' av ' + numberToText[totalN];
			strChange += 'minskar arbetslösheten inom ' + shareStr + ' utbildningsgrupper.';
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
		var diff = highest.today - lowest.today;
		var diffStr = formatPercent(diff).replace("%","");
		var changeMost = valuesSortedChange[0];
		var changeLeast = valuesSortedChange[valuesSortedChange.length - 1];
		var changeDiff = Math.abs(changeMost.change - changeLeast.change);
		var changeDiffStr = formatPercent(changeDiff).replace("%","");

		var str;
		if (diff == 0) {
			str = 'Den öppna arbetslösheten är i dag lika hög bland män och kvinnor med minst två års eftergymnasial utbildning. Detta tillhör ovanligheterna. De senaste åren har kvinnors arbetslöshet varit lägre än mäns. '
		}
		else {
			str = 'Den öppna arbetslöshet bland personer med minst två års eftergymnasial utbildning är ' + diffStr + ' procentenheter högre bland '+highest.nameFull.toLowerCase() + ' än bland '+ lowest.nameFull.toLowerCase() + '. ';
			if (changeDiffStr = "0,0") {
				str += 'Det är lika stor skillnad som vid samma tidpunkt förra året.'
			}
			else {
				if (changeMost.nameFull == highest.nameFull) {
					str += 'Skillnaden har dessutom ökat ';
				}
				else {
					str += 'Skillnaden däremot har minskat ';
				}
				str += ' med ' + changeDiffStr + ' procentenheter jämfört med samma tidpunkt förra året.';
			}
		}

		return str;
	},
	'Ålder': function(values) {
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
		var decreaseShare = decreaseN / totalN;
		var strToday = 'Den öppna arbetslösheten för personer med minst två års eftergymnasial utbildning är högst i åldersspannet ' + highest.nameFull.toLowerCase() + '. Den här åldersgruppen har ' + diff + ' procentenheter högre arbetslöshet än personer i åldern ' + lowest.nameFull.toLowerCase() + '.<br/> ' ;
		var strChange = 'Jämfört med samma tidpunkt förra året ';
		if (increaseShare > decreaseShare) {
			var shareStr = increaseShare == 1 ? 'samtliga' : numberToText[increaseN] + ' av ' + numberToText[totalN];
			strChange += 'ökar arbetslösheten inom ' + shareStr + ' utbildningsgrupper.'
		}
		else {
			var shareStr = decreaseShare == 0 ? 'samtliga' : numberToText[decreaseN] + ' av ' + numberToText[totalN];
			strChange += 'minskar arbetslösheten inom ' + shareStr + ' åldersgrupper.';
		}
		return strToday + ' ' + strChange;
	},
	'Födelseregion': function(values) {
		var swedenBorn = values.filter(function(d) {
			return d.name == 'Sverige'
		})[0];
		var foreignBorn = values.filter(function(d) {
			return d.name == 'Utanför Norden'
		})[0];

		var diffToday = formatPercent(foreignBorn.today - swedenBorn.today).replace('%','');
		var diffChange = foreignBorn.change - swedenBorn.change;
		var diffChangeStr = formatPercent(diffChange).replace('%','');
		var direction = foreignBorn.change > swedenBorn.change ? 'dessutom ökat' : 'dock minskat';

		var str = 'Var en person är född är en av de mest avgörande faktorerna för risken att bli arbetslös för personer med minst två års eftergymnasial utbildning. Personer födda utanför Norden har ' + diffToday + ' procentenheter högre arbetslöshet än svenskfödda. ';

		if (diffChange!==0) {
			str += ' Skillnaden har ' + direction + ' något (' + diffChangeStr + ' procentenheter) jämfört med samma tidpunkt förra året.';
		}
		return str;
	}

}
