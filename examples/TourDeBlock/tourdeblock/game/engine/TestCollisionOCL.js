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


/***************************************************************************/
var normalMeshes = new Array();
function GetNumHitPointsOCLTEST(m_e,
                                        m_matWorld,
                                        hitNormal,
                                        penetration) {

    var defaultReturn = [
                            [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], //numverts
                            [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], //verts
                            [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]  //vertsIndices
                        ];




    var x = m_e[0];
    var y = m_e[1];
    var z = m_e[2];
    var Vertex =
	[
    	[-x, y, -z],
		[x, y, -z],
		[x, y, z],
		[-x, y, z],

		[-x, -y, -z],
		[x, -y, -z],
		[x, -y, z],
		[-x, -y, z]
	]

    for (var i = 0; i < 8; i = i + 1) {
        Vertex[i] = vec3_transform_coord(Vertex[i], m_matWorld);
    }

    var planePoint = Vertex[0];
    var maxdist = vec3_dot(Vertex[0], hitNormal);

    for (var i = 0; i < 8; i = i + 1) {
        var dx = vec3_dot(Vertex[i], hitNormal);
        if (dx > maxdist) {
            maxdist = dx;
            planePoint = Vertex[i];
        }
    }

    var d = vec3_dot(planePoint, hitNormal);
    d = d - (penetration + 0.01);

    var verts = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];

    var subVertIndexs = [-1, -1, -1, -1, -1, -1, -1, -1];

    var vertCount = 0;
    for (var i = 0; i < 8; i = i + 1) {
        var side = vec3_dot(Vertex[i], hitNormal) - d;

        if (side > 0) {
            verts[vertCount] = Vertex[i];                        //<---------- might have to double bag
            subVertIndexs[vertCount] = i;
            vertCount = vertCount + 1;
        }
    }

    var numVerts = [[vertCount, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];

    // cant use the regular indices array, have to put into slot [i][0]
    var vertIndexs = [[subVertIndexs[0], 0, 0], [subVertIndexs[1], 0, 0], [subVertIndexs[2], 0, 0], [subVertIndexs[3], 0, 0], [subVertIndexs[4], 0, 0], [subVertIndexs[5], 0, 0], [subVertIndexs[6], 0, 0], [subVertIndexs[7], 0, 0]];

    return [numVerts, verts, vertIndexs];
}

/***************************************************************************/

function VertInsideFaceOCLTEST(verts0, p0)  //<-------------- if planeErr is null set to 0
{
    var planeErr = .1;

    // Work out the normal for the face
    var v0 = vec3_sub(verts0[1], verts0[0]);
    var v1 = vec3_sub(verts0[2], verts0[0]);
    var n = vec3_cross(v1, v0);
    n = vec3_normalize(n);

    for (var i = 0; i < 4; i = i + 1) {
        var s0 = verts0[i];
        var s1 = verts0[(i + 1) % 4];
        var sx = vec3_add(s0, vec3_scale(10, n));

        // Work out the normal for the face
        var sv0 = vec3_sub(s1, s0);
        var sv1 = vec3_sub(sx, s0);
        var sn = vec3_cross(sv1, sv0);
        sn = vec3_normalize(sn);

        var d = vec3_dot(s0, sn);
        var d0 = vec3_dot(p0, sn) - d;

        // Outside the plane
        if (d0 > planeErr) {
            return 0;
        }
    }

    return 1;

}


function ClipFaceFaceVertsOCLTEST(verts0,
                                        vertIndexs0,
                                        verts1,
                                        vertIndexs1,
                                        numVertsX) {

    var i = 0, j = 0, k = 0;
    var defaultReturn = [
                            [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], // verts
                            [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]  // numVerts
                        ];

    var vertsX;

    // Work out the normal for the face
    var v0 = vec3_sub(verts0[1], verts0[0]);
    var v1 = vec3_sub(verts0[2], verts0[0]);
    var n = vec3_cross(v1, v0);
    n = vec3_normalize(n);


    // Project all the vertices onto a shared plane, plane0
    var vertsTemp1 = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (i = 0; i < 4; i = i + 1) {
        vertsTemp1[i] = vec3_add(verts1[i], vec3_scale(vec3_dot(n, vec3_sub(verts0[0], verts1[i])), n));
    }

    // temp can be bigger than 8 verts
    var temp = [
                [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0],
                [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0],
                [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0],
                [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0],
                [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0],
                [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0],
                [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0],
                [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]

    ];



    var numVerts = 0;

    var vertA = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];
    var vertB = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];


    var sv0 = [0, 0, 0];
    var sv1 = [0, 0, 0];
    var sn = [0, 0, 0];
    var d;

    var p = [0, 0, 0];
    var p1 = [0, 0, 0];


    for (var c = 0; c < 2; c = c + 1) {
        vertA = vertsTemp1;
        vertB = verts0;

        if (c == 1) {
            vertA = verts0;
            vertB = vertsTemp1;
        }

        // Work out the normal for the face
        v0 = vec3_sub(vertA[1], vertA[0]);
        v1 = vec3_sub(vertA[2], vertA[0]);
        n = vec3_cross(v1, v0);
        n = vec3_normalize(n);

        for (i = 0; i < 4; i = i + 1) {
            var s0 = vertA[i];
            var s1 = vertA[(i + 1) % 4];
            var sx = vec3_add(s0, vec3_scale(10, n));

            // Work out the normal for the face
            sv0 = vec3_sub(s1, s0);
            sv1 = vec3_sub(sx, s0);
            sn = vec3_cross(sv1, sv0);
            sn = vec3_normalize(sn);

            d = vec3_dot(s0, sn);


            for (j = 0; j < 4; j = j + 1) {
                var p0 = vertB[j];
                var p1 = vertB[(j + 1) % 4]; // Loops back to the 0th for the last one

                var d0 = vec3_dot(p0, sn) - d;
                var d1 = vec3_dot(p1, sn) - d;

                // Check there on opposite sides of the plane
                if ((d0 * d1) < 0.0) {

                    var pX = vec3_add(p0, vec3_scale((vec3_dot(sn, vec3_sub(s0, p0)) / vec3_dot(sn, vec3_sub(p1, p0))), vec3_sub(p1, p0)));

                    if (VertInsideFaceOCLTEST(vertA, pX) == 1) {
                        temp[numVerts] = pX;
                        numVerts = numVerts + 1;
                    }
                }


                if (VertInsideFaceOCLTEST(vertA, p0) == 1) {
                    temp[numVerts] = p0;
                    numVerts = numVerts + 1;
                }


            }
        }
    }


    // Remove verts which are very close to each other
    for (i = 0; i < numVerts; i = i + 1) {
        for (j = i; j < numVerts; j = j + 1) {
            if (i != j) {
                var dist = vec3_lengthSquared(vec3_sub(temp[i], temp[j]));

                if (dist < 6.5)                                                         //<--- arbitrary number =)
                {

                    for (k = j; k < numVerts; k = k + 1) {
                        temp[k] = temp[k + 1];
                    }
                    numVerts--;
                }
            }
        }
    }

    var out = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];

    var m;
    for (m = 0; m < numVerts; m = m + 1) {
        out[m] = temp[m];
    }

   


    var numVertsOut = [[numVerts, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];

    return [out, numVertsOut];



}

/***************************************************************************/


/***************************************************************************/

function /*void*/ClosestPtPointOBBOCLTEST(point,
                                        m_e,
                                        m_u,
                                        m_c
                                        ) {


    var closestP = [0, 0, 0];
    var d = vec3_sub(point, m_c);
    var q = m_c;    
    var dist;

    for (var i = 0; i < 3; i = i + 1) {
        dist = vec3_dot(d, m_u[i]);

        if (dist > m_e[i]) dist = m_e[i];
        if (dist < -m_e[i]) dist = -m_e[i];

        q = vec3_add(q, vec3_scale(dist, m_u[i]));
    }
    closestP = q;
    return closestP;
}

/***************************************************************************/

function ClipLinePlaneOCLTEST(verts0, m_e, m_u, m_c) {

    // lineplane always returns 2 points
    var vertsX = [[0, 0, 0], [0, 0, 0]];


    vertsX[0] = ClosestPtPointOBBOCLTEST(verts0[0], m_e, m_u, m_c);
    vertsX[1] = ClosestPtPointOBBOCLTEST(verts0[1], m_e, m_u, m_c);
    
    return vertsX;

}

/***************************************************************************/

function ClosestPointLineLineOCLTEST(verts0,
                                    verts1) {


    // num verts is always 1

    var vertsX = [0, 0, 0];


    var p1 = verts0[0];     //vec
    var q1 = verts0[1];     //vec
    var p2 = verts1[0];     //vec
    var q2 = verts1[1];     //vec

    var d1 = vec3_sub(q1, p1);       //vec
    var d2 = vec3_sub(q2, p2);       //vec
    var r = vec3_sub(p1, p2);       //vec
    var a = vec3_dot(d1, d1);   //f
    var e = vec3_dot(d2, d2);   //f
    var f = vec3_dot(d2, r);    //f

    var epsilon = 0.00001;

    var s = 0.0, t = 0.0; //f
    var c1 = [0, 0, 0], c2 = [0, 0, 0]; //vec

    if (a <= epsilon && e <= epsilon) {
        s = t = 0.0;
        c1 = p1;
        c2 = p2;

        vertsX = c1;

        return vertsX;
    }

    if (a <= epsilon) {
        s = 0.0;
        t = f / e;
        t = clamp(t, 0.0, 1.0);
    }
    else {
        var c = vec3_dot(d1, r);
        if (e <= epsilon) {
            t = 0.0;
            s = clamp(-c / a, 0.0, 1.0);
        }
        else {
            var b = vec3_dot(d1, d2);
            var denom = a * e - b * b;

            if (denom != 0.0) {
                s = clamp((b * f - c * e) / denom, 0.0, 1.0);
            }
            else {
                s = 0.0;
            }

            t = (b * s + f) / e;

            if (t < 0.0) {
                t = 0.0;
                s = clamp(-c / a, 0.0, 1.0);
            }
            else if (t > 1.0) {
                t = 1.0;
                s = clamp((b - c) / a, 0.0, 1.0);
            }
        }
    }


    c1 = vec3_add(p1, vec3_scale(s, d1));
    c2 = vec3_add(p2, vec3_scale(t, d2));

    vertsX = vec3_scale(.5, vec3_add(c1, c2));

    return vertsX;
}

/***************************************************************************/

var debugSpheres = new Array();

function CalculateHitPointOCLTEST(m_e0, m_e1,
                                m_u0, m_u1,
                                m_c0, m_c1,
                                m_matWorld0, m_matWorld1,
                                penetration,
                                hitNormal) {

    

    var defaultReturn = [
                            [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], //verts
                            [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]  // hipoint count
                        ];
    var i;
    var hitPoints;


    var norm0 = hitNormal;
    var results0 = GetNumHitPointsOCLTEST(m_e0,
                                        m_matWorld0,
									    norm0,
									    penetration);
    var numVerts0 = results0[0][0][0];
    var verts0 = results0[1];
    var vertIndex0 = [0, 0, 0, 0, 0, 0, 0, 0];
    for (i = 0; i < 8; i = i + 1) {
        vertIndex0[i] = results0[2][i][0];
    }


    var norm1 = vec3_scale(-1, hitNormal);
    // returns verts, numVerts, vertsIndices
    var results1 = GetNumHitPointsOCLTEST(m_e1,
									    m_matWorld1,
                                        norm1,
									    penetration);
    var numVerts1 = results1[0][0][0];
    var verts1 = results1[1];
    var vertIndex1 = [0, 0, 0, 0, 0, 0, 0, 0];
    for (i = 0; i < 8; i = i + 1) {
        vertIndex1[i] = results1[2][i][0];
    }

   
    // This should never really happen!
    if ((numVerts0 == 0) || (numVerts1 == 0)) {
        
        return defaultReturn;
    }

   


    var vertsX = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];
    var cpLineResult = [[0, 0, 0], [0, 0, 0]];
    var numVertsX = 0
    // NOTE: changed to if/elseif/else so that we only assign vertsX once

    if (numVerts0 >= 4 && numVerts1 >= 4) {
        //trace("4x4");
        var clipResult = ClipFaceFaceVertsOCLTEST(verts0, vertIndex0,
							                    verts1, vertIndex1,
							                    numVertsX);
        vertsX = clipResult[0];
        numVertsX = clipResult[1][0][0];

    } else if (numVerts1 < numVerts0) {
       // trace("<");
        numVertsX = numVerts1;
        vertsX = verts1;
        hitNormal = vec3_scale(-1, norm1);

    } else if (numVerts1 == 2 && numVerts0 == 2) {
        //trace("2x2");
        var numV = 0;
        var linLineResult = ClosestPointLineLineOCLTEST(verts0, verts1);

        vertsX[0] = linLineResult; // always one vert (two lines can only intersect in one place, unless your using non-euclidian geometry)
        numVertsX = 1;

        

    } else if (numVerts0 == 2 && numVerts1 == 4) {
        //trace("2x4");

        //trace("v0 " + verts0);
        cpLineResult = ClipLinePlaneOCLTEST(verts0, m_e1, m_u1, m_c1);

        vertsX[0] = cpLineResult[0];
        vertsX[1] = cpLineResult[1];
        numVertsX = 2;

      //  trace(vertsX[0] + " " + vertsX[1]);


    } else if (numVerts0 == 4 && numVerts1 == 2) {
        //trace("4x2");
   

        cpLineResult = ClipLinePlaneOCLTEST(verts1, m_e0, m_u0, m_c0);
        vertsX[0] = cpLineResult[0];
        vertsX[1] = cpLineResult[1];
        numVertsX = 2;


    } else {
    
        numVertsX = numVerts0;
        vertsX = verts0;
    }

    //numVertsX = numVerts0;
    //vertsX = verts0;

    var hitPoints = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];

    for (i = 0; i < numVertsX; i = i + 1) {
        hitPoints[i] = vertsX[i];
    }


    var hitPointCount = [[numVertsX, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];

    /*
    for (var i = 0; i < debugSpheres.length; i++) {
        sceneThree.remove(debugSpheres[i]);
    }
    debugSpheres = new Array();
    */
    /*
    var cubeMaterial = new THREE.MeshPhongMaterial({ color: 0x00ffff });  // blue is zero
    var cubeGeom = new THREE.SphereGeometry(.25, 20, 20);



    // DEBUG DRAWING
    for (var i = 0; i < numVerts0; i++) {

        var cubeMesh = new THREE.Mesh(cubeGeom, cubeMaterial);
        cubeMaterial.depthTest = false;
        cubeMaterial.overdraw = true;
        cubeMesh.position.x = verts0[i][0];
        cubeMesh.position.y = verts0[i][1];
        cubeMesh.position.z = verts0[i][2];
        debugSpheres.push(cubeMesh);
        sceneThree.add(cubeMesh);
    }


    // DEBUG DRAWING
    for (var i = 0; i < numVerts1; i++) {

        var cubeMesh = new THREE.Mesh(cubeGeom, cubeMaterial);
        cubeMaterial.depthTest = false;
        cubeMaterial.overdraw = true;
        cubeMesh.position.x = verts1[i][0];
        cubeMesh.position.y = verts1[i][1];
        cubeMesh.position.z = verts1[i][2];
        debugSpheres.push(cubeMesh);
        sceneThree.add(cubeMesh);
    }

    */

    return [hitPoints, hitPointCount];

}


var doAlert = 0;

/***************************************************************************/
var cycle = 0;
var doPause = false;


function /*bool*/CubeCubeCollisionCheckOCLTEST(
m_e0, m_e1,
m_u0, m_u1,
m_c0, m_c1,
m_radius0, m_radius1,
m_matWorld0, m_matWorld1
) {

    // Simple bounding sphere check first
    var len = (m_radius0 + m_radius1);


    if (vec3_length(vec3_sub(m_c1, m_c0)) > (len * len)) {
        return [[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]];
    }


    var hit = 1;
    var minPenetration = 10000.0;
    var normal = [0, 0, 0];

    var test = [0, 1, 2];


    // -- box 1
    var resultA = SpanIntersectOCLTEST(m_e0, m_e1, m_matWorld0, m_matWorld1, m_u0[0], minPenetration, normal);
    if (hit == 1 && resultA[0][0] == 1)
        hit = 1; else hit = 0;

    resultA = SpanIntersectOCLTEST(m_e0, m_e1, m_matWorld0, m_matWorld1, m_u0[1], resultA[0][1], resultA[1]);
    if (hit == 1 && resultA[0][0] == 1)
        hit = 1; else hit = 0;


    resultA = SpanIntersectOCLTEST(m_e0, m_e1, m_matWorld0, m_matWorld1, m_u0[2], resultA[0][1], resultA[1]);
    if (hit == 1 && resultA[0][0] == 1)
        hit = 1; else hit = 0;




    // -- box 2

    resultA = SpanIntersectOCLTEST(m_e0, m_e1, m_matWorld0, m_matWorld1, m_u1[0], resultA[0][1], resultA[1]);
    if (hit == 1 && resultA[0][0] == 1)
        hit = 1; else hit = 0;

    resultA = SpanIntersectOCLTEST(m_e0, m_e1, m_matWorld0, m_matWorld1, m_u1[1], resultA[0][1], resultA[1]);
    if (hit == 1 && resultA[0][0] == 1)
        hit = 1; else hit = 0;

    resultA = SpanIntersectOCLTEST(m_e0, m_e1, m_matWorld0, m_matWorld1, m_u1[2], resultA[0][1], resultA[1]);
    if (hit == 1 && resultA[0][0] == 1)
        hit = 1; else hit = 0;




    // -- cross products of both box vectors

    resultA = SpanIntersectOCLTEST(m_e0, m_e1, m_matWorld0, m_matWorld1, vec3_cross(m_u0[0], m_u1[0]), resultA[0][1], resultA[1]);
    if (hit == 1 && resultA[0][0] == 1)
        hit = 1; else hit = 0;

    resultA = SpanIntersectOCLTEST(m_e0, m_e1, m_matWorld0, m_matWorld1, vec3_cross(m_u0[0], m_u1[1]), resultA[0][1], resultA[1]);
    if (hit == 1 && resultA[0][0] == 1)
        hit = 1; else hit = 0;

    resultA = SpanIntersectOCLTEST(m_e0, m_e1, m_matWorld0, m_matWorld1, vec3_cross(m_u0[0], m_u1[2]), resultA[0][1], resultA[1]);
    if (hit == 1 && resultA[0][0] == 1)
        hit = 1; else hit = 0;



    resultA = SpanIntersectOCLTEST(m_e0, m_e1, m_matWorld0, m_matWorld1, vec3_cross(m_u0[1], m_u1[0]), resultA[0][1], resultA[1]);
    if (hit == 1 && resultA[0][0] == 1)
        hit = 1; else hit = 0;

    resultA = SpanIntersectOCLTEST(m_e0, m_e1, m_matWorld0, m_matWorld1, vec3_cross(m_u0[1], m_u1[1]), resultA[0][1], resultA[1]);
    if (hit == 1 && resultA[0][0] == 1)
        hit = 1; else hit = 0;

    resultA = SpanIntersectOCLTEST(m_e0, m_e1, m_matWorld0, m_matWorld1, vec3_cross(m_u0[1], m_u1[2]), resultA[0][1], resultA[1]);
    if (hit == 1 && resultA[0][0] == 1)
        hit = 1; else hit = 0;


    resultA = SpanIntersectOCLTEST(m_e0, m_e1, m_matWorld0, m_matWorld1, vec3_cross(m_u0[2], m_u1[0]), resultA[0][1], resultA[1]);
    if (hit == 1 && resultA[0][0] == 1)
        hit = 1; else hit = 0;

    resultA = SpanIntersectOCLTEST(m_e0, m_e1, m_matWorld0, m_matWorld1, vec3_cross(m_u0[2], m_u1[1]), resultA[0][1], resultA[1]);
    if (hit == 1 && resultA[0][0] == 1)
        hit = 1; else hit = 0;

    resultA = SpanIntersectOCLTEST(m_e0, m_e1, m_matWorld0, m_matWorld1, vec3_cross(m_u0[2], m_u1[2]), resultA[0][1], resultA[1]);
    if (hit == 1 && resultA[0][0] == 1)
        hit = 1; else hit = 0;

        

    var penetration = resultA[0][1];
    normal = resultA[1];

   

    var numHitPoints = 0;
    var hitPoints = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];

   


    if (( normal[0] != 0 || normal[1] != 0 || normal[2] != 0 ) && hit == 1) {

        //trace("penetration OCL " + penetration);

        // var hitPointCount = [[numVertsX, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];
        //return [hitPoints, hitPointCount]; 

        var hpResult = CalculateHitPointOCLTEST(m_e0, m_e1,
                                                m_u0, m_u1,
                                                m_c0, m_c1,
                                                m_matWorld0, m_matWorld1,
							                    penetration, // pen
							                    normal)  // normal axis 
        var hitPoints = hpResult[0];
        var numHitPoints = hpResult[1][0][0];

        
        normal = vec3_scale(-1, normal);
    }

   


    var holder = [[hit, 0, 0], [penetration, 0, numHitPoints], normal, [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];

    return [holder, hitPoints];


}

/***************************************************************************/


/***************************************************************************/


function /*bool*/SpanIntersectOCLTEST(              m_e0, m_e1,
							                        m_matWorld0, m_matWorld1,
                                                    m_uAxis,
                                                    minPenetration,
                                                    axisPenetration
                                                    ) {
    var defaultReturn = [[0, 0, 0], [0, 0, 0]];


    var lq = vec3_lengthSquared(m_uAxis);


    if (lq <= 0.02) {

        return [[1, minPenetration, 0], axisPenetration];
    }


    var axis = [0, 0, 0];

    axis = vec3_normalize(m_uAxis);


    var mina, maxa;
    var minb, maxb;


    var resultA = CalculateIntervalOCLTEST(m_e0, m_matWorld0, axis); // used to get ref out
    mina = resultA[0];
    maxa = resultA[1];

    var resultB = CalculateIntervalOCLTEST(m_e1, m_matWorld1, axis); // used to get ref out
    minb = resultB[0];
    maxb = resultB[1];



    var lena = maxa - mina;
    var lenb = maxb - minb;

    var minv = (mina < minb) ? mina : minb;             //Math.min(mina, minb);
    var maxv = (maxa > maxb) ? maxa : maxb;             //Math.max(maxa, maxb);
    var lenv = maxv - minv;


    if (lenv > (lena + lenb)) {
        // NO Collision       
        return [[0, minPenetration, 0], axisPenetration]
    }

    var penetration = (lena + lenb) - lenv;
    //trace("Penetration:"+penetration);

    if (penetration < minPenetration) {
        minPenetration = penetration;
        axisPenetration = axis;

        // BoxA pushes BoxB away in the correct Direction
        if (minb < mina) {

            axisPenetration = vec3_scale(-1, axisPenetration);
        }
    }

    // Colllision
    return [[1, minPenetration, 0], axisPenetration];
}


function CalculateIntervalOCLTEST(m_e, m_matWorld, axis) {

    var min, max;

    var x = m_e[0];
    var y = m_e[1];
    var z = m_e[2];
    var Vertex = [

                            [x, y, -z],
		                    [-x, y, -z],
		                    [x, -y, -z],
		                    [-x, -y, -z],


                            [x, y, z],
		                    [-x, y, z],
		                    [x, -y, z],
		                    [-x, -y, z]
                 ];

    var transformedVertices = [
     vec3_transform_coord(Vertex[0], m_matWorld),
     vec3_transform_coord(Vertex[1], m_matWorld),
     vec3_transform_coord(Vertex[2], m_matWorld),
     vec3_transform_coord(Vertex[3], m_matWorld),
     vec3_transform_coord(Vertex[4], m_matWorld),
     vec3_transform_coord(Vertex[5], m_matWorld),
     vec3_transform_coord(Vertex[6], m_matWorld),
     vec3_transform_coord(Vertex[7], m_matWorld)
     ]


    var dot = vec3_dot(transformedVertices[0], axis);

    min = dot;
    max = dot;


    for (var i = 0; i < 8; i = i + 1) {
        var d = vec3_dot(transformedVertices[i], axis);

        if (d < min) min = d;
        if (d > max) max = d;
    }

    

    return [min, max];

}

