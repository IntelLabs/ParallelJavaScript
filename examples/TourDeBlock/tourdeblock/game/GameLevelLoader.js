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




var currentLevelJson;
var currentlyLoadedBrushes;

var setting;
var settingBrushes;

var particleColor, trailColor, bgColor;

var bgParticleSystem, bgParticles, pMaterialB;

function selectLevel() {

    showLoadingIndicator();
    isLoading = true;
    cameraControl.freeze = true;

    $.getJSON(Config.service_path + 'ListLevels.aspx', function (json) {

        showModal();

        for (var i = 0; i < json.levels.length; i++) {
            var fileName = json.levels[i].file;

            if (hasLoadedLevel == false)
                modal.innerHTML += "<div style='cursor:pointer;margin-top:10px;' onmousedown='loadLevel(\"" + fileName + "\")' >" + fileName + "</div>";
            else
                modal.innerHTML += "<div style='cursor:pointer;margin-top:10px;' onmousedown='navigateToLevel(\"" + fileName + "\")' >" + fileName + "</div>";
        }

        hideLoadingIndicator();
    });

}





function navigateToLevel( fileName ) {
        window.location = window.location.toString().split("?")[0] + "?level=" + fileName;
}

function clearAndLoad(fileName){
    nextLevel = fileName;
    animateOutCubes();}

var _cubeColor, _cubeScoreColor, _cubeHitColor, _cubeScoreColorSmall, _bgScale;

/* This function will replace loadLevel to avoid ASP calls */
function loadLevelJSON(levelObject) {

    cubeArray = [];


    setState(States.LOADING);

    hideLoadingIndicator();
    hideModal();

    hasLoadedLevel = true;

    isDoneLoading = false;
    buildCount = 0;
    
    // set the winningScore var
    winningScore = levelObject.winningScore;
   

    _currentLevel = levelObject;
    _cubeColor = new THREE.Color(parseInt(_currentLevel.cube_color));

    reticuleScale = 2;

    if (_currentLevel.bg_scale)
        _bgScale = parseInt(_currentLevel.bg_scale);
    else
        _bgScale = 30;

    _cubeScoreColor = new THREE.Color(parseInt(_currentLevel.cube_score_color));
    _cubeScoreColorSmall = new THREE.Color(parseInt(_currentLevel.cube_score_color_small));
    _cubeHitColor = new THREE.Color(parseInt(_currentLevel.cube_hit_color));
    

    if (levelObject.gravity !== undefined)
        g_gravity = parseFloat( levelObject.gravity);
    else
        g_gravity = -9.8;

    if (levelObject.timeDivisor !== undefined)
        timeDivisor = parseFloat(levelObject.timeDivisor);
    else
        timeDivisor = 1100;


    g_friction = .9;//this is set again later when firing to maitain stability

    if (levelObject.floor_size !== undefined) {
        floorWidth = parseFloat( levelObject.floor_size );
        floorDepth = parseFloat(levelObject.floor_size );
    } else {
        floorWidth = 60;
        floorDepth = 60;
    }

    g_sleepEpsilon = 1;

    _preventAudioFirstPlay = false;
    
    reticuleScale = 2;
   
    document.getElementById("reticule").setAttribute("style", "-moz-transform:scale(" + reticuleScale + ")");


    $.getJSON(Config.service_path + 'assets/levels/' + levelObject.level + '/' + levelObject.level + '.json', function (data) {
        currentLevelJson = data;

        if (Config.use_textures == true)
            loadBrushes();
        else
            prepareGeometryWithoutTexture();

    });
}

function loadBrushes() {
   
    currentlyLoadedBrushes = new Array();
    var len = currentLevelJson.data.length;
    var numLoadedBrushes = 0;
    var numBrushes = 0;

    for (var i = 0; i < len; i++)
        if (currentLevelJson.data[i]["brushId"]) {

            var brushId = currentLevelJson.data[i]["brushId"];
            numBrushes++;

            $.getJSON(Config.service_path + 'assets/levels/' + currentLevelJson.title + "/brushes/" + brushId + "/" + brushId + ".json",
            function (json, index) {
                currentlyLoadedBrushes.push(json);
                numLoadedBrushes++;
                if (numLoadedBrushes == numBrushes)
                    applyBrushes();
            });
            
        }

    /* LEGACY: no brushes so load the default textures */
        if (numBrushes == 0)
            LoadTextures(currentLevelJson, buildScene);
}


function applyBrushes() {

    for (var i = 0; i < currentlyLoadedBrushes.length; i++)
        for (var q = 0; q < currentLevelJson.data.length; q++)
            if (currentLevelJson.data[q].brushId == currentlyLoadedBrushes[i].id)
                currentLevelJson.data[q].sourceImages = currentlyLoadedBrushes[i].sourceImages;

    for (var i = 0; i < currentLevelJson.data.length; i++)
        currentLevelJson.data[i].binding = false;

    for (i = 0; i < currentlyLoadedBrushes.length; i++) {
        LoadCubeTexture(currentlyLoadedBrushes[i], combineGeoTextures, true, false);        
    }
}

function combineGeoTextures( brush ) {

    var isDoneLoading = false;
    var combinedCount = 0;

    for (i = 0; i < currentLevelJson.data.length; i++) {

        if (currentLevelJson.data[i].brushId == brush.id && currentLevelJson.data[i].binding == false  ) {

            //currentLevelJson.data[i]["mesh"] = new THREE.Mesh(brush["box"], new THREE.MeshFaceMaterial({ /*transparent: true*/ }));

            currentLevelJson.data[i]["mesh"] = new THREE.Mesh(brush["box"], new THREE.MeshLambertMaterial({ color: _currentLevel.cube_color * currentLevelJson.data[i].pointValue}));
            currentLevelJson.data[i].binding = true;
            buildScene(currentLevelJson.data[i]);
        }

    }


}


function prepareGeometryWithoutTexture()
{
    var sharedMaterial = new THREE.MeshBasicMaterial({ color: 0xfafafa });

    var isDoneLoading = false;
    for (i = 0; i < currentLevelJson.data.length; i++) {

        currentLevelJson.data[i]["mesh"] = new THREE.Mesh(new THREE.CubeGeometry(1,1,1), sharedMaterial);
        currentLevelJson.data[i].binding = true;

        buildScene(currentLevelJson.data[i]);
    }


}



var buildCount = 0;
var levelScale = 2;
function buildScene( obj  ) {       
    
            var doneLoading = false;
      
            buildCount++;
            
            if (buildCount == currentLevelJson.data.length)
                doneLoading = true;


            var body = new Cube([obj.x * levelScale, obj.y * levelScale, obj.z * levelScale], [obj.rx * 180 / Math.PI , obj.ry * 180 / Math.PI, obj.rz * 180 / Math.PI], [obj.sx * levelScale, obj.sy * levelScale, obj.sz * levelScale], parseInt(obj.mass));
            body.m_uniqueId = "cube_" + i;
            g_cubes.push(body);
            g_numCubes++;           

            
            var cubeMesh = obj["mesh"];
            cubeMesh.scale = new THREE.Vector3(obj.sx * levelScale, obj.sy * levelScale, obj.sz * levelScale);
            

            cubeMesh.castShadow = false;
            cubeMesh.receiveShadow = false;
            cubeMesh.useQuaternion = true;
            cubeMesh.autoUpdateMatrix = true;            
           

            cubeMesh.data = new Object();
                        
            cubeMesh.data.originalX = (obj.x * levelScale);
            cubeMesh.data.originalY = (obj.y * levelScale);
            cubeMesh.data.originalZ = (obj.z * levelScale);
            
            cubeMesh.data.hasScored = false;
            cubeMesh.data.hasMigrated = false;

            // set the point value of the block
            if (obj.pointValue != null || obj.pointValue != undefined)
                cubeMesh.data.pointValue = obj.pointValue;
            else
                cubeMesh.data.pointValue = 1;

            cubeMesh.position.y = 2000;


            sceneThree.add(cubeMesh);
            cubeArray.push(cubeMesh);

            NUM_CUBES++;

        if( doneLoading ){
            

            initFloor();

            loadingIndicator.style.display = "none";
            cameraControl.freeze = false;
            isLoading = false;

            if (!SHOW_MOUSE)
                container.style.cursor = "none";

            numLoaded = 0;
            numTextures = 0;

            // ADD BULLETS TO RECYCLE LATER

            bulletIndeces = [];
            currentBullet = 0;


            var sphereMaterial = new THREE.MeshLambertMaterial({ color: _currentLevel.bullet_color });

            for (var i = 0; i < NUM_BULLETS; i++) {

                var bullet = new Cube([i * 100, -2500, 2550], [0, 0, 0], [16, 16, 16], 4);
                g_cubes.push(bullet);
                bulletIndeces.push(g_numCubes);

                g_numCubes++;

                var sphereGeom = new THREE.CubeGeometry(16, 16, 16);
                var sphereMesh = new THREE.Mesh(sphereGeom, sphereMaterial);
                sphereMesh.receiveShadow = false;
                sphereMesh.useQuaternion = true;
                sphereMesh.autoUpdateMatrix = true;

                sphereMesh.position.x = 500;
                sphereMesh.position.y = -500;

                sceneThree.add(sphereMesh);
                cubeArray.push(sphereMesh);

            }

            initializeParticles();
            //ConvertCubesToArrays();
                        

            if (IMPULSE_OCL)
                UseParallelVelocities();
                
            setState(States.PIECES_LOADED);
        }

    }







/* Again, wrote this temp function to handle loading the Set JSON while ASP is not available */

function loadSetJSON(setName) {

    hideLoadingIndicator();
    hideModal();

    setDoneLoading = false;
    hasLoadedLevel = true;
    buildBackgroundCount = 0;

    $.getJSON(Config.service_path +'assets/levels/' + setName + '/' + setName + '.json', function (json) {
        setting = json;
        loadSettingBrushes();
    });

}

/* yes, i know there's some repitition here. if the brush loader was built into the data loading scheme in the first place, 
this would not have happened, but just tring to wrap up texture junk and move on */

/*
function loadSet(setName) {

    hideLoadingIndicator()
    hideModal();

    setDoneLoading = false;
    hasLoadedLevel = true;
    buildBackgroundCount = 0;

    $.getJSON(Config.service_path + 'GetLevel.aspx?filename=' + setName, function (json) {
        setting = json;
        loadSettingBrushes();       
    });

}
*/

function loadSettingBrushes() {

    settingBrushes = new Array();
    var len = setting.data.length;
    var numLoadedBrushes = 0;
    var numBrushes = 0;

    for (var i = 0; i < len; i++)
        if (setting.data[i]["brushId"]) {

            var brushId = setting.data[i]["brushId"];
            numBrushes++;

            $.getJSON(Config.service_path + 'assets/levels/' + setting.title + "/brushes/" + brushId + "/" + brushId + ".json",
                function (json, index) {
                    settingBrushes.push(json);
                    numLoadedBrushes++;
                    if (numLoadedBrushes == numBrushes)
                        applySetBrushes();
                });

        }

    /* LEGACY: no brushes so load the default textures */
    if (numBrushes == 0)
        makeFrontFaces(setting, buildBackground);
}


function applySetBrushes() {

    for (var i = 0; i < settingBrushes.length; i++)
        for (var q = 0; q < setting.data.length; q++)
            if (setting.data[q].brushId == settingBrushes[i].id)
                setting.data[q].sourceImages = settingBrushes[i].sourceImages;


    makeFrontFaces(setting, buildBackground, true);
}





var backgrounds = new Array(); // mesh geometry & material
var backgroundMaps = new Array(); // data
var bgCount = 0;
var buildBackgroundCount = 0;
var setDoneLoading = false;

function buildBackground(obj, doneLoading ) {

    var SM = _bgScale;

    var cubeMesh = obj["mesh"];

    cubeMesh.scale = new THREE.Vector3(obj.sx * SM, obj.sy * SM, obj.sz * SM);

    cubeMesh.doubleSided = true;
    cubeMesh.transparent = true; 
   
    cubeMesh.position.x = obj.x * SM;
    cubeMesh.position.y = 200;
    cubeMesh.position.z = obj.z * SM;

    obj.targetY = obj.y * SM - 20;

    cubeMesh.rotation.x = obj.rx;
    cubeMesh.rotation.y = obj.ry;
    cubeMesh.rotation.z = obj.rz;


    cubeMesh.autoUpdateMatrix = true;


    cubeMesh.data = new Object();

    sceneThree.add(cubeMesh);
    backgrounds.push(cubeMesh);

    backgroundMaps.push(obj);

    obj["texture"].needsUpdate = true;
    obj["mat"].map.needsUpdate = true;


    setTimeout(updateMaps, 1000);

    buildBackgroundCount++;

    
    if (buildBackgroundCount == setting.data.length) {
        setDoneLoading = true;

        // cant do start game here the level manager should listen for the state and decide if it should intro

        setState(States.LEVEL_LOADED);

    }

}


function updateMaps() {

    for (var i = 0; i < backgrounds.length; i++) {

        backgroundMaps[i]["texture"].needsUpdate = true;
        backgroundMaps[i]["mat"].map.needsUpdate = true;
    }

}













function initializeParticles() {

    if (particleSystem)
        sceneThree.remove(particleSystem);

    particleColor = _currentLevel.particleColor;

    if (_currentLevel.bgColor)
        bgColor = _currentLevel.bgColor.replace("0x", "#");
    else
        bgColor = "#5a5a5a";

    trailColor = _currentLevel.trailColor;

    

    tweenBgColor();

    // particles for trail
    pMaterial = new THREE.ParticleBasicMaterial({
        color: trailColor,
        size: 64,
        opacity: .25,
        map: THREE.ImageUtils.loadTexture("resources/particle.png"),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthTest: true,
        depthWrite: false
    });


    particles = new THREE.Geometry();

    if (particles.vertices)
        particles.vertices = [];

    // normal  bodies
    for (var p = 0; p < 150; p++) {

        var particle = new THREE.Vertex(new THREE.Vector3(0,-2000,0) );
        particles.vertices[p] = particle;
    }


    particleSystem = new THREE.ParticleSystem(particles, pMaterial);

    sceneThree.add(particleSystem);

   


    // BG PARTICLES --------------------------------------------------------------------------------
    pMaterialB = new THREE.ParticleBasicMaterial({
        color: particleColor,
        size: 24,
        opacity: .35,
        map: THREE.ImageUtils.loadTexture(
                "resources/particle.png"),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthTest: true,
        depthWrite: false
    });


    bgParticles = new THREE.Geometry();

    if (bgParticles.vertices)
        bgParticles.vertices = [];


    // normal  bodies
    for (var p = 0; p < 250; p++) {

        var particle = new THREE.Vertex(new THREE.Vector3(Math.random() * 500 - 250, Math.random() * 500 - 250, Math.random() * 500 - 250));
        bgParticles.vertices[p] = particle;
    }

    if (bgParticleSystem)
        sceneThree.remove(bgParticleSystem);

    bgParticleSystem = new THREE.ParticleSystem(bgParticles, pMaterialB);
    sceneThree.add(bgParticleSystem);

    // intro particles
    for (var i = 0; i < 250; i++) {
    
        JSTweener.addTween(bgParticles.vertices[i].position, {
            time: 2,
            delay: Math.random() * 2,
            transition: "easeInExpo",
           // x: Math.random() * 500 - 250,
           // y: Math.random() * 500 - 250,
           // z: Math.random() * 500 - 250,
            onUpdate: dirtyTheVirtices
        });
        
    }

}

var targetcolor = new Object();
targetcolor.r = 255;
targetcolor.g = 255;
targetcolor.b = 255;

function tweenBgColor() {

   // targetcolor.color = bgColor;
    var R = hexToR(bgColor);
    var G = hexToG(bgColor);
    var B = hexToB(bgColor);


    JSTweener.addTween(targetcolor, {
        time:1,
        transition: "linear",
        onUpdate: setBgColor,
        r: R,
        g: G,
        b: B
    });
}

function setBgColor() {
   
    var colorString = rgbToHex(parseInt(targetcolor.r), parseInt(targetcolor.g), parseInt(targetcolor.b));
    renderer.setClearColorHex(colorString, 1);
    sceneThree.fog = new THREE.Fog(colorString, 10, 700);
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "0x" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hexToR(h) { return parseInt((cutHex(h)).substring(0, 2), 16) }
function hexToG(h) { return parseInt((cutHex(h)).substring(2, 4), 16) }
function hexToB(h) { return parseInt((cutHex(h)).substring(4, 6), 16) }
function cutHex(h) { return (h.charAt(0) == "#") ? h.substring(1, 7) : h }
