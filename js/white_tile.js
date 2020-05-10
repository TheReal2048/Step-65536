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
var confuse = [];
var confuse2 = [];
var record = document.querySelector(".game-stat");

function updatecanvas(success) {
    for (var i in tiles) {
        var unitpos = posnow - parseInt(i) + gameheight - 1;

        var tilex = poslist[Math.floor(unitpos / gameheight) * gameheight + parseInt(i)];
        var tiley = unitpos % gameheight - 1;

        var conx = Math.floor(Math.random() * gamewidth);
        var cony = unitpos % gameheight - 1;

        var con2x = Math.floor(Math.random() * gamewidth);
        var con2y = unitpos % gameheight - 1;

        var lastscore = getscore();

        var conrate = 0.1 + 0.9 * lastscore / (lastscore + 200);
        var conalpha = (lastscore > 50) ? (0.8 + lastscore / (lastscore + 200)) : (0.5 + lastscore / (lastscore + 50));

        tilex++; tiley++;
        conx++; cony++;
        con2x++; con2y++;

        if (unitpos % gameheight > 0) {
            if (success) {
                tiles[i].setAttribute("class", "tile tile-top tile-65536 tile-position-" + tilex + "-" + tiley);
            } else {
                tiles[i].setAttribute("class", "tile tile-top tile-new tile-65536 tile-position-" + tilex + "-" + tiley);
            }
            tiles[i].innerHTML = "<div class=\"tile-inner\">65536</div>";
            tiles[i].style.opacity = (tiley == 4) ? 1 : 0.5;
        } else {
            tiles[i].setAttribute("class", "tile tile-top tile-position-" + tilex + "-" + tiley);
            tiles[i].innerHTML = "";
        }

        if (unitpos % gameheight > 0) {
            var val = 2 << Math.floor(Math.random() * 10);
            if (success) {
                confuse[i].setAttribute("class", "tile tile-" + val + " tile-position-" + conx + "-" + cony);
            } else {
                confuse[i].setAttribute("class", "tile tile-new tile-" + val + " tile-position-" + conx + "-" + cony);
            }
            confuse[i].innerHTML = "<div class=\"tile-inner\">" + val + "</div>";
            confuse[i].style.opacity = (
                conx == tilex || Math.random() > conrate
            ) ? 0 : tiles[i].style.opacity * conalpha;
        } else {
            confuse[i].setAttribute("class", "tile tile-position-" + tilex + "-" + tiley);
            confuse[i].innerHTML = "";
        }

        if (unitpos % gameheight > 0) {
            var val = 2 << Math.floor(Math.random() * 10);
            if (success) {
                confuse2[i].setAttribute("class", "tile tile-" + val + " tile-position-" + con2x + "-" + con2y);
            } else {
                confuse2[i].setAttribute("class", "tile tile-new tile-" + val + " tile-position-" + con2x + "-" + con2y);
            }
            confuse2[i].innerHTML = "<div class=\"tile-inner\">" + val + "</div>";
            confuse2[i].style.opacity = (
                con2x == tilex || con2x == conx || Math.random() > conrate
            ) ? 0 : tiles[i].style.opacity * conalpha;
        } else {
            confuse2[i].setAttribute("class", "tile tile-position-" + tilex + "-" + tiley);
            confuse2[i].innerHTML = "";
        }
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

window.setInterval(function () {
    var time = (new Date()).getTime();

    // if > 1500ms, fail
    if (time - timelist[timelist.length - 1] > 1500) {
        timelist = [];
        updateit(time);
        updatecanvas(false);
    }
}, 20);

function input(value) {
    updatecanvas(goahead(value));
}

function initcanvas() {
    for (var i = 0; i < gamewidth; ++i) {
        var event = function (j){
            return function (e){
                e.preventDefault();
                input(j);
            };
        }(i);

        for (var k = 0; k < gameheight - 1; ++k) {
            var track = document.querySelector(".grid-cell-" + (parseInt(i) + 1) + "-" + (parseInt(k) + 1));
            track.addEventListener("click", event);
            track.addEventListener("touchstart", event);
        }
    }

    for (var i = 0; i < gameheight; ++i) {
        var elem = document.createElement("div");
        game.appendChild(elem);
        tiles.push(elem);
    }

    for (var i = 0; i < gameheight; ++i) {
        var elem = document.createElement("div");
        game.appendChild(elem);
        confuse.push(elem);
    }

    for (var i = 0; i < gameheight; ++i) {
        var elem = document.createElement("div");
        game.appendChild(elem);
        confuse2.push(elem);
    }

    updatecanvas();
}

initcanvas();

////////////////////////////////////////////////////////////////
// Input

var keymap = {
    49: 0, 50: 1, 51: 2, 52: 3,
    70: 0, 71: 1, 72: 2, 74: 3
}

document.onkeydown = function (event) {
    var value = keymap[event.which];
    if (value != undefined) input(value);
};

////////////////////////////////////////////////////////////////
