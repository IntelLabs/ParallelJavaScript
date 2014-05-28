/*
 * Copyright (c) 2011, Intel Corporation
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without 
 * modification, are permitted provided that the following conditions are met:
 *
 * - Redistributions of source code must retain the above copyright notice, 
 *   this list of conditions and the following disclaimer.
 * - Redistributions in binary form must reproduce the above copyright notice, 
 *   this list of conditions and the following disclaimer in the documentation 
 *   and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE 
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF 
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS 
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) 
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF 
 * THE POSSIBILITY OF SUCH DAMAGE.
 *
 */

var GetImage = function(w, h) {
    var dataType = TypedObject.uint8Clamped.array(w*h, 4);
    var img = new dataType();

    for(var i = 0; i < w*h; i++) {
        img[i][0] = 0;
        img[i][1] = 0;
        img[i][2] = 0;
        img[i][3] = 0;
    }
    return img;
}

var wself;
var World = function() {
    this.xRot = 0;
    this.yRot = 0;
    this.ySin = 0;
    this.xCos = 0;
    this.xSin = 0;
    this.ox = 0;
    this.oy = 0;
    this.oz = 0;
    this.result = null;
    this.PARALLEL = true;

    this.w = 250 * 2;
    this.h =  128 * 2;
    this.len = this.w * this.h;
    this.time_elapsed = 0;
    this.parallelResult = GetImage(this.w, this.h);

    this.map = null;
    this.texmap = null;

    this.map = new Float32Array(64 * 64 * 64);
    this.texmap = new Float32Array(16 * 16 * 3 * 16);
    this.frames = 0;

    this.ctx = document.getElementById('game').getContext('2d');
    wself = this;
    document.getElementById("togglebutton").onclick = this.toggleExecutionMode.bind(this);
    this.init();
}

World.prototype.toggleExecutionMode = function () {
    this.time_elapsed = 0;
    this.frames = 0;
    if(this.PARALLEL) {
        this.PARALLEL = false;
        document.getElementById("togglebutton").innerHTML = "Go Parallel";
    }
    else {
        this.PARALLEL = true;
        document.getElementById("togglebutton").innerHTML = "Go Sequential";
    }
    return false;
}

World.prototype.init = function() {

    var map = this.map;
    var texmap = this.texmap;
    var w = this.w;
    var h = this.h;

    for ( var i = 1; i < 16; i++) {
        var br = 255 - ((Math.random() * 96) | 0);
        for ( var y = 0; y < 16 * 3; y++) {
            for ( var x = 0; x < 16; x++) {
                var color = 0x966C4A;
                if (i == 4)
                    color = 0x7F7F7F;
                if (i != 4 || ((Math.random() * 3) | 0) == 0) {
                    br = 255 - ((Math.random() * 96) | 0);
                }
                if ((i == 1 && y < (((x * x * 3 + x * 81) >> 2) & 3) + 18)) {
                    color = 0x6AAA40;
                } else if ((i == 1 && y < (((x * x * 3 + x * 81) >> 2) & 3) + 19)) {
                    br = br * 2 / 3;
                }
                if (i == 7) {
                    color = 0x675231;
                    if (x > 0 && x < 15
                            && ((y > 0 && y < 15) || (y > 32 && y < 47))) {
                        color = 0xBC9862;
                        var xd = (x - 7);
                        var yd = ((y & 15) - 7);
                        if (xd < 0)
                            xd = 1 - xd;
                        if (yd < 0)
                            yd = 1 - yd;
                        if (yd > xd)
                            xd = yd;

                        br = 196 - ((Math.random() * 32) | 0) + xd % 3 * 32;
                    } else if (((Math.random() * 2) | 0) == 0) {
                        br = br * (150 - (x & 1) * 100) / 100;
                    }
                }

                if (i == 5) {
                    color = 0xB53A15;
                    if ((x + (y >> 2) * 4) % 8 == 0 || y % 4 == 0) {
                        color = 0xBCAFA5;
                    }
                }
                if (i == 9) {
                    color = 0x4040ff;
                }
                var brr = br;
                if (y >= 32)
                    brr /= 2;

                if (i == 8) {
                    color = 0x50D937;
                    if (((Math.random() * 2) | 0) == 0) {
                        color = 0;
                        brr = 255;
                    }
                }

                var col = (((color >> 16) & 0xff) * brr / 255) << 16
                    | (((color >> 8) & 0xff) * brr / 255) << 8
                    | (((color) & 0xff) * brr / 255);
                texmap[x + y * 16 + i * 256 * 3] = col;
            }
        }
    }

    for ( var x = 0; x < 64; x++) {
        for ( var y = 0; y < 64; y++) {
            for ( var z = 0; z < 64; z++) {
                var i = z << 12 | y << 6 | x;
                var yd = (y - 32.5) * 0.4;
                var zd = (z - 32.5) * 0.4;
                map[i] = (Math.random() * 16) | 0;
                if (Math.random() > Math.sqrt(Math.sqrt(yd * yd + zd * zd)) - 0.8)
                    map[i] = 0;
            }
        }
    }

    this.pixels = this.ctx.createImageData(w, h);
    var da = this.pixels.data;

    for ( var i = 0; i < w * h; i++) {
        da[i * 4 + 3] = 255;
    }

    setInterval(this.clock.bind(this), 0);
};
World.prototype.MineKernel = function (e, index, c, handle) {
   
    var w = wself.w;
    var h = wself.h;
    var map = wself.map;
    var texmap = wself.texmap;
    var yCos = wself.yCos;
    var ySin = wself.ySin;
    var xCos = wself.xCos;
    var xSin = wself.xSin;
    var ox = wself.ox;
    var oy = wself.oy;
    var oz = wself.oz;

    var x = Math.floor(index/w);
    var y = index-(x*w);
    var ___xd = (x - w / 2) / h;
    var __yd = (y - h / 2) / h;
    var __zd = 1;

    var ___zd = __zd * yCos + __yd * ySin;
    var _yd = __yd * yCos - __zd * ySin;

    var _xd = ___xd * xCos + ___zd * xSin;
    var _zd = ___zd * xCos - ___xd * xSin;

    var col = 0;
    var br = 255;
    var ddist = 0;

    var closest = 32;
    for ( var d = 0; d < 3; d++) {
        var dimLength = _xd;
        if (d == 1)
            dimLength = _yd;
        if (d == 2)
            dimLength = _zd;

        var ll = 1 / (dimLength < 0 ? -dimLength : dimLength);
        var xd = (_xd) * ll;
        var yd = (_yd) * ll;
        var zd = (_zd) * ll;

        var initial = ox - (ox | 0);
        if (d == 1)
            initial = oy - (oy | 0);
        if (d == 2)
            initial = oz - (oz | 0);
        if (dimLength > 0)
            initial = 1 - initial;

        var dist = ll * initial;

        var xp = ox + xd * initial;
        var yp = oy + yd * initial;
        var zp = oz + zd * initial;

        if (dimLength < 0) {
            if (d == 0)
                xp--;
            if (d == 1)
                yp--;
            if (d == 2)
                zp--;
        }

        while (dist < closest) {
            var tex = map[(zp & 63) << 12 | (yp & 63) << 6 | (xp & 63)];

            if (tex > 0) {
                var u = ((xp + zp) * 16) & 15;
                var v = ((yp * 16) & 15) + 16;
                if (d == 1) {
                    u = (xp * 16) & 15;
                    v = ((zp * 16) & 15);
                    if (yd < 0)
                        v += 32;
                }

                var cc = texmap[u + v * 16 + tex * 256 * 3];
                if (cc > 0) {
                    col = cc;
                    ddist = 255 - ((dist / 32 * 255) | 0);
                    br = 255 * (255 - ((d + 2) % 3) * 50) / 255;
                    closest = dist;
                }
            }
            xp += xd;
            yp += yd;
            zp += zd;
            dist += ll;
        }
    }

    handle[0] = ((col >> 16) & 0xff) * br * ddist / (255 * 255);
    handle[1] = ((col >> 8) & 0xff) * br * ddist / (255 * 255);
    handle[2] = ((col) & 0xff) * br * ddist / (255 * 255); 
    handle[3] = 255;
}

World.prototype.updateTickParams = function () {
    this.xRot = Math.sin(Date.now() % 10000 / 10000 * Math.PI * 2) * 0.4
        + Math.PI / 2;
    this.yRot = Math.cos(Date.now() % 10000 / 10000 * Math.PI * 2) * 0.4;
    this.yCos = Math.cos(this.yRot);
    this.ySin = Math.sin(this.yRot);
    this.xCos = Math.cos(this.xRot);
    this.xSin = Math.sin(this.xRot);
    this.ox = 32.5 + Date.now() % 10000 / 10000 * 64;
    this.oy = 32.5;
    this.oz = 32.5;
    this.frames++;
    wself = this;
}

World.prototype.renderWorldParallel = function() {
    this.updateTickParams();
    this.result = this.parallelResult.mapPar(this.MineKernel);
}

World.prototype.writeWorldtoCanvasContext_viewStorage = function() {
    this.pixels.data = new Uint8ClampedArray(TypedObject.storage(this.result).buffer);
    this.ctx.putImageData(this.pixels, 0, 0);
}
World.prototype.writeWorldtoCanvasContext_copy = function() {
    var f_data = this.pixels.data;
    var pa = this.result;
    var p = 0; var le = this.len;
    for(var i = 0; i < le; i++) {
        f_data[p++] = pa[i][0];
        f_data[p++] = pa[i][1];
        f_data[p++] = pa[i][2];
        f_data[p++] = 255;
    }
    this.ctx.putImageData(this.pixels, 0, 0);
}

World.prototype.clock = function () {
    var start_time = Date.now();
    if(this.PARALLEL) {
        this.renderWorldParallel();
        this.writeWorldtoCanvasContext_copy();
    }
    else {
        this.renderWorldSequential();
        this.ctx.putImageData(this.pixels, 0, 0);
    }
    var frames = this.frames;
    // warmup
    if(frames > 9) {
        this.time_elapsed += Date.now() - start_time;
        document.getElementById("fps").innerHTML = Math.floor((frames-9)*1000/this.time_elapsed) + " fps";
    }
    else {
        document.getElementById("fps").innerHTML = "-- fps";
    }
}

World.prototype.renderWorldSequential = function() {
    this.updateTickParams();
    var w = this.w;
    var h = this.h;
    var map = this.map;
    var texmap = this.texmap;
    var yCos = this.yCos;
    var ySin = this.ySin;
    var xCos = this.xCos;
    var xSin = this.xSin;
    var ox = this.ox;
    var oy = this.oy;
    var oz = this.oz;
    var pixels = this.pixels;
    
    for ( var x = 0; x < w; x++) {
        var ___xd = (x - w / 2) / h;
        for ( var y = 0; y < h; y++) {
            var __yd = (y - h / 2) / h;
            var __zd = 1;

            var ___zd = __zd * yCos + __yd * ySin;
            var _yd = __yd * yCos - __zd * ySin;

            var _xd = ___xd * xCos + ___zd * xSin;
            var _zd = ___zd * xCos - ___xd * xSin;

            var col = 0;
            var br = 255;
            var ddist = 0;

            var closest = 32;
            for ( var d = 0; d < 3; d++) {
                var dimLength = _xd;
                if (d == 1)
                    dimLength = _yd;
                if (d == 2)
                    dimLength = _zd;

                var ll = 1 / (dimLength < 0 ? -dimLength : dimLength);
                var xd = (_xd) * ll;
                var yd = (_yd) * ll;
                var zd = (_zd) * ll;

                var initial = ox - (ox | 0);
                if (d == 1)
                    initial = oy - (oy | 0);
                if (d == 2)
                    initial = oz - (oz | 0);
                if (dimLength > 0)
                    initial = 1 - initial;

                var dist = ll * initial;

                var xp = ox + xd * initial;
                var yp = oy + yd * initial;
                var zp = oz + zd * initial;

                if (dimLength < 0) {
                    if (d == 0)
                        xp--;
                    if (d == 1)
                        yp--;
                    if (d == 2)
                        zp--;
                }

                while (dist < closest) {
                    var tex = map[(zp & 63) << 12 | (yp & 63) << 6 | (xp & 63)];

                    if (tex > 0) {
                        var u = ((xp + zp) * 16) & 15;
                        var v = ((yp * 16) & 15) + 16;
                        if (d == 1) {
                            u = (xp * 16) & 15;
                            v = ((zp * 16) & 15);
                            if (yd < 0)
                                v += 32;
                        }

                        var cc = texmap[u + v * 16 + tex * 256 * 3];
                        if (cc > 0) {
                            col = cc;
                            ddist = 255 - ((dist / 32 * 255) | 0);
                            br = 255 * (255 - ((d + 2) % 3) * 50) / 255;
                            closest = dist;
                        }
                    }
                    xp += xd;
                    yp += yd;
                    zp += zd;
                    dist += ll;
                }
            }

            var r = ((col >> 16) & 0xff) * br * ddist / (255 * 255);
            var g = ((col >> 8) & 0xff) * br * ddist / (255 * 255);
            var b = ((col) & 0xff) * br * ddist / (255 * 255);

            pixels.data[(x + y * w) * 4 + 0] = r;
            pixels.data[(x + y * w) * 4 + 1] = g;
            pixels.data[(x + y * w) * 4 + 2] = b;
        }
    }
}

function init() {
    var t = new World();
}

