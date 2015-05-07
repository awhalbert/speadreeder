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

var fontSize = 108; // px
var fontFamily = "Helvetica";
var fontColor = "#FFFFFF";
var speed_slider = $(".speed-slider");
var speedMultiplier = 12;
var currentSpeed = speed_slider.val() * speedMultiplier; // slider goes from 0 to 1500 wpm instad of 0 to 100
var longWordThreshold = 3;
var longWord = false;
// ----------------------------------------------------------------------------------|
//  END DEFINE GLOBALS
// ----------------------------------------------------------------------------------|

var main = function () {
    "use strict";


    var count = 1
    var read = function (reverse) {
        if (currentWord < 0) {
            currentWord = 0;
            reverse = false;
            stopReading();
        }
        if (currentWord < words.length) {    
            interval = wpmToInterval(currentSpeed);

            // if word is long, show it for longer
            if (words[currentWord].length > longWordThreshold) {
                var delta = longWordExtraTime();
                // console.log("interval: " + interval + ", interval delta: " + delta);
                interval += delta;
                stopReading();
                startReading(reverse);
                longWord = true;
            }

            // if word is not long and the last one was long, reset the timer to normal
            else if (longWord) {
                interval = wpmToInterval(currentSpeed);
                stopReading();
                startReading(reverse);
                longWord = false;
            }
            writeWord(words[currentWord]);
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
        if (count % 5 == 0) calcAndDisplayWPM();
        count++;
    }

    var longWordExtraTime = function () {
        return Math.round((words[currentWord].length - longWordThreshold + 1) * interval / 10);
    }

    var wpmToInterval = function (speed) {
        return Math.round(1000.0/speed*60);
    }

    var calcAndDisplayElapsed = function() {
        var timeElapsedReading = new Date().getTime() - 
          startTime - timeElapsedPaused;
        var elapsedMoment = moment(timeElapsedReading);
        $(".elapsed").html("Time elapsed: " +
          elapsedMoment.format("mm:ss"));

        // if (timeElapsedReading / 1000 / 60 >= 60)
        //   $(".elapsed").html("Time elapsed: " +
        //     elapsedMoment.format("h:m[m]:s.S[s]"));
        // else if (timeElapsedReading / 1000 >= 60)
        //   $(".elapsed").html("Time elapsed: " +
        //     elapsedMoment.format("m[m]:s.S[s]"));
        // else $(".elapsed").html("Time elapsed: " +
        //   elapsedMoment.format("s[s]"));
    }

    var calcAndDisplayWPM = function () {
        var timeElapsedReading = new Date().getTime() - startTime - timeElapsedPaused;
        // console.log("time elapsed: " + timeElapsedReading / 1000);
        $(".current-wpm").html("Speed: " + Math.round(currentWord / (timeElapsedReading / 1000 / 60)) + " wpm");
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
        }
    }

    var stopReading = function() {
        // get the time when reading stopped
        pauseStartTime = new Date().getTime();
        currentlyReading = false;
        clearInterval(reader);
        $(".focusDummy").focus();
    }



    $("button.start").click(function() {
        currentWord = 0;
        timeElapsedPaused = 0; 
        startReading(false);
    });

    $("button.pause").click(function() {
        if (currentlyReading) stopReading();
        else startReading(false)
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

    speed_slider.change(function(event) {
        stopReading();
        currentSpeed = speed_slider.val() * speedMultiplier;
        interval = wpmToInterval(currentSpeed);
        startReading(reverse);
    });

	$('#font_size').change(function(){ 
	    var value = $(this).val();
	    if (value === "s") fontSize = 50;
	    else if (value === "m") fontSize = 72;
	    else if (value === "l") fontSize = 108;
	    else if (value === "xl") fontSize = 150;
	    else fontize = 108;
	    console.log(fontSize + ", " + value);
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

$(main);

