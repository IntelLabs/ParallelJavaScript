/// <reference path="engine/ApplyImpulses.js" />
/// <reference path="engine/ApplyImpulsesOCL.js" />
/// <reference path="engine/Cube.js" />
/// <reference path="engine/CubeCollision.js" />
/// <reference path="engine/CubeCollisionOCL.js" />
/// <reference path="engine/VectMath.js" />
/// <reference path="CamControl.js" />
/// <reference path="GameLevelLoader.js" />
/// <reference path="LevelManagement.js" />
/// <reference path="CamControl.js" />


/*
   Tour de Block
Designed by Indigo Kelleigh, Developed by Vance Feldman, Original c++ engine by Ben Kenwright

Copyright (c) 2012, Intel Corporation
All rights reserved.
 
Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
 
    - Redistributions of source code must retain the above copyright notice,
      this list of conditions and the following disclaimer.
    - Redistributions in binary form must reproduce the above copyright notice,
      this list of conditions and the following disclaimer in the documentation
and/or other materials provided with the distribution.
 
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
    SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
THE POSSIBILITY OF SUCH DAMAGE.
*/


var dialog, introBackdrop, frame, reticule, bottomNav, introCredits;
var preventDialogClose = false;
var instructionsButton, playButton;

var isIntro = true;

var LOGO_STRING = "<img src='resources/interface/logo_1.png'/>";

function UserInterface () {

    dialog = document.getElementById("dialog");
    dialogInstructions = document.getElementById("dialogInstructions");
    introBackdrop = document.getElementById("intro-backdrop");
    frame = document.getElementById("frame");
    reticule = document.getElementById("reticule");
    bottomNav = document.getElementById("bottom-nav");
    mouseHideArea = document.getElementById("mouse-hide-area");
    introCredits = document.getElementById("intro-credits");
    dialog.style.display = "inherit";


    return this;
}

function initButtons(){
    // TEMP BUTTONS FOR CHOOSING LEVELS
    $('#top .next').click(function(){
        loadNextLevel();
    });

    document.addEventListener( "mousedown", userInterface.clearDialog );

    $("#restart-button").click(function () {
        userInterface.repeatLevel();
    });

    $("#instructions-button").click(function () {        
        setFlag("VIEWING_INSTRUCTIONS", true);        
        userInterface.showInstructions();
    });

    if (Config.show_credits == true) {
        $("#credits-button").click(function () {           
            setFlag("VIEWING_CREDITS", true);
            userInterface.showIntroCredits();
            userInterface.clearDialog();
        });
    } else {
        document.getElementById("credits-button").style.display = "none";
    }

    $("#high-scores-button").click(function () {        
        setState(States.HIGH_SCORE);
    });

    $("#mute-button").click(function () {
        mute();
        
        $("#mute-button").innerHTML = "";

        if (_mute == true)
            document.getElementById("mute-button").innerHTML = '<img src="resources/interface/mute.gif" width="27" height="27"/>';
        else 
            document.getElementById("mute-button").innerHTML = '<img src="resources/interface/unmute.gif" width="27" height="27"/>';

        $("#mute-button").innerHTML = "";
    });

    // Setup RiverTrail based on Config
    if (Array.buildPar) {

        $('#top a.rivertrail').removeClass('disabled');
        COLLISION_OCL = true;
       //IMPULSE_OCL = true;

    } else {
        $('#top a.rivertrail').text('RiverTrail Disabled');
        COLLISION_OCL = false;
       // IMPULSE_OCL = false;       
    }

    $('#top a.rivertrail').click(function () {
        if ($(this).hasClass('disabled')) {

            if (!Array.buildPar)
                return;

            COLLISION_OCL = true;
         // IMPULSE_OCL = true;           
         // UseParallelVelocities();

            $(this).text('RiverTrail Enabled');
            $(this).removeClass('disabled');
            console.log("River Trail is now enabled");
        } else {
            COLLISION_OCL = false;
        //    IMPULSE_OCL = false;

            //UseNormalVelocities();

            $(this).text('RiverTrail Disabled');
            $(this).addClass('disabled');
            console.log("River Trail is now disabled");
        }
    });

    // Setup Demo Mode
    if(Config.is_demo){
        $('#top a.demo').click(function(){
            setState(States.LOAD_LEVEL_FROM_LIST);
        });
      
       // $('#top a.demo').fadeIn();
    }
}

/* cache logo before first showDialog */
UserInterface.prototype.loadAndDisplayLogo = function () {
    var img = new Image();
    img.src = 'resources/interface/logo_1.png';
    img.onload = function () {
        userInterface.intro();
    }

}

// helper for automation
UserInterface.prototype.next = function () {

    if (FLAGS.HOME_SCREEN == true)
        userInterface.beginPlay();
    else if (FLAGS.LEVEL_COMPLETE == true)
        userInterface.nextLevel();

}


UserInterface.prototype.intro = function () {

    introBackdrop.style.display = "inherit";
    introBackdrop.style.opacity = "0";

    this.showDialog(3);
    this.showBottomNav(2);

    dialog.innerHTML = LOGO_STRING;

  

    this.centerElement(dialog);

    bottomNav.innerHTML = "<div class='clickable' id='start-play' onclick='userInterface.beginPlay()' style='position:fixed; left: 50%; margin-left: -137px; margin-top: -40px;'><img src='resources/interface/b_play.png'/></div>";



    JSTweener.addTween(introBackdrop.style, {
        time: 1,
        delay: 0,
        transition: "easeInQuad",
        opacity: 1
    });

}



UserInterface.prototype.showBottomNav = function (p_delay) {

    var delay = 0;
    if (p_delay) delay = p_delay;

    bottomNav.innerHTML = "";

    JSTweener.addTween(bottomNav.style, {
        time: 1,
        delay: delay,
        transition: "easeInQuad",
        opacity: 1
    });

}

UserInterface.prototype.showHomeScreen = function () {
    setFlag("HOME_SCREEN", true);

    scoreDisplay.style.display = "none";
    scoreDisplay.style.display = "none";
    document.getElementById("instructions-button").style.display = "none";
    document.getElementById("restart-button").style.display = "none";
    
    document.getElementById("home-instructions").style.display = "inherit";
    document.getElementById("home-instructions-bg").style.display = "inherit";

    // Display logo
    userInterface.loadAndDisplayLogo();

   
    // Display Play Button
    bottomNav.innerHTML = "<div class='clickable' id='start-play' onclick='userInterface.beginPlay()' style='position:fixed; left: 50%; margin-left: -137px; margin-top: -40px;'><img src='resources/interface/b_play.png'/></div>";

}



UserInterface.prototype.beginPlay = function () {
    setFlag("HOME_SCREEN", false);

    if( Config.is_demo != true )
        document.getElementById("call-to-action").style.display = "inherit";

    document.getElementById("high-scores-button").style.display = "none";
    document.getElementById("home-instructions").style.display = "none";
    document.getElementById("home-instructions-bg").style.display = "none";
    
    currentScore = 0;
    totalScore = 0;
    multipliedScore = 0;
    multipliedCurrentScore = 0;

    updateScoreDisplay();

    this.removeDialog();
   

    isDialog = false;
    isIntro = false;



    var play = document.getElementById("start-play");

    beginGame(); // starts the render and physics process

    startIntro();


    $('#start-play').fadeOut();

    JSTweener.addTween(introBackdrop.style, {
        time: 1,
        transition: "easeInQuad",
        opacity: 0
    });

    if (Config.is_demo) 
        $('#top a.demo').fadeIn();
    
}


UserInterface.prototype.hideMouse = function(){
   //mouseHideArea.style.cursor = "none";
}






/* ------------- Dialog UI ------------- */

UserInterface.prototype.buildDialog = function (element, share) {
   
    dialog.innerHTML = element;

    this.showDialog(2, 0, "easeOutExpo");

    if (document.getElementById("highscoresName"))
        document.getElementById("highscoresName").focus();

    this.centerElement( dialog );
}



UserInterface.prototype.clearDialog = function () {     
    if (isDialog == false )
        return;

    if (preventDialogClose == false) {
        isDialog = false;
        dialog.style.display = "none";
    }

    document.getElementById("three-scene").focus();
}


UserInterface.prototype.removeDialog = function () {
    dialog.style.display = "none";
    isDialog = false;
}


UserInterface.prototype.showDialog = function (time, delay, _transition) {
    if (typeof (_transition) == 'undefined') {
        _transition = 'easeOutElastic';
    }

    dialog.style.display = "inherit";

    isDialog = true;

    if (time == null) time = 2;
    if (delay == null) delay = 0;

    dialog.style.opacity = "0";

   
    JSTweener.addTween(dialog.style, {
        time: time / 2,
        delay: delay,
        transition: "easeInQuad",
        opacity: 1
    });


    dialog.style.top = -200;
    JSTweener.addTween(dialog.style, {
        time: time,
        delay: delay,
        transition: _transition,
        top: 100
    });
}



/* ------------- Levels ------------- */

UserInterface.prototype.showLoadingLevel = function () {
    this.clearDialog();

    var messageText = "Dot dot dot...";
    var levelComplete = "<div class='shadow' id='dialogBox' style='font-size:24px;display:inline-block;padding:30px;color:yellow;'>Loading Level</div>";
    this.buildDialog(levelComplete);
}




UserInterface.prototype.showGameComplete = function () {
    this.clearDialog();

    preventDialogClose = true;

    document.getElementById("instructions-button").style.display = "none";
    document.getElementById("credits-button").style.display = "none";


    var messageText = "You beat the game with " + totalScore + " points!";
    var levelComplete = "<div class='shadow' id='dialogBox' style='display:inline-block;padding:30px;'><img src='resources/interface/title_youwin.png' /><p>" + messageText + "</p><img onclick='userInterface.showHighScores()' class='clickable' src='resources/interface/b_highScores.png'/><img onclick='userInterface.showCredits()' class='clickable' src='resources/interface/b_credits.png'/></div>";
    this.buildDialog(levelComplete, true);
}

UserInterface.prototype.showLevelComplete = function () {
    userInterface.clearDialog();
    setFlag("COLLECT_POINTS" ,false);
    setFlag("LEVEL_COMPLETE" , true);

    preventDialogClose = true;

    var levelPoints = multipliedCurrentScore; //<-- todo: load from level schema
    var message = "I scored " + multipliedScore + " points! " + window.location.href;
    var messageText = "You completed the level with " + levelPoints + " points!  &nbsp; " + " <a href='https://twitter.com/share?text=" + message + "' class='twitter-share-button' data-dnt='true' data-count='none' data-via='twitterapi' target='_blank'><img src='resources/interface/twitter.png' style='display:inline;vertical-align:middle;' /> </a>";
    messageText += '<script>!function (d, s, id) { var js, fjs = d.getElementsByTagName(s)[0]; if (!d.getElementById(id)) { js = d.createElement(s); js.id = id; js.src = "https://platform.twitter.com/widgets.js"; fjs.parentNode.insertBefore(js, fjs); } }(document, "script", "twitter-wjs");</script>';
    var levelComplete = "<div class='shadow' id='dialogBox' style='display:inline-block;padding:30px;'><img src='resources/interface/title_levelComplete.png' /><p>" + messageText + "</p><img onmousedown='userInterface.nextLevel()' class='clickable' src='resources/interface/b_nextLevel.png'/><img onmousedown='userInterface.repeatLevel()' class='clickable' src='resources/interface/b_playAgain.png'/></div>";
   

    userInterface.buildDialog(levelComplete, true);
}

UserInterface.prototype.showTryAgain = function () {
    this.clearDialog();
    setFlag("LEVEL_COMPLETE", true);

    isDialog = true;


    document.getElementById("instructions-button").style.display = "none";
    document.getElementById("credits-button").style.display = "none";

    var messageText = "Minimum score not reached. Try again!";
    var levelComplete = "<div class='shadow' id='dialogBox' style='display:inline-block;padding:30px;'><h2>Not Quite</h2><p>" + messageText + "</p><img onmousedown='userInterface.repeatLevel()' class='clickable' src='resources/interface/b_playAgain.png'/></div>";
    this.buildDialog(levelComplete);
}


UserInterface.prototype.showInstructions = function () {
    
    if (isGameIntro == true)
        return;


    this.clearDialog();
    isDialog = true;

    var instructions = "<div class='shadow' id='dialogBox' style='padding:30px;'> <h2>Gameplay</h2><br/>  <div style='color:#ffffff;width:500px;margin:auto;'>" + Config.instructions_text + "<br/><br/> <h2>Controls</h2>" + Config.controls_text + "  </div>     </div>";
    userInterface.buildDialog(instructions);
}



UserInterface.prototype.nextLevel = function(  ) {
    userInterface.clearDialog();
    preventDialogClose = false;
    loadNextLevel();
}

UserInterface.prototype.repeatLevel = function () {
    preventDialogClose = false;
    userInterface.clearDialog();

    // Remove currentScore
    totalScore -= currentScore;
    currentScore = 0; 
    loadCurrentLevel();
}

UserInterface.prototype.showLevelPicker = function () {
    this.clearDialog();

    var messageText = "";
    var levels = '';

    isDialog = true;
    preventDialogClose = true;

    $.each(Levels, function (i, _level) {
        levels += '<div id="level-' + i + '" onclick="loadLevelFromList(' + i + ')" class="level" style="background-image: url(assets/levels/' + _level.level + '/thumbnail.jpg);"></div>';
    })

    var levelComplete = "<div class='shadow' id='dialogBox' style='display:inline-block;padding:30px;'><img src='resources/interface/title_chooseLevel.png' /><p>" + messageText + "</p><div id='levelList' >" + levels + "</div></div>";
    this.buildDialog(levelComplete);

}

function loadLevelFromList(_id) {

   
    setFlag("LEVEL_TO_LOAD", Levels[_id] );
    // Score has passed the minimum necessary to move to the next level
    // Animate out the old level
    if (hasLoadedLevel) {
        var currentLevel = currentLevelJson.title.toLowerCase();

        // Find current level in schema
        $.each(Levels, function (u, _level) {
            var levelString = _level.level.toLowerCase();
            if (levelString == currentLevel) {

                setFlag("LEVEL_TO_LOAD", Levels[_id]);
                setFlag('LOAD_NEXT_LEVEL', true);
                
                userInterface.clearDialog();

                // Purge old level
                animateOutCubes();
            }
        });
    }

    preventDialogClose = false;

    userInterface.clearDialog();
    
}


function loadCurrentLevel(  ) {

  
        setFlag("LEVEL_TO_LOAD", _currentLevel);
        setFlag('LOAD_NEXT_LEVEL', true);
        userInterface.clearDialog();
        // Purge old level
        loadNextLevel(true);
}



UserInterface.prototype.showLevelInstructions = function (){
    var levelInstructions = '<div id="dialogBoxInstructions" class="instructions shadow"><p>Hold down the mouse, then release to launch a cube.</p></div>';
    this.buildInstructions(levelInstructions);

    setTimeout(this.hideDialogInstructions, 4500);
}











/* -------------  ------------- */

UserInterface.prototype.collectHighScore = function () {

    var text = document.getElementById("highscoresName").value;
    if (containsProfanity(text)) {
        alert("Please Refrain from using profanity.");
        return;
    }

    cleaned = text.replace(/[^a-zA-Z 0-9]+/g, '');

    var data = new Object();
    data.id = redirect;
    data.levelTitle = text;
    data.hash = multipliedScore;

    var serialized = JSON.stringify(data);

    $.ajax({
        type: 'POST',
        url: "../Redirect.aspx?exec=redirect",
        dataType: 'text',
        data: serialized,
        complete: function (response) {
            var god = data.stream;

            $.getJSON('assets/HighScores.json', { cache: Math.round(Math.random() * 1000) }, function (data) {

                HighScores = data.scores;
                userInterface.showHighScores();
            });
        }
    });

}


UserInterface.prototype.showHighScoresDataCollection = function () {
    this.clearDialog();

    var messageText = "You got a high score! Enter your name below to be added to the list.";

    var inputField = '<div id="highscoresCollection"><span>Name</span><input type="text" name="highscoresName" id="highscoresName" style="z-index:4000; color:#000000; font-size:20px;" maxlength="16"/><img onclick="userInterface.collectHighScore()" class="clickable submit" src="resources/interface/b_submit.png" /></div>';

    var inputData = "<div class='shadow' id='dialogBox' style='display:inline-block;padding:30px;'><img src='resources/interface/title_highScores.png' /><p>" + messageText + "</p>" + inputField + "</div>";

    this.buildDialog(inputData);
}


UserInterface.prototype.showHighScores = function () {
    this.clearDialog();
   

    var levelPoints = 100;
    var messageText = "How do you compare with to the top scoring players?";

    var scoresData = '';

    // Temp create 10 scores
    for (var u = 0; u < 10; u++) {
        var rank;
        if (u <= 9) {
            rank = '0' + (u + 1);
        } else {
            rank = "10";
        }
        var name = "---";
        var score = "000";

        if (HighScores[u]) {
            name = HighScores[u].name;
            score = HighScores[u].score;
        }
        if (name == '')
            name = "&nbsp;";
        var scoresRow = '<div class="row"><span class="rank">' + rank + '.</span><span class="name">' + name + '</span><span class="score">' + score + '</span></div>';
        scoresData += scoresRow;
    }

    var scoresTable = '<div id="highscores">' + scoresData + '</div>';
    var contents = "<div onclick='userInterface.clearDialog' class='shadow' id='dialogBox' style='display:inline-block;padding:30px;'><img src='resources/interface/title_highScores.png' />" + scoresTable + "</div>";

    this.buildDialog(contents);
    setFlag("VIEWING_HIGH_SCORES", true);


}

UserInterface.prototype.hideHighScores = function () {
    this.clearDialog();
}


UserInterface.prototype.showCredits = function () {
    this.clearDialog();

    var messageText = Config.credits;
    var gameCredits = "<div class='shadow' id='dialogBox' style='display:inline-block;padding:30px;'><img src='resources/interface/title_credits.png' /><p>" + messageText + "</p></div>";
    this.buildDialog(gameCredits);
   
}



UserInterface.prototype.showIntroCredits = function () {
    this.clearDialog();
    var messageText = Config.credits;
    var gameCredits = "<div class='instructions shadow' id='dialogBox' style='padding:30px;font-size:14px;'position:absolute;><p>" + messageText + "</p></div>";
   
    document.getElementById("intro-credits").innerHTML = gameCredits;
    introCredits.style.display = "inherit";

    introCredits = document.getElementById("intro-credits");
    userInterface.centerElement(introCredits);

    JSTweener.addTween(introCredits.style, {
        time: .75,
        delay: 0,
        transition: "easeInQuad",
        opacity: 1,
        top: -200
    });

    //  setTimeout(userInterface.hideIntroCredits, 15000);
    //  document.addEventListener("mouseup", userInterface.clearDialog);
}

UserInterface.prototype.hideIntroCredits = function ()
{
    introCredits.innerHTML = "";
}










/* ------------- Instructions ------------- */

var currentInstruction = 1;
var canHideInstructions = false;

UserInterface.prototype.showCallToAction = function () {
    if (isGameIntro == true   )
        return;

    document.getElementById("call-to-action").style.display = "inherit";
   

}

UserInterface.prototype.testExitInstructions = function (e) {

    if (canHideInstructions == false) return;

    document.getElementById("call-to-action").style.display = "none";

    var rect = userInterface.getElementRect(dialog);

    if (e.pageX > rect.x2 + 20 || e.pageX < rect.x1 - 20 || e.pageY < rect.y1 - 20 || e.pageY > rect.y2) {
        currentInstruction = 1;

        if (isIntro) {
            userInterface.removeDialog();
        }
      
        canHideInstructions = false;
        isDialog = false;
    }
}












/* ------------- Positioning ------------- */

UserInterface.prototype.centerElement = function (element) {
    var x = (SCREEN_WIDTH / 2) - (element.offsetWidth / 2);
    var y = (SCREEN_HEIGHT / 2) - (element.offsetHeight / 2);
    element.style.marginLeft = x + "px";

   


    var children = element.childNodes;

    /* recenter once fully loaded */
    for (var i = 0; i < children.length; i++) {
        children[i].onload = function () {
            userInterface.centerAgain(element);
        }

    }
}

UserInterface.prototype.centerElementBottom = function (element) {
    var x = (SCREEN_WIDTH / 2) - (element.offsetWidth / 2);
    var y = 375;
    element.style.marginLeft = x + "px";
    element.style.marginTop = y + "px";

    var children = element.childNodes;

    /* recenter once fully loaded */
    for (var i = 0; i < children.length; i++) {
        children[i].onload = function () {
            userInterface.centerAgainBottom(element);
        }

    }
}



UserInterface.prototype.centerAgain = function (element) {
    var x = (SCREEN_WIDTH / 2) - (element.offsetWidth / 2);
    var y = (SCREEN_HEIGHT / 2) - (element.offsetHeight / 2);
    element.style.marginLeft = x + "px";
    //element.style.marginTop = y + "px";

}

UserInterface.prototype.centerAgainBottom = function (element) {
    var x = (SCREEN_WIDTH / 2) - (element.offsetWidth / 2);
    var y = 200;
    element.style.marginLeft = x + "px";
    element.style.marginTop = y + "px";

}


UserInterface.prototype.getElementRect = function (element) {

  var rect = new Object();

  rect.x1 = parseInt(element.style.marginLeft);
  rect.y1 = parseInt(element.style.marginTop);

  rect.x2 = parseInt(element.style.marginLeft) + element.offsetWidth;
  rect.y2 = parseInt(element.style.marginTop) + element.offsetHeight;

  return rect;
}

