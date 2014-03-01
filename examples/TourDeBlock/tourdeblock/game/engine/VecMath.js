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



// define quaternion as array-based object
Quaternion = function (x,y,z,w) {

 return [ x || 0,
		  y || 0,
		  z || 0,
		  w !== undefined ? w : 1
        ]
}


function quat_to_mat4 (q) {

    var x2 = q[0] * q[0];
    var y2 = q[1] * q[1];
    var z2 = q[2] * q[2];
    var xy = q[0] * q[1];
    var xz = q[0] * q[2];
    var yz = q[1] * q[2];
    var wx = q[3] * q[0];
    var wy = q[3] * q[1];
    var wz = q[3] * q[2];

	return [ 1.0 - 2.0 * (y2 + z2), 2.0 * (xy - wz), 2.0 * (xz + wy), 0.0,
			2.0 * (xy + wz), 1.0 - 2.0 * (x2 + z2), 2.0 * (yz - wx), 0.0,
			2.0 * (xz - wy), 2.0 * (yz + wx), 1.0 - 2.0 * (x2 + y2), 0.0,
			0.0, 0.0, 0.0, 1.0]

}

function quat_add(q1, q2) {

    return [q1[0] + q2[0], q1[1] + q2[1], q1[2] + q2[2], q1[3] + q2[3]];
}


function quat_mul(q1, q2) {

    return [q1[0] * q2[3] + q1[1] * q2[2] - q1[2] * q2[1] + q1[3] * q2[0],
		 -q1[0] * q2[2] + q1[1] * q2[3] + q1[2] * q2[0] + q1[3] * q2[1],
		 q1[0] * q2[1] - q1[1] * q2[0] + q1[2] * q2[3] + q1[3] * q2[2],
		 -q1[0] * q2[0] - q1[1] * q2[1] - q1[2] * q2[2] + q1[3] * q2[3]];
}

function quat_scale(q, s) {             

    return [q[0] * s, q[1] * s, q[2] * s, q[3] * s];
   
}


function quat_normalize(q) {
       
		var l = Math.sqrt( q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3] );

		if (l == 0) {
                return [0,0,0,0];
		} else {
                l = 1/l;
                return [q[0]*l, q[1]*l, q[2]*l, q[3]*l];
		}
		
}


function quat_setFromEuler(vec3) {

        var quat=[0,0,0,0];
		var c = Math.PI / 360, // 0.5 * Math.PI / 360, // 0.5 is an optimization
		x = vec3[0] * c,
		y = vec3[1] * c,
		z = vec3[2] * c,

		c1 = Math.cos( y  ),
		s1 = Math.sin( y  ),
		c2 = Math.cos( -z ),
		s2 = Math.sin( -z ),
		c3 = Math.cos( x  ),
		s3 = Math.sin( x  ),

		c1c2 = c1 * c2,
		s1s2 = s1 * s2;
		
	  	quat[0] = c1c2 * s3  + s1s2 * c3;
		quat[1] = s1 * c2 * c3 + c1 * s2 * s3;
		quat[2] = c1 * s2 * c3 - s1 * c2 * s3;
        quat[3] = c1c2 * c3  - s1s2 * s3;

        return quat;
 }


 function quat_setFromAxisAngle ( axis, angle ) {
        
        var quat = [0,0,0,0];
		var halfAngle = angle / 2,
			s = Math.sin( halfAngle );

		quat[0] = axis[0] * s;
		quat[1] = axis[1] * s;
		quat[2] = axis[2] * s;
		quat[3] = Math.cos( halfAngle );

		return quat;
}


//-------------------------------------      new mat4 functions  


function mat4_add( m1, m2) {
    var ret = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

        ret[0] = m1[0] + m2[0];
        ret[1] = m1[1] + m2[1];
        ret[2] = m1[2] + m2[2];
        ret[3] = m1[3] + m2[3];
        ret[4] = m1[4] + m2[4];
        ret[5] = m1[5] + m2[5];
        ret[6] = m1[6] + m2[6];
        ret[7] = m1[7] + m2[7];
        ret[8] = m1[8] + m2[8];
        ret[9] = m1[9] + m2[9];
        ret[10] = m1[10] + m2[10];
        ret[11] = m1[11] + m2[11];
        ret[12] = m1[12] + m2[12];
        ret[13] = m1[13] + m2[13];
        ret[14] = m1[14] + m2[14];
        ret[15] = m1[15] + m2[15];
   return ret;
}



function mat4_setTranslation ( x, y, z ) {

    return [1, 0, 0, x,
			0, 1, 0, y,
			0, 0, 1, z,
			0, 0, 0, 1];
}


function mat4_setRotationFromQuaternion ( m, q ) {      

    var x = q[0], y = q[1], z = q[2], w = q[3];
    var x2 = x + x, y2 = y + y, z2 = z + z,
		xx = x * x2, xy = x * y2, xz = x * z2,
		yy = y * y2, yz = y * z2, zz = z * z2,
		wx = w * x2, wy = w * y2, wz = w * z2;

		m[0] = 1 - ( yy + zz );
		m[1] = xy - wz;
		m[2] = xz + wy;

		m[4] = xy + wz;
		m[5] = 1 - ( xx + zz );
		m[6] = yz - wx;

		m[8] = xz - wy;
		m[9] = yz + wx;
		m[10] = 1 - ( xx + yy );

		return m;
	}




	function mat4_scale(m, f) {

	    for (var i = 0; i < 16; i++) {
	        m[i] = m[i] * f;
	    }

	    return m;
	}


    

 function mat4_inverse( m  )
 {
        // from: http://www.nigels.com/glt/doc/matrix4_8cpp-source.html
        // Invert matrix m.  This algorithm contributed by Stephane Rehel
        // <rehel@worldnet.fr>

     
     /* NB. OpenGL Matrices are COLUMN major. */


      var det=0;
      var tmp = []; 
 
        /* Inverse = adjoint / det. (See linear algebra texts.)*/
 
        tmp[0]= m[5] * m[10] - m[6] * m[9];
        tmp[1]= m[6] * m[8] - m[4] * m[10];
        tmp[2]= m[4] * m[9] - m[5] * m[8];
 
        /* Compute determinant as early as possible using these cofactors. */
        det= m[0] * tmp[0] + m[1] * tmp[1] + m[2] * tmp[2];
 
        /* Run singularity test. */
        if (det == 0.0) {           
           return [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
        } 

           var d12, d13, d23, d24, d34, d41;
           var im = [];
 
           det= 1 / det;
 
           /* Compute rest of inverse. */
           tmp[0] = tmp[0] * det;
           tmp[1] = tmp[1] * det;
           tmp[2] = tmp[2] * det;
           tmp[3]  = 0;
 
           im[0]= m[0] * det;
           im[1]= m[1] * det;
           im[2]= m[2] * det;
           im[3]= m[3] * det;
           tmp[4] = im[2] * m[9] - im[1] * m[10];
           tmp[5] = im[0] * m[10] - im[2] * m[8];
           tmp[6] = im[1] * m[8] - im[0] * m[9];
           tmp[7] = 0;
 
           /* Pre-compute 2x2 dets for first two rows when computing */
           /* cofactors of last two rows. */
           d12 = im[0]*m[5] - m[4]*im[1];
           d13 = im[0]*m[6] - m[4]*im[2];
           d23 = im[1]*m[6] - m[5]*im[2];
           d24 = im[1]*m[7] - m[5]*im[3];
           d34 = im[2]*m[7] - m[6]*im[3];
           d41 = im[3]*m[4] - m[7]*im[0];
 
           tmp[8] =  d23;
           tmp[9] = -d13;
           tmp[10] = d12;
           tmp[11] = 0;
 
           tmp[12] = -(m[9] * d34 - m[10] * d24 + m[11] * d23);
           tmp[13] =  (m[8] * d34 + m[10] * d41 + m[11] * d13);
           tmp[14] = -(m[8] * d24 + m[9] * d41 + m[11] * d12);
           tmp[15] =  1;

           tmp = mat4_reflect(tmp);

           return tmp;
   }


   // not used
    function mat4_reflect(m) {
        var out = [];
        out[0] = m[0];
        out[1] = m[4];
        out[2] = m[8];
        out[3] = m[12];
        out[4] = m[1];
        out[5] = m[5];
        out[6] = m[9];
        out[7] = m[13];
        out[8] = m[2];
        out[9] = m[6];
        out[10] = m[10];
        out[11] = m[14];
        out[12] = m[3];
        out[13] = m[7];
        out[14] = m[11];
        out[15] = m[15];
        return out;


    }
    
//-----------------------------------------------  new scaler functions

function clamp(/*float*/v, /*float*/min, /*float*/max) {
    /*float*/var res = v;
    res = v > max ? max : v;
    res = v < min ? min : v;
    return res;
};


function maxf(/*float*/a,/*float*/ b)
{

    if(a>b)
        return a;
    return b;
}

// ----------------------------------------------  new Vec3 functions

function vec3_plus(inOut, vec3) {
   
    return [inOut[0] + vec3[0], inOut[1] + vec3[1], inOut[2] + vec3[2]];
}

function vec3_minus(inOut, vec3) {

    inOut[0] = inOut[0] - vec3[0];
    inOut[1] = inOut[1] - vec3[1];
    inOut[2] = inOut[2] - vec3[2];
    return inOut;
}

function vec3_timesEquals(inOut, f) {

    inOut[0] = inOut[0] * f;
    inOut[1] = inOut[1] * f;
    inOut[2] = inOut[2] * f;
    return inOut;
}

function vec3_divideEquals(inOut, f) {
    if (f == 0) { return; }

    var inv = 1/f;
    inOut[0] = inOut[0] * inv;
    inOut[1] = inOut[1] * inv;
    inOut[2] = inOut[2] * inv;
    return inOut;
}


function vec3_invScale(f, v) {
    if (f == 0) return v;
    var inv = 1 / f;
    
    return [v[0] * inv, v[1] * inv, v[2] * inv];
}


/*D3DXVecTransformCoord */
function vec3_transform_coord(v, m) {
    
    //var out = new Array();
    var vx = v[0], vy = v[1], vz = v[2];
	var	d = 1 / (m[12] * vx + m[13] * vy + m[14] * vz + m[15]); //<------ use this for "transform coord" (project it back)

    var out0 = (m[0] * vx + m[1] * vy + m[2] * vz + m[3]) * d;
    var out1 = (m[4] * vx + m[5] * vy + m[6] * vz + m[7]) * d;
    var out2 = (m[8] * vx + m[9] * vy + m[10] * vz + m[11]) * d;

    return [out0,out1,out2];
}

/* c++ Vec3 * Mat4 */
function vec3_transform(v, m) {

    var x,y,z,w;

    x = v[0] * m[0] + v[1] * m[4] + v[2] * m[8] + m[12];
    y = v[0] * m[1] + v[1] * m[5] + v[2] * m[9] + m[13];
    z = v[0] * m[2] + v[1] * m[6] + v[2] * m[10] + m[11];
    
    return [x, y, z];
}

// ------ modified vec3

function vec3_normalize(v) {

    var d = vec3_length(v);
    if (d != 0)
        return [v[0] / d, v[1] / d, v[2] / d];
   
    return [0,0,0];
    
};


// vector math on vec3
function vec3_addScalar(v1, f) {
    return [v1[0] + f, v1[1] + f, v1[2] + f];
};



//------------------------------------   EXISTING INTEL METHODS ------------------------------------------------------





// vector math on vec3
function vec3_add(v1, v2) {
    return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]];
};

function vec3_sub(v1, v2) {
    return [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]];
};
           

function vec3_cross(v1, v2) {
    return      [v1[1] * v2[2] - v1[2] * v2[1],
                v1[2] * v2[0] - v1[0] * v2[2],
                v1[0] * v2[1] - v1[1] * v2[0]];

};



function vec3_lengthSquared(v) {
    return v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
};

function vec3_length(v) {
    return Math.sqrt(vec3_lengthSquared(v));
};



function vec3_scale(s, v) {
    return [s * v[0], s * v[1], s * v[2]];
};

function vec3_scaleAdd(s, v1, v2) {
    return [s * v1[0] + v2[0],
                s * v1[1] + v2[1],
                s * v1[2] + v2[2]];
};

function vec3_dot(v1, v2) {
    return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
};

function vec3_negate(v) {
    return [-v[0], -v[1], -v[2]];
};

function vec3_equals(v1, v2) {
    return (v1[0] == v2[0]) && (v1[1] == v2[1]) && (v1[2] == v2[2]);
};

// vector math on quaternions
function quat4_absolute(q) {
    return [Math.abs(q[0]), Math.abs(q[1]), Math.abs(q[2]), Math.abs(q[3])];
};

function quat4_mul(q1, q2) {
    return [q1[0] * q2[3] + q1[3] * q2[0] + q1[1] * q2[2] - q1[2] * q2[1],
            q1[1] * q2[3] + q1[3] * q2[1] + q1[2] * q2[0] - q1[0] * q2[2],
            q1[2] * q2[3] + q1[3] * q2[2] + q1[0] * q2[1] - q1[1] * q2[0],
            q1[3] * q2[3] + q1[0] * q2[0] - q1[1] * q2[1] - q1[2] * q2[2]];
};

function quat4_norm(q) {
    return q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3];
};

function quat4_normalize(q) {
    var n = Math.sqrt(quat4_norm(q));
    return [q[0] / n, q[1] / n, q[2] / n, q[3] / n];
};

// matrix math on mat3
function mat3_transform(m, v) {
    return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
                m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
                m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
}

function mat3_mul(m1, m2) {
    return [m1[0] * m2[0] + m1[1] * m2[3] + m1[2] * m2[6],
                m1[0] * m2[1] + m1[1] * m2[4] + m1[2] * m2[7],
                m1[0] * m2[2] + m1[1] * m2[5] + m1[2] * m2[8],
                m1[3] * m2[0] + m1[4] * m2[3] + m1[5] * m2[6],
                m1[3] * m2[1] + m1[4] * m2[4] + m1[5] * m2[7],
                m1[3] * m2[2] + m1[4] * m2[5] + m1[5] * m2[8],
                m1[6] * m2[0] + m1[7] * m2[3] + m1[8] * m2[6],
                m1[6] * m2[1] + m1[7] * m2[4] + m1[8] * m2[7],
                m1[6] * m2[2] + m1[7] * m2[5] + m1[8] * m2[8]];
};

function mat3_transpose(m) {
    return [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
};

function mat3_getRow(m, r) {
    return [m[r * 3], m[r * 3 + 1], m[r * 3 + 2]];
};

function mat3_setRow(m, r, v) {
    if (r == 0) {
        return [v[0], v[1], v[2], m[3], m[4], m[5], m[6], m[7], m[8]];
    } else if (r == 1) {
        return [m[0], m[1], m[2], v[0], v[1], v[2], m[6], m[7], m[8]];
    } else if (r == 2) {
        return [m[0], m[1], m[2], m[3], m[4], m[5], v[0], v[1], v[2]];
    } else {
        return m;
    }
};

function mat3_identity() {
    return [1, 0, 0, 0, 1, 0, 0, 0, 1];
};

// matrix math on mat4
function mat4_rotX(angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    return [1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1];
};

function mat4_rotY(angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    return [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1];
};

function mat4_rotZ(angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    return [c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
};
/*
changed to use above
function mat4_transform(m, v) {
return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2] + m[3] * v[3],
m[4] * v[0] + m[5] * v[1] + m[6] * v[2] + m[7] * v[3],
m[8] * v[0] + m[9] * v[1] + m[10] * v[2] + m[11] * v[3],
m[12] * v[0] + m[13] * v[1] + m[14] * v[2] + m[15] * v[3]];
};
*/
function mat4_mul(m1, m2) {
    

    return [m1[0] * m2[0] + m1[1] * m2[4] + m1[2] * m2[8] + m1[3] * m2[12],
            m1[0] * m2[1] + m1[1] * m2[5] + m1[2] * m2[9] + m1[3] * m2[13],
            m1[0] * m2[2] + m1[1] * m2[6] + m1[2] * m2[10] + m1[3] * m2[14],
            m1[0] * m2[3] + m1[1] * m2[7] + m1[2] * m2[11] + m1[3] * m2[15],
	        m1[4] * m2[0] + m1[5] * m2[4] + m1[6] * m2[8] + m1[7] * m2[12],
            m1[4] * m2[1] + m1[5] * m2[5] + m1[6] * m2[9] + m1[7] * m2[13],
            m1[4] * m2[2] + m1[5] * m2[6] + m1[6] * m2[10] + m1[7] * m2[14],
            m1[4] * m2[3] + m1[5] * m2[7] + m1[6] * m2[11] + m1[7] * m2[15],
	        m1[8] * m2[0] + m1[9] * m2[4] + m1[10] * m2[8] + m1[11] * m2[12],
            m1[8] * m2[1] + m1[9] * m2[5] + m1[10] * m2[9] + m1[11] * m2[13],
            m1[8] * m2[2] + m1[9] * m2[6] + m1[10] * m2[10] + m1[11] * m2[14],
            m1[8] * m2[3] + m1[9] * m2[7] + m1[10] * m2[11] + m1[11] * m2[15],
	        m1[12] * m2[0] + m1[13] * m2[4] + m1[14] * m2[8] + m1[15] * m2[12],
            m1[12] * m2[1] + m1[13] * m2[5] + m1[14] * m2[9] + m1[15] * m2[13],
            m1[12] * m2[2] + m1[13] * m2[6] + m1[14] * m2[10] + m1[15] * m2[14],
            m1[12] * m2[3] + m1[13] * m2[7] + m1[14] * m2[11] + m1[15] * m2[15]];
};

function mat4_getRotationScale(m) {
    return [m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]];
};



function vec3_applyRotationMatrix(p_input, m) {   //<--------    this does not work correctly. attempting to apply a 4x4 to a 3

    var input = p_input;

    var cosY = Math.cos(input.y);

    input.y = Math.asin(m[2]);

    if (Math.abs(cosY) > 0.00001) {
        input.x = Math.atan2(-m[6] / cosY, m[8] / cosY);
        input.z = Math.atan2(-m[1] / cosY, m[0] / cosY);
    } else {
        input.x = 0;
        input.z = Math.atan2(m[5], m[6]);
    }

    return input;
}