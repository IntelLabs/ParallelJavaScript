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



/***************************************************************************/
var normalMeshes = new Array();
function GetNumHitPointsPJS(            m_e,
                                        m_matWorld,
                                        hitNormal,
                                        penetration)

{
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
	];

    var transformedVertex = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];
   
    for (var i = 0; i < 8; i = i + 1) {
        
        var g = 1 / (m_matWorld[12] * Vertex[i][0] + m_matWorld[13] * Vertex[i][1] + m_matWorld[14] * Vertex[i][2] + m_matWorld[15]);

        transformedVertex[i][0] = (m_matWorld[0] * Vertex[i][0] + m_matWorld[1] * Vertex[i][1] + m_matWorld[2] * Vertex[i][2] + m_matWorld[3]) * g;
        transformedVertex[i][1] = (m_matWorld[4] * Vertex[i][0] + m_matWorld[5] * Vertex[i][1] + m_matWorld[6] * Vertex[i][2] + m_matWorld[7]) * g;
        transformedVertex[i][2] = (m_matWorld[8] * Vertex[i][0] + m_matWorld[9] * Vertex[i][1] + m_matWorld[10] * Vertex[i][2] + m_matWorld[11]) * g;

    }

    Vertex = transformedVertex;

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
    d = d - (penetration + 0.1);

    var verts = [];

    for (var i = 0; i < 8; i = i + 1) {
        var side = vec3_dot(Vertex[i], hitNormal) - d;

        if (side > 0) {
            verts.push([i, Vertex[i], hitNormal, penetration]);
            //verts.push(Vertex[i]);
        }
    }

    return verts;
}

/***************************************************************************/

function VertInsideFaceOCL(verts0, p0)  //<-------------- if planeErr is null set to 0
{
   
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
        if (d0 > 0) {
            return 0;
        }
    }

    return 1;

}

function SortVerticesOCL(verts0, vertIndexs0) {
    var returnVerts = verts0;
    var faces =
	[
	    [4, 0, 3, 7],
		[1, 5, 6, 2],
	    [0, 1, 2, 3],
		[7, 6, 5, 4],
	    [5, 1, 0, 4],
		[6, 7, 3, 2]
	];

    var faceSet = -1;
    var temp = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]; // New correct clockwise order

    // Work out which face to use
    for (var i = 0; i < 6 && faceSet == -1; i++) {
        var numFound = 0;
        for (var j = 0; j < 4; j++) {
            if (vertIndexs0[j] == faces[i][j]) {
                temp[numFound] = verts0[j];
                numFound++;

                if (numFound == 4) {
                    faceSet = i;
                   
                }
            }
        }
    }



    for (var i = 0; i < 4; i++) {
        verts0[i] = temp[i];
    }
    

    return verts0;
}




function ClipFaceFaceVertsOCL(	        verts0,
                                        vertIndexs0,
                                        verts1,
                                        vertIndexs1,
                                        numVertsX) {
    var i=0, j=0, k=0;
    var defaultReturn = [
                            [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], // verts
                            [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]  // numVerts
                        ];

    //verts0 = SortVerticesOCL(verts0, vertIndexs0);
    //verts1 = SortVerticesOCL(verts1, vertIndexs1);
    
   
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


    for (var c = 0; c < 2; c = c+1) {
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


            for (j = 0; j < 4; j = j +1) {
                var p0 = vertB[j];
                var p1 = vertB[(j + 1) % 4]; // Loops back to the 0th for the last one

                var d0 = vec3_dot(p0, sn) - d;
                var d1 = vec3_dot(p1, sn) - d;

                // Check there on opposite sides of the plane
                if ((d0 * d1) < 0.0) {
    
                    var pX = vec3_add(p0, vec3_scale((vec3_dot(sn, vec3_sub(s0 , p0)) / vec3_dot(sn, vec3_sub(p1 , p0))), vec3_sub(p1 , p0)));
                    
                    if (VertInsideFaceOCL(vertA, pX) == 1) {
                        temp[numVerts] = pX;
                        numVerts = numVerts + 1;
                    }
                }

                
                if (VertInsideFaceOCL(vertA, p0) == 1 ) {
                    temp[numVerts] = p0;
                    numVerts = numVerts + 1;
                }
                
                /*
                if (numVerts > 8) {
                    numVerts = 8;
                }*/

            }
        }
    }


    
    // Remove verts which are very close to each other
    for (i = 0; i < numVerts; i = i + 1) {
        for (j = i; j < numVerts; j = j +1) {
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

function /*void*/ClosestPtPointOBBOCL( point,
                                        m_e,
                                        m_u,
                                        m_c
                                        ) {

    var closestP = [0, 0, 0];
    var d = vec3_sub(point, m_c);
    var q0,q1,q2;
    var dist;

    
        dist = vec3_dot(d, m_u[0]);

        if (dist > m_e[0]) dist = m_e[0];
        if (dist < -m_e[0]) dist = -m_e[0];

        q0 = vec3_add(m_c, vec3_scale(dist, m_u[0]));

        dist = vec3_dot(d, m_u[1]);

        if (dist > m_e[1]) dist = m_e[1];
        if (dist < -m_e[1]) dist = -m_e[1];

        q1 = vec3_add(q0, vec3_scale(dist, m_u[1]));

        dist = vec3_dot(d, m_u[2]);

        if (dist > m_e[2]) dist = m_e[2];
        if (dist < -m_e[2]) dist = -m_e[2];

        q2 = vec3_add(q1, vec3_scale(dist, m_u[2]));


    closestP = q2;
    return closestP;

  
}

/***************************************************************************/

function ClipLinePlaneOCL(	verts0, m_e, m_u, m_c ) {

    // lineplane always returns 2 points
    var vertsX = [[0, 0, 0], [0, 0, 0]];

    vertsX[0] = ClosestPtPointOBBOCL(verts0[0], m_e, m_u, m_c);
    vertsX[1] = ClosestPtPointOBBOCL(verts0[1], m_e, m_u, m_c);

    return vertsX;

}

/***************************************************************************/

function ClosestPointLineLineOCL(   verts0, 
                                    verts1 ) {


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

    var epsilon = 0.0001;

    var s=0.0, t=0.0; //f
    var c1=[0,0,0], c2=[0,0,0]; //vec

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

function CalculateHitPointPJS(  m_e0, m_e1,
                                m_u0, m_u1,
                                m_c0, m_c1,
                                m_matWorld0,m_matWorld1,
                                penetration,
                                hitNormal ) {

    var i;

    var norm0 = hitNormal;
    var verts0 = GetNumHitPointsPJS(  m_e0,
                                        m_matWorld0,
									    norm0,
									    penetration);


    var norm1 = vec3_scale(-1, hitNormal);
    // returns verts, numVerts, vertsIndices
    var verts1 = GetNumHitPointsPJS(m_e1,
									    m_matWorld1,
                                        norm1,
									    penetration);

    // This should never really happen!
    if ((verts0.length == 0) || (verts1.length == 0)) {
        return [];
    }

        
    if (verts1.length < verts0.length) {
        return verts1;
        //return [[1, verts1[0][1], hitNormal, penetration]];
    } 
    if (verts1.length == 2 && verts0.length == 2) {
        var point = ClosestPointLineLineOCL([verts0[0][1], verts0[1][1]], [verts1[0][1], verts1[1][1]]); 
        //return [point];
        return [[1, point, hitNormal, penetration]];
        //
        //var retu =  [[0, ClosestPointLineLineOCL([verts0[0][1], verts0[1][1]], [verts1[0][1], verts1[1][1]]), hitNormal, penetration]];
        //return retu;
        //return [ClosestPointLineLineOCL([verts0[0][1], verts0[1][1]], [verts1[0][1], verts1[1][1]]), [0,0,0]];
        //return [[ClosestPointLineLineOCL(verts0, verts1), hitNormal, penetration]];
        //return ClosestPointLineLineOCL(verts0, verts1);
    } 
    if (verts0.length == 2 && verts1.length == 4) {
            //return ClipLinePlaneOCL(verts0, m_e1, m_u1, m_c1);
            //var point = ClipLinePlaneOCL(verts0, m_e1, m_u1, m_c1);
            var point = ClipLinePlaneOCL([verts0[0][1], verts0[1][1]], m_e1, m_u1, m_c1);
            //return [point];
            return [[1, point, hitNormal, penetration]];
    } 
    if (verts0.length == 4 && verts1.length == 2) {
        //var point = ClipLinePlaneOCL(verts1, m_e0, m_u0, m_c0);
        var point = ClipLinePlaneOCL([verts1[0][1], verts1[1][1]], m_e0, m_u0, m_c0);
        //return [point];
        return [[1, point, hitNormal, penetration]];
    } 

    return verts0;
}


var doAlert = 0;

/***************************************************************************/
var cycle = 0;
var doPause = false;


function /*bool*/CubeCubeCollisionCheckOCL( index , m_e, m_u, m_c, m_radius, m_matWorld ) {
  

    if( index[1] <= index[0])
    return [[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]];

    var i0 = index[0];
    var i1 = index[1];


                                           
    // Simple bounding sphere check first
    var len = (m_radius[i0] + m_radius[i1]);


    if (vec3_lengthSquared(vec3_sub(m_c[i1], m_c[i0])) > (len * len)) {        
        return [[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]];
    }
        
    
    var hit = 1;
    var minPenetration = 10000.0;
    var normal = [0, 0, 0];

   
    // -- box 1
    var resultA = SpanIntersectOCL(m_e[i0], m_e[i1], m_matWorld[i0], m_matWorld[i1],  m_u[i0][0], minPenetration, normal );
    if (resultA[0][0] == 0)
        return [[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]];

    resultA = SpanIntersectOCL(m_e[i0], m_e[i1], m_matWorld[i0], m_matWorld[i1], m_u[i0][1], resultA[0][1], resultA[1]);
    if (resultA[0][0] == 0)
        return [[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]];


    resultA = SpanIntersectOCL(m_e[i0], m_e[i1], m_matWorld[i0], m_matWorld[i1], m_u[i0][2], resultA[0][1], resultA[1]);
    if (resultA[0][0] == 0)
        return [[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]];


   

    // -- box 2

    resultA = SpanIntersectOCL(m_e[i0], m_e[i1], m_matWorld[i0], m_matWorld[i1], m_u[i1][0], resultA[0][1], resultA[1]);
    if (resultA[0][0] == 0)
        return [[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]];

    resultA = SpanIntersectOCL(m_e[i0], m_e[i1], m_matWorld[i0], m_matWorld[i1], m_u[i1][1], resultA[0][1], resultA[1]);
    if (resultA[0][0] == 0)
        return [[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]];

    resultA = SpanIntersectOCL(m_e[i0], m_e[i1], m_matWorld[i0], m_matWorld[i1], m_u[i1][2], resultA[0][1], resultA[1]);
    if (resultA[0][0] == 0)
        return [[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]];


    

    // -- cross products of both box vectors

    resultA = SpanIntersectOCL(m_e[i0], m_e[i1], m_matWorld[i0], m_matWorld[i1], vec3_cross(m_u[i0][0], m_u[i1][0]), resultA[0][1], resultA[1]);
    if (resultA[0][0] == 0)
        return [[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]];

    resultA = SpanIntersectOCL(m_e[i0], m_e[i1], m_matWorld[i0], m_matWorld[i1], vec3_cross(m_u[i0][0], m_u[i1][1]), resultA[0][1], resultA[1]);
    if (resultA[0][0] == 0)
        return [[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]];

    resultA = SpanIntersectOCL(m_e[i0], m_e[i1], m_matWorld[i0], m_matWorld[i1], vec3_cross(m_u[i0][0], m_u[i1][2]), resultA[0][1], resultA[1]);
    if (resultA[0][0] == 0)
        return [[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]];



    resultA = SpanIntersectOCL(m_e[i0], m_e[i1], m_matWorld[i0], m_matWorld[i1], vec3_cross(m_u[i0][1], m_u[i1][0]), resultA[0][1], resultA[1]);
    if (resultA[0][0] == 0)
        return [[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]];

    resultA = SpanIntersectOCL(m_e[i0], m_e[i1], m_matWorld[i0], m_matWorld[i1], vec3_cross(m_u[i0][1], m_u[i1][1]), resultA[0][1], resultA[1]);
    if (resultA[0][0] == 0)
        return [[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]];

    resultA = SpanIntersectOCL(m_e[i0], m_e[i1], m_matWorld[i0], m_matWorld[i1], vec3_cross(m_u[i0][1], m_u[i1][2]), resultA[0][1], resultA[1]);
    if (resultA[0][0] == 0)
        return [[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]];


    resultA = SpanIntersectOCL(m_e[i0], m_e[i1], m_matWorld[i0], m_matWorld[i1], vec3_cross(m_u[i0][2], m_u[i1][0]), resultA[0][1], resultA[1]);
    if (resultA[0][0] == 0)
        return [[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]];

    resultA = SpanIntersectOCL(m_e[i0], m_e[i1], m_matWorld[i0], m_matWorld[i1], vec3_cross(m_u[i0][2], m_u[i1][1]), resultA[0][1], resultA[1]);
    if (resultA[0][0] == 0)
        return [[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]];

    resultA = SpanIntersectOCL(m_e[i0], m_e[i1], m_matWorld[i0], m_matWorld[i1], vec3_cross(m_u[i0][2], m_u[i1][2]), resultA[0][1], resultA[1]);
    if (resultA[0][0] == 0)
        return [[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]];



    var penetration = resultA[0][1];
    normal = resultA[1];


    var numHitPoints = 0;
    var hitPoints = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];

    if (( normal[0] != 0 || normal[1] != 0 || normal[2] != 0 ) && hit == 1) {


        // var hitPointCount = [[numVertsX, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];
        //return [hitPoints, hitPointCount]; 

        var hpResult = CalculateHitPointOCL(    m_e[i0], m_e[i1],
                                                m_u[i0], m_u[i1],
                                                m_c[i0], m_c[i1],
                                                m_matWorld[i0], m_matWorld[i1],
							                    penetration, // pen
							                    normal)  // normal axis 
        var hitPoints = hpResult[0];
        var numHitPoints = hpResult[1][0][0];

       

        normal = vec3_scale(-1, normal);
        return [[[hit, 0, 0], [penetration, 0, numHitPoints], normal, [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], hitPoints];
    }


   return [[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]];
}




//function /*bool*/CubeCubeHitOCL(index, m_e, m_u, m_c, m_radius, m_matWorld) {
function /*bool*/CubeCubeHitPJS(index) {
    var i0 = index[0];
    var i1 = index[1];
    if(i1 < i0) return false;
    var cube0 = g_cubes[i0];
    var cube1 = g_cubes[i1];

    // Simple bounding sphere check first
    var len = (cube0.m_radius + cube1.m_radius);

    if (vec3_lengthSquared(vec3_sub(cube1.m_c, cube0.m_c)) > (len * len)) {
        return false;
    }


    var hit = 1;
    var minPenetration = 10000.0;
    var normal = [0, 0, 0];


    // -- box 1
    var result = SpanIntersectPJS(cube0.m_e, cube1.m_e, cube0.m_matWorld, cube1.m_matWorld, cube0.m_u[0], minPenetration, normal);
    if (!result)
        return false;

    result = SpanIntersectPJS(cube0.m_e, cube1.m_e, cube0.m_matWorld, cube1.m_matWorld, cube0.m_u[1], result[0], result[1]);
    if (!result)
        return false;

    result = SpanIntersectPJS(cube0.m_e, cube1.m_e, cube0.m_matWorld, cube1.m_matWorld, cube0.m_u[2], result[0], result[1]);
    if (!result)
        return false;



    // -- box 2

    result = SpanIntersectPJS(cube0.m_e, cube1.m_e, cube0.m_matWorld, cube1.m_matWorld, cube1.m_u[0], result[0], result[1]);
    if (!result)
        return false;

    result = SpanIntersectPJS(cube0.m_e, cube1.m_e, cube0.m_matWorld, cube1.m_matWorld, cube1.m_u[1], result[0], result[1]);
    if (!result)
        return false;

    result = SpanIntersectPJS(cube0.m_e, cube1.m_e, cube0.m_matWorld, cube1.m_matWorld, cube1.m_u[2], result[0], result[1]);
    if (!result)
        return false;


    // -- cross products of both box vectors

    result = SpanIntersectPJS(cube0.m_e, cube1.m_e, cube0.m_matWorld, cube1.m_matWorld, vec3_cross(cube0.m_u[0], cube1.m_u[0]), result[0], result[1]);
    if (!result)
        return false;

    result = SpanIntersectPJS(cube0.m_e, cube1.m_e, cube0.m_matWorld, cube1.m_matWorld, vec3_cross(cube0.m_u[0], cube1.m_u[1]), result[0], result[1]);
    if (!result)
        return false;

    result = SpanIntersectPJS(cube0.m_e, cube1.m_e, cube0.m_matWorld, cube1.m_matWorld, vec3_cross(cube0.m_u[0], cube1.m_u[2]), result[0], result[1]);
    if (!result)
        return false;


    result = SpanIntersectPJS(cube0.m_e, cube1.m_e, cube0.m_matWorld, cube1.m_matWorld, vec3_cross(cube0.m_u[1], cube1.m_u[0]), result[0], result[1]);
    if (!result)
        return false;

    result = SpanIntersectPJS(cube0.m_e, cube1.m_e, cube0.m_matWorld, cube1.m_matWorld, vec3_cross(cube0.m_u[1], cube1.m_u[1]), result[0], result[1]);
    if (!result)
        return false;

    result = SpanIntersectPJS(cube0.m_e, cube1.m_e, cube0.m_matWorld, cube1.m_matWorld, vec3_cross(cube0.m_u[1], cube1.m_u[2]), result[0], result[1]);
    if (!result)
        return false;


    result = SpanIntersectPJS(cube0.m_e, cube1.m_e, cube0.m_matWorld, cube1.m_matWorld, vec3_cross(cube0.m_u[2], cube1.m_u[0]), result[0], result[1]);
    if (!result)
        return false;

    result = SpanIntersectPJS(cube0.m_e, cube1.m_e, cube0.m_matWorld, cube1.m_matWorld, vec3_cross(cube0.m_u[2], cube1.m_u[1]), result[0], result[1]);
    if (!result)
        return false;

    result = SpanIntersectPJS(cube0.m_e, cube1.m_e, cube0.m_matWorld, cube1.m_matWorld, vec3_cross(cube0.m_u[2], cube1.m_u[2]), result[0], result[1]);

    return result;
}




//function /*bool*/CubeCubePairsOCL(index, m_e, m_u, m_c, m_radius, m_matWorld, pen_normal ) {
function /*bool*/CubeCubePairsPJS(hit) {
   
    var i0 = hit[0][0];
    var i1 = hit[0][1];
    var cube0 = g_cubes[i0];
    var cube1 = g_cubes[i1];

    var penetration = hit[1];
    var normal = hit[2];

    if (penetration > 0 ) { 
        if(i0 === 62 && i1 === 109) {
            console.log("Problem pair found");
        }
        return CalculateHitPointPJS(            cube0.m_e, cube1.m_e,
                                                cube0.m_u, cube1.m_u,
                                                cube0.m_c, cube1.m_c,
                                                cube0.m_matWorld, cube1.m_matWorld,
							                    penetration,
							                    normal);
    }

    return false;
}








/***************************************************************************/


/***************************************************************************/


function /*bool*/SpanIntersectPJS(                  m_e0, m_e1,
							                        m_matWorld0,m_matWorld1,
                                                    m_uAxis,
                                                    minPenetration, 
                                                    axisPenetration                                                    
                                                    )

{
    var lq = vec3_lengthSquared(m_uAxis);


    if (lq <= 0.02) {
        // so close they have to be colliding
        return [minPenetration, axisPenetration];
    }


    var axis = vec3_normalize(m_uAxis);


    var mina, maxa;
    var minb, maxb;


    var resultA = CalculateIntervalPJS(m_e0, m_matWorld0, axis ); // used to get ref out
    mina = resultA[0];
    maxa = resultA[1];

    var resultB = CalculateIntervalPJS(m_e1, m_matWorld1, axis ); // used to get ref out
    minb = resultB[0];
    maxb = resultB[1];



    var lena = maxa - mina;
    var lenb = maxb - minb;

    var minv = (mina < minb) ? mina : minb;             //Math.min(mina, minb);
    var maxv = (maxa > maxb) ? maxa : maxb;             //Math.max(maxa, maxb);
    var lenv = maxv - minv;

   
    if (lenv > (lena + lenb)) {
        // NO Collision
        return false;
    }

    var penetration = (lena + lenb) - lenv;

    if (penetration < minPenetration) {
        minPenetration = penetration;
        axisPenetration = axis;

        // BoxA pushes BoxB away in the correct Direction
        if (minb < mina) {
            axisPenetration = vec3_scale(-1, axisPenetration);
        }
    }

    // Colllision
    return [minPenetration, axisPenetration];
}


function CalculateIntervalPJS(m_e, m_matWorld, axis ) {

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
    /*
    var transformedVertex = [[0, 0, 0],[0, 0, 0],[0, 0, 0],[0, 0, 0],[0, 0, 0],[0, 0, 0],[0, 0, 0],[0, 0, 0]];

    for (var i = 0; i < 8; i++) {

       
        var g = 1 / (m_matWorld[12] * Vertex[i][0] + m_matWorld[13] * Vertex[i][1] + m_matWorld[14] * Vertex[i][2] + m_matWorld[15]);

        transformedVertex[i][0] = (m_matWorld[0] * Vertex[i][0] + m_matWorld[1] * Vertex[i][1] + m_matWorld[2] * Vertex[i][2] + m_matWorld[3]) * g;
        transformedVertex[i][1] = (m_matWorld[4] * Vertex[i][0] + m_matWorld[5] * Vertex[i][1] + m_matWorld[6] * Vertex[i][2] + m_matWorld[7]) * g;
        transformedVertex[i][2] = (m_matWorld[8] * Vertex[i][0] + m_matWorld[9] * Vertex[i][1] + m_matWorld[10] * Vertex[i][2] + m_matWorld[11]) * g;

        
    }


    var dot = vec3_dot(transformedVertex[0], axis);

    min = dot;
    max = dot;


    for (var i = 0; i < 8; i = i +1) {
        var d = vec3_dot(transformedVertex[i], axis);

        if (d < min) min = d;
        if (d > max) max = d;
    }

  

    return [min, max];*/


 
    var i = 0;
    var g = 1 / (m_matWorld[12] * Vertex[i][0] + m_matWorld[13] * Vertex[i][1] + m_matWorld[14] * Vertex[i][2] + m_matWorld[15]);
 
    var dot = vec3_dot( [(m_matWorld[0] * Vertex[i][0] + m_matWorld[1] * Vertex[i][1] + m_matWorld[2] * Vertex[i][2] + m_matWorld[3]) * g,
                            (m_matWorld[4] * Vertex[i][0] + m_matWorld[5] * Vertex[i][1] + m_matWorld[6] * Vertex[i][2] + m_matWorld[7]) * g,
                            (m_matWorld[8] * Vertex[i][0] + m_matWorld[9] * Vertex[i][1] + m_matWorld[10] * Vertex[i][2] + m_matWorld[11]) * g],
                        axis );


    min = dot;
    max = dot;


    for (var i = 0; i < 8; i = i + 1) {
        g = 1 / (m_matWorld[12] * Vertex[i][0] + m_matWorld[13] * Vertex[i][1] + m_matWorld[14] * Vertex[i][2] + m_matWorld[15]);
        dot = vec3_dot( [(m_matWorld[0] * Vertex[i][0] + m_matWorld[1] * Vertex[i][1] + m_matWorld[2] * Vertex[i][2] + m_matWorld[3]) * g,
                            (m_matWorld[4] * Vertex[i][0] + m_matWorld[5] * Vertex[i][1] + m_matWorld[6] * Vertex[i][2] + m_matWorld[7]) * g,
                            (m_matWorld[8] * Vertex[i][0] + m_matWorld[9] * Vertex[i][1] + m_matWorld[10] * Vertex[i][2] + m_matWorld[11]) * g],
                        axis );

        if (dot < min) min = dot;
        if (dot > max) max = dot;
    }

    return [min, max];
}
