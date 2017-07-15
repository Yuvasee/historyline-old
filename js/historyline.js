// ------------------------------------
// Вертикальная полоса при ховере
// Изменение размеров шрифта
// Cортировка групп
// Переделать код в ООП: https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects
// Добавить покраску отдельных линий
// Добавить разные толщины линий (?)
// Изменение расположения линий, если не требует изменения размеров канваса, без их перерисовки
// Сохранение данных в куки
// Сделать, чтобы скролл был ограничен полем дива (вручную через события onpan)
// Подключить Gulp и NPM (или Bower)
// Сделать чтобы при перерисовке с масштабированием не терялся канвас за пределами отображения
// Кнопка "Очистить"
// Динамическое изменение высоты группы в этажах при выводе "плотно" и перерисовка если надо
// ------------------------------------

// id of canvas div elements
var CANVAS_CONT_ID = 'hl-canvas-container';
var CANVAS_ID = 'hl-canvas';
var CANVAS_TL_ID = 'hl-timeline-canvas';

// Square size for spacing lines in pixels
var MATRIX_CELL_SIZE = 5;

// Floor hight in pixels
var FLOOR_HEIGHT = 21;

// Canvas height
var CANVAS_CONT_HEIGHT = 500;

// Pixels between timeline and 1 floor
var FLOOR1_ALT = 15;

// Max number of floors
var FLOORS_CAP = 15;

// Default pixels per year
var DEF_PXPERYEAR = 3;

var DEF_FONTSIZE = 10;

// init scale edges array
var scaleEdges = {
	'min': 1700,
	'max': 2000
};

// init groups array
var groups = [];

// Инит объекта formsController
var formsC = new formsController();

// init canvas, events etc.
init();

// get canvas element
function getC()
{
	return $('#'+CANVAS_ID).svg('get');
}

// get timeline canvas element
function getTC()
{
	return $('#'+CANVAS_TL_ID).svg('get');
}

// onLoad initialization
function init()
{
	// Скрыть/показать элементы
	$("div.switch > a").each(function(index, element) {
		$(this).click(function() {
			$(this).parent().next().toggle();
		})
	});

	// create canvas and set it's start parameters
	$('#'+CANVAS_CONT_ID).height(CANVAS_CONT_HEIGHT);
	//drawCanvas();

	// add line onClick action
	$("#addLine").click(function() {
		// ------------------------------------------------------
		// !! task: add validation here!
		// ------------------------------------------------------
		addLine($('#addName').val(), $('#addBegin').val(), $('#addEnd').val());
	});

	$("#parse").click(function() {
		groupAddJSON();
	});

	$("#importJSONButton").click(function() {
		importJSON();
	});

	// add line onClick action
	$("#redraw").click(function() {
		drawAll();
	});

	$("#pxPerYear").val(DEF_PXPERYEAR);
	$("#fontSize").val(DEF_FONTSIZE);

}

// Drawing canvas
function drawCanvas() {
	
	// Число пикселей на год
	var pxPerYear = Number($('#pxPerYear').val()) || DEF_PXPERYEAR;

	// Меняем ширину дива: диапазон времени + 200 лет. Год = 2 пикселя
	w = (scaleEdges.max - scaleEdges.min + 200) * pxPerYear;
	
	// Считаем общее число этажей
	var totalFloorsN = 0;
	groups.forEach(function(group){
		totalFloorsN += Number(group.floorsN);
	});
	// Высота канваса (Y-координата нижней точки) = высота этажа * число этажей + отступ снизу
	var v = FLOOR_HEIGHT * totalFloorsN + FLOOR1_ALT;

	// Обновляем главный канвас
	// Задаём размер
	$('#'+CANVAS_ID).width(w).height(v);
	// Ресет самого канваса
	$('#'+CANVAS_ID).svg('destroy');
	$('#'+CANVAS_ID).svg();

	// Добавляем пан
	$('#'+CANVAS_ID).panzoom({
		// Добавляем движение таймлайна вместе с основным канвасом (танцы с бубном)
		onPan: function(e, panzoom, x, y){
			$('#'+CANVAS_TL_ID).panzoom("pan", x, 0, { silent: true })
		},
	});

	// Обновляем SVG-канвас таймлайна
	// Задаём размер
	$('#'+CANVAS_TL_ID).width(w).height(30);
	// Ресет самого канваса
	$('#'+CANVAS_TL_ID).svg('destroy');
	$('#'+CANVAS_TL_ID).svg();
	// Добавляем пан
	$('#'+CANVAS_TL_ID).panzoom({
		contain: 'invert',
		disableYAxis: true,
		// Добавляем движение основного канваса вместе с таймлайном
		onPan: function(e, panzoom, x, y){
			// Чтобы координата Y основного канваса не обнулялась при пане таймлайна
			// берем матрицу сдвига основной матрицы
			var matrix = $('#'+CANVAS_ID).panzoom("getMatrix");
			// и меняем в ней только координату X
			matrix[4] = panzoom.getMatrix()[4]
			// отправляем матрицу сдвига обратно в основной канвас
			$('#'+CANVAS_ID).panzoom("setMatrix", matrix);
		},
	});

	// Группы под элементы шкалы
	var gr = getC().group('scale');
	var gr2 = getTC().group('timeline');
	
	// Рисуем базовую линию
	getTC().rect(gr2, 0, 0, w, 1, 0, 0, {fill: 'black'});

	// x - счетчик пикселей для цикла отрисовки
	var x = -pxPerYear;

	// Цикл отрисовки шкалы
	for(i = scaleEdges.min-100; i <= scaleEdges.max+100; i++)
	{
		// 1 год = pxPerYear пикс
		x += pxPerYear;

		// 100-летняя линия
		if(i % 100 == 0)
		{
			getC().rect(gr, x, 0, 1, v, 0, 0, {fill: '#ebebeb'});
			getTC().rect(gr2, x, 1, 1, 20, 0, 0, {fill: 'black'});
			getTC().text(gr2, x+8, 21, i.toString(), {'font-family': 'arial', 'font-size': '10', 'fill': '#939393'});
			continue;
		}

		// 50-летняя линия
		if(i % 50 == 0)
		{
			getC().rect(gr, x, 0, 1, v, 0, 0, {fill: '#ebebeb'});
			getTC().rect(gr2, x, 1, 1, 10, 0, 0, {fill: 'black'});
			getTC().text(gr2, x+8, 21, i.toString(), {'font-family': 'arial', 'font-size': '10', 'fill': '#939393'});
			continue;
		}

		// 10-летняя линия
		if(i % 10 == 0)
		{
			getC().rect(gr, x, 0, 1, v, 0, 0, {fill: '#f5f5f5'});
			getTC().rect(gr2, x, 1, 1, 3, 0, 0, {fill: 'black'});
		}
	}

}

// Добавляем группу линий JSON-массивом
function groupAddJSON()
{
	// Парсим JSON
	var jsonData = JSON.parse($('#lines').val());

	var renderType = 'ladder';
	if ($("input[name='renderType']:checked").val() == 'freeSpace'){
		renderType = 'freeSpace';
	}

	// Добавляем новую группу, получаем её индекс в массиве
	var grI = groupAdd($('#newGroupName').val(), $('#newGroupColor').val(), renderType, $('#newGroupFloorsN').val());

	// Добавляем в группу линии
	for (var i = 0; i < jsonData.length; i++) {
		groupLineAdd(grI, jsonData[i].name, jsonData[i].begin, jsonData[i].end, $('#newGroupColor').val());
	}

	// Sort lines ascending by begin date
	groupSort(grI);

	// Апдейтим диапазон таймлайна в годах
	groupCalcEdges(grI);

	drawAll();

}

// Добавляем новую группу,
// возвращаем её номер
function groupAdd(name, color, renderType, floorsN, lines)
{
	name = name || "New group";
	color = color || "red";
	renderType = renderType || "ladder";
	floorsN = Number(floorsN) || 10;
	lines = lines || [];

	groups.push({
		"groupName": name,
		"groupColor": color,
		"renderType": renderType,
		"floorsN": floorsN,
		"lines": lines,
		"matrix": [],
	});

	formsC.drawGroupForm(groups.length-1);

	return groups.length-1;
}

function groupUpdate(grI, name, color, renderType, floorsN)
{
	groups[grI].groupName = name || groups[grI].groupName;
	groups[grI].groupColor = color || groups[grI].groupColor;
	groups[grI].renderType = renderType || groups[grI].renderType;
	groups[grI].floorsN = Number(floorsN) || groups[grI].floorsN;
}

// Сортировка линий группы по возрастанию даты начала
function groupSort(groupIndex)
{
	groups[groupIndex].lines.sort(function(a, b){
		return a.begin - b.begin;
	});	
}

// Апдейт диапазона таймлайна в годах
function groupCalcEdges(groupIndex)
{
	groups[groupIndex].lines.forEach(function(line){
		calcEdges(line.begin, line.end);
	});	
}

// Добавить линию в группу
function groupLineAdd(groupIndex, name, begin, end, color)
{
	// По-умолчанию берем цвет группы
	color = color || groups[groupIndex].color;

	// Провеяем на дубль по названию и дате начала
	if(!groups[groupIndex].lines.find(function(line){
		return (line.name == name && line.begin == Number(begin));
	})){
		groups[groupIndex].lines.push({
			"name": name,
			"begin": Number(begin),
			"end": Number(end),
			"color": color,
		});
	}
}

// add new line to our graph
function addLine(name, begin, end)
{
	// str to num
	begin = Number(begin);
	end = Number(end);

	// add data to lines array
	lines.push({
		"name": name,
		"begin": begin,
		"end": end
	});

	// output new data to JSON textarea
	exportJSON();

	// Check if new line dates are out of current scale
	// Do we have to redraw our scale?
	var bRedraw = calcEdges(begin, end);

	// Redraw if it's necessary
	if(bRedraw)
	{
		drawAll();
		
		// and that's it
		return;
	}

	// If we don't have to redraw all, just draw last added line
	drawLine(lines[lines.length - 1], lines.length - 1);
}

// Check if new line dates are out of current scale
// Do we have to redraw our scale?
function calcEdges(begin, end)
{
	// Check left side
	var bRedraw = false;
	if(!("min" in scaleEdges) || scaleEdges.min > begin)
	{
		scaleEdges.min = begin;
		bRedraw = true;
	}

	// Check right side
	if(!("max" in scaleEdges) || scaleEdges.max < end)
	{
		scaleEdges.max = end;
		bRedraw = true;
	}

	return bRedraw;
}

// Рисуем всё
function drawAll()
{
	// Рисуем таймлайн и канвас
	drawCanvas();

	// Рисуем группы
	drawGroups();

	// Экспортим JSON
	exportJSON();

}

// Рисуем все группы
function drawGroups()
{
	groups.forEach(function(group, groupIndex){

		// инит матрицы этажей в зависимости от числа групп
		initMatrix(groupIndex);

		// пока что просто рисуем все линии по одной
		group.lines.forEach(function(line, index){
			drawLine(line, index, group.groupColor, group.renderType, groupIndex)
		});

	});
}

// Инит матрицы группы
function initMatrix(groupIndex)
{
	for(var i = 0; i < FLOOR_HEIGHT; i++)
	{
		groups[groupIndex].matrix[i] = [];
	}
}

// Draw line from lines array
function drawLine(line, index, groupColor, renderType, groupIndex)
{
	// Форматируем цифровые параметры
	line.begin = Number(line.begin);
	line.end = Number(line.end);

	// Число пикселей на год
	var pxPerYear = Number($('#pxPerYear').val()) || DEF_PXPERYEAR;

	// Размер Шрифта
	var fontSize = $('#fontSize').val() || DEF_FONTSIZE;

	// Вычисляем общее число этажей
	var floorsTotal = 0
	groups.forEach(function(group){
		floorsTotal += group.floorsN;
	});

	// Вычисляем высоту канваса
	// Линия сначала рисуется на нижнем этаже, а потом сдвигается на своё место по-вертикали
	var v = FLOOR_HEIGHT * floorsTotal;
	
	// Вычисляем горизонтальную координату начала линии.
	// Сначала происходит отрисовка, а потом сдвиг линии на ширину текста перед линией (var shift)
	var h = (line.begin-scaleEdges.min+100) * pxPerYear;

	// Длинна линиии в пикселях
	var l = (line.end-line.begin+1) * pxPerYear;
	
	// Цвет линии
	var col = groupColor || line.color;

	// Группа для нашего объекта
	var gr = getC().group(null, {id: 'group'+groupIndex+'line'+index});

	// Текст name
	var t = getC().text(gr, h, v+4, line.name, {'font-family': 'arial', 'font-size': fontSize, 'fill': '#939393'});

	// Переменная для сдвига, который компенсирует длинну текста перед линией
	var shift = 0;
	
	// Измеряем длинну текста name
	t = t.getBBox().width;
	// Округляем и добавляем ее к горизонтали
	h += Math.round(t) + 5;
	// Добавляем длинну текста к переменной сдвига
	shift += Math.round(t);
	
	// Текст begin
	t = getC().text(gr, h, v+4, line.begin.toString(), {'font-family': 'georgia', 'font-size': fontSize, 'fill': '#939393'});

	// Измеряем длинну текста begin
	t = t.getBBox().width;
	// Округляем и добавляем ее к горизонтали
	h += Math.round(t) + 5;
	// Добавляем длинну текста (цифры) к переменной сдвига + 10 px на отступы
	shift += Math.round(t) + 10;
	// Меняем знак для сдвига влево
	shift = -shift;

	// Рисуем полосу
	if(l > 4) {
		getC().rect(gr, h, v, l, 3, 0, 0, {fill: col});
		getC().polygon(gr, [[h, v-3], [h+5, v+2], [h, v+6]], {'fill': col});
		getC().polygon(gr, [[h+l, v-4], [h+l-5, v+2], [h+l, v+6]], {'fill': col});
	} else {
		getC().rect(gr, h, v-3, l, 9, 0, 0, {fill: col});
	}

	h += l + 5;

	// Текст end
	getC().text(gr, h, v+4, line.end.toString(), {'font-family': 'georgia', 'font-size': fontSize, 'fill': '#939393'});

	// Подсчитаем число этажей в группах под текущей группой
	var floorsUnder = 0
	for(var i = groupIndex-1; i >= 0; i--){
		floorsUnder += groups[i].floorsN;
	}

	if(renderType == 'freeSpace') {
		// Получаем свободный этаж по матрице этажей группы
		var floorN = findFreeFloor(gr.getBBox().x+shift, gr.getBBox().width, groupIndex);

		// Добавляем сдвиг на предыдущие группы
		// Получаем сдвиг для нашего этажа
		var shiftY = (floorN + floorsUnder) * FLOOR_HEIGHT * -1;

	} else {
		// Этаж относительно группы
		var shiftY = index % groups[groupIndex].floorsN;

		// Добавляем сдвиг на предыдущие группы
		shiftY += floorsUnder;

		// Умножаем на высоту этажа с обратным знаком
		shiftY *= FLOOR_HEIGHT * -1;
	}

	// If no free space - delete current SVG group, last lines array element and return
	if(floorN == -1) {
		alert("Не поместилась строка: "+line.name);
		getC().remove(gr);
		return;
	}

	// Move line to proper position
	$('#group'+groupIndex+'line'+index).animate({svgTransform: 'translate('+shift+', '+shiftY+')'}, 200);

}

// Get free floor number for line
function findFreeFloor(position, width, groupIndex)
{
	// Get shift in grid squares (free squares at left)
	sqShift = Math.floor(position / MATRIX_CELL_SIZE);

	// Get line length in grid squares (free squares left)
	if(position % MATRIX_CELL_SIZE != 0) {
		sqLength = Math.ceil((width + MATRIX_CELL_SIZE - position % MATRIX_CELL_SIZE) / MATRIX_CELL_SIZE);
	} else {
		sqLength = Math.ceil(width / MATRIX_CELL_SIZE);
	}

	// check if current floor has free space on proper squares
	var bFree = true;
	var floorN = 0;

	// Перебираем этажи, пока не найдем место или не убедимся, что его нет
	while (1)
	{
		bFree = true;

		// Перебираем ячейки на этаже, проверяем есть ли среди них занятые
		// Проверяем по одной дополнительной ячейке по краям
		for(var i = sqShift; i <= sqShift+sqLength+1; i++)
		{
			if(!(typeof groups[groupIndex].matrix[floorN][i] === 'undefined') && groups[groupIndex].matrix[floorN][i] == 1)
			{
				bFree = false;
				break;
			}
		}

		// Если не нашли помех на этаже - выходим из цикла, место найдено
		if(bFree == true) {
			break;
		}

		// Если мест нет, идем дальше
		floorN++;

		// Если достигли потолка - увы
		if(floorN >= groups[groupIndex].floorsN) {
			return -1;
		}
	}

	// Занимаем место в матрице на нашем этаже
	for(var j = sqShift+1; j <= sqShift+sqLength; j++)
	{
		groups[groupIndex].matrix[floorN][j] = 1;
	}

	return floorN;
}

// Вываливаем массив для экспорта
function exportJSON()
{
	var g = JSON.parse(JSON.stringify(groups));

	// Удаляем матрицы у групп, для экспорта они не нужны
	g.forEach(function(group, index){
		delete group["matrix"];
	});

	$('#exportJSON').val(JSON.stringify(g));
}

function importJSON()
{
	// Парсим JSON
	var jsonData = JSON.parse($('#importJSON').val());	

	var grI;

	if(jsonData){
		jsonData.forEach(function(group, index){
			grI = groupAdd(group.groupName, group.groupColor, group.renderType, group.floorsN, group.lines);
			groupSort(grI);
			groupCalcEdges(grI);
		});		

		drawAll();
	}
}

// Апдейт свойств групп из форм
function updateAll()
{
	// Обновляем значения
	groups.forEach(function(group, grI){
		groupUpdate(grI, $("#group"+grI+"Name").val(), $("#group"+grI+"Color").val(),
			$("#group"+grI+"RenderType").val(), $("#group"+grI+"FloorsN").val());
	});

	// Перерисовываем
	drawAll();
}

// Класс для контроля всех веб-форм
function formsController() {

	// Рисуем для группы форму с её параметрами
	this.drawGroupForm = function(groupIndex) {
		$('#groupsList').prepend(`					<form class="form-inline groups-list">
						<div class="form-group">
							<input type="text" class="form-control" id="group`+groupIndex+`Name" value="`+groups[groupIndex].groupName+`">
						</div>

						<div class="form-group">
							<label for="group`+groupIndex+`Color">Цвет</label>
							<input type="text" class="form-control hl-sm" id="group`+groupIndex+`Color" value="`+groups[groupIndex].groupColor+`">
						</div>

						<div class="form-group">
							<label for="group`+groupIndex+`FloorsN">Этажи</label>
							<input type="number" class="form-control hl-sm" id="group`+groupIndex+`FloorsN" value="`+groups[groupIndex].floorsN+`">
						</div>

						<div class="form-group">
							<label for="group`+groupIndex+`RenderType">Структура</label>
							<select class="form-control" id="group`+groupIndex+`RenderType">
								<option value="ladder">Лестница</option>
								<option value="freeSpace">Плотняк</option>
							</select>
						</div>
					</form>`);

		$("#group"+groupIndex+"RenderType").val(groups[groupIndex].renderType);

		this.drawGroupsUpdateButton();

	};

	// Рисуем кнопку апдейта групп
	this.drawGroupsUpdateButton = function() {

		// Если группы есть, а кнопки нет - рисуем кнопку
		if (groups.length && !$("#groupsUpdateButton").length) {
			$('#groupsList').append(`<button type="button" class="btn btn-default" id="groupsUpdateButton">Обновить</button>`);
			$("#groupsUpdateButton").click(function() {
				updateAll();
			});
		}

		// Если групп нет, а кнопка есть - удаляем её
		if (!groups.length && $("#groupsUpdateButton").length) {
			$("#groupsUpdateButton").remove();
		}
	};

}