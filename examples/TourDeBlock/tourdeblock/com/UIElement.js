/* VARIOUS UI ELEMENTS */



var PropertyList = new Array();
function getProperty(p_title) {

    for (var i = 0; i < PropertyList.length; i++) {

        if (PropertyList[i].id == p_title)
            return PropertyList[i];
    }
    return null;
}




UIToggle = function (p_title, p_dom_object_id, p_bool, p_trueCallback, p_falseCallback, p_color) {

    this.title = p_title;
    this.bool = p_bool;
    this.domObject = document.getElementById(p_dom_object_id);
    this.domObject.innerHTML += "<div class='ui-toggle' id='" + p_title + "' onclick='uiClick(\"" + p_title + "\")'>" + this.title + "</div>";
    this.element = document.getElementById(this.title);
    
    if( p_color )
        this.element.style.backgroundColor = p_color;

    this.id = p_title;
    this.trueCallback = p_trueCallback;
    this.falseCallback = p_falseCallback;

    if (this.bool == false)
        this.element.style.opacity = ".5";

    PropertyList.push(this);

};

UIToggle.prototype.domObject;
uiClick = function (id) {

    var ui = getProperty(id);
    var disElement = document.getElementById(id);

    ui.bool = !ui.bool;

    if (ui.bool == true) {
        disElement.style.opacity = "1";
        if (ui.trueCallback) ui.trueCallback();

    } else {
        disElement.style.opacity = ".5";
        if (ui.falseCallback) ui.falseCallback();
    }

}

UIToggle.prototype.uiOver = function (e) {
}

UIButton = function (p_title, p_dom_object_id, p_callback) {

    this.title = p_title;
    this.domObject = document.getElementById(p_dom_object_id);
    /*  adding the callback in here is a hack. Why can't the event handlers pick it up for buttons? */
    this.domObject.innerHTML += "<div class='ui-button' id='" + p_title + "' onMouseDown='"+p_callback.toString() +"();'>" + p_title + "</div>";
    this.element = document.getElementById(p_title);

    document.getElementById(p_title).addEventListener("mousedown", this.uiClick);
}

UIButton.prototype.uiClick = function (e) {

}



UITextInput = function (p_label, p_dom_object_id, p_default) {
    this.title = p_label;
    this.inputValue = p_default;
    this.domObject = document.getElementById(p_dom_object_id);
    this.domObject.innerHTML += "<input type='text' class='ui-text-input' id='" + p_label + "' value='" + this.inputValue + "'/>";
}

UIDivider = function (p_dom_object_id) {
    this.domObject = document.getElementById(p_dom_object_id);
    this.domObject.innerHTML += "&nbsp;<div class='ui-divider'>|</div>&nbsp;";
}



UINewBrush = function (p_title, p_dom_object_id,p_callback) {

    this.title = p_title;
    this.domObject = document.getElementById(p_dom_object_id);
    this.domObject.innerHTML += "<div class='ui-button' id='" + p_title + "' onMouseDown='" + p_callback + "();' style='display:inline-block;'>" + p_title + "<br/><br/><br/><br/></div>";

    this.domObject.innerHTML += "<div id='brushtabs' style='display:inline-block;'></div> ";


    this.element = document.getElementById(p_title);
}

UIUploadButton = function (p_title, p_callback , directory ) {

    this.title = p_title;

    modal.innerHTML += '<div style="display:inline-block;border:2px;border-color:#fcfcfc;padding:5px;"><h3>' + p_title + '</h3><div id="image-' + p_title + '" style="display:inline-block"></div><form id="uploadForm" enctype="multipart/form-data" method="post"><input type="hidden" name="directory" value="' + directory + '"/> <input type="hidden" name="filename" value="' + p_title + '"/><input id="' + p_title + '" type="file" value="' + p_title + '" name="file" onchange="uploadImage(this.form,onImageComplete)"/> </form><div id="upload_area" style="display:inline-block;border:1px;"></div></div>';

}


UIBrushTab = function (p_title, p_dom_object_id, p_index, p_selectCallback, p_editCallback, p_deleteCallback) {

    var data = brushArray[p_index];

    var imgString = '<img width="60" height="60" src="../../' + data.sourceImages[4] + '" /><br/>';
    var htmlString = '<div id="brush-' + p_title + '" style="display:inline-block;border:2px;border-color:#fcfcfc;padding:5px;color:0xffffff">' + imgString + p_title + '</div>';


    document.getElementById(p_dom_object_id).innerHTML += htmlString;
}





var clearModalCallback = "";
function clearModal() {
    modal.innerHTML = "<div class='clickable' id='close-modal' onclick='hideModal();'>X</div>";
}

function showModal() {
    isDialog = true;
    clearModal();
    var modal = document.getElementById("file-modal");
    modal.style.display = "inherit";
}

function hideModal() {
    var modal = document.getElementById("file-modal");
    modal.style.display = "none";
    isDialog = false;
}

function sizeModal( height ) {
    modal.style.height = height + "px";
}



function showLoadingIndicator() {

    document.getElementById("loading-indicator").style.display = "inherit";
}

function hideLoadingIndicator() {

    document.getElementById("loading-indicator").style.display = "none";

}


var UILoader = function (p_dom_id) {

    this.domId = p_dom_id;
    this.tempId = Math.round(Math.random() * 1000000);
    this.element = document.getElementById(p_dom_id);
    this.element.innerHTML = "<div class='instance-loader' id='" + this.tempId + "'><img src='../resources/loading.gif'/></div>";


    this.hide = function () {
        var parent = document.getElementById(this.domId);
        var child = document.getElementById(this.tempId);
        parent.removeChild(child);
    }

}

