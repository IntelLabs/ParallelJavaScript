/* NOTE: since these are global namespace, do not use in CPU intensive loops */

function gup(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.href);
    if (results == null)
        return "";
    else
        return results[1];
}




function degToRad(deg) {
    return deg * (Math.PI / 180);
}

function radToDeg(rad) {
    return rad * (180 / Math.PI);
}


function trace(p_name) {
    if (!TRACE)
        return;

    if (window.console)
        console.log(p_name);
}

var debugArgs = new Array();
function debug(p_name, p_value) {

    if (!DEBUG)
        return;

    var debugItem = new Object();
    debugItem.name = p_name;
    debugItem.value = p_value;

    debugArgs.push(debugItem);
}

function updateDebug() {

    var d = document.getElementById("debug");
    d.innerHTML = "";

    for (var i = 0; i < debugArgs.length; i++) {

        try {
            d.innerHTML += "<br/>" + debugArgs[i].name + " = " + JSON.stringify(debugArgs[i].value, "data", "\t");
        } catch (err) {
            d.innerHTML += "<br/>" + debugArgs[i].name + " = " + debugArgs[i].value;
        }
    }
    debugArgs = new Array();
}



function createCookie(name,value,days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";
}




// extend strings with the method "contains"
String.prototype.contains = function (str) { return this.indexOf(str) != -1; };

// profanities of choice
var profanities = new Array("fuck", "nigger", "bitch","poop", "shit", "turd","chink","sucks","intel","penis", "vagina", "ass", "cunt", "pope", "tits","puke","spew","barf","shiiit","shiit");

var containsProfanity = function (text) {
    var returnVal = false;
    for (var i = 0; i < profanities.length; i++) {
        if (text.toLowerCase().contains(profanities[i].toLowerCase())) {
            returnVal = true;
            break;
        }
    }
    return returnVal;
}

