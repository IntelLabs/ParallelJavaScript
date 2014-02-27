/*
* Copyright (C) 2011 Samsung Electronics Corporation. All rights reserved.
*
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided the following conditions
* are met:
*
* 1.  Redistributions of source code must retain the above copyright
*     notice, this list of conditions and the following disclaimer.
*
* 2.  Redistributions in binary form must reproduce the above copyright
*     notice, this list of conditions and the following disclaimer in the
*     documentation and/or other materials provided with the distribution.
*
* THIS SOFTWARE IS PROVIDED BY SAMSUNG ELECTRONICS CORPORATION AND ITS
* CONTRIBUTORS "AS IS", AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING
* BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
* FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL SAMSUNG
* ELECTRONICS CORPORATION OR ITS CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
* INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES(INCLUDING
* BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
* DATA, OR PROFITS, OR BUSINESS INTERRUPTION), HOWEVER CAUSED AND ON ANY THEORY
* OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT(INCLUDING
* NEGLIGENCE OR OTHERWISE ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
* EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

var WINW                = window.innerWidth;          // drawing canvas width
var WINH                = window.innerHeight;          // drawing canvas height

var NUM_VERTEX_COMPONENTS = 3;          // xyz, xyz, ...

var SAMPLEPERIOD        = 10;           // calculate fps and sim/draw times over this many frames
var DISPLAYPERIOD       = 400;          // msecs between display updates of fps and sim/draw times

var GLCL_SHARE_MODE     = false;        // shareMode is boolean
var PHASE_DELTA			= 0.01;         // per cycle change to phase

var NO_SIM              = 0;
var JS_SIM              = 1;
var CL_SIM              = 2;
var PJS_SIM             = 3;
var MAX_SIM             = PJS_SIM;

var intervalId1 = null;
var intervalId2 = null;
var intervalId3 = null;
var intervalId4 = null;

function UserData() {
    this.nVertices		= null;			// number of vertices
    this.nFlops			= 0;            // flop estimate per sim cycle

    this.initPos		= null;         // initial vertex positions
    this.initNor        = null;         // initial vertex normals (just needed for resetting)
    this.curPos         = null;         // current vertex positions
    this.curNor			= null;         // current vertex normals

    this.curPosVBO      = null;         // shared buffer between GL and CL
    this.curNorVBO      = null;         // shared buffer between GL and CL

    this.gl             = null;         // handle for GL context
    this.cl             = null;         // handle for CL context
    this.glLoaded		= false;        // indicates completion of geometry initialization
    this.clLoaded		= false;        // indicates completion of buffer initialization
    this.simMode        = NO_SIM;       // toggles between simulation modes
    this.fpsSampler     = null;         // FPS sampler
    this.simSampler     = null;         // Sim time sampler
    this.drawSampler    = null;         // Draw time sampler

    // simulation parameters
	this.frequency 		= 1.0;
	this.amplitude		= 0.35;
	this.phase			= 0.0;
	this.lacunarity		= 2.0;
	this.increment		= 1.5;
	this.octaves		= 5.5;
	this.roughness		= 0.025;
}

var userData = null;

function RANDM1TO1() { return Math.random() * 2 - 1; }
function RAND0TO1() { return Math.random(); }

function ResetSamplers(userData) {
    if(intervalId1) clearInterval(intervalId1);
    if(intervalId2) clearInterval(intervalId2);
    if(intervalId3) clearInterval(intervalId3);
    if(intervalId4) clearInterval(intervalId4);
    document.getElementById("fps").firstChild.nodeValue = "XX";
    document.getElementById("f1").firstChild.nodeValue = "TEXT:";
    document.getElementById("f2").firstChild.nodeValue = "XX";
    document.getElementById("sms").firstChild.nodeValue = "XX";
    document.getElementById("dms").firstChild.nodeValue = "XX";
    userData.fpsSampler = new FpsSampler(SAMPLEPERIOD, "fps");
    userData.simSampler = new MSecSampler(SAMPLEPERIOD, "sms");
    userData.drawSampler = new MSecSampler(SAMPLEPERIOD, "dms");
    intervalId1 = setInterval( function() { userData.fpsSampler.display(); }, DISPLAYPERIOD);
    intervalId2 = setInterval( function() { userData.simSampler.display(); }, DISPLAYPERIOD);
    intervalId3 = setInterval( function() { userData.drawSampler.display(); }, DISPLAYPERIOD);
    intervalId4 = setInterval( ShowFLOPS, 2*DISPLAYPERIOD);
}

function onLoad() {
    userData = new UserData();

    userData.gl  = InitGL();
    userData.cl  = InitCL();

    if(userData.cl === null)
        alert('WebCL is not supported in your browser!\nDisabling WebCL mode.');
    if(Array.prototype.mapPar === undefined)
        alert('Parallel JS is not supported in your browser!\nDisabling Parallel JS mode.');

    SetSimButton();

    setInterval( MainLoop, 0 );
    ResetSamplers(userData);
}

function ShowFLOPS() {
    var flops = 0;

    if(userData.simSampler.ms > 0)
    	flops = (userData.nFlops * 1000) / (userData.simSampler.ms);

    if(userData.simMode === NO_SIM || userData.simMode === CL_SIM || userData.simMode === PJS_SIM) {
        document.getElementById("f1").firstChild.nodeValue = "TEXT:";
        document.getElementById("f2").firstChild.nodeValue = "XX";
        return;
    }

    if(flops > 1000 * 1000 * 1000) {
        flops = Math.round(flops / (1000 * 1000 * 1000));
        document.getElementById("f1").firstChild.nodeValue = "GFLOPS:";
    }
    else {
        flops = Math.round(flops / (1000 * 1000));
        document.getElementById("f1").firstChild.nodeValue = "MFLOPS:";
    }
    document.getElementById("f2").firstChild.nodeValue = flops;
}

function MainLoop() {

	if(userData.glLoaded && !userData.clLoaded) {
		InitCLBuffers(userData.cl, userData.gl);
		userData.clLoaded = true;
	}

    userData.drawSampler.endFrame();    // started at beginning of previous Draw()
    userData.fpsSampler.markFrame();    // count a new frame

    userData.simSampler.startFrame();
    if(userData.simMode === JS_SIM) {
            SimulateJS();
    }
    else if(userData.simMode === CL_SIM && userData.clLoaded) {
    	SimulateCL(userData.cl);
    }
    else if(userData.simMode === PJS_SIM) {
        SimulatePJS();
    }
    userData.simSampler.endFrame();

    userData.drawSampler.startFrame();
    DrawGL(userData.gl);
    // end drawSampler when we re-enter MainLoop()
}

function ToggleSim() {
	userData.simMode += 1;
    if(userData.simMode === CL_SIM) {
        if(userData.cl === null)
            userData.simMode += 1;
    }
    if(userData.simMode === PJS_SIM) {
        if(Array.prototype.mapPar === undefined)
            userData.simMode += 1;
    }
    if(userData.simMode > MAX_SIM)
        userData.simMode = NO_SIM;
	SetSimButton();
    ResetSamplers(userData);
}

function SetSimButton() {
	var b1 = document.getElementById("b1");

    switch(userData.simMode) {
    case NO_SIM:
        ResetGeometry(userData.gl);
		b1.firstChild.nodeValue = "Toggle Sim Mode (now off)";
        break;
    case JS_SIM:
		b1.firstChild.nodeValue = "Toggle Sim Mode (now JS)";
        break;
    case CL_SIM:
        b1.firstChild.nodeValue = "Toggle Sim Mode (now CL)";
        break;
    case PJS_SIM:
        b1.firstChild.nodeValue = "Toggle Sim Mode (now Parallel JS)";
        break;
    }
}

