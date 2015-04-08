var main = function () {
    "use strict";

    var reader = 0; // handle for event timer
    var currentWord = 0;
    var currentlyReading = false;
    var reverse = false;
    var interval = 150; // 400 wpm

    var startTime = 0;
    var pauseStartTime = 0;
    var timeElapsedPaused = 0; 

// moment.js
// version : 1.7.2
// author : Tim Wood
// license : MIT
// momentjs.com
require.config({
    paths: {
        "moment": "moment.js",
    }
});
define(["moment"], function (moment) {
    moment().format();
});

    var read = function (reverse) {
        if (currentWord < words.length) {
            writeWord(words[currentWord]);
            $(".current-word").html("Current word: " + (currentWord + 1) + " / " + words.length);
        }
        else {
            writeWord("FIN.");
            var timeElapsedReading = new Date().getTime() - startTime - timeElapsedPaused;
            var $jqdate = $(new Date(timeElapsedReading));
            stopReading();
            alert("Total time elapsed: " + $jqdate + " " + moment($jqdate.text(), "hh:mm:ss"));
        }
        if (reverse) currentWord--;
        else currentWord++;
    }

    var writeWord = function(text) {
        ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.fillText(text, cv.width/2, cv.height/2);
    };

    var startReading = function(reverse) {
        // add the time elapsed while stopped to the corresponding counter
        if (currentWord === 0) {
            startTime = new Date().getTime();
        }
        else {
            timeElapsedPaused += new Date().getTime() - pauseStartTime;
        }
        if (!currentlyReading) {
            reader = setInterval(function () {read(reverse);}, interval);
            currentlyReading = true;
            $(".focusDummy").focus();
        };
    }

    var stopReading = function() {
        // get the time when reading stopped
        pauseStartTime = new Date().getTime();
        currentlyReading = false;
        clearInterval(reader);
        $(".focusDummy").focus();
    }



    $("button.start").click(function() {
        startReading(false);
    });

    $("button.stop").click(function() {
        stopReading();
    });

    $(document).keyup(function(evt) {
        if (evt.keyCode == 32) { // space
          if (currentlyReading) stopReading();
          else startReading(false);
        }
    });
    $(document).keyup(function(evt) {
        if (evt.keyCode == 37) { // left arrow
          reverse = true;
          stopReading();
          startReading(reverse);
        }
    });
    $(document).keyup(function(evt) {
        if (evt.keyCode == 39) { // right arrow
          reverse = false;
          stopReading();
          startReading(reverse);
        }
    });

    // change stylesheet
    var sheet = document.styleSheets[0];
    var copyright_width = $(".copyright").width();
    var rule = "footer { margin: 275px 0px 0px -" +
          copyright_width / 2 + "px; }";
    sheet.insertRule(rule, 0);

    var textField = $(".textField");
    var text = "";
    var words = [];
    textField.change(function(event) {
        text = textField.val();
        var last = 0; // index of beginning of last word found
        var temp = "";
        for (var i = 1; i < text.length; i++) {
            if (text[i] === " " || text[i] === "\n") {
                if (i-last > 0) words.push(text.substring(last, i));
                last = i+1;
            }
        }
        words.push(text.substring(last, text.length));
        $(".current-word").html("Current word: 0 / " + words.length);
    });

    var speed = $(".speed-slider");
    speed.change(function(event) {
        stopReading();
        var wpm = speed.val()*10;
        $(".current-wpm").html("Current speed: " + wpm + " wpm");
        interval = Math.round(1000.0/wpm*60)
        startReading(reverse);
    });

    // var speed = $(".speed-input");
    // speed.change(function(event) {
    // });

    var cv = document.getElementsByTagName("canvas")[0];
    cv.style.width = cv.width;
    cv.style.height = cv.height;
    var ctx = cv.getContext("2d");
    ctx.fillStyle = "white";
    ctx.font = "32px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
};

$(main);

