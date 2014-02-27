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



//SCORE
var currentScore = 0;
var winningScore = 9999999999;
var totalScore = 0;
var multipliedScore = 0;
var multipliedCurrentScore = 0;

var floorIndex = -1;

var speedUpPhysics = false;

var _currentLevel = new Object();

var STATE = "";
// STATE MANAGEMENT
var States = new Object();
var FLAGS = new Object();


States.PLAYING = "playing";
States.LOADING = "loading";
States.PIECES_LOADED = "piecesLoaded";
States.BACKDROP_LOADED = "backdropLoaded";
States.HIGH_SCORE = "highScore";
States.LOAD_LEVEL_FROM_LIST = "loadLevelFromList";
States.HOME_SCREEN = 'homeScreen';
States.LEVEL_COMPLETE = 'levelComplete';
States.LOAD_LEVEL = 'loadLevel';
States.LEVEL_LOADED = 'levelLoaded';
States.PURGE_COMPLETE = 'purgeComplete';
States.COMPLETED_GAME = 'completedGame';



FLAGS.HAS_PLAYED_ONCE = false;
FLAGS.ENGINE_RUNNING = false;
FLAGS.HOME_SCREEN = true;
FLAGS.VIEWING_INSTRUCTIONS = false;
FLAGS.IS_GUP_LEVEL = false;
FLAGS.LEVEL_TO_LOAD = new Object();
FLAGS.LEVEL_FROM_LIST = false;
FLAGS.LOAD_NEXT_LEVEL = false;
FLAGS.COLLECT_POINTS = false;
FLAGS.VIEWING_CREDITS = false;
FLAGS.VIEWING_HIGH_SCORES = false;
FLAGS.BULLET_LIMIT_REACHED = false;
FLAGS.GATHER_LEVEL_SCORE = false;
FLAGS.LEVEL_COMPLETE = false;

function setState( state ) {
    // TODO: swtich
    STATE = state;
    trace("STATE:: " + STATE);

    switch(state){
        case States.LEVEL_LOADED:
            
            levelPercent.style.width = "0px";
         


            setFlag( "COLLECT_POINTS", true );

            if (FLAGS.HAS_PLAYED_ONCE) {
                startIntro();
            } else {
                if(FLAGS.LEVEL_FROM_LIST){
                    //userInterface.beginPlay();
                    startIntro();
                    setFlag("LEVEL_FROM_LIST", false);
                } else if(FLAGS.LOAD_NEXT_LEVEL){
                    setFlag('LOAD_NEXT_LEVEL', false);
                    //userInterface.beginPlay();
                    startIntro();
                }
            }
            break;

        case States.LOAD_LEVEL:

            levelPercent.style.width = "0px";

            speedUpPhysics = false;
            FLAGS.BULLET_LIMIT_REACHED = false;
            FLAGS.GATHER_LEVEL_SCORE = false;
            
         
            bulletsFired = 0;
            loadLevelJSON(FLAGS.LEVEL_TO_LOAD)
            break;
        
        case States.LOADING:
            // App is loading a level
            
            break;
        
        case States.PIECES_LOADED:
            // Level pieces loaded
            document.getElementById("top").style.display = "inherit";
            // load set

            // No gup, load levels backdrop
            loadSetJSON(FLAGS.LEVEL_TO_LOAD.background)
            

            break;
        
        case States.PURGE_COMPLETE:
            // Backdrop & Pieces Purged
            if(FLAGS.LOAD_NEXT_LEVEL){
                //setFlag('LOAD_NEXT_LEVEL', false);
                setState(States.LOAD_LEVEL);
            }

        case States.PLAYING:
            //userInterface.clearDialog();
            //userInterface.showLevelInstructions();
            FLAGS.HAS_PLAYED_ONCE = true;
            FLAGS.PLAYING_GAME = true;
            currentScore = 0;

            break;

        case States.HOME_SCREEN:
            // Launch Home Screen
            FLAGS.PLAYING_GAME = false;
            userInterface.showHomeScreen();
            break;

        case States.LOAD_LEVEL_FROM_LIST:
            // Launch Load Level
            userInterface.showLevelPicker();
            break;

        case States.HIGH_SCORE:
            // Launch High Scores
            FLAGS.VIEWING_HIGH_SCORES = true;
            userInterface.showHighScores();
            break;

        case States.LEVEL_COMPLETE:
            // Launch Level Complete
            //currentScore = 0;
            winningScore = 9999999; // Set this so we dont accidentally beat the level

            document.getElementById("top").style.display = "none";

            scoreDisplay.display = "none";
          

            // Delay UI so we can speed up time & collect all points
            setTimeout(userInterface.showLevelComplete, 3000);

            speedUpPhysics = true;

            break;

        case States.COMPLETED_GAME:
            // Beat the game!

            winningScore = 999999;
            var isHighScore = false;
            FLAGS.PLAYING_GAME = false;

            for (var i = 0; i < HighScores.length; i++) {

                if (multipliedScore > HighScores[i].score) {
                    userInterface.showHighScoresDataCollection();
                    isHighScore = true;
                    break;
                }
            }

            if (isHighScore == false)
                userInterface.showHighScores();
    }

}


function setFlag(flag, value) {
    FLAGS[flag] = value;
    //trace("FLAG:: " + flag + "=" + value + " " + arguments.callee.caller.name);
}


// snag level from query vars (change to use levelschema)
function gupLevel() {
    /* check for a level in the URL */
    if (gup("level") != "") {
        setFlag("IS_GUP_LEVEL", true);          
        setFlag("LEVEL_TO_LOAD", gup("level"));
        setState(States.LOAD_LEVEL);
    }    
    setTimeout(beginGame, 1000);
}



function levelCompleted() {

    // Score has passed the minimum necessary to move to the next level
    var currentLevel = currentLevelJson.title.toLowerCase();
    $.each(Levels, function (u, _level) {

        var levelString = _level.level.toLowerCase();       

        if (levelString == currentLevel) {
            if (typeof (Levels[u + 1]) !== 'undefined') {
                // Completed Level
                setState(States.LEVEL_COMPLETE);

            } else {
                // Completed Game, no more levels to beat               
                // wait a bit for last tiles top score
                setTimeout(showGameOver, 3000);
            }

            return false;
        }
    })
}

function showGameOver() {
    setFlag( "COLLECT_POINTS", false );
    setState(States.COMPLETED_GAME);
}


//----------------------------     Switching Levels    --------------------------------------

var nextLevel = 'none';
function loadNextLevel( preventNext ) {
    // Animate out the old level
    if(hasLoadedLevel){
        var currentLevel = currentLevelJson.title.toLowerCase();

        // Find current level in schema
        $.each(Levels, function(u, _level){
            var levelString = _level.level.toLowerCase();

            if (levelString == currentLevel) {

                if (typeof(Levels[u + 1]) !== 'undefined') {
                   
                    if( !preventNext )
                        setFlag("LEVEL_TO_LOAD", Levels[u + 1]);
                    else 
                        setFlag("LEVEL_TO_LOAD", Levels[u]);

                    setFlag('LOAD_NEXT_LEVEL', true);
                    setFlag("LEVEL_COMPLETE", false);
                    userInterface.clearDialog();
                }

                // Purge old level
                animateOutCubes()

                return false;
            }
        })
    }
}

function getLevelSchemaByName(levelName) {


    $.each(Levels, function (u, _level) {
        if (levelName == _level)
            return _level;
    })


}



// begin the drawing seqence and run the engine
function beginGame() {
    setFlag("ENGINE_RUNNING", true);
    setFlag("COLLECT_POINTS", true);
    draw();
}


// main hook to start intro
function startIntro() {

    introBackground();
    introCubes();

    if (_currentLevel.audio)
        playBackground(_currentLevel.audio);
   
    scoreDisplay.style.display = "inherit";
}

function unFreezeCam() {
    cameraControl.lockTarget = false;
}


// transition out phsyics
function animateOutCubes() {

    // floor is last item before bulletss
    CubeList._m_mass[cubeArray.length - 6] = 20; 
    
    // Remove Cubes from display after they are off-screen
    setTimeout(purgeCubes, 1500);

    // Animate out background after the cubes are gone
    setTimeout(animateOutBackground, 1500);

    // remove particles
    for (var i = 0; i < 250; i++) {
   
        JSTweener.addTween(bgParticles.vertices[i].position, {
            time: 2,
            delay: 2,
            transition: "easeInExpo",
            y: 200,
            onUpdate: dirtyTheVirtices
        });
    }
   
   

}

function dirtyTheVirtices() {
    bgParticleSystem.geometry.__dirtyVertices = true;
}


function animateOutBackground() {
    for (var i = 0; i < backgroundMaps.length; i++) {

        var obj = backgroundMaps[i];

        JSTweener.addTween(obj["mesh"].position, {
            time: 2,
            delay:  2,
            transition: "easeInExpo",
            y: -400
        });

    }
    
    setTimeout(purgeBackdrop, 4000);
}


// hard removal of Cube objects
function purgeCubes() {

    isGameIntro = true;

    g_cubes = [];
    g_numCubes = 0;

    for (var i = 0; i < cubeArray.length; i++) {

        sceneThree.remove(cubeArray[i]);
    }

    cubeArray = [];
    bulletCubes = [];   //mesh
    bulletIndices = [];
    currentBullet = 0;

    NUM_CUBES = 0;

}

function purgeBackdrop() {

    for (var i = 0; i < backgrounds.length; i++) {

        sceneThree.remove(backgrounds[i]);
    }

    backgrounds = [];
    backgroundMaps = [];
    bgCount = 0;


    setState(States.PURGE_COMPLETE);
}
  

var floorWidth = 60, floorHeight = 30, floorDepth = 60;
// setup the material, physics cube and mesh for the floor
function initFloor() {

    // the cube object is the physics object, the mesh updates to this object's position at runtime

    //FLOOR                 //pos    //rot      //size      // mass
    var cube = new Cube([0, -15, 0], [0, 1, 0], [floorWidth, floorHeight, floorDepth], 10000);
    floorIndex = g_numCubes;
    g_cubes.push(cube);
    g_numCubes++;

    var image = new Image();
    image.onload = function () { texture.needsUpdate = true; };
    image.src = "resources/cube1.jpg";

    var texture = new THREE.Texture(image, new THREE.UVMapping(), THREE.RepeatWrapping, THREE.RepeatWrapping, THREE.NearestFilter, THREE.LinearMipMapLinearFilter);
    texture.repeat.x = 5;
    texture.repeat.y = 5;

    var floorMaterial = new THREE.MeshLambertMaterial({
        map: texture,
        color: 0xffffff
    });

    THREE.ColorUtils.adjustHSV(floorMaterial.color, 0, 0, 0.9);
    floorMaterial.wrapS = THREE.RepeatWrapping;
    floorMaterial.wrapT = THREE.RepeatWrapping;

    // THE FLOOR PLANE
    var floorPlane = new THREE.CubeGeometry(1, 1, 1);
    floor = new THREE.Mesh(floorPlane, floorMaterial);
    floor.position.x = cube.m_c[0];
    floor.position.y = -100;
    floor.position.z = cube.m_c[2];
    floor.castShadow = false;
    floor.receiveShadow = true;
    floor.data = new Object();
    floor.data.id = "floor";
    floorMaterial.map.needsUpdate = true;

    sceneThree.add(floor);
    cubeArray.push(floor);

    // just mimicing the normal way we align meshes with cubes
    for (var i = 0; i < cubeArray.length; i++) {

        cubeArray[i].scale.x = g_cubes[i].m_e[0] * 2;
        cubeArray[i].scale.y = g_cubes[i].m_e[1] * 2;
        cubeArray[i].scale.z = g_cubes[i].m_e[2] * 2;

        cubeArray[i].quaternion.set(g_cubes[i].m_rot[0], g_cubes[i].m_rot[1], g_cubes[i].m_rot[2], g_cubes[i].m_rot[3]);
    }
}



//----------------------------     intro --------------------------------------

// the current intro where the bg bounces in
function introBackground() {

    isGameIntro = true;

    for (var i = 0; i < backgroundMaps.length; i++) {

        var obj = backgroundMaps[i];

        JSTweener.addTween(obj["mesh"].position, {
            time: 2,
            delay: 2,
            transition: "easeOutExpo",
            y: obj.targetY
        });

    }

}


function introCubes() {



    for (var i = 0; i < cubeArray.length; i++) {

        var cube = cubeArray[i];
        var gCube = g_cubes[i];
        var obj = cube.data;

        if (i != floorIndex) {
            var mat = gCube.m_matWorld;
            var rot = gCube.m_rot;
            cube.position.x = Math.random() * 30;
            cube.position.y = Math.random() * 100 + 50;
            cube.position.z = Math.random() * 30;

            cube.quaternion.set(rot[0], rot[1], rot[2], rot[3]);

            // TWEEN TO THE TARGET (the physics cube's position)
            
            JSTweener.addTween(cube.position, {
                time: 3.5,
                delay: Math.random() * 1 + (mat[7] / 50),
                transition: "easeOutSine",
                x: mat[3],
                y: mat[7],
                z: mat[11]
            });

        }

    }

    var floor = cubeArray[floorIndex];

    floor.position.y = -200;
    var mat = g_cubes[floorIndex].m_matWorld;
    JSTweener.addTween(floor.position, {
        time: 3.5,
        delay: 0,
        transition: "easeOutSine",
        x: mat[3],
        y: mat[7],
        z: mat[11]
    });


    setTimeout(endGameIntro, 5500); //<--------------   note, just waiting 5 seconds to end the intro state
    setTimeout(hideLoadingDialog, 6000);

    document.getElementById("instructions-button").style.display = "inherit";
    document.getElementById("credits-button").style.display = "inherit";
    document.getElementById("restart-button").style.display = "inherit";

    userInterface.showLoadingLevel();
}

function hideLoadingDialog() {

    userInterface.removeDialog();
    document.getElementById("reticule").style.display = "inherit";
    document.getElementById("reticule").style.opacity = "1";
    reticule.innerHTML = '<img width="120" height="120" src="resources/interface/reticule.png" />';

    reticuleScale = 2;

    document.getElementById("reticule").setAttribute("style", "-moz-transform:scale(" + reticuleScale + ")");

}

function endGameIntro() {
    automatedCamera = false;
    isGameIntro = false;
    isRight = false;
}
