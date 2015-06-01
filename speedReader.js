/*

NOTES: currently, the speed indicator is an average over the whole session instead of
a reflection of a current estimation of wpm.
*/

// ----------------------------------------------------------------------------------|
// DEFINE GLOBALS
// ----------------------------------------------------------------------------------|
var reader = 0; // handle for event timer
var currentWord = 0; // keeps track of index of current word in pasted text
var currentlyReading = false; // keeps track of reading/not reading state of program
var reverse = false; // keeps track of forward/reverse state of program
var interval = 150; // 150 ms between words = 400 wpm

var startTime = 0;
var pauseStartTime = 0;
var timeElapsedPaused = 0;
var timeElapsedPausedSince = 0;
var timeElapsedReading = 0;
var timeTenWordsAgo = null;

var fontSize = 108; // px
var fontFamily = "Helvetica";
var fontColor = "#FFFFFF";
var speed_slider = $(".speed-slider");
var comma_slider = $("#comma-slider");
var semicolon_slider = $("#semicolon-slider");
var colon_slider = $("#colon-slider");
var sentence_slider = $("#sentence-slider");
var speedMultiplier = 12;
var currentSpeed = speed_slider.val() * speedMultiplier; // slider goes from 0 to 1500 wpm instad of 0 to 100
var longWordThreshold = 6;
var longWord = false;

// milliseconds
var foundNoPunc     = false;
var commaPause      = 200;
var semicolonPause  = 300;
var colonPause      = 300;
var sentencePause   = 400;
// ----------------------------------------------------------------------------------|
//  END DEFINE GLOBALS
// ----------------------------------------------------------------------------------|

var main = function () {
    "use strict";


    var count = 1
    var read = function (reverse) {
        if (currentWord === 0) timeTenWordsAgo = new Date().getTime();
        else if (currentWord < 0) {
            currentWord = 0;
            reverse = false;
            stopReading();
        }
        if (currentWord < words.length) {
            writeWord(words[currentWord]);
            if (!reverse) {
                foundNoPunc = false;
                switch(words[currentWord][words[currentWord].length - 1]) {
                    case ',':
                        delayOneWordAndContinue(commaPause);
                        break;
                    case ';':
                        delayOneWordAndContinue(semicolonPause);
                        break;
                    case ':':
                        delayOneWordAndContinue(colonPause);
                        break;
                    case '.':
                    case '?':
                    case '!':
                        delayOneWordAndContinue(sentencePause);
                        break;
                    default:
                        if (words[currentWord].length > longWordThreshold) {
                            var delta = longWordExtraTime();
                            // console.log("LONG WORD: " + words[currentWord] + ", extra time: " + delta);
                            delayOneWordAndContinue(interval + delta);
                        }
                }
            }
            $(".current-word").html("Current word: "
              + (currentWord + 1) + " / " + words.length);
        }
        else {
            stopReading();
            currentWord = words.length - 2; // one before last element
            calcAndDisplayWPM();
        }
        if (reverse) currentWord--;
        else currentWord++;
        calcAndDisplayElapsed();
        if (count % 10 === 0) calcAndDisplayWPM();
        count++;
    }

    var longWordExtraTime = function () {
        return Math.round((words[currentWord].length - longWordThreshold) * 10 * (100 / speed_slider.val()));
    }

    var wpmToInterval = function (speed) {
        return Math.round(1000.0/speed*60);
    }

    var calcAndDisplayElapsed = function() {
        timeElapsedReading = new Date().getTime() - startTime - timeElapsedPaused;
        $(".elapsed").html("Time elapsed: " +
          moment(timeElapsedReading).format("mm:ss"));
    }

    var calcAndDisplayWPM = function () {
        var timeElapsedLastTenWords = new Date().getTime() - timeTenWordsAgo - timeElapsedPausedSince;
        $(".current-wpm").html("Speed: " + Math.round(10 / (timeElapsedLastTenWords / 1000 / 60)) + " wpm");
        timeTenWordsAgo = new Date().getTime();
        timeElapsedPausedSince = 0;
    }
    var isNumeric = function(obj) {
        return !jQuery.isArray(obj) && (obj - parseFloat(obj) + 1) >= 0;
    }

    var extractfontSize = function (str) {
        var output = "";
        for (var i = 0; i < str.length; i++) {
            if (isNumeric(str[i])) {
                output = output + str[i];
            }
        }
        return output;
    }

    var writeWord = function(text) {
        // if word is too big, scale it down to fit
        while (Math.round(ctx.measureText(text).width) > canvas.width - 80) {
            // console.log("text too wide at: " + ctx.font);
            var newSize = parseInt(extractfontSize(ctx.font));
            ctx.font = (newSize-10).toString() + "px " + fontFamily;
        };
        ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.fillText(text, cv.width/2, cv.height/2);
        ctx.font = fontSize + "px " + fontFamily;
        ctx.fillStyle = fontColor;
    }

    var startReading = function(reverse, addPauseTime) {
        if (typeof(addPauseTime) === 'undefined') addPauseTime = true;
        // add the time elapsed while stopped to the corresponding counter
        if (currentWord === 0) {
            startTime = new Date().getTime();
        }

        else if (addPauseTime) {
            updateTimePaused(new Date().getTime() - pauseStartTime);
        }
        else currentlyReading = false; // make sure if we're coming from a delay, we reset currentlyReading to false
        if (!currentlyReading && currentWord < words.length-2) {
            // console.log("SETTING INTERVAL: " + interval);
            clearInterval(reader);
            reader = setInterval(function () {read(reverse);}, interval);
            currentlyReading = true;
            $(".focusDummy").focus();
        }
    }

    var stopReading = function() {
        // get the time when reading stopped
        pauseStartTime = new Date().getTime();
        currentlyReading = false;
        clearInterval(reader);
        $(".focusDummy").focus();
    }

    var delayOneWordAndContinue = function(addedDelay) {
        clearInterval(reader);
        reader = setTimeout(function() {
            console.log("added Delay: " + addedDelay);
            read(false);
            // console.log("interval: " + interval);
            pauseStartTime = new Date().getTime();
            startReading(false, false);
        }, addedDelay + interval);
    }

    var pause = function () {
        stopReading();
        location.href = "#pauseScreen";
    }

    var unpause = function () {
        location.href = "#close";
        startReading(false);
    }

    var updateTimePaused = function (pauseDelta) {
        timeElapsedPaused += pauseDelta;
        if (pauseStartTime > timeTenWordsAgo) timeElapsedPausedSince += pauseDelta;
    }

    $("button.start").click(function() {
        currentWord = 0;
        timeElapsedPaused = 0; 
        startReading(false);
    });

    $("button.pause").click(function() {
        if (currentlyReading) pause();
        else unpause();
    });

    $(document).keyup(function(evt) {
        if (evt.keyCode == 32) { // space
          if (currentlyReading) pause();
          else unpause();
        }
        else if (evt.keyCode == 37) { // left arrow
          reverse = true;
          stopReading();
          startReading(reverse);
        }
        else if (evt.keyCode == 39) { // right arrow
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


    var setPunctuationPausesFromSpeed = function () {
        ["comma", "semicolon", "colon", "sentence"].forEach(function(element) {
            setSliderValueAndText(element, Math.min(100, 110 - speed_slider.val()));
        });
    }

    var setSliderValueAndText = function (puncType, value) {
        var multiplier;
        $("#" + puncType + "-slider").val(value);
        switch (puncType) {
            case "comma":
                multiplier = 3;
                break;
            case "semicolon":
                multiplier = 4;
                break;
            case "colon":
                multiplier = 4;
                break;
            case "sentence":
                multiplier = 6;
                break;
            default:
                throw new Error("Something has gone horribly wrong in setSliderValueAndText()");
        }
        window[puncType + "Pause"] = $("#" + puncType + "-slider").val() * multiplier;
        $("#" + puncType + "-slider-value").text(window[puncType + "Pause"] + "ms");
    }

    speed_slider.change(function(event) {
        // console.log("in speed slider");
        stopReading();
        currentSpeed = speed_slider.val() * speedMultiplier;
        interval = wpmToInterval(currentSpeed);
        startReading(reverse);
        setPunctuationPausesFromSpeed();
    });

    setPunctuationPausesFromSpeed();
    comma_slider.change(function(event) {
        setSliderValueAndText("comma", comma_slider.val());
        console.log(commaPause);
    });

    semicolon_slider.change(function(event) {
        setSliderValueAndText("semicolon", semicolon_slider.val());
        console.log(semicolonPause);
    });

    colon_slider.change(function(event) {
        setSliderValueAndText("colon", colon_slider.val());
        
        console.log(colonPause);
    });

    sentence_slider.change(function(event) {
        setSliderValueAndText("sentence", sentence_slider.val());
        console.log(sentencePause);
    });

	$('#font_size').change(function(){ 
	    var value = $(this).val();
	    if (value === "s") fontSize = 50;
	    else if (value === "m") fontSize = 72;
	    else if (value === "l") fontSize = 108;
	    else if (value === "xl") fontSize = 150;
	    else fontize = 108;
	    // console.log(fontSize + ", " + value);
	});
	$('#font_family').change(function(){ 
	    var value = $(this).val();
	    if (value === "gothic") fontFamily = "'Century Gothic', CenturyGothic, sans-serif";
	    else if (value === "futura") fontFamily = "Futura, sans-serif";
	    else if (value === "helvetica") fontFamily = "Helvetica, Arial, sans-serif";
	    else if (value === "garamond") fontFamily = "Garamond, 'Palatino Linotype', 'Book Antiqua', Palatino, serif";
	    else if (value === "rockwell") fontFamily = "Rockwell, Garamond, 'Palatino Linotype', 'Book Antiqua', Palatino, serif";
	    else if (value === "times") fontFamily = "'Times New Roman', Times, serif";
	    else fontFamily = "sans-serif";
	});
	$('a.shouldPause').click(function(){ 
	    stopReading();
        // we don't call pause() because we want to leave up the instructions dialog
        // instead of bringing up the pause dialog
	});
	$('.close').click(function(){
	    startReading(reverse);
	});

	$('.color').change(function(evt){
	    fontColor = "#" + $('.color').val();
	});

    var cv = document.getElementsByTagName("canvas")[0];
    cv.style.width = cv.width;
    cv.style.height = cv.height;
    var ctx = cv.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.font = fontSize + "px " + fontFamily;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";


};

$(document).ready(main);

