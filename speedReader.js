var main = function () {
    "use strict";

    var reader = 0; // handle for event timer
    var currentWord = 0; // keeps track of index of current word in pasted text
    var currentlyReading = false; // keeps track of reading/not reading state of program
    var reverse = false; // keeps track of forward/reverse state of program
    var interval = 150; // 150 ms between words = 400 wpm

    var startTime = 0;
    var pauseStartTime = 0;
    var timeElapsedPaused = 0; 

    var read = function (reverse) {
        if (currentWord < 0) {
            currentWord = 0;
            reverse = false;
            stopReading();
        }
        if (currentWord < words.length) {
            writeWord(words[currentWord]);
            $(".current-word").html("Current word: "
              + (currentWord + 1) + " / " + words.length);
        }
        else {
            stopReading();
            currentWord = words.length - 2; // one before last element
            writeWord("FIN.");
        }
        if (reverse) currentWord--;
        else currentWord++;
        calcAndDisplayElapsed();
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

    var isNumeric = function(obj) {
        return !jQuery.isArray(obj) && (obj - parseFloat(obj) + 1) >= 0;
    }

    var extractFontSize = function (str) {
        var output = "";
        for (var i = 0; i < str.length; i++) {
            if (isNumeric(str[i])) {
                output = output + str[i];
            }
        }
        return output;
    }

    var writeWord = function(text) {
        ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.fillText(text, cv.width/2, cv.height/2);

        // if word is too big, scale it down to fit
        while (Math.round(ctx.measureText(text).width) > canvas.width) {
            console.log("text too wide at: " + ctx.font);
            var newSize = parseInt(extractFontSize(ctx.font));
            ctx.font = (newSize-10).toString() + "px Arial";
            console.log("new size: " + ctx.font);
            ctx.clearRect(0, 0, cv.width, cv.height);
            ctx.fillText(text, cv.width/2, cv.height/2);
        };
        ctx.font = "100px Arial";
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
    ctx.font = "100px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
};

$(main);

