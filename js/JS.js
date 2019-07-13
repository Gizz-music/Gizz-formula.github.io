function car (position, direction) {

// Переменные настройки параметров физики заноса и управления тачками!

    var MAX_LINEAR_VELOCITY = 5;
    var ACCELERATION_FORWARD = 0.3;
    var ACCELERATION_BACK = 0.05;
    var DIRECTION_CHANGE = 0.06;
    var SMOOTHING = -0.05;
    var RESISTANSE = 1;

    this.position = position;
    this.carDirection = direction;
    this.linearVelocity = [0, 0];
    this.acceleration = [0];
    this.me = this;
    this.carControl = function() {
        forward = function () {return this.forward.call(this.me)};
        neutral = function () {return this.neutral.call(this.me)};
        back = function () {return this.back.call(this.me)};
        turnLeft = function () {return this.turnLeft.call(this.me)};
        turnRight = function () {return this.turnRight.call(this.me)};
    };

    this.forward = function () {
        this.acceleration = [ACCELERATION_FORWARD * Math.sin(this.carDirection),
            -ACCELERATION_FORWARD * Math.cos(this.carDirection)];
    };

    this.neutral = function () {
        this.acceleration = [0, 0];
    };

    this.back = function () {
        this.acceleration = [-ACCELERATION_BACK * Math.sin(this.carDirection),
            ACCELERATION_BACK * Math.cos(this.carDirection)];
    };

    this.turnLeft = function () {
        this.carDirection =
            normalizeAngle (this.carDirection - DIRECTION_CHANGE);
    };

    this.turnRight = function () {
        this.carDirection =
            normalizeAngle (this.carDirection + DIRECTION_CHANGE);

    };

    function normalizeAngle(angle) {
        if (angle > Math.PI) {
            return angle - 2 * Math.PI;
        } else
        if (angle < - Math.PI) {
            return angle + 2 * Math.PI;
        }
        return angle;
    }

    this.update = function () {
        this.updateDirection();
        this.updatePosition();
        this.velocityByDirectionCorrection();
    };

    this.updateDirection = function () {
        this.linearVelocity = [(this.linearVelocity[0] + this.acceleration[0]) * RESISTANSE ,
            (this.linearVelocity[1] + this.acceleration[1]) * RESISTANSE];
        this.linearVelocity[0] = limitModulus(this.linearVelocity[0], MAX_LINEAR_VELOCITY);
        this.linearVelocity[1] = limitModulus(this.linearVelocity[1], MAX_LINEAR_VELOCITY);
    };

    function limitModulus(value, limit) {
        if (value > MAX_LINEAR_VELOCITY) {
            return MAX_LINEAR_VELOCITY;
        } else if (value < - MAX_LINEAR_VELOCITY) {
            return - MAX_LINEAR_VELOCITY;
        }
        return value;
    }

    this.updatePosition = function () {
        this.position[0] = this.position[0] + this.linearVelocity[0];
        this.position[1] = this.position[1] + this.linearVelocity[1];
    };

    this.velocityByDirectionCorrection = function () {
        var velocityDirection = this.getVelocityDirection();
        var sideslipAngle = normalizeAngle(velocityDirection - this.carDirection);
        this.linearVelocity = rotate (this.linearVelocity, sideslipAngle * SMOOTHING);
    };

    this.getVelocityDirection = function (){
        return Math.atan2(this.linearVelocity[1], this.linearVelocity[0]) + Math.PI / 2;
    };

    function rotate (position, angle) {
        return [
            position[0] * Math.cos(angle) - position[1] * Math.sin(angle),
            position[0] * Math.sin(angle) + position[1] * Math.cos(angle)
        ];
    }

}

pressedKeys = [];

function keyUp(key) {
    pressedKeys[key] = false;
}

function keyDown(key) {
    pressedKeys[key] = true;
}

function blur() {
    pressedKeys = [];
}

function carDrive(car, keySet) {
    this.car = car;
    var keySet = keySet;

    this.action = function() {
        pressedKeys[keySet.left]
    };

    this.action = function() {

        if (car.demage) {
            return;
        }
        if (pressedKeys[keySet.up] || pressedKeys[keySet.down]) {
            if (pressedKeys[keySet.up]) {
                this.car.forward();
            }
            if (pressedKeys[keySet.down]) {
                this.car.back()
            }
        } else {
            this.car.neutral();
        }
        if (pressedKeys[keySet.left]) {
            this.car.turnLeft();
        }
        if (pressedKeys[keySet.right]) {
            this.car.turnRight()
        }
        this.car.update();
    }

}

controlKeys = {
    AWDS : {
        left : 65,
        up : 87,
        right : 68,
        down : 83
    },
    Arrows : {
        left : 37,
        up : 38,
        right : 39,
        down : 40
    }

};

function map (traceMap) {

    var trace = precomputingTrace(traceMap);
    this.lines = trace.length;
    this.cars = traceMap.cars;
    this.trace = traceMap;

    function precomputingTrace(traceMap) {
        var trace = [];
        for (var i = 1; i < traceMap.path.length; i++) {
            trace.push (area (traceMap.path[i - 1], traceMap.path[i]));
        }
        trace.push (area (traceMap.path[traceMap.path.length - 1],
            traceMap.path[0]));
        return trace;
    }

    function area (begin, end) {
        var angle = Math.atan2 (end[1] - begin[1], end[0] - begin[0]);
        return {
            begin : [begin[0], begin[1]],
            end : [end[0], end[1]],
            angle : angle,
            sin : Math.sin (angle),
            cos : Math.cos (angle),
            radius : begin[2],
            sqrRadius : Math.pow (begin[2], 2),
            length : Math.sqrt (Math.pow (end[1] - begin[1], 2) +
                Math.pow (end[0] - begin[0], 2))
        }
    }

    this.checkBorder = function (car) {
        var line = checkTrace(car);
        if (line === -1) {
            if (hollywood) {
                beginExplosion(car);
            }
            car.linearVelocity[0] = 0;
            car.acceleration[0] = 0;
            car.linearVelocity[1] = 0;
            car.acceleration[1] = 0;
        }
        return line;
    };

    function checkTrace(car) {
        for (var i in trace) {
            if (checkLine (i, car.position)) {
                return i;
            }
        }
        return -1;
    }

    function checkLine (lineIndex, position) {
        var modernPosition = turnAndTranslate(lineIndex, position);
        if (inRectangle (lineIndex, modernPosition) || inCircle (lineIndex, modernPosition)) {
            return true;
        }
        return false;
    }

    function inRectangle (lineIndex, position) {
        if (Math.abs (position[1]) < trace[lineIndex].radius &&
            position[0] > 0 && position[0] < trace[lineIndex].length) {
            return true;
        }
        return false;
    }

    function inCircle (lineIndex, position) {
        var sqrRadiusBegin = Math.pow (position[0], 2) + Math.pow (position[1], 2);
        var sqrRadiusEnd = Math.pow (position[1], 2) + Math.pow (position[0] - trace[lineIndex].length, 2);
        if ((lineIndex > 0 && sqrRadiusBegin < trace[lineIndex].sqrRadius) ||
            sqrRadiusEnd < trace[lineIndex].sqrRadius) {
            return true;
        }
        return false;
    }

    function turnAndTranslate(lineIndex, position) {
        return [
            trace[lineIndex].cos * (position[0] - trace[lineIndex].begin[0]) + trace[lineIndex].sin * (position[1] - trace[lineIndex].begin[1]),
            trace[lineIndex].sin * (- position[0] + trace[lineIndex].begin[0]) + trace[lineIndex].cos * (position[1] - trace[lineIndex].begin[1])
        ];
    }

    this.draw = function (canvas) {
        drawBackground(canvas);
        drawBorder(canvas);
        drawTrack(canvas);
        drawDemarcation(canvas);
        drawFinish(canvas);
        drawTrees(canvas, this.trace.trees);
    };

    function drawBackground (canvas) {
        canvas.fillStyle = "rgba(0, 0, 0, .0)";
        canvas.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    function drawBorder(canvas) {
        canvas.fillStyle = "#779dff";
        drawPath(canvas, 10)
    }

    function drawTrack(canvas) {
        canvas.fillStyle = "#373737";
        drawPath(canvas, 0);
    }

    function drawPath(canvas, width) {
        for (var i = 0; i < trace.length; i++) {
            canvas.save();
            canvas.translate (trace[i].begin[0], trace[i].begin[1]);
            canvas.rotate (trace[i].angle);
            drowCircle (canvas, 0, 0, trace[i].radius + width);
            drowCircle (canvas, trace[i].length, 0, trace[i].radius + width);
            canvas.fillRect (0, - trace[i].radius - width,
                trace[i].length, 2 * (trace[i].radius + width));
            canvas.restore();
        }
    }

    function drawDemarcation(canvas) {
        canvas.fillStyle = "#779dff";
        var residue = 0;
        for (var i = 0; i < trace.length; i++) {
            canvas.save();
            canvas.translate (trace[i].begin[0], trace[i].begin[1]);
            canvas.rotate (trace[i].angle);
            residue = leaderCharacters(canvas, trace[i].length, residue);
            canvas.restore();
        }
    }

    function leaderCharacters(canvas, length, residue) {
        var strokeFill = 80;
        var strokePeriod = 140;
        var stroke = firstStroke(strokeFill, residue);
        while (stroke['finish'] < length) {
            canvas.fillRect (stroke.start, 2, stroke.finish - stroke.start, -4);
            stroke['start'] = stroke['finish'] + strokePeriod - strokeFill;
            stroke['finish'] += strokePeriod;
        }
        if (stroke['start'] < length) {
            canvas.fillRect (stroke.start, 2, length - stroke.start, -4);
            drowCircle (canvas, length, 0, 2);
        }
        return stroke['start'] - length;
    }

    function firstStroke(length, residue) {
        var start = 0;
        if (residue > 0) {
            start = residue;
            finish = length + residue;
        } else {
            finish = length + residue;
        }
        return {'start': start, 'finish': finish};
    }

    function drawFinish (canvas) {
        canvas.save();
        canvas.translate (trace[0].begin[0], trace[0].begin[1]);
        canvas.rotate (trace[0].angle);
        canvas.fillStyle = "#FFF";
        canvas.fillRect(0,  - trace[0].radius, 5, 2 * trace[0].radius);
        canvas.fillStyle = "#000";
        canvas.fillRect(5,  - trace[0].radius, 3, 2 * trace[0].radius);
        canvas.restore();
    }

    function drowCircle(canvas, x, y, radius) {
        canvas.beginPath();
        canvas.arc(x, y, radius, 0, Math.PI*2, false);
        canvas.closePath();
        canvas.fill();
    }

    function drawTrees(canvas, trees) {
        for (var i in trees) {
            drawTree(canvas, trees[i]);
        }
    }

    function drawTree(canvas, tree) {
        canvas.drawImage(treeImg, tree[0], tree[1]);
    }
}

// Отрисовка трассы и её параметры!!!

Level1 = {
    path : [
        [230, 80, 70],
        [1000, 80, 70],
        [900, 800, 70],
        [450, 800, 70],
        [750, 300, 70],
        [250, 250, 70],
        [350, 650, 70],
        [120, 800, 70],
        [80, 80, 70]
    ],
    trees : [
    ],

// Расположение болидов на стартовой решётке!

    cars : function () {
        return [
            new car ([140, 100], Math.PI / 2),
            new car ([200, 50], Math.PI / 2)
        ]
    }


};

function mouseClick (event) {
    buttonClick(event.offsetX, event.offsetY);
}

function buttonClick (x, y) {
    for (var i in buttons) {
        var start = buttons[i].start;
        var size = buttons[i].size;
        if (x > start[0] && x < start[0] + size[0]) {
            if (y > start[1] && y < start[1] + size[1]) {
                buttons[i].action.onClick();
            }
        }
    }
}

function panel (statisticSet, canvas) {
    var statisticSet = statisticSet;
    var canvas = canvas;
    var canvasWidth = canvas.canvas.clientWidth;
    var canvasHeight = canvas.canvas.clientHeight;
    var pauseLabel = "  PAUSE";

// Отрисовка боковой панели со временем!!!

    this.draw = function () {
        canvas.save();
        canvas.fillStyle = "#444";
        canvas.translate (canvasWidth - 200, 0);
        canvas.fillRect(0, 0, 200, canvasHeight);
        drawBorder();
        drawTimer();
        drawGameControl();
        canvas.restore();
    };

// Отрисовка бордер-линии между трассой и меню!

    function drawBorder () {
        canvas.beginPath();
        canvas.lineWidth = 10;
        canvas.strokeStyle = "#779dff";
        canvas.moveTo(0, 0);
        canvas.lineTo(0, canvasHeight);
        canvas.stroke();
    }

// Отрисовка таймера!!!

    function drawTimer() {
        canvas.font = "14pt Arial";
        canvas.fillStyle = "#888";
        canvas.fillRect(10, 10, 180, 203);
        drawTimerGrid();
        drawPilotNames();
        canvas.fillStyle = "#f00";
        for (var i in statisticSet.cars) {
            for (var j in statisticSet.cars[i].lapsTime) {
                if (j === statisticSet.cars[i].lapsTime.length - 1) {
                    canvas.fillStyle = "#a00";
                } else if (statisticSet.bestLap[0] === i && statisticSet.bestLap[1] === j) {
                    canvas.fillStyle = "#080";
                } else {
                    canvas.fillStyle = "#000";
                }
                if (j < statisticSet.laps) {
                    canvas.fillText(statisticSet.cars[i].lapsTime[j][0], 32 + i * 80, 50 + j * 20);
                }
            }
        }
        drawGeneralTimer();
    }

    function drawTimerGrid() {
        canvas.beginPath ();
        canvas.strokeStyle = "#000";
        canvas.lineWidth = 1;
        canvas.moveTo (10, 33);
        canvas.lineTo (190, 33);
        canvas.moveTo (30, 10);
        canvas.lineTo (30, 213);
        canvas.moveTo (110, 10);
        canvas.lineTo (110, 213);
        canvas.stroke ();
        drawLapNumbers ();
    }

// Переменные и условия для вопроса игрокам!

    var nameDriver = prompt('Add name of pilot!');
    var nameDriver2 = prompt('Add name of pilot number 2!');

    if ((nameDriver == null) || (nameDriver2 == null)) {
        nameDriver = 'Enemy';
        nameDriver2 = 'Enemy';
    }

//Функция принимающая строку введённую игроками в поле вопроса! ++ Параметры расположения имен в поле (имена).

    function drawPilotNames() {
        canvas.fillText(nameDriver, 35, 27);
        canvas.fillText(nameDriver2, 115, 27);
    }

// Функция счётчика кругов с начала старта.

    function drawLapNumbers () {
        canvas.fillStyle = "#222";
        for (var i = 0; i < statisticSet.laps; i++) {
            canvas.fillText(i, 15, 50 + i * 20);
        }
    }

    function drawGeneralTimer () {
        drawGeneralTimerArea();
        showGeneralTimer();
    }

    function drawGeneralTimerArea () {
        canvas.fillStyle ="#222";
        canvas.fillRect(37, 227, 126, 46);
        canvas.fillStyle ="#ff0900";
        canvas.fillRect(40, 230, 120, 40);
    }

    function showGeneralTimer() {
        canvas.fillStyle ="#222";
        canvas.font = "20pt Arial";
        canvas.fillText (statisticSet.generalTimeString, 45, 260)
    }

    function drawGameControl () {
        hollywoodCheck ();
        newGame ();
        pauseView ();
    }

    function hollywoodCheck () {
        if (hollywood) {
            canvas.beginPath ();
            canvas.strokeStyle = "#222";
            canvas.lineWidth = 2;
            canvas.moveTo (35, 399);
            canvas.lineTo (45, 409);
            canvas.moveTo (35, 409);
            canvas.lineTo (45, 399);
            canvas.stroke ();
        }

    }
// Текст в кнопке СТАРТ!
    function newGame() {
        canvas.fillStyle ="#6577c0";
        canvas.fillRect(32, 447, 136, 46);
        canvas.fillStyle ="#bbb";
        canvas.fillRect(35, 450, 130, 40);
        canvas.fillStyle ="#6577c0";
        canvas.font = "20pt Arial";
        canvas.fillText("AGAIN", 50, 480);
    }

    function pauseView () {
        canvas.fillStyle ="#6577c0";
        canvas.fillRect(32, 527, 136, 46);
        canvas.fillStyle ="#bbb";
        canvas.fillRect(35, 530, 130, 40);
        canvas.fillStyle ="#6577c0";
        canvas.font = "20pt Arial";
        canvas.fillText(pauseLabel, 40, 560);
    }

    this.pauseClick = function () {
        this.pauseAction();
        this.pauseDraw();
    };

    this.pauseAction = function () {
        statisticSet.changePause();
    };

    this.pauseDraw = function () {
        if (!pause) {
            pauseLabel = "RESUME";
        }else {
            pauseLabel = "  PAUSE";
        }
    }
}



function addButton (start, size, action) {
    buttons.push({
        start : start,
        size : size,
        action : action});
}

buttons =[];

function mouseClick (event) {
    buttonClick(event.offsetX, event.offsetY);
}

function buttonClick (x, y) {
    for (var i in buttons) {
        var start = buttons[i].start;
        var size = buttons[i].size;
        if (x > start[0] && x < start[0] + size[0]) {
            if (y > start[1] && y < start[1] + size[1]) {
                buttons[i].action.onClick();
            }
        }
    }
}


(function(){
    startButton();
    pauseButton()
})();

function pauseButton () {
    var start = [1300 - 168, 527];
    var size = [136, 46];
    action = {
        onClick : pauseClick
    };
    addButton(start, size, action);
}

function pauseClick () {
    leftPanel.pauseClick();
    gameChangePause();
}

function startButton () {
    var start = [1300 - 168, 447];
    var size = [136, 46];
    action = {
        onClick : function () {startRace()}
    };
    addButton(start, size, action);
}

CANVAS_WIDTH = 1300;
CANVAS_HEIGHT = 900;

imagesNumber = 6;
laps = 1;

var startTime = null;
var userDriverSet = [];
bang = [];
leftPanel = null;

pause = false;
inGame = false;
hollywood = false;
readingTimer = "";

carImg = [];


window.onload = function() {
    var i = 0;
    carImg[0] = new Image;
    carImg[0].src = '../imgs/ferrari.gif';
    carImg[0].onload = function () {
        i++;
        downloadCheck(i);
    };
    carImg[1] = new Image;
    carImg[1].src = '../imgs/red_bull.gif';
    carImg[1].onload = function () {
        i++;
        downloadCheck(i);
    };
    carImgDemage = new Image;
    carImgDemage.src = '../imgs/blue_car1_demage.gif';
    carImgDemage.onload = function () {
        i++;
        downloadCheck(i);
    };
    traceMap = new Image;
    traceMap.src = '../imgs/Vroom_SS.jpg';
    traceMap.onload = function () {
        i++;
        downloadCheck(i);
    };

    explosion = new Image;
    explosion.src = '../imgs/EXPLOSION.bmp';
    explosion.onload = function () {
        i++;
        downloadCheck(i);
    };

    treeImg = new Image;
    treeImg.src = '../imgs/tree.gif';
    treeImg.onload = function () {
        i++;
        downloadCheck(i);
    }
};

function downloadCheck(i) {
    if (i === imagesNumber) {
        init();
    }
}

function init() {
    context = document.getElementById('canvas').getContext("2d");
    window.setInterval(refresh, 1000/25);
    startRace();
}

function startRace () {
    inGame = false;
    track = new map(Level1);
    gameOverScreen = new resultScreen (context);
    cars = track.cars();
    userDriverSet = [
        new carDrive (cars[0], controlKeys.Arrows),
        new carDrive (cars[1], controlKeys.AWDS)
    ];
    statisticSet = new raceStatistic (cars.length, track.lines, laps, gameOver);
    statisticSet.startRace();
    leftPanel = new panel(statisticSet, context);
    startTime = new Date();
    pause = false;
}

function refresh () {
    reading ();
    if (!pause && inGame) {
        update ();
    }
    draw();
}

// Функция отчета времени перед стартом!!!

function reading () {
    var time = new Date() - startTime;
    if (time < 3000) {
        readingTimer = 3 - ~~(time / 1000);
    } else if (readingTimer == "1") {
        readingTimer = "";
        inGame = true;
    }
}

function update () {
    for (var i in userDriverSet) {
        userDriverSet[i].action();
        var line = track.checkBorder(userDriverSet[i].car);
        statisticSet.carInLine(i, line);
    }
    for (var i in bang) {
        bang[i].update();
    }
}

function gameOver(carId) {
    gameOverScreen.gameOver(carId);
    inGame = false;
}

//Методы отрисовки!


function draw() {
    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawBackground();
    drawBorder();
    drawCars();
    leftPanel.draw();
    drawExplosions();
    drawReadingTimer();
    gameOverScreen.drow();
    drawFps();
}

function drawBackground () {
    track.draw(context);
}

function drawBorder() {
    context.beginPath();
    context.lineWidth = 1;
    context.moveTo(1, 1);
    context.lineTo(CANVAS_WIDTH - 2, 1);
    context.lineTo(CANVAS_WIDTH - 2, CANVAS_HEIGHT - 2);
    context.lineTo(1, CANVAS_HEIGHT - 2);
    context.lineTo(1, 1);
    context.stroke();
}

function drawCars() {
    for (var i in userDriverSet) {
        drawCar(i);
    }
}

function drawCar (carNumber) {
    context.save();
    var car = userDriverSet[carNumber].car;
    context.translate(car.position[0], car.position[1]);
    context.rotate(car.carDirection);
    if (car.demage) {
        context.drawImage(carImgDemage, -10, -10);
    } else {
        context.drawImage(carImg[carNumber], -10, -10);
    }
    context.restore();
}

function drawExplosions() {
    for (var i in bang){
        bang[i].drow();
    }
}

// Функция отрисовки обратного отсчета перед стартом!

function drawReadingTimer() {
    context.font = "160pt Arial";
    context.fillStyle ="#222";
    context.fillText(readingTimer, 480, 455); //Расположение теней.
    context.fillStyle ="#ff0900";
    context.fillText(readingTimer, 480, 450);//Расположение основной цифры.
}

// Функция отрисовки победителя!

function resultScreen (context) {

    var context = context;
    this.isOver = false;
    this.winner = null;

    this.gameOver = function (carId) {
        this.winner = carId;
        this.isOver = true;
    };

    this.drow = function () {
        if (this.isOver) {
            context.fillStyle ="#ff0015";
            context.font = "80pt Arial";
            context.fillText ("Pilot " + this.winner + " wins!", 270, 450)
        }
    }
}

function raceStatistic (carNumber, lines, laps, gameOver) {

    this.carNumber = carNumber;
    this.cars = carSet(carNumber, gameOver);
    this.lines = lines;
    this.laps = laps;
    this.generalTimeString = "00:00.00";
    this.generalTime = 0;
    this.lastTime;
    this.bestLap = [0, 0];
    this.pause = false;

    function carSet(carNumber) {
        statisticList = [];
        for (var i = 0; i < carNumber; i++) {
            statisticList[i] = new statistic(lines, i, laps, gameOver);
        }
        return statisticList;
    }

    this.findBestLap = function () {
        for (var i in statisticList) {
            for (var j = 0; j < statisticList[i].lapsTime.length - 1; j++) {
                bestTime = statisticList[this.bestLap[0]].lapsTime[this.bestLap[1]][1];
                if (statisticList[i].lapsTime[j][1] < bestTime) {
                    this.bestLap = [i, j];
                }
            }
        }
    };

    this.startRace = function () {
        this.lastTime = new Date();
        this.bestLap = [0, 0];
        this.pause = false;
        this.generalTime = 0;
        this.cars = carSet(this.carNumber);
    };

    this.carInLine = function (car, line) {
        this.findBestLap();
        this.cars[car].inLine(line);
        if (!this.pause) {
            this.generalTime += new Date() - this.lastTime;
        }
        this.lastTime = new Date();
        this.generalTimeString = millisecondsToMinutes(this.generalTime);
    };

    this.changePause = function () {
        for (var i in this.cars) {
            this.cars[i].changePause();
        }
        this.pause = !this.pause;
    }
}

function statistic (lines, carNumber, laps, gameOver) {

    this.laps = laps;
    var lap = -1;
    var lastLine = -1;
    this.makeLaps = 0;
    this.lapsTime = [];
    var lapTime;
    this.lastTime;
    var beginRaceTime;
    var lines = lines;
    this.pause = false;
    this.gameOver = gameOver;
    this.carNumber = carNumber;

    this.inLine = function (line) {
        if (line == 0) {
            if (lastLine == -1) {
                this.startLap ();
                lastLine = 0;
                lap = 0;
            } else if (lastLine == lines - 1) {
                this.endLap();
                lastLine = 0;
            }
        } else if (line == lastLine + 1) {
            lastLine = lastLine + 1;
        }
        this.updateTimer();
    };

    this.startLap = function() {
        beginLapTime = new Date();
        this.lapTime = 0;
        this.lastTime = new Date();
    };

    this.endLap = function () {
        this.updateLapCounter();
        this.checkGameOver();
    };

    this.updateLapCounter = function () {
        this.lapTime = 0;
        beginLapTime = new Date();
        lap++;
    };

    this.checkGameOver = function() {
        if (lap == this.laps) {
            this.gameOver(carNumber);
        }
    };

    this.updateTimer = function() {
        if (lap == -1) {
            this.lapsTime[0] = [millisecondsToMinutes (0), 0];
            return
        }
        if (!this.pause) {
            this.lapTime += new Date() - this.lastTime;
        }
        this.lastTime = new Date();
        this.lapsTime[lap] = [millisecondsToMinutes (this.lapTime), this.lapTime];
    };

    this.changePause = function () {
        this.pause = !this.pause;
    }
}

function millisecondsToMinutes (time) {
    var minutes = ~~(time / 1000 / 60);
    var seconds = ((time / 1000) - minutes * 60).toFixed(2);
    return doubleDigits(minutes) + ":" + doubleDigits(seconds);
}

function doubleDigits (number) {
    if (number < 10) {
        return "0" + number;
    }
    return number;
}