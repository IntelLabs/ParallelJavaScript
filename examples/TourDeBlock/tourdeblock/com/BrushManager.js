/* create and edit brushes */

var inputTitle, uploaders, doShowUploader = false;
var replaceActiveObject = false;
var replaceActiveNow = false;

var brushArray = new Array();


function onNewBrush() {

    if (document.getElementById("TITLE").value == "untitled" || document.getElementById("TITLE").value == "") {
        alert("Warning: You must name and save the level first!");
        return;
    }

    doShowUploader = true;

    populateLevelList(warnSaveBrush);
    showModal();

    reloadMeshTextureId = "";

    modal.innerHTML += "<h2>Create New Brush</h2>";

    if (activeObject) {
        modal.innerHTML += "<div class='clickable' onclick='cloneActiveObject(false)'><h1>Clone Active Object Brush -></h1></div>Make a new brush from the active object.<br/><br/>";

        modal.innerHTML += "<div class='clickable' onclick='cloneActiveObject(true)'><h1>Edit Active Object -></h1> Make a new unique brush, and apply the textures to the currently selected piece. </div><br/><br/>";

        modal.innerHTML += "<div class='clickable' onclick='editGlobalBrush()'><h1>Edit Brush Globally-></h1>Modify this object&rsquo;s textures. This will effect all other blocks that use this brush. </div><br/><br/>";

    } else {
        warnActive();
    }
    

}

function editGlobalBrush(p_brush) {

    if (p_brush) {
        activeBrush = p_brush;
    } else {

        activeBrush = getBrush(activeObject);

        if (activeBrush == null) {
            cloneActiveObject();
        } else {

            activeBrush.sx = activeObject.data.sx;
            activeBrush.sy = activeObject.data.sy;
            activeBrush.sz = activeObject.data.sz;

            activeBrush.rx = activeObject.data.rx;
            activeBrush.ry = activeObject.data.ry;
            activeBrush.rz = activeObject.data.rz;



        }
    }

    reloadMeshTextureId = activeBrush.id;
    replaceActiveObject = false;
    showImageUploader();
}

function getBrush( p_object ) {

    var brush;
    for (var i = 0; i < brushArray.length; i++) {

        if (brushArray[i].id == p_object.data.brushId)
            brush = brushArray[i];
    }

    return brush;
}

function appendBrush( p_brush ) {

    var foundMatch = false;

    for (var i = 0; i < brushArray.length; i++) {
        if (brushArray[i].id == p_brush.id)
            foundMatch = true;
    }

    if (!foundMatch) {
        brushArray.push(p_brush);
    }
}




function warnSaveBrush() {

    var foundMatch = false;

    /* see if the level is already saved */
    for (var i = 0; i < levelList.levels.length; i++)
        if (levelList.levels[i].file == document.getElementById("TITLE").value)
            foundMatch = true;

    if (!foundMatch) {
        alert("You must save the level before saving a brush.");

        hideModal();

        return;
    }

}


/* creates the uploaders etc */
function makeNewObjectDialog() {

   
}

function warnActive() {
    alert("NO ACTIVE OBJECT: please select a shape to clone");
}



function verifySaveBrush() {
   
    if( document.getElementById("Brush Title") )
        activeBrush.title = document.getElementById("Brush Title").value;

    if (document.getElementById("TITLE").value == "untitled" || document.getElementById("TITLE").value == "") {
        alert("Warning: You must name and save the level first!");
        return;
    }

    populateLevelList(saveBrush);
}

function saveBrush() {

    var foundMatch = false;

    /* see if the level is already saved */
    for (var i = 0; i < levelList.levels.length; i++) 
        if (levelList.levels[i].file == document.getElementById("TITLE").value)
            foundMatch = true;

    if (!foundMatch) {
        alert("You must save the level before saving a brush.");
        return;
    }

    activeBrush.levelTitle = document.getElementById("TITLE").value;

    var serializedData = JSON.stringify(activeBrush, "data", "\t");

    showLoadingIndicator();

    $.ajax({
        type: 'POST',
        url: SERVICE_PATH + "SaveBrush.aspx",
        dataType: 'text',
        data: serializedData,
        success: function (response) {

            var obj = JSON.parse(response);
            activeBrush.id = obj.id;
            hideLoadingIndicator();
          
            appendBrush(activeBrush);

            if (doShowUploader == true)
                showImageUploader();

            initCursor(true);



            /* youve decided to edit the brush globally, so we have to rebuild all the textures for the replacement pieces */
            if (reloadMeshTextureId != "") {

                buildAndReloadMeshes(reloadMeshTextureId);

            }


        }
    });

}




function buildAndReloadMeshes(p_brushId) {

    var reloadList = new Array();

    for (var i = 0; i < currentlyLoadedLevel.data.length; i++) {

        if (currentlyLoadedLevel.data[i].brushId == p_brushId) {

            reloadList.push(currentlyLoadedLevel.data[i]);
            for (var q = 0; q < gameObjects.length; q++) {

                if (gameObjects[q].data.id == currentlyLoadedLevel.data[i].id)
                    scene.remove(gameObjects[q]);

            }

        }
    }

    var tempLevel = new Object();
    tempLevel.data = reloadList;

    LoadTextures(tempLevel, addGamePiece, .5);
}





function cloneActiveObject(p_replaceActiveObject) {

    replaceActiveObject = p_replaceActiveObject;

    clearModal();

    activeBrush = new Object();
    activeBrush.id = "";// activeObject.data.brushId;

    if (activeObject.data.brushId != "brushdefault")
        activeBrush.id = activeObject.data.brushId;

 //   activeBrush.title = "untitled";
    activeBrush.mass = activeObject.data.mass;
    activeBrush.pointValue = activeObject.data.pointValue;
    
    activeBrush.sx = activeObject.data.sx;
    activeBrush.sy = activeObject.data.sy;
    activeBrush.sz = activeObject.data.sz;

    activeBrush.rx = activeObject.data.rx;
    activeBrush.ry = activeObject.data.ry;
    activeBrush.rz = activeObject.data.rz;

    /* set default images */
   // var path = "_assets/brushdefault/";
   // activeBrush.sourceImages = activeObject
    
    /*[

        path + "TOP IMAGE.jpg",
        path + "BOTTOM IMAGE.jpg",
        path + "FRONT IMAGE.jpg",
        path + "BACK IMAGE.jpg",
        path + "LEFT IMAGE.jpg",
        path + "RIGHT IMAGE.jpg"
    
    ];*/

   // trace("active object source images " + activeObject.data.sourceImages);

    /* clone image paths (server will copy these upon save to new assets directory) */
    if (activeObject.data.sourceImages != null ) {
        activeBrush.sourceImages = activeObject.data.sourceImages;
    }

    if (activeObject.data.brushId == "brushdefault" && activeObject.data.sourceImages.length == 0  )
        activeBrush.sourceImages = makeDefaultBrush().sourceImages;


    modal.innerHTML += "<h2>Bush Title:</h2>"
    modal.innerHTML += "<h2>";
    inputTitle = new UITextInput("Brush Title", "file-modal", "");
    modal.innerHTML += "</h2>";

    var save = new UIButton("NEXT", "file-modal", "verifySaveBrush");


    for (p in activeObject.data) {
        modal.innerHTML += "<br/>" + p.toString() + ": " + activeObject.data[p.valueOf()];
    }

    modal.innerHTML += "<br/><br/><br/><br/>";

}


function showImageUploader() {

    doShowUploader = false;
    clearModal();

    var prefix = "_assets\/levels\/" + document.getElementById("TITLE").value + "\/brushes\/" + activeBrush.id;

    activeBrush.prefix = prefix;

    var leftImage = new UIUploadButton("LEFT IMAGE", onImageComplete, prefix);
    var rightImage = new UIUploadButton("RIGHT IMAGE", onImageComplete, prefix);
    var topImage    = new UIUploadButton("TOP IMAGE", onImageComplete, prefix);
    var bottomImage = new UIUploadButton("BOTTOM IMAGE", onImageComplete, prefix);
    var frontImage  = new UIUploadButton("FRONT IMAGE", onImageComplete, prefix);
    var backImage   = new UIUploadButton("BACK IMAGE", onImageComplete, prefix);
  

    loadExistingImages();

    sizeModal(500);

}


function loadExistingImages() {

    if (activeBrush == null) return;

    var nocache = "?nocache=" + Math.round(Math.random() * 1000);

        document.getElementById("image-LEFT IMAGE").innerHTML = '<img border="1" width="50" height="50" src="' + SERVICE_PATH + activeBrush.sourceImages[0] + nocache + '"/>';

        document.getElementById("image-RIGHT IMAGE").innerHTML = '<img border="1" width="50" height="50" src="' + SERVICE_PATH + activeBrush.sourceImages[1] + nocache + '"/>';

        document.getElementById("image-TOP IMAGE").innerHTML = '<img border="1" width="50" height="50" src="' + SERVICE_PATH + activeBrush.sourceImages[2] + nocache + '"/>';

        document.getElementById("image-BOTTOM IMAGE").innerHTML = '<img border="1" width="50" height="50" src="' + SERVICE_PATH + activeBrush.sourceImages[3] + nocache + '"/>';

        document.getElementById("image-FRONT IMAGE").innerHTML = '<img border="1" width="50" height="50" src="' + SERVICE_PATH + activeBrush.sourceImages[4] + nocache + '"/>';

        document.getElementById("image-BACK IMAGE").innerHTML = '<img border="1" width="50" height="50" src="' + SERVICE_PATH + activeBrush.sourceImages[5] + nocache + '"/>';

}





function onImageComplete() {

    /* this is ugly I know */

    hideLoadingIndicator();

    var left = document.getElementById("LEFT IMAGE").value.toString();
    var right = document.getElementById("RIGHT IMAGE").value.toString();
    var top = document.getElementById("TOP IMAGE").value.toString();
    var bottom = document.getElementById("BOTTOM IMAGE").value.toString();  
    var front = document.getElementById("FRONT IMAGE").value.toString();
    var back = document.getElementById("BACK IMAGE").value.toString();


    if (left.length > 1) {
        activeBrush.sourceImages[0] = activeBrush.prefix + "/" + "LEFT IMAGE." + left.split(".")[1];
        document.getElementById("image-LEFT IMAGE").innerHTML = '<img border="1" width="50" height="50" src="' + SERVICE_PATH + activeBrush.sourceImages[0] + "?nocache="+Math.random() * 10000 + '"/>';
    }

    if (right.length > 1) {
        activeBrush.sourceImages[1] = activeBrush.prefix + "/" + "RIGHT IMAGE." + right.split(".")[1];
        document.getElementById("image-RIGHT IMAGE").innerHTML = '<img border="1" width="50" height="50" src="' + SERVICE_PATH + activeBrush.sourceImages[1] + "?nocache=" + Math.random() * 10000 + '"/>';
    }

    if (top.length > 1) {
        activeBrush.sourceImages[2] = activeBrush.prefix + "/" + "TOP IMAGE." + top.split(".")[1];
        document.getElementById("image-TOP IMAGE").innerHTML = '<img border="1" width="50" height="50" src="' + SERVICE_PATH + activeBrush.sourceImages[2] + "?nocache=" + Math.random() * 10000 + '"/>';
    }

    if (bottom.length > 1) {
        activeBrush.sourceImages[3] = activeBrush.prefix + "/" + "BOTTOM IMAGE." + bottom.split(".")[1];
        document.getElementById("image-BOTTOM IMAGE").innerHTML = '<img border="1" width="50" height="50" src="' + SERVICE_PATH + activeBrush.sourceImages[3] + "?nocache=" + Math.random() * 10000 + '"/>';
    }  

    if (front.length > 1) {
        activeBrush.sourceImages[4] = activeBrush.prefix + "/" + "FRONT IMAGE." + front.split(".")[1];
        document.getElementById("image-FRONT IMAGE").innerHTML = '<img border="1" width="50" height="50" src="' + SERVICE_PATH + activeBrush.sourceImages[4] + "?nocache=" + Math.random() * 10000 + '"/>';
    }

    if (back.length > 1) {
        activeBrush.sourceImages[5] = activeBrush.prefix + "/" + "BACK IMAGE." + back.split(".")[1];
        document.getElementById("image-BACK IMAGE").innerHTML = '<img border="1" width="50" height="50" src="' + SERVICE_PATH + activeBrush.sourceImages[5] + "?nocache=" + Math.random() * 10000 + '"/>';
    }

    verifySaveBrush();

    if (replaceActiveObject == true) {
        replaceActiveNow = true;
        
    } else {
        replaceActiveNow = false;
    }


}


function generateBrushlistGUI(  ){

    for( var i = 0; i <  brushArray.length; i++ ){

        var brush = brushArray[i];

        if( brush.title == "untitled" || brush.title == "" )
            brush.title = "untitled"+i;

        var brushUI = new UIBrushTab( brush.title, "brushtabs", i, onBrushSelect, onBrushEdit, onBrushRemove );

    }

}

function onBrushSelect() {

}

function onBrushEdit() {

}

function onBrushRemove() {

}





function addBrush() {

    alert("yo");

}





/* UI */



