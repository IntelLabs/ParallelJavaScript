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
/// <reference path="../index.htm" />



/**

* CIRCULAR CAM CONTROL
*
* @author mrdoob / http://mrdoob.com/
* @author alteredq / http://alteredqualia.com/
* @author paulirish / http://paulirish.com/
* @authro vancefeldman / http://fashionbuddha.com/
*/

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




var automatedCamera = false;

CircularCamControls = function (object) {

    this.draggerWrapper = document.getElementById("dragger-wrapper");
    this.dragger = document.getElementById("dragger");

    this.object = object;
    this.target = new THREE.Vector3(0, 0, 0);

    var domElement;

    this.domElement = (domElement !== undefined) ? domElement : document;

    this.XMIN = .05; /* percent */
    this.XMAX = .85; /* percent */

    this.movementSpeed = 1.0;
    this.lookSpeed = 0.5;
    this.lookSpeedX = .001;

    this.noFly = false;
    this.lookVertical = true;
    this.autoForward = false;

    this.activeLook = true;

    this.heightSpeed = false;
    this.heightCoef = 1.0;
    this.heightMin = 0.0;

    this.constrainVertical = false;
    this.verticalMin = 0;
    this.verticalMax = Math.PI;

    this.autoSpeedFactor = 0.0;

    this.mouseX = 0;
    this.mouseY = 0;

    this.attenuationX = 1;
    this.attenuationXCenter = 1;

    this.lat = 0;
    this.lon = 0;
    this.phi = 0;
    this.theta = 0;

    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.freeze = false;
    this.lockTarget = false;

    // keyboard or transition sets these
    /*this.autoLeft = false;
    this.autoRight = false;
    this.autoUp = false;
    this.autoDown = false;*/


    this.mouseDragOn = false;
    this.downX = 0, this.downY = 0;

    this.targetLon = this.lon;

    var floorMaterial = new THREE.MeshLambertMaterial({
        color: 0xff0000
    });

    var geo = new THREE.CubeGeometry(1, 1, 50);

    this.thetaMesh = new THREE.Mesh(geo, floorMaterial);
    //    this.thetaMesh.translateZ(25);
    this.thetaMesh.position.y = 3;
    this.thetaMesh.rotation.x = .25;


    this.onResize = function () {

        if (this.domElement === document) {

            this.viewHalfX = window.innerWidth / 2;
            this.viewHalfY = window.innerHeight / 2;

        } else {

            this.viewHalfX = this.domElement.offsetWidth / 2;
            this.viewHalfY = this.domElement.offsetHeight / 2;
            this.domElement.setAttribute('tabindex', -1);

        }
    }


    this.onResize();

    
   

    this.onMouseDown = function (event) {

        userInterface.hideIntroCredits();

        if (this.domElement !== document) {
            this.domElement.focus();
        }

        event.preventDefault();
        event.stopPropagation();
        
        if (parseInt(this.mouseEvent.pageY) < 60)
            return;

        this.mouseDragOn = true;

        this.downX =  this.mouseX;
        this.downY = this.mouseY;

    };

    this.onMouseUp = function (event) {

        event.preventDefault();
        event.stopPropagation();
        this.mouseDragOn = false;

    };

    this.mouseEvent;
    this.onMouseMove = function (event) {
        
        this.mouseEvent = event;
    }

    // simple cursor update
    this.updateMouse = function () {

        if( this.mouseEvent )
            if (parseInt(this.mouseEvent.pageY) < 60)
                return;


        if (this.lockTarget == true )
            return;

        if (isDialog == true || isIntro == true || touchDrag == true )
            return;

        this.mouseX = this.mouseEvent.pageX - this.viewHalfX;
        this.mouseY = this.mouseEvent.pageY - this.viewHalfY;

        //console.log(this.mouseEvent.pageX + " " + this.mouseEvent.pageY);

        if (this.mouseEvent.pageY < 60)
            return;

       

        if (this.mouseDragOn /*&& touchDrag == false*/) {
            this.downX = this.mouseX;
            this.downY = this.mouseY;

            this.dx = this.mouseEvent.pageX - this.viewHalfX;
            this.dy = this.mouseEvent.pageY - this.viewHalfY;

            this.angle = Math.atan2(this.dx, this.dy);
           
            if (isChrome)
                return;
            
            document.getElementById("dragger-wrapper").style.opacity = 1;
            document.getElementById("dragger").style.opacity = 1;
            document.getElementById("dragger").setAttribute("style", "-moz-transform-origin:50% 50%;");
            document.getElementById("dragger").setAttribute("style", "-moz-transform:rotate(" + ((this.angle * (180/Math.PI) ) * -1 + 180 )  + "deg) ");

        }

    };

    

    this.camPhase = -3.4;
    this.time = 0;
    this.update = function (delta) {

        

        if (this.draggerWrapper.style.opacity > 0);
            this.draggerWrapper.style.opacity -= .05;
       

        this.draggerWrapper.style.left = this.viewHalfX + this.downX - 60;
        this.draggerWrapper.style.top = this.viewHalfY + this.downY -60;

        this.downX += -this.downX / 50;
        this.downY += -this.downY / 50;

        this.updateMouse();

        var centerScreenX = toScreenXY(this.thetaMesh.position, this.object).x;
        var actualMoveSpeed = 0;

        actualMoveSpeed = delta * this.movementSpeed;

        var halfWidth = SCREEN_WIDTH / 2;

        if (this.moveForward || (this.autoForward && !this.moveBackward))
            this.object.translateZ(-(actualMoveSpeed + this.autoSpeedFactor));

        if (this.moveBackward)
            this.object.translateZ(actualMoveSpeed);

        if (this.moveLeft || this.moveRight || touchDrag || isRight || isLeft || isUp || isDown) {

            var touchCenterRatio = .0041;
            if (touchDrag == true) {
                touchCenterRatio = .041;
            }

            var moveSpeed = Config.camera_speed + touchSpeed;

            // set the move speed for keyboard input
            if (isRight || isLeft || isUp || isDown) {
                moveSpeed = 3;
                touchSpeed = 2;
            }

            
            if (this.moveLeft || isLeft) {
                this.camPhase += .0065 * moveSpeed;
                this.lon += moveSpeed * .3;
            }

            if (this.moveRight || isRight) {

                this.camPhase -= .0065 * moveSpeed;
                this.lon -= moveSpeed * .3;
            }

        }


        if ( automatedCamera == true )
            if(centerScreenX < halfWidth - 1 || centerScreenX > halfWidth + 1)
                this.lon += (centerScreenX - halfWidth) * .0041;

           
        

        

        var verticalSpeed = .5;

        if (touchDrag == true)
            verticalSpeed = 1.5;

        if ((this.moveUp || isUp) && this.object.position.y < 150)
            this.object.position.y += (touchSpeed + Config.camera_speed ) /4;

        if (( this.moveDown || isDown ) && this.object.position.y > -15)
            this.object.position.y -= (touchSpeed + Config.camera_speed) / 4;

        var actualLookSpeed = delta * this.lookSpeed;

        if (!this.activeLook) {
            actualLookSpeed = 0;
        }

        var verticalLookRatio = 1;
        if (this.constrainVertical) {
            verticalLookRatio = Math.PI / (this.verticalMax - this.verticalMin);
        }

       
        if (!this.moveRight && !this.moveLeft && !this.freeze && !touchDrag && !isLeft && !isRight) {

            if (Math.abs(this.downX) < 100) {
                this.attenuationXCenter = Math.max(this.attenuationXCenter, this.attenuationXCenter * .97);
            } else {
                this.attenuationXCenter = Math.min(this.attenuationXCenter * 1.1, 1);
            }

           
            if (centerScreenX > SCREEN_WIDTH * this.XMIN && centerScreenX < SCREEN_WIDTH * this.XMAX) {
                this.lon += this.downX * this.lookSpeedX * this.attenuationXCenter;
                this.attenuationX = 1;
            } else if (this.downX < 0 && centerScreenX <= SCREEN_WIDTH * this.XMIN) {
                this.lon += this.downX * this.lookSpeedX * this.attenuationXCenter;
                this.attenuationX = 1;
            } else if (this.downX > 0 && centerScreenX >= SCREEN_WIDTH * this.XMAX) {
                this.lon += this.downX * this.lookSpeedX * this.attenuationXCenter;
            } else if (this.attenuationX != 0) {
                this.attenuationX = Math.max(0, this.attenuationX * .96);
                this.lon += this.downX * this.lookSpeedX * this.attenuationX;
            }
        }

        
        if (this.lookVertical && !this.freeze)
            this.lat -= this.downY * actualLookSpeed * verticalLookRatio;

        if (automatedCamera == true)
            this.lat += (0 - this.lat) * .25;


        this.lat = ( Math.max(-20, Math.min(20, this.lat)) * this.attenuationXCenter );
        this.phi = (90 - this.lat) * Math.PI / 180;

        this.theta = this.lon * Math.PI / 180;

        if (this.constrainVertical) {
            this.phi = THREE.Math.mapLinear(this.phi, 0, Math.PI, this.verticalMin, this.verticalMax);
        }

       
		var position = this.object.position;

        this.target.x = position.x + 100 * Math.sin(this.phi) * Math.cos(this.theta);
        this.target.y = position.y + 200 * Math.cos(this.phi-.05);
        this.target.z = position.z + 100 * Math.sin(this.phi) * Math.sin(this.theta);


        this.object.position.x = 175 * Math.cos(this.camPhase);
        this.object.position.z = 175 * Math.sin(this.camPhase);
        
        if (isIntro) {
            
           
            this.target.y = -135;
           /* this.lat = 0;
            this.phi = 0;
            this.target.x = 1;
            this.target.z = 1;
            this.downX = 0;
            this.downY = 0;
            this.mouseX = 0;
            this.mouseY = 0;
            this.camPhase = .1;*/
        } 
                

        var rotFromCenter = Math.atan2(this.object.position.x, this.object.position.z);

        this.thetaMesh.rotation.y = rotFromCenter;

        var rotationDiff = rotFromCenter - (-this.object.rotation.y);


        this.object.lookAt(this.target);
        this.time++;
    };

    /* TODO: get the actual div offsets */

    function toScreenXY(position, camera) {

        var pos = position.clone();
        projScreenMat = new THREE.Matrix4();
        projScreenMat.multiply(camera.projectionMatrix, camera.matrixWorldInverse);
        projScreenMat.multiplyVector3(pos);

        return { x: (pos.x + 1) * SCREEN_WIDTH / 2 + 0,
            y: (-pos.y + 1) * SCREEN_HEIGHT / 2 + 10
        };

    }


    this.domElement.addEventListener('contextmenu', function (event) { event.preventDefault(); }, false);

    this.domElement.addEventListener('mousemove', bind(this, this.onMouseMove), false);
    this.domElement.addEventListener('mousedown', bind(this, this.onMouseDown), false);
    this.domElement.addEventListener('mouseup', bind(this, this.onMouseUp), false);
    
    //$(document).bind("mousemove", this.onMouseMove, false);
    //document.addEventListener("mousemove", this.onMouseMove, false);

    function bind(scope, fn) {

        return function () {
            fn.apply(scope, arguments);
        };

    };




};
