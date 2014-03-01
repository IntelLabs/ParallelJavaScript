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



OBBEngine.prototype.ApplyImpulsesOCL = function (/*float*/dt) {


	var c0 = [];
	var c1 = [];
    var _masses = [];
    var _awakes = [];
    var _centers = []
    var _linVels = [];
    var _angVels = [];
    var _invInrts = [];
    var np = [];
    var hpts = [];
    var normals = [];
    var penetrations = [];
    var maxPoints = 30;

    if (g_numCols == 0)
        return;

    for (var i = 0; i < g_numCols; i++) {
        var cp = g_CollisionsArray[i];                    

		c0[i] = cp.box0;
		c1[i] = cp.box1;
        //_masses[i] = [cp.box0.m_mass, cp.box1.m_mass];
        //_awakes[i] = [cp.box0.m_awake ? 1 : 0, cp.box1.m_awake ? 1 : 0];
        //_centers[i] = [cp.box0.m_c, cp.box1.m_c];
        //_linVels[i] = [cp.box0.m_linVelocity, cp.box1.m_linVelocity];
        //_angVels[i] = [cp.box0.m_angVelocity, cp.box1.m_angVelocity];
        //_invInrts[i] = [cp.box0.m_invInertia, cp.box1.m_invInertia];

        np[i] = cp.numPoints;
        if (cp.numPoints > maxPoints) {
            trace("not enough Collision Points:"+maxPoints+"<"+cp.numPoints);
            maxPoints = cp.numPoints;
        }
        normals[i] = [];
        hpts[i] = [];
        penetrations[i] = [];

    }

    for (var i = 0; i < g_numCols; i++) {
        cp = g_CollisionsArray[i];
        for (var r = 0; r < maxPoints; r++) {
            if (r < np[i]) {
                hpts[i][r] = cp.points[r].point;
                normals[i][r] = cp.points[r].normal;
                penetrations[i][r] = cp.points[r].pen;
            } else {
                hpts[i][r] = [0, 0, 0];
                normals[i][r] = [0, 0, 0];
                penetrations[i][r] = 0;
            }
        }
    }


    var temp = new ParallelArray([g_numCols, maxPoints], 
    	ApplyImpulsesKernel, 
    	c0,c1, 
    	CubeList._m_mass, 
    	CubeList._m_awake, 
    	
    	CubeList._m_linVelocity, 
    	CubeList._m_angVelocity,
    	CubeList._m_invInertia, 
    	CubeList._m_c, 
    	np, 
    	hpts, 
    	normals, 
    	penetrations, 
    	dt);
    
    CubeList._m_linVelocity = CubeList._m_linVelocity.combine(1,largerVelocityWithScaleKernel,c0,c1,0,g_numCols,np,temp);
    CubeList._m_angVelocity = CubeList._m_angVelocity.combine(1,largerVelocityWithScaleKernel,c0,c1,1,g_numCols,np,temp);
    CubeList._m_linVelocity = CubeList._m_linVelocity.combine(1,largerVelocityWithScaleKernel,c0,c1,2,g_numCols,np,temp);
    CubeList._m_angVelocity = CubeList._m_angVelocity.combine(1,largerVelocityWithScaleKernel,c0,c1,3,g_numCols,np,temp);
    
}


function largerVelocityWithScaleKernel(iv,c0,c1,resultIndex,numCols,pointCount,deltaResults)
{
	var index = iv[0];
	var collisionIndex;
	var i=0;
	var count=0;
	var delta= [0,0,0];
	for(i=0;i<numCols;i=i+1)
	{
		
		collisionIndex = c0[i];
		if(resultIndex>1)
		{
			collisionIndex = c1[i];
		}
		if( collisionIndex == index)
		{
			for(var r = 0; r < pointCount[i]; r =r+1)
			{
				if(vec3_lengthSquared(deltaResults[i][r][resultIndex])!=0)
				{
					count=count+1;
					delta = vec3_add(delta,deltaResults[i][r][resultIndex]);
				}
			}		
		}
	}
	
	if(count>0){
		if(resultIndex>1){
			return vec3_sub(this[index],vec3_invScale(count,delta));
		} else {
			return vec3_add(this[index],vec3_invScale(count,delta));
		}
	} else {
		return [this[index][0],this[index][1],this[index][2]];
	}
}

function updateAddVelocityWithScaleKernel(iv,count,delta)
{
	var index = iv[0];
	return vec3_add(this[index],vec3_invScale(count[index],delta[index]));
}

function updateSubVelocityWithScaleKernel(iv,count,delta)
{
	var index = iv[0];
	return vec3_sub(this[index],vec3_invScale(count[index],delta[index]));
}

function ApplyImpulsesKernel(iv, boxes0,boxes1,masses, awakes,  linVels, angVels, invInertias, m_c, nps, hpts, normals, pens, dt) {
    	
    var i = iv[0];
    var r = iv[1];
    var c0 = boxes0[i];
    var c1 = boxes1[i];
    var cen = m_c[c0];
    var hitPoint = hpts[i][r];
    var normal = normals[i][r];
    var penetration = pens[i][r];
    
    if (r < nps[i]) {
        if (dt <= 0.0) {
	        return [[0,0,0],[0,0,0],[0,0,0],[0,0,0]];
	    }
	
	    var invMass0 = (masses[c0] > 9999) ? 0.0 : (1.0 / masses[c0]);
	    var invMass1 = (masses[c1] > 9999) ? 0.0 : (1.0 / masses[c1]);
	
	    invMass0 = (awakes[c0]==0) ? 0.0 : invMass0;
	    invMass1 = (awakes[c1]==0) ? 0.0 : invMass1;
	    
	    // Both objects are non movable
	    if ((invMass0 + invMass1) == 0.0)
	        return [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];
	
	   
	    var r0 = vec3_sub(hitPoint, m_c[c0]);
	    var r1 = vec3_sub(hitPoint, m_c[c1]);
	
	    var v0 = vec3_add(linVels[c0], vec3_cross(angVels[c0], r0));
	    var v1 = vec3_add(linVels[c1], vec3_cross(angVels[c1], r1));
	
	    // Relative Velocity
	    var dv = vec3_sub(v0, v1);
	
	
	    // NORMAL Impulse Code --------------------------------------------------
	
	    // Compute Normal Impulse
	    var vn = vec3_dot(dv, normal);
	
	    // Works out the bias to prevent Prevents sinking!
	    var allowedPenetration = 0.1;
	    var biasFactor = 0.1; // 0.1 to 0.3
	    //var biasFactorValue = g_positionCorrection ? biasFactor : 0.0;
	    var biasFactorValue = biasFactor;
	
	    // biasFactorValue = 0;
	
	    var inv_dt = dt > 0.0 ? 1.0 / dt : 0.0;
	    var bias = biasFactorValue * inv_dt * ((0.0 > (penetration - allowedPenetration))?0:(penetration - allowedPenetration));
	    //var bias = biasFactorValue * inv_dt * Math.max(0.0, penetration - allowedPenetration);
	
	    var kNormal = invMass0 + invMass1 +
	
	    vec3_dot(
	        normal,
	        vec3_add(                                                           
	            vec3_cross(vec3_transform_coord(vec3_cross(r0, normal), invInertias[c0]), r0),
	            vec3_cross(vec3_transform_coord(vec3_cross(r1, normal), invInertias[c1]), r1)
	        )
	    );
	
	
	    var massNormal = 1.0 / kNormal;
	    var dPn = massNormal * (-vn + bias);
	    dPn = (dPn>0?dPn: 0.0);
	
	
	    // Apply normal contact impulse
	
	    /*vec3*/var P = vec3_scale(dPn, normal);
	
	    var mappedResult = vec3_transform_coord(vec3_cross(r0, P), invInertias[c0]);
	
	    var linVelocityDelta0 = vec3_scale(invMass0, P);
	    var angularVelocityDelta0 = mappedResult;
	
	    var linVelocityDelta1 = vec3_scale(invMass1, P);
	    var angularVelocityDelta1 = vec3_transform_coord(vec3_cross(r1, P), invInertias[c1]);
	
	
	    
	    // TANGENT  -------------------------------------------------------------------------
	
	    // Work out our tangent vector, with is perpendicular
	    // to our collision normal
	    //var tangent = [0, 0, 0];
	
	    //updated dv?
	    
	    //end
	
	    var tangent = vec3_sub(dv, vec3_scale(vec3_dot(dv, normal), normal));
	    tangent = vec3_normalize(tangent);
	
	    var kTangent = invMass0 + invMass1 +
	
	        vec3_dot(tangent,                                                           
	        vec3_add(
	            vec3_cross(vec3_transform_coord(vec3_cross(r0, tangent), invInertias[c0]), r0),
	            vec3_cross(vec3_transform_coord(vec3_cross(r1, tangent), invInertias[c1]), r1)
	        )
	        );
	
	    var massTangent = 1.0 / kTangent;
	
	
	    var vt = vec3_dot(dv, tangent);
	    var dPt = massTangent * (-vt);
	
	    var l_friction = 0.6 //g_friction
	    var maxPt = l_friction * dPn;
	    dPt = clamp(dPt, -maxPt, maxPt);
	
	
	    // Apply contact impulse
	    P = vec3_scale(dPt, tangent);
	
	    //we're outputing the changes to the velocity here. we'll accumulate them after the kernel runs.
	    linVelocityDelta0 = vec3_add(linVelocityDelta0, vec3_scale(invMass0, P));
	    angularVelocityDelta0 = vec3_add(angularVelocityDelta0, vec3_transform_coord(vec3_cross(r0, P), invInertias[c0]));
	
	    linVelocityDelta1 = vec3_add(linVelocityDelta1, vec3_scale(invMass1, P));
	    angularVelocityDelta1 = vec3_add(angularVelocityDelta1, vec3_transform_coord(vec3_cross(r1, P), invInertias[c1]));
	    return [linVelocityDelta0, angularVelocityDelta0, linVelocityDelta1, angularVelocityDelta1];
        
    } else {
        return [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];
    }

       
}