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




/***************************************************************************/
var normalMeshes = new Array();
function /*int*/ GetNumHitPoints( /*Cube*/  idx,
							/*vec3*/        hitNormal,
							/*f*/           penetration)
							/*array<vec3>*/ //verts,          // out        // this is just an array of 8 vec3s used to be /*vec3*/ verts[8]
							/*int*/         //vertIndexs)     // out
{

    var verts = new Array();
    var vertIndexs = new Array();

  

	var x = g_cubes[idx].m_e[0];
	var y = g_cubes[idx].m_e[1];
	var z = g_cubes[idx].m_e[2];
	//var y = CubeList._m_e[idx][1];
	//var z = CubeList._m_e[idx][2];
	var Vertex =
	[
    	[   -x,     y,      -z],
		[   x,      y,      -z],
		[   x,      y,      z],
		[   -x,     y,      z],

		[  -x,   -y,      -z	],
		[   x,   -y,	  -z	],
		[   x,   -y,	   z	],
		[  -x,   -y,	   z	]	
	]
    var m_matWorld = g_cubes[idx].m_matWorld;
	for (var i=0; i<8; i++)
	{
		Vertex[i] = vec3_transform_coord(Vertex[i], m_matWorld);
	}

	
	var planePoint = Vertex[0];
	var maxdist = vec3_dot(Vertex[0], hitNormal);

	for (var i=0; i<8; i++)
	{
		var d = vec3_dot(Vertex[i], hitNormal);
		if (d > maxdist)
		{
			maxdist = d;
			planePoint = Vertex[i];
		}
	}
	
	var d = vec3_dot(planePoint, hitNormal);
	d -= penetration + .1;

	var numVerts = 0;
	for (var i=0; i<8; i++)
	{
		var side = vec3_dot(Vertex[i], hitNormal) - d;
		
		if ( side > 0 )
		{
			verts[numVerts] = Vertex[i];
			vertIndexs[numVerts] = i;
			numVerts++;
		}
	}

	return [numVerts, verts, vertIndexs];
}

/***************************************************************************/

function /*bool*/ VertInsideFace(/*vec3*/ verts0, /*vec3*/ p0 )  
{
    var planeErr = 0.00;

	// Work out the normal for the face
	var v0 = vec3_sub( verts0[1] , verts0[0] );
	var v1 = vec3_sub( verts0[2] , verts0[0] );
	var n  = vec3_cross(v1, v0);
	n = vec3_normalize(n);

	for (var i=0; i<4; i++)
	{
		var s0 = verts0[i];
		var s1 = verts0[(i+1)%4];
		var sx = vec3_add( s0 , vec3_scale( 10, n));

		// Work out the normal for the face
		var sv0 = vec3_sub( s1 , s0);
		var sv1 = vec3_sub( sx , s0);
		var sn  = vec3_cross(sv1, sv0);
		sn = vec3_normalize(sn);

		var d  = vec3_dot(s0, sn);
		var d0 = vec3_dot(p0, sn) - d;                             

		// Outside the plane
		if (d0 > planeErr) {
			return false;
		}
	}

	return true;
    
}

function SortVertices(verts0, vertIndexs0)
{
    var faces =
	[
	    [4,0,3,7],
		[1,5,6,2],
	    [0,1,2,3],
		[7,6,5,4],
	    [5,1,0,4],
		[6,7,3,2]
	];

    var faceSet = -1;
    var temp=[0,0,0,0]; // New correct clockwise order

    // Work out which face to use
    for (var i=0; i<6 && faceSet==-1; i++)
    {
		var numFound = 0;
		for (var j=0; j<4; j++)
        {
			if (vertIndexs0[j]==faces[i][j])
            {
		    temp[numFound] = verts0[j];
		    numFound++;

		    if (numFound==4)
            {
				faceSet = i;
				break;
            }
        }
    }
    }

    if (faceSet < 0)
    {
        var errorHasOccured = 1;
    }
    else
    {
        for (var i=0; i<4; i++)
        {
			    verts0[i] = temp[i];
        }
    }

    return verts0;
}



function /*void*/ ClipFaceFaceVerts(	/*vec3*/ verts0,
								        /*int*/ vertIndexs0,
								        /*vec3*/ verts1,
								        /*int*/ vertIndexs1,
								        /*vec3*/ vertsX,
								        /*int*/ numVertsX)
{

    var i;

	// Work out the normal for the face
	var v0 = vec3_sub( verts0[1] , verts0[0] );
	var v1 = vec3_sub( verts0[2] , verts0[0] );
	var  n  = vec3_cross(v1, v0);
	n = vec3_normalize(n);


	// Project all the vertices onto a shared plane, plane0
	var vertsTemp1 = new Array();
	for (i=0; i<4; i++) {
		vertsTemp1[i] = vec3_add( verts1[i] , vec3_scale( vec3_dot(n, vec3_sub( verts0[0], verts1[i])), n  )); 
	}

	var temp = new Array();
	var numVerts = 0;

	for (var c=0; c<2; c++)
	{
		var vertA = vertsTemp1;
		var vertB = verts0;
		if (c==1)
		{
			vertA = verts0;
			vertB = vertsTemp1;
		}

		// Work out the normal for the face
		var v0 = vec3_sub( vertA[1] , vertA[0]);
		var v1 = vec3_sub( vertA[2] , vertA[0]);
		var n  = vec3_cross(v1, v0);
		n = vec3_normalize(n);

		for (i=0; i<4; i++)
		{
		    var s0 = [0, 0, 0];
            if( vertA[i] ) s0 = vertA[i];
			var s1 = vertA[(i+1)%4];
			var sx = vec3_add( s0 , vec3_scale( 10 , n ) );

			// Work out the normal for the face
			var sv0 =  vec3_sub( s1 , s0);
			var sv1 = vec3_sub( sx , s0);

			var sn = vec3_cross(sv1, sv0);	
			sn = vec3_normalize(sn);   
			var d = vec3_dot(s0, sn);   
            			

			for (var j=0; j<4; j++)
			{
				var p0 = vertB[j];
				var p1 = vertB[(j+1)%4]; // Loops back to the 0th for the last one

				var d0 = vec3_dot(p0, sn) - d;
				var d1 = vec3_dot(p1, sn) - d;
				
				// Check if they're on opposite sides of the plane
				if ( (d0 * d1) < 0.0)
				{
				  
				    var pX = vec3_add(p0, vec3_scale((vec3_dot(sn, vec3_sub(s0 , p0)) / vec3_dot(sn, vec3_sub(p1 , p0))), vec3_sub(p1 , p0)));

					if (VertInsideFace(vertA, pX))
					{
						temp[numVerts] = pX;
						numVerts++;
					}
				}

				
				if (VertInsideFace(vertA, p0))
				{
					temp[numVerts] = p0;
					numVerts++;
				}
			
			
			}
		}
		
}

	// Remove verts which are very close to each other
	for (var i=0; i<numVerts; i++)
	{
		for (var j=i; j<numVerts; j++)
		{
			if (i!=j)
			{
				var dist = vec3_lengthSquared( vec3_sub( temp[i] , temp[j] ) );

				if (dist < 6.5)                                                         //<--- arbitrary number
				{
					for (var k=j; k<numVerts; k++)
					{
						temp[k] = temp[k+1];
					}
					numVerts--;
				}
			}
		}
	}

    return [ temp, numVerts];

}

/***************************************************************************/


/***************************************************************************/

function ClosestPtPointOBB( point, 
					        idx)
{

    var closestP = [0, 0, 0];
	var q = g_cubes[idx].m_c;
    var m_e = g_cubes[idx].m_e;
    var m_u = g_cubes[idx].m_u;
    var m_c = g_cubes[idx].m_c;
	var d = vec3_sub( point , m_c);

	var dist;

	for (var i = 0; i < 3; i = i + 1)
	{
	    dist = vec3_dot(d, m_u[i]);

	    if (dist > m_e[i]) dist = m_e[i];
	    if (dist < -m_e[i]) dist = -m_e[i];

		q = vec3_add(q, vec3_scale(dist, m_u[i]));
	}

	closestP = q;
    return closestP;
}

/***************************************************************************/

function ClipLinePlane(	verts0,	idx)
{
                                                        

    var vertsX = new Array();

    vertsX[0] = ClosestPtPointOBB(verts0[0], idx);
    vertsX[1] = ClosestPtPointOBB(verts0[1], idx);
	

	return vertsX;
	
}

/***************************************************************************/

function ClosestPointLineLine( 	verts0,	
						     	verts1  ) {
    var vertsX = new Array();
    var numVertX = 2;

    

	var p1 = verts0[0];     //vec
	var q1 = verts0[1];     //vec
	var p2 = verts1[0];     //vec
	var q2 = verts1[1];     //vec

	var d1 = vec3_sub( q1 , p1);       //vec
	var d2 = vec3_sub( q2 , p2);       //vec
	var r  = vec3_sub( p1 , p2);       //vec
	var a = vec3_dot(d1, d1);   //f
	var e = vec3_dot(d2, d2);   //f
	var f = vec3_dot(d2, r);    //f

	var epsilon = 0.0001;

	var s, t; //f
	var  c1, c2; //vec

	if (a <= epsilon && e <= epsilon)
	{
		s = t = 0.0;
		c1 = p1;
		c2 = p2;

		vertsX[0] = c1;
		numVertX = 1;
		return [vertsX, numVertX];
	}

	if (a <= epsilon)
	{
		s = 0.0;
		t = f / e;
		t = clamp(t, 0.0, 1.0);
	}
	else
	{
		var c = vec3_dot(d1, r);
		if (e <= epsilon)
		{
			t = 0.0;
			s = clamp(-c/a, 0.0, 1.0);
		}
		else
		{
			var b = vec3_dot(d1, d2);
			var denom = a*e - b*b;

			if (denom != 0.0)
			{
				s = clamp((b*f - c*e) / denom, 0.0, 1.0);
			}
			else
			{
				s = 0.0;
			}

			t = (b*s + f) / e;

			if (t < 0.0)
			{
				t = 0.0;
				s = clamp(-c / a , 0.0, 1.0);
			}
			else if (t > 1.0)
			{
				t = 1.0;
				s = clamp((b-c) / a, 0.0, 1.0);
			}
		}
	}

	
	c1 = vec3_add(p1,vec3_scale(s,d1));
	c2 = vec3_add(p2,vec3_scale(t,d2));

	vertsX[0] = vec3_scale( .5, vec3_add(c1 , c2) );
	
    numVertX=1;
    return [vertsX, numVertX];
}

/***************************************************************************/

var debugSpheres = new Array();

function CalculateHitPoint(  /*Cube*/   idx0, 
						 /*Cube*/       idx1,
						 /*f*/          penetration,
						/*vec3*/        hitNormal)
{
    var hitPoints = new Array();
    var numHitPoints = 0;

    
	var verts0 = new Array();
	var vertIndex0 = new Array();
	var norm0 = hitNormal;
	var results0 = GetNumHitPoints(  idx0,
									 norm0,
									 penetration);


	var numVerts0 = results0[0];
	verts0 = results0[1];
	vertIndex0 = results0[2];

	var verts1 = new Array();
	var vertIndex1 = new Array();
	var norm1 = vec3_scale( -1, hitNormal );
	var results1 = GetNumHitPoints(     idx1,
									    norm1,
									    penetration);
	var numVerts1 = results1[0];
	verts1 = results1[1];
	vertIndex1 = results1[2];

	// This should never really happen!
	if (numVerts0==0 || numVerts1==0) {
		return;
	}

	var numVertsX		= numVerts0;
	var vertsX          = verts0;

	var cpLineResult;
    
	/*if (numVerts0 >= 4 && numVerts1 >= 4) {


	    var clipVerts = new Array();
	    var clipResult = ClipFaceFaceVerts(     verts0, vertIndex0,             //<----- maybe some more outs needed
							                    verts1, vertIndex1,
							                    clipVerts, numVertsX);

	    vertsX = clipResult[0];
	    numVertsX = clipResult[1];


	} else*/ if (numVerts1 < numVerts0) {

	    numVertsX = numVerts1;
	    vertsX = verts1;
	    hitNormal = vec3_scale(-1, norm1);

	} else if (numVerts1 == 2 && numVerts0 == 2) {

	    var linLineResult = ClosestPointLineLine(verts0, verts1);

	    vertsX = linLineResult[0];
	    numVertsX = linLineResult[1];

	} else if (numVerts0 == 2 && numVerts1 == 4) {

	    cpLineResult = ClipLinePlane(verts0, idx1);
	    vertsX = cpLineResult;
	    numVertsX = 2;

	} else if (numVerts0 == 4 && numVerts1 == 2) {

	    cpLineResult = ClipLinePlane(verts1, idx0);
	    vertsX = cpLineResult;
	    numVertsX = 2;
	} else  {
	    numVertsX = numVerts0;
	    vertsX = verts0;
	}
    


	numVertsX = numVerts0;
	vertsX = verts0;

       
/*
// clear the debug spheres
for (var i = 0; i < debugSpheres.length; i++) {
sceneThree.remove(debugSpheres[i]);
}
debugSpheres = new Array();

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






    return [vertsX, numVertsX];
    
}


var doAlert = 0;

/***************************************************************************/
var cycle = 0;
var step = 0;
var doPause = false;


function /*bool*/ CubeCubeCollisionCheck_PJS(pair) {
    var idx0 = pair[0];
    var idx1 = pair[1];


    // -- OUT VARS ---------------------------------------
    /*D3DXVECTOR3*/var hitPoints = new Array();
    /*int*/var numHitPoints = 0;
    /*float*/var penetrationBox = 0.0;
    /*D3DXVECTOR3*/var hitNormalBox = [0, 0, 0];
    //----------------------------------------------------

    if (idx1 <= idx0)
        return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];


    var cube0 = g_cubes[idx0];
    var cube1 = g_cubes[idx1];
    

    var m_radius0 = cube0.m_radius;
    var m_radius1 = cube1.m_radius;

    var m_e0 = cube0.m_e;
    var m_e1 = cube1.m_e;

    var m_u0 = cube0.m_u;
    var m_u1 = cube1.m_u;

    var m_c0 = cube0.m_c;
    var m_c1 = cube1.m_c;

	// Simple bounding sphere check first
    var len = (m_radius0 + m_radius1);
    var lensq = len * len;
    var diff = vec3_lengthSquared(vec3_sub(m_c1, m_c0));
    if (vec3_lengthSquared(vec3_sub(m_c1, m_c0)) > (len * len)) {
	    
	    return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];
	}    

	var hit = 1;
	var p = 10000.0;
	/*vec3*/ var lnormal = [0,0,0];

	var result;


	result = SpanIntersect(idx0, idx1, m_u0[0], p, lnormal);
	if (result[0] == 0)
	    return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];
	p = result[1];
	lnormal = result[2];

	result = SpanIntersect(idx0, idx1, m_u0[1], p, lnormal);
	if (result[0] == 0)
	    return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];
	p = result[1];
	lnormal = result[2];

	result = SpanIntersect(idx0, idx1, m_u0[2], p, lnormal);
	if (result[0] == 0)
	    return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];
	p = result[1];
	lnormal = result[2];

	result = SpanIntersect(idx0, idx1, m_u1[0], p, lnormal);
	if (result[0] == 0)
	    return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];
	p = result[1];
	lnormal = result[2];

	result = SpanIntersect(idx0, idx1, m_u1[1], p, lnormal);
	if (result[0] == 0)
	    return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];
        //return ret;
	p = result[1];
	lnormal = result[2];

	result = SpanIntersect(idx0, idx1, m_u1[2], p, lnormal);
	if (result[0] == 0)
	    return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];
	p = result[1];
	lnormal = result[2];



	result = SpanIntersect(idx0, idx1, vec3_cross(m_u0[0], m_u1[0]), p, lnormal);
	if (result[0] == 0)
	    return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];
    p = result[1];
    lnormal = result[2];

    result = SpanIntersect(idx0, idx1, vec3_cross(m_u0[0], m_u1[1]), p, lnormal);
    if (result[0] == 0)
        return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];
    p = result[1];
    lnormal = result[2];


    result = SpanIntersect(idx0, idx1, vec3_cross(m_u0[0], m_u1[2]), p, lnormal, false);
    if (result[0] == 0)
        return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];
    p = result[1];
    lnormal = result[2];

    result = SpanIntersect(idx0, idx1, vec3_cross(m_u0[1], m_u1[0]), p, lnormal);
    if (result[0] == 0)
        return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];
    p = result[1];
    lnormal = result[2];


    result = SpanIntersect(idx0, idx1, vec3_cross(m_u0[1], m_u1[1]), p, lnormal);
    if (result[0] == 0)
        return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];
    p = result[1];
    lnormal = result[2];


    result = SpanIntersect(idx0, idx1, vec3_cross(m_u0[1], m_u1[2]), p, lnormal);
    if (result[0] == 0)
        return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];
    p = result[1];
    lnormal = result[2];

    result = SpanIntersect(idx0, idx1, vec3_cross(m_u0[2], m_u1[0]), p, lnormal);
    if (result[0] == 0)
        return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];
    p = result[1];
    lnormal = result[2];

    result = SpanIntersect(idx0, idx1, vec3_cross(m_u0[2], m_u1[1]), p, lnormal);
    if (result[0] == 0)
        return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];
        //return ret;
    p = result[1];
    lnormal = result[2];

    result = SpanIntersect(idx0, idx1, vec3_cross(m_u0[2], m_u1[2]), p, lnormal);
    if (result[0] == 0)
        return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];

    p = result[1];
    lnormal = result[2];

   

	numHitPoints = 0;

	hitPoints = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];




	if ((lnormal[0] != 0 || lnormal[1] != 0 || lnormal[2] != 0) && hit == 1) {

	    //doPause = true;


		var hpResult = CalculateHitPoint(       idx0, 
							                    idx1,
							                    p,
							                    lnormal)


		for (var i = 0; i < 8; i++) {

		    if (hpResult[0][i])
		        hitPoints[i] = hpResult[0][i];

		}


        
        numHitPoints = hpResult[1];

       //trace("hitpoints non ocl " + hitPoints );

		penetrationBox = p;
		hitNormalBox = vec3_scale(-1, lnormal);


    }

//penetrationBox = penetrationBox * 10;
    var ret = [];
    ret[0] = hit;
    ret[1] = hitPoints;
    ret[2] = numHitPoints;
    ret[3] = penetrationBox;
    ret[4] = hitNormalBox;
    return ret;

    //return [hit, hitPoints, numHitPoints, penetrationBox, hitNormalBox];
    
}

function /*bool*/ CubeCubeCollisionCheck(/*cube*/   idx0, 
							/*cube*/                idx1) {


    // -- OUT VARS ---------------------------------------
    /*D3DXVECTOR3*/var hitPoints = new Array();
    /*int*/var numHitPoints = 0;
    /*float*/var penetrationBox = 0.0;
    /*D3DXVECTOR3*/var hitNormalBox = [0, 0, 0];
    //----------------------------------------------------

    if (idx1 <= idx0)
        return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];


	// Simple bounding sphere check first
    var len = (CubeList._m_radius[idx0] + CubeList._m_radius[idx1]);
    var lensq = len * len;
    var diff = vec3_lengthSquared(vec3_sub(CubeList._m_c[idx1], CubeList._m_c[idx0]));
    if (vec3_lengthSquared(vec3_sub(CubeList._m_c[idx1], CubeList._m_c[idx0])) > (len * len)) {
	    
	    return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];
	}    

	var hit = 1;
	var p = 10000.0;
	/*vec3*/ normal = [0,0,0];

	var result;


	result = SpanIntersect(idx0, idx1, CubeList._m_u[idx0][0], p, normal);
	if (result[0] == 0)
	    return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];
	p = result[1];
	normal = result[2];

	result = SpanIntersect(idx0, idx1, CubeList._m_u[idx0][1], p, normal);
	if (result[0] == 0)
	    return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];
	p = result[1];
	normal = result[2];

	result = SpanIntersect(idx0, idx1, CubeList._m_u[idx0][2], p, normal);
	if (result[0] == 0)
	    return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];
	p = result[1];
	normal = result[2];

	result = SpanIntersect(idx0, idx1, CubeList._m_u[idx1][0], p, normal);
	if (result[0] == 0)
	    return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];
	p = result[1];
	normal = result[2];

	result = SpanIntersect(idx0, idx1, CubeList._m_u[idx1][1], p, normal);
	if (result[0] == 0)
	    return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];
	p = result[1];
	normal = result[2];

	result = SpanIntersect(idx0, idx1, CubeList._m_u[idx1][2], p, normal);
	if (result[0] == 0)
	    return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];
	p = result[1];
	normal = result[2];



	result = SpanIntersect(idx0, idx1, vec3_cross(CubeList._m_u[idx0][0], CubeList._m_u[idx1][0]), p, normal);
	if (result[0] == 0)
	    return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];
    p = result[1];
    normal = result[2];

    result = SpanIntersect(idx0, idx1, vec3_cross(CubeList._m_u[idx0][0], CubeList._m_u[idx1][1]), p, normal);
    if (result[0] == 0)
        return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];
    p = result[1];
    normal = result[2];


    result = SpanIntersect(idx0, idx1, vec3_cross(CubeList._m_u[idx0][0], CubeList._m_u[idx1][2]), p, normal, false);
    if (result[0] == 0)
        return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];
    p = result[1];
    normal = result[2];

    result = SpanIntersect(idx0, idx1, vec3_cross(CubeList._m_u[idx0][1], CubeList._m_u[idx1][0]), p, normal);
    if (result[0] == 0)
        return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];
    p = result[1];
    normal = result[2];


    result = SpanIntersect(idx0, idx1, vec3_cross(CubeList._m_u[idx0][1], CubeList._m_u[idx1][1]), p, normal);
    if (result[0] == 0)
        return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];
    p = result[1];
    normal = result[2];


    result = SpanIntersect(idx0, idx1, vec3_cross(CubeList._m_u[idx0][1], CubeList._m_u[idx1][2]), p, normal);
    if (result[0] == 0)
        return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];
    p = result[1];
    normal = result[2];

    result = SpanIntersect(idx0, idx1, vec3_cross(CubeList._m_u[idx0][2], CubeList._m_u[idx1][0]), p, normal);
    if (result[0] == 0)
        return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];
    p = result[1];
    normal = result[2];

    result = SpanIntersect(idx0, idx1, vec3_cross(CubeList._m_u[idx0][2], CubeList._m_u[idx1][1]), p, normal);
    if (result[0] == 0)
        return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];
    p = result[1];
    normal = result[2];

    result = SpanIntersect(idx0, idx1, vec3_cross(CubeList._m_u[idx0][2], CubeList._m_u[idx1][2]), p, normal);
    if (result[0] == 0)
        return [0, hitPoints, numHitPoints, penetrationBox, hitNormalBox];

    p = result[1];
    normal = result[2];

   

	numHitPoints = 0;

	hitPoints = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];




	if ((normal[0] != 0 || normal[1] != 0 || normal[2] != 0) && hit == 1) {

	    doPause = true;


		var hpResult = CalculateHitPoint(       idx0, 
							                    idx1,
							                    p,
							                    normal)


		for (var i = 0; i < 8; i++) {

		    if (hpResult[0][i])
		        hitPoints[i] = hpResult[0][i];

		}


        
        numHitPoints = hpResult[1];

       //trace("hitpoints non ocl " + hitPoints );

		penetrationBox = p;
		hitNormalBox = vec3_scale(-1, normal);


    }

//penetrationBox = penetrationBox * 10;

return [hit, hitPoints, numHitPoints, penetrationBox, hitNormalBox];
    
}

/***************************************************************************/


/***************************************************************************/


function /*bool*/SpanIntersect(                     idx0,
							                        idx1,
                                        /*vec3*/    axisc,
                                        /*float*/   minPenetration, //out
                                        /*vec3*/    axisPenetration//out
                                                    )

{

    /*vec3*/var axis = axisc;
    var lq = vec3_lengthSquared(axis); 
    var ret = [];
    
    if (lq <= 0.02 ) {
        //pen = 100000.0;
        //return [1, minPenetration, axisPenetration];
        ret[0] = 1;
        ret[1] = minPenetration;
        ret[2] = axisPenetration;
        return ret;
    }
    
    axis = vec3_normalize(axis);

    var mina, maxa;
    var minb, maxb;


    var resultA = CalculateInterval(idx0, axis, mina, maxa); // used to get ref out
    mina = resultA[0];
    maxa = resultA[1];

    var resultB = CalculateInterval(idx1, axis, minb, maxb); // used to get ref out
    minb = resultB[0];
    maxb = resultB[1];

    var lena = maxa - mina;
    var lenb = maxb - minb;

    var minv = (mina < minb) ? mina : minb;             //Math.min(mina, minb);
    var maxv = (maxa > maxb) ? maxa : maxb;             //Math.max(maxa, maxb);
    var lenv = maxv - minv;
       

    if (lenv > (lena + lenb)) {       
        // NO Collision
        return [0, minPenetration, axisPenetration];
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
    ret[0] = 1;
    ret[1] = minPenetration;
    ret[2] = axisPenetration;
    return ret;
    //return [1, minPenetration, axisPenetration];
}


function /*void*/CalculateInterval(/*cube*/idx, /*vec3*/axis, /*float*/min, /*float*/max, doDebug) {
    var x = g_cubes[idx].m_e[0];
    var y = g_cubes[idx].m_e[1];
    var z = g_cubes[idx].m_e[2];
    //var y = CubeList._m_e[idx][1];
    //var z = CubeList._m_e[idx][2];
    var Vertex = new Array();
    /*arr<vec3>*/Vertex = [

                            [x, y, -z],
		                    [-x, y, -z],
		                    [x, -y, -z],
		                    [-x, -y, -z],
                            

                            [x, y, z],
		                    [-x, y, z],
		                    [x, -y, z],
		                    [-x, -y, z]
                            ];

    var m_matWorld = g_cubes[idx].m_matWorld;
    for (var i = 0; i < 8; i++) {
        Vertex[i] = vec3_transform_coord(Vertex[i], m_matWorld);
   }

   

    var dot =  vec3_dot(Vertex[0], axis);

    min = dot;
    max = dot;


    for (var i = 0; i < 8; i++) {
        var d = vec3_dot(Vertex[i], axis);

        if (d < min) min = d;
        if (d > max) max = d;
    }

    return [min, max];

}
