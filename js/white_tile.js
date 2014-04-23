////////////////////////////////////////////////////////////////
// Storage

function getlocal(key) {
    return parseInt(localStorage.getItem(key));
}

function setlocalmax(key, value) {
    if (isNaN(getlocal(key)) || value > getlocal(key)) {
        localStorage.setItem(key, value);
    }
}

function setlocalmin(key, value) {
    if (isNaN(getlocal(key)) || value < getlocal(key)) {
        localStorage.setItem(key, value);
    }
}

function setlocal(key, value) {
    if (key[0] == "+") setlocalmax(key, value);
    if (key[0] == "-") setlocalmin(key, value);
}

////////////////////////////////////////////////////////////////
// Rule

// Setup
var gamewidth = 4;
var gameheight = 5;
var seriestarget = [10, 20, 30, 50, 100];
var intervaltarget = [1000, 500, 300, 200];

// Data
var posnow = 0;
var poslist = [];
var timelist = []; // .length = score
var itscore = [];

function getscore() {
    return timelist.length;
}

function gettime(len) {
    var score = getscore();

    if (score > len) {
        return timelist[score - 1] - timelist[score - len - 1];
    } else {
        return 999999;
    }
}

function getresult() {
    var result = {"+wt-score": getscore()};

    for (var i in seriestarget) {
        result["-wt-series-" + seriestarget[i]] = gettime(seriestarget[i]);
    }
    for (var i in intervaltarget) {
        result["+wt-interval-" + intervaltarget[i]] = itscore[i];
    }

    return result;
}

function getresultwithsto() {
    var result = getresult();
    var resultsto = {};

    for (var i in result) {
        setlocal(i, result[i]);
        resultsto[i] = getlocal(i);
    }

    return {current: result, best: resultsto};
}

function genpos() {
    poslist.push(Math.floor(Math.random() * gamewidth));
}

function checkpos(value) {
    return poslist[posnow] == value;
}

function updateit(time) {
    var lastscore = getscore();

    for (var i in intervaltarget) {
        if (lastscore > 0 && time - timelist[lastscore - 1] < intervaltarget[i]) {
            ++itscore[i];
        } else {
            itscore[i] = 0;
        }
    }
}

function goahead(value) {
    var time = (new Date()).getTime();

    if (checkpos(value)) {
        // Go
        updateit(time);
        timelist.push(time);

        ++posnow;
        genpos();

        return true;
    } else {
        // Reset
        timelist = [];
        updateit(time);

        return false;
    }
}

function initgame() {
    for (var i = 0; i < gameheight; ++i) genpos();
    for (var i in intervaltarget) itscore[i] = 0;
}

initgame();

////////////////////////////////////////////////////////////////
// Canvas

var canvaswidth = gamewidth / (gameheight - 1);

var game = document.querySelector(".tile-container");
var score_c = document.querySelector(".score-container");
var best_c = document.querySelector(".best-container");
var tiles = [];
var record = document.querySelector(".game-stat");

function updatecanvas(success) {
    for (var i in tiles) {
        var unitpos = posnow - parseInt(i) + gameheight - 1;

        var unitwidth = game.clientHeight / 4;
        var unitheight = game.clientHeight / 4;

        var tilex = poslist[Math.floor(unitpos / gameheight) * gameheight + parseInt(i)];
        var tiley = unitpos % gameheight - 1;

        tilex++; tiley++;

        if (unitpos % gameheight > 0) {
            tiles[i].setAttribute("class", "tile tile-2048 tile-position-" + tilex + "-" + tiley);
            tiles[i].innerHTML = "<div class=\"tile-inner\">2048</div>";
        } else {
            tiles[i].setAttribute("class", "tile tile-new tile-position-" + tilex + "-" + tiley);
            tiles[i].innerHTML = "";
        }

        //tiles[i].style.left = (100 / gamewidth) * poslist[Math.floor(unitpos / gameheight) * gameheight + parseInt(i)] + "%";
        //tiles[i].style.top = (100 / (gameheight - 1)) * (unitpos % gameheight - 1) + "%";

        //if (unitpos % gameheight > 0) {
        //    tiles[i].animate(anidata, 100);
        //} else {
        //    tiles[i].css(anidata);
        //}

        //if (success) {
    }

    var result = getresultwithsto();

    record.innerHTML = "";

    for (var i in result.current) {
        var cu = result.current[i];
        var be = result.best[i];
        if (i[0] == "-" && cu == 999999) cu = "none";
        if (i[0] == "-" && be == 999999) be = "none";
        record.innerHTML += i.substring(4, i.length) + " - " + cu + " / " + be + "<br>";

        if (i.substring(4, i.length) == "score") {
            score_c.textContent = cu;
            best_c.textContent = be;
        }
    }
}

function input(value) {
    updatecanvas(goahead(value));
}

function initcanvas() {
    //$("body").delegate("*", "touchstart", function (e) {
    //    if ($(this) !== $altNav) {
    //        e.preventDefault();
    //        return false;
    //    }
    //});

    for (var i = 0; i < gameheight; ++i) {
        var elem = document.createElement("div");
        game.appendChild(elem);
        tiles.push(elem);
    }

    updatecanvas();
}

initcanvas();

////////////////////////////////////////////////////////////////
// Input

var keymap = {
    49: 0, 50: 1, 51: 2, 52: 3, 53: 4, 54: 5, 55: 6, 56: 7, 57: 8, 48: 9, 173: 10, 61: 11,
    81: 0, 87: 1, 69: 2, 82: 3, 84: 4, 89: 5, 85: 6, 73: 7, 79: 8, 80: 9, 219: 10, 221: 11,
    65: 0, 83: 1, 68: 2, 70: 3, 71: 4, 72: 5, 74: 6, 75: 7, 76: 8, 59: 9, 222: 10,
    90: 0, 88: 1, 67: 2, 86: 3, 66: 4, 78: 5, 77: 6, 188: 7, 190: 8, 191: 9
}

document.onkeydown = function (event) {
    var value = keymap[event.which];
    if (value != undefined) input(value);
};

////////////////////////////////////////////////////////////////
