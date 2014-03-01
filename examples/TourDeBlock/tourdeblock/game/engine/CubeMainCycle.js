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
Ported to Parallel JavaScript by Stephan Herhut.

Copyright (c) 2013, Intel Corporation
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



//var CubeList;


function ConvertCubesToArrays() {
    alert("NOO");
    CubeList = new Object();
    // speficy type as normal to get a normal array, otherwise data is parallel
    
    /*
    var useNormalArray = false;
    if (type == "normal")
        useNormalArray = true;*/


    // grab a parray for values used in CollisionDetection
    CubeList._m_e = GeneratePArray(g_cubes, "m_e", true);               // normal
    CubeList._m_u = GeneratePArray(g_cubes, "m_u", true);               // normal array
    CubeList._m_c = GeneratePArray(g_cubes, "m_c", true);               // normal array
    CubeList._m_rot = GeneratePArray(g_cubes, "m_rot", true);           // normal array
    CubeList._m_radius = GeneratePArray(g_cubes, "m_radius", true);     // normal
    CubeList._m_matWorld = GeneratePArray(g_cubes, "m_matWorld", true); //normal 

    CubeList._m_penHistory = GeneratePArray(g_cubes, "m_penHistory", true);

    // can be parallel arrays
    CubeList._m_linVelocity = GeneratePArray(g_cubes, "m_linVelocity", true); // parallel 
    CubeList._m_angVelocity = GeneratePArray(g_cubes, "m_angVelocity", true); // parallel 

	//Temporary Regular Arrays
	CubeList._m_linVelocityTemp = GeneratePArray(g_cubes, "m_linVelocity", true); // normal array 
    CubeList._m_angVelocityTemp = GeneratePArray(g_cubes, "m_angVelocity", true); // normal array
    CubeList._m_velocityUpdate = new Array(g_cubes.length);

    // grab all other values
    CubeList._m_mass = GeneratePArray(g_cubes, "m_mass", true);   // normal array
    CubeList._m_boxInertia = GeneratePArray(g_cubes, "m_boxInertia", true);  //normal array
    CubeList._m_invInertia = GeneratePArray(g_cubes, "m_invInertia", true); // normal 
    CubeList._m_forces = GeneratePArray(g_cubes, "m_forces", true);   // normal array
    CubeList._m_torques = GeneratePArray(g_cubes, "m_torques", true); // normal array
    CubeList._m_rwaMotion = GeneratePArray(g_cubes, "m_rwaMotion", true); //normal
    CubeList._m_awake = GeneratePArray(g_cubes, "m_awake", true); //normal
    CubeList.m_velocityAverage = GeneratePArray(g_cubes, "m_velocityAverage", true); //normal

    // Set the default new velocities
    CubeList._m_newLinVel = [];
    CubeList._m_newAngVel = [];

    for (var i = 0; i < g_numCubes; i++) {
        CubeList._m_newLinVel[i] = [0, 0, 0];
        CubeList._m_newAngVel[i] = [0, 0, 0];      
    }
   

    // workaround to do the intial setting of matrices one arrays are defined
    for (var i = 0; i < g_cubes.length; i++) {

        if (g_cubes[i].needsMatrixUpdate == true)
            UpdateMatrix(i);

        g_cubes[i].needsMatrixUpdate = false;
    }


}


function UseParallelVelocities() {
    //assumes we already converted to arrays

    CubeList._m_linVelocity = new ParallelArray(CubeList._m_linVelocity);
    CubeList._m_angVelocity = new ParallelArray(CubeList._m_angVelocity);

}

function UseNormalVelocities() {
    //assumes we already converted to arrays
	
    var convertedLinVelocity = new Array();
    var convertedAngVelocity = new Array();

    for (var i = 0; i < g_cubes.length; i++) {

        convertedLinVelocity.push(CubeList._m_linVelocity[i]);
        convertedAngVelocity.push(CubeList._m_angVelocity[i]);
    }

	CubeList._m_linVelocity = convertedLinVelocity;
	CubeList._m_angVelocity = convertedAngVelocity;
}





function ConvertArraysIntoCubes() {
    alert("NoNoNo");

    for (var i = 0; i < g_numCubes; i++) {

        var cube = new Cube([0, 0, 0], [0, 0, 0], [1, 1, 1], 1);

        cube.m_e = CubeList._m_e[i];
        cube.m_u = CubeList._m_u[i];
        cube.m_c = CubeList._m_c[i];
        cube.m_radius = CubeList._m_radius[i];
        cube.m_matWorld = CubeList._m_matWorld[i];
        cube.m_mass = CubeList._m_mass[i];
        cube.m_boxIntertia = CubeList._m_boxInertia[i];
        cube.m_linVelocity = CubeList._m_linVelocity[i];
        cube.m_angVelocity = CubeList._m_angVelocity[i];
        cube.m_penHistory = CubeList._m_penHistory[i];
        cube.m_forces = CubeList._m_forces[i];
        cube.m_torques = CubeList._m_torques[i];
        cube.m_rwaMotion = CubeList._m_rwaMotion[i];
        cube.m_awake = CubeList._m_awake[i];
		cube.m_invInertia = CubeList.m_invInertia[i];
        g_cubes[i] = cube;
        g_numCubes++;
    }

}



function GeneratePArray(globalArray, property, useNormalArray ) {

    // Generate an array from a property of a global array, g_cubes or g_CollisionsArray

    var i;
    var j;
    var unitArray = new Array();   //new Float32Array(globalArray.length)
    
    for (i = 0; i < globalArray.length; i++) {
        unitArray[i] = globalArray[i][property];
    }

    if (useNormalArray == true) 
        return unitArray;
    else 
        return new ParallelArray(unitArray);

}



/***************************************************************************/

// Globals
var g_timeStep          = 0.05;			// Timing
var g_paused            = false;
var g_singleStep        = false;
var g_totalTime         = 0.0;
var g_wireView          = false;
var g_friction          = .9;
var g_gravity           = -9.8;

var g_numCubes          = 0;
var g_positionCorrection = true;  // Sinking fix!
var	g_numIterations = 4;

OBBEngine = function () {
    g_numCubes = 0;
    // CREATE AN INSTANCE OF THE ENGINE!
}







stPoint = function()
{
	/*D3DXVECTOR3*/ this.point = [0,0,0];
	/*D3DXVECTOR3*/ this.normal =  [0,0,0];
	/*float*/		this.pen = 0;
	/*D3DXVECTOR3*/ this.pos0 =  [0,0,0];
	/*D3DXVECTOR3*/ this.pos1 =  [0,0,0];
};

// Collision information
stCollisionPoints =  function()
{
	/*Cube**/       this.box0 = null; //new Cube();  // <----------- TODO : define the intial state/rotation of the cube
	/*Cube**/       this.box1 = null; //new Cube();
	/*stPoint*/     this.points = []; // will contain stPoint objects
	/*int*/         this.numPoints = 0;
};


stCollisions = function()
{
    // INSTANTIATE A Collisions Object
}

stCollisions.prototype.Clear = function ()
{
	g_numCols = 0;
}

// add collision objects to master list
stCollisions.prototype.Add = function (
/*Cube Index*/box0,
/*Cube Index*/box1,
/*vec3*/point,
/*vec3*/normal,
/*float*/pen) {
    // First we determine if we have any collisions between these two
    // rigid bodies and store them in that array...so we can group
    // rigid body collisions....very useful in the long run


    /*stCollisionPoints*/var cp = null;                                    

    for (var i = 0; i < g_numCols; i++) {
        if (g_CollisionsArray[i].box0 == box0 &&
			g_CollisionsArray[i].box1 == box1) {
            cp = g_CollisionsArray[i];                                      
            break;
        }
    }

    // We've not found one, hence add it to our list, with the data
    // and return
    if (cp == null) {
        g_CollisionsArray[g_numCols] = new Object();                        
        g_CollisionsArray[g_numCols].box0 = box0;
        g_CollisionsArray[g_numCols].box1 = box1;
        g_CollisionsArray[g_numCols].numPoints = 1;
        g_CollisionsArray[g_numCols].points = new Array();
        g_CollisionsArray[g_numCols].points[0] = new Object();
        g_CollisionsArray[g_numCols].points[0].normal = normal;
        g_CollisionsArray[g_numCols].points[0].point = point;
        g_CollisionsArray[g_numCols].points[0].pos0 = g_cubes[box0].m_c;
        g_CollisionsArray[g_numCols].points[0].pos1 = g_cubes[box1].m_c;
        g_CollisionsArray[g_numCols].points[0].pen = pen;


        

        g_numCols++;
        return;
    }


    // Multiple collision points between a single rigid body, so add
    // it to our array
    cp.points[cp.numPoints] = new Object();
    cp.points[cp.numPoints].normal = normal; 
    cp.points[cp.numPoints].point = point;
    cp.points[cp.numPoints].pos0 = g_cubes[box0].m_c;
    cp.points[cp.numPoints].pos1 = g_cubes[box1].m_c;
    cp.points[cp.numPoints].pen = pen;

    cp.numPoints++;

}

var g_CollisionsArray = new Array(); //[100];
var g_numCols = 0;

var g_Collisions = new stCollisions(); // Single list of all the collisions are stored in this variable

/* not used, see main game app */
OBBEngine.prototype.CreateCubeSetup = function (  config )
{
	g_Collisions.Clear();
}


OBBEngine.prototype.UpdateTiming = function (delay) {
    g_timeStep = delay;    
}



var totalSeqHits;
OBBEngine.prototype.CollisionDetection = function () {

    g_Collisions.Clear();

    totalSeqHits = 0;

    // Check Cube-Cube Collisions
    for (var i = 0; i < g_numCubes; i++) {
        for (var j = 0; j < g_numCubes; j++) {
            if (j > i) {

                var hitResult = CubeCubeCollisionCheck_PJS([i, j]);

                var hitBox = hitResult[0];
                var hitPoints = hitResult[1];
                var numHitPoints = hitResult[2];
                var penetration = hitResult[3];
                var hitNormalBox = hitResult[4];

                if (hitBox) {
                    for (var k = 0; k < numHitPoints; k++) {
                        g_Collisions.Add(i, j, hitPoints[k], hitNormalBox, penetration);
                        totalSeqHits++;
                    }
                }
            }
        }
    }

 

}

OBBEngine.prototype.CollisionDetection_PJS = function () {

    g_Collisions.Clear();

    totalSeqHits = 0;

    if (cube_indices_base !== g_numCubes) {
        cube_indices = [];
        for (var i = 0; i < g_numCubes; ++i) {
            for (var j = i+1; j < g_numCubes; ++j) {
                cube_indices.push([i, j]);
            }
        }
        cube_indices_base = g_numCubes;
    }
    hitResult = cube_indices.mapPar(CubeCubeCollisionCheck_PJS);
    for (var p = 0; p < cube_indices.length; p++) {
        var hitBox = hitResult[p][0];
        if(hitBox !== 0) {
            var i = cube_indices[p][0];
            var j = cube_indices[p][1];
            var hitPoints = hitResult[p][1];
            var numHitPoints = hitResult[p][2];
            var penetration = hitResult[p][3];
            var hitNormalBox = hitResult[p][4];
            for (var k = 0; k < numHitPoints; k++) {
                g_Collisions.Add(i, j, hitPoints[k], hitNormalBox, penetration);
                totalSeqHits++;
            }

            
        }
       
        /*
        if (collisionResult[p] && collisionResult[p][0] > 0 && collisionResult[p][0] < 1 ) { 
            hitting_pairs.push([cube_indices[p], collisionResult[p][0], collisionResult[p][1]]);
        }
        */
    }
}



var collisionResult,pairsResult;
var flatten3 = function (arr) {
    var out = new Array();
    var len = arr.length;
    for (var i = 0; i < len; i++) {
        for (var j = 0; j < 3; j++) {
            out.push(arr[i][j]);
        }
    }
    return out;
}

var flatten3_3 = function (arr) {
    var out = new Array();
    var len = arr.length;
    for (var i = 0; i < len; i++) {
        for (var j = 0; j < 8; j++) {
            for (var k = 0; k < 3; k++) {
                out.push(arr[i][j][k]);
            }
        }
    }
    return out;
}

var flatten16 = function(arr)
{
    var out = new Array();
    var len = arr.length
    for (var i = 0; i < len; i++) {
        for (var j = 0; j < 16; j++) {
            out.push(arr[i][j]);
        }
    }
    return out;
}


var num_recompilations = 0, num_collision_checks = 0, first_ocl_run = false, tri_index = [], tri_idx = 0, collision_time = 0;
var pa_size = 150; // Too low and we'll trigger recompilation, too high and we're inefficient.
var num_hits = 0, num_hits_accumulator =[];
var cube_indices = [];
var cube_indices_base = 0;
var hitting_pairs;
var normals;
OBBEngine.prototype.CollisionDetectionInitOCL = function () {
    
        g_Collisions.Clear();
        num_collision_checks++;
        if(cube_indices_base == 0) {
            var len = g_numCubes*g_numCubes;
            cube_indices_base = new Array(g_numCubes*g_numCubes);
            //for(var i = 0; i < len; i++) {
            //    cube_indices_base[i] = i;
            //}
        }

        //collisionResult_array = new ParallelArray([g_numCubes, g_numCubes], CubeCubeHitOCL, CubeList._m_e, CubeList._m_u, CubeList._m_c, CubeList._m_radius, CubeList._m_matWorld);
        var collisionResult_array = cube_indices_base.mapPar(CubeCubeHitOCL);
        num_hits = 0;
        hitting_pairs = new Array();
        normals = new Array();

        // Materialize the PA for faster accesses
        //collisionResult.materialize();
        //var collisionResult_array = collisionResult.data;
        var j = 0;
        for (i = 0; i < g_numCubes; i++) {
            for (j = i + 1; j < g_numCubes; j++) {
                if (Math.abs(collisionResult_array[i * g_numCubes * 4 + j * 4 + 0]) > 0) {

                    var nh2 = num_hits * 2;
                    var nh4 = nh2 * 2;
                    hitting_pairs[nh2] = i;
                    hitting_pairs[nh2 + 1] = j;

                    /* Do manual common subexpression elimination here */
                    normals[nh4] = collisionResult_array[i * g_numCubes * 4 + j * 4];
                    normals[nh4 + 1] = collisionResult_array[i * g_numCubes * 4 + j * 4 + 1];
                    normals[nh4 + 2] = collisionResult_array[i * g_numCubes * 4 + j * 4 + 2];
                    normals[nh4 + 3] = collisionResult_array[i * g_numCubes * 4 + j * 4 + 3];
                    num_hits++;

                }
            }
        }
        /*
        if (num_hits === 0)
            return;
        if (num_hits > pa_size) {
            pa_size *= 2;
            num_recompilations++;
            console.log( "RECOMPILATIONS : " + num_recompilations);
        }

        var pa2 = pa_size * 2;
        var pa4 = pa_size * 4;
        for (i = num_hits * 2; i < pa2; i++) {
            hitting_pairs[i] = 0;
        }
        for (i = num_hits * 4; i < pa4; i++) {
            normals[i] = 0;
        }
        */
        //pairsResult = new ParallelArray(pa_size, CubeCubePairsOCL_opt2, CubeList._m_e, CubeList._m_u, CubeList._m_c, CubeList._m_radius, CubeList._m_matWorld, hitting_pairs, normals, num_hits);
        var hitArray = new Array(num_hits);
        pairsResult = hitArray.mapPar(CubeCubePairsOCL_opt3); 

        // pairsResult is a [num_hits x 8 x 3] shaped parallel array
        var pairsResult_array = pairsResult.data;
        var x24 = 0; var k3 = 0;
        var x2 = 0; var x4 = 0;
        for (x = 0; x < num_hits; x++) {
            x24 = x * 24;
            x2 = x * 2; x4 = x * 4;
            for (var k = 0; k < 8; k++) {
                k3 = k * 3;
                if (Math.abs(pairsResult_array[x24 + k3] + pairsResult_array[x24 + k3 + 1] + pairsResult_array[x24 + k3 + 2]) > 0) {
                    i = hitting_pairs[x2];
                    j = hitting_pairs[x2 + 1];
                    if (j > i)
                        g_Collisions.Add(i, j, [pairsResult_array[x24 + k3], pairsResult_array[x24 + k3 + 1], pairsResult_array[x24 + k3 + 2]], vec3_scale(-1, [normals[x4 + 1], normals[x4 + 2], normals[x4 + 3]]), normals[x4]);
                }
            }
        }
        
        num_hits_accumulator.push(num_hits);

        if (num_hits_accumulator.length > 9)
            num_hits_accumulator.shift();

}//end initTriCollision




OBBEngine.prototype.CollisionDetectionInitOCL_PJS = function () {
        // build a set of pairs to check
        if (cube_indices_base !== g_numCubes) {
            cube_indices = [];
            for (var i = 0; i < g_numCubes; ++i) {
                for (var j = i+1; j < g_numCubes; ++j) {
                    cube_indices.push([i, j]);
                }
            }
            cube_indices_base = g_numCubes;
        }
    
        g_Collisions.Clear();
        num_collision_checks++;
       
        //collisionResult = new ParallelArray([g_numCubes, g_numCubes], CubeCubeHitOCL, CubeList._m_e, CubeList._m_u, CubeList._m_c, CubeList._m_radius, CubeList._m_matWorld);
        collisionResult = cube_indices.mapPar(CubeCubeHitPJS);

        var hitting_pairs = new Array();
        for (var p = 0; p < cube_indices.length; ++p) {
            if (collisionResult[p] && collisionResult[p][0] > 0 && collisionResult[p][0] < 1 ) { 
                hitting_pairs.push([cube_indices[p], collisionResult[p][0], collisionResult[p][1]]);
            }
        }

        if (hitting_pairs.length === 0)
            return;

        var pairsResult = hitting_pairs.mapPar(CubeCubePairsPJS); //new ParallelArray(pa_size, CubeCubePairsOCL_opt2, CubeList._m_e, CubeList._m_u, CubeList._m_c, CubeList._m_radius, CubeList._m_matWorld, hitting_pairs, normals, num_hits);

        for (var x = 0; x < pairsResult.length; x++) {
            var current = pairsResult[x];
            if (current) {
                var i = hitting_pairs[x][0][0];
                var j = hitting_pairs[x][0][1];
                for (var k = 0; k < current.length; k++) {
                    if(0/*current[k][2] == undefined*/) {
                        console.log("Here");
                    } else {
                        g_Collisions.Add(i, j, current[k][1], vec3_scale(-1, current[k][2]), current[k][3]);
                        //g_Collisions.Add(i, j, current[k], vec3_scale(-1, hitting_pairs[x][1]), hitting_pairs[x][2]);
                    }
                    num_hits++;
                }
            }
        }
        
        num_hits_accumulator.push(num_hits);

        if (num_hits_accumulator.length > 9)
            num_hits_accumulator.shift();

}//end initTriCollision





/***************************************************************************/


OBBEngine.prototype.ApplyImpulses = function (/*float*/dt) {

    // CAN WE SORT BY Y POSITION to approximate level?
    for (var i = 0; i < g_numCols; i++) {
        var cp = g_CollisionsArray[i];                    

        var box0 = cp.box0;
        var box1 = cp.box1;
        var numPoints = cp.numPoints;

        for (var k = 0; k < numPoints; k++) {

            var hitPoint = cp.points[k].point;
            var normal = cp.points[k].normal;
            var penDepth = cp.points[k].pen;
           
            AddCollisionImpulse(            box0,
										    box1,
										    hitPoint,
										    normal,
										    dt,
										    penDepth);
        }
       
    }
}



OBBEngine.prototype.UpdateSleepingObjects = function () {
    // For an object to remain sleeping, it must be in collision with another
    // sleeping object or infinite mass object
    // or its energy/motion is less than a certain threshold


    for (var k = 0; k < g_numCubes; k++) {
        // Check its hitting another object
        var sleepingCollision = false;
        for (var i = 0; i < g_numCols; i++) {
            var cp = g_CollisionsArray[i];

            var box0 = cp.box0;
            var box1 = cp.box1;

            var sleepCube = k;
            var otherCube = null;

            if (sleepCube == box0) otherCube = box1;
            if (sleepCube == box1) otherCube = box0;

            if (otherCube != null) {
                if (!g_cubes[otherCube].m_awake == 1 || g_cubes[otherCube].m_mass > 9999) {
                    sleepingCollision = (sleepingCollision | true);
                }
            }
        }

        var cube = g_cubes[k];

        if (!sleepingCollision) {
            cube.m_rwaMotion = 2 * g_sleepEpsilon;
            cube.m_awake = 1; //true;
        }

        // Check its energy/motion
        if (cube.m_rwaMotion < g_sleepEpsilon && cube.m_awake == 1) {
            cube.m_awake = 0; //false;
            cube.m_linVelocity = [0, 0, 0];
            cube.m_angVelocity = [0, 0, 0];
        }
        else if (cube.m_rwaMotion > 10 * g_sleepEpsilon) {
            cube.m_rwaMotion = 10 * g_sleepEpsilon;
            cube.m_awake = 1; //true;
        }

        // Check if a cube in collision with our sleeping cube
        // has enough energy to wake it up
        for (var i = 0; i < g_numCols; i++) {
            cp = g_CollisionsArray[i];

            var box0 = cp.box0;
            var box1 = cp.box1;

            var sleepCube = k;
            var otherCube = null;

            if (sleepCube == box0) otherCube = box1;
            if (sleepCube == box1) otherCube = box0;

            if (otherCube && g_cubes[otherCube].m_mass < 10000) {
                if (g_cubes[otherCube].m_rwaMotion > (2 * g_sleepEpsilon)) {
                    cube.m_awake = 1;
                    cube.m_rwaMotion = 2 * g_sleepEpsilon;
                }

            }
        }

    }

    
}

OBBEngine.prototype.Step = function (dt) {
    // I found checking for sleeping object first, as it works better
    // if the objects start in sleeping mode...wake up correctly when
    // needed.

    //dt = .015;

   

    // Integrate Forces
    if (!IMPULSE_OCL) {
        integrateNewVelocity();
        this.UpdateSleepingObjects();
        for (var i = 0; i < g_numCubes; i++) {
            g_cubes[i].UpdateVel(dt, i);
        }

    } else {

        CubeList._m_angVelocity = CubeList._m_angVelocity.combine(integrateNewVelocityOCL, CubeList._m_newAngVel, CubeList._m_angVelocity);
        CubeList._m_linVelocity = CubeList._m_linVelocity.combine(integrateNewVelocityOCL, CubeList._m_newLinVel, CubeList._m_linVelocity);

        this.UpdateSleepingObjects();
        CubeList._m_angVelocity = CubeList._m_angVelocity.combine(clearVelocityKernel, CubeList._m_awake);
        CubeList._m_linVelocity = CubeList._m_linVelocity.combine(clearVelocityKernel, CubeList._m_awake);
        CubeList._m_angVelocity = CubeList._m_angVelocity.combine(1, UpdateAngVelKernel,
			CubeList._m_mass,
			CubeList._m_awake,
			CubeList._m_torques,
			CubeList._m_invInertia,
			CubeList._m_angVelocity,
			dt);
        CubeList._m_linVelocity = CubeList._m_linVelocity.combine(1, UpdateLinVelKernel,
			CubeList._m_mass,
			CubeList._m_awake,
			CubeList._m_torques,
			CubeList._m_invInertia,
			CubeList._m_linVelocity,
			dt,
            g_gravity);
			var linVel = CubeList._m_linVelocity.getArray();
			var angVel = CubeList._m_angVelocity.getArray();
        for (var i = 0; i < g_numCubes; i++) {
            UpdateKinetics(dt, i,linVel[i],angVel[i]);
        }
        CubeList._m_angVelocity = CubeList._m_angVelocity.combine(clearVelocityKernel, CubeList._m_awake);
        CubeList._m_linVelocity = CubeList._m_linVelocity.combine(clearVelocityKernel, CubeList._m_awake);

    }

    for(var i=0;i<g_numCubes;i++)
    {
    	g_cubes[i].m_velocityUpdate=0;
    }

    // Update a few times to take into account stacking and multiple
    // contact points - applys impulse to each contact point on the cube
    for (var i = 0; i < g_numIterations; i++) {
        if (!IMPULSE_OCL) {
            this.ApplyImpulses(dt );
        } else {
            this.ApplyImpulsesOCL(dt / g_numIterations);
            
        }
    }


    // Finally update the new position of our cube
    if(IMPULSE_OCL){
    	g_cubes[0].UpdatePosOCLWithKernels(dt);
    } else {
    	for (var i = 0; i < g_numCubes; i++) {
        	if (!IMPULSE_OCL) {
            	g_cubes[i].UpdatePos(dt, i);
        	} else {
            	g_cubes[i].UpdatePosOCL(dt, i);
        	}
    	}
	}
}


/***************************************************************************/
/*                                                                         */
/* Update()                                                                */
/* Our main render loop, which gets called over and over agian to do our   */
/* drawing...clears the screen, draws the data, then presents it..         */
/*                                                                         */
/***************************************************************************/
OBBEngine.prototype.Update = function (timingDelay) {


    this.UpdateTiming(timingDelay);


    var doSingleStep = false;
    if (!g_paused || g_singleStep) {
        doSingleStep = true;
        g_singleStep = false;
    }

    var timeScale = 1.0;
    var overlapTime = 0.0;
    var timeStepFrame = 1.0 / 100.0; // (100Hz)


    var dt = g_timeStep * timeScale;


    var totalTime = dt + overlapTime;

    if (totalTime > 0.1)                            //< -------------- note the clamping here
    {
        // ERROR.. TimeStep greater than 0.1f!.. Clamp our
        // timestep to 0.1f!
        totalTime = 0.1;
    }

    // Split the timestep into fixed size chunks
    var numLoops = (totalTime / timeStepFrame);
    var timeStep = timeStepFrame;
    overlapTime = totalTime - numLoops * timeStep;

    // If its single step, just step at 0.01ms per timestep
    if (g_paused && doSingleStep) {
        numLoops = 1;
        timeStep = timeStepFrame;
    }

    if (doSingleStep)
        for (var i = 0; i < numLoops; ++i) {
            g_totalTime += timeStep;

            // Collision Detection
            if (COLLISION_OCL) {

                //this.CollisionDetectionInitOCL();
                this.CollisionDetection_PJS();

            } else if (TEST_COLLISION) {

                this.CollisionDetectionTestOCL();

            } else {
                
                this.CollisionDetection();
            }

            //    DebugDrawCollisionPoints();

            // Run Physics Steps
            this.Step(timingDelay);
        }
}          


