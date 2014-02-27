/* Load and construct object tree of textures */


var currentJson;

var numLoaded, numTextures;
var isSingleCube;
var reloadMeshTextureId = "";

function LoadCubeTexture(obj, p_callback, p_isSingleCube, frontFaceOnly, p_makeMaterialOnly) {

    var cubeLoaded = 0;

    isSingleCube = p_isSingleCube;

    var noCache = "";

    var path = "";
    for (var q = 0; q < 6; q++) {

        /* only no-cache if this is a reload */
        if (reloadMeshTextureId)
            if (reloadMeshTextureId != "")
                noCache = "?nocache=" + Math.round(Math.random() * 10000);

        /* create default image if not in data */
        //if (obj.sourceImages[q] == null || obj.sourceImages[q] == undefined) {
            path = "../_assets/brushdefault/";
            obj.sourceImages[q] = "FRONT IMAGE.jpg";
        //} else {
        //    path = Config.service_path;
        //}
        

        obj["image" + q] = new Image();
        obj["image" + q].crossOrigin = "anonymous";

        obj["image" + q].onload = function () {

            numLoaded++;
            cubeLoaded++;

            obj["cubeLoaded"] = cubeLoaded;

          
            if (obj["cubeLoaded"] == 6)
                makeMaterials(obj, p_callback);
            else if (obj["cubeLoaded"] == 6 && p_makeMaterialOnly == true)
                makeMaterialsOnly(obj, p_callback);

        };

        /* if it doesn't exist, use the default image */
        obj["image" + q].onerror = function () {
            trace("image load error! Are you running on a server?");
            numLoaded++;
            cubeLoaded++;

            if (obj["cubeLoaded"] == 6)
                makeMaterials(obj, p_callback, isSingleCube);
        }

        obj["image" + q].src = path + obj.sourceImages[q] + noCache;


        obj["texture" + q] = new THREE.Texture(obj["image" + q ], new THREE.UVMapping(), THREE.RepeatWrapping, THREE.RepeatWrapping, THREE.NearestFilter, THREE.LinearMipMapLinearFilter);

    }


}





/* expects the level data json object */
function LoadTextures(json, p_callback, p_transparency) {

    currentJson = json;
    numTextures = currentJson.data.length * 6;
    numLoaded = 0;

    for (var i = 0; i < currentJson.data.length; i++) {

        var obj = currentJson.data[i];

        if( obj.type = "piece"){

            if( obj.sourceImages == null ) 
                obj.sourceImages = new Array();

            LoadCubeTexture(obj, p_callback, p_transparency);
        }
   }

}

/* adds material data to object */
function makeMaterials(obj, p_callback , isSingleCube, p_transparency  ){

    var transparency = 1;
    if (p_transparency) transparency = p_transparency;

    if (obj.type = "piece") {

            /* add the geo to the obj */
            obj["box"] = new THREE.CubeGeometry(1, 1, 1);

            for (var q = 0; q < 6; q++) {

                if (obj["texture" + q] != null) {

                    /* important! will not show up without update */
                    obj["texture" + q].needsUpdate = true; 

                    obj["mat" + q] = new THREE.MeshBasicMaterial({
                        color: 0xffffff,
                        opacity: transparency,
                        depthTest: true,
                        map: obj["texture" + q]
                    });

                    /* add material to the geo */
                    obj["box"].materials.push(obj["mat" + q]);

                    /* add the material indeces to the box */
                    obj["box"].faces[q].materialIndex = q;
                }
            }

            /* create the mesh and add it to the object */
            obj["mesh"] = new THREE.Mesh(obj["box"], new THREE.MeshFaceMaterial());

                if (!isSingleCube) {

                    if (numLoaded >= numTextures)
                        p_callback(obj, true);
                    else
                        p_callback(obj, false);

                } else if (isSingleCube && numLoaded == 6) {
                    p_callback(obj, true);
                    isSingleCube = false;
                }

            }

}








function makeFrontFaces(json, p_callback) {

    numLoaded = 0;   
    for (var i = 0; i < json.data.length; i++) {
        obj = json.data[i];
        if( obj["sourceImages"] != null )
            buildImage( obj , p_callback)
    }

}

function buildImage ( obj, p_callback ){

        obj["image"] = new Image();
        obj["image"].crossOrigin = "anonymous";

        /* temp, select only image 4 */
        obj["image"].src = Config.service_path + obj.sourceImages[4];

        obj["texture" ] = new THREE.Texture(obj["image"], new THREE.UVMapping(), THREE.RepeatWrapping, THREE.RepeatWrapping, THREE.NearestFilter, THREE.LinearMipMapLinearFilter);

        obj["image"].onload = function () {

            obj["box"] = new THREE.PlaneGeometry(1, 1, 1, 1);

            obj["mat"] = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                depthTest: true,
                //depthWrite: false,
                opacity: 1,
                map: obj["texture"],
                alphaTest: 0.5,
                doubleSided: false
            });



            obj["texture"].needsUpdate = true;
            obj["mat"].map.needsUpdate = true;

            /*obj["box"].faces.doubleSided = true;*/

            /* create the mesh and add it to the object */
            obj["mesh"] = new THREE.Mesh(obj["box"], obj["mat"]);

            p_callback(obj, true);

        }


}



function makeDefaultBrush() {

    var defaultBrush = new Object();
    defaultBrush.id = "brushdefault";
    defaultBrush.title = "default";
    defaultBrush.mass = "1";
    defaultBrush.pointValue = 1;
    
    defaultBrush.rx = 0;
    defaultBrush.ry = 0;
    defaultBrush.rz = 0;

    defaultBrush.sx = 3.5;
    defaultBrush.sy = 10;
    defaultBrush.sz = 2;

    defaultBrush.sourceImages = [
        "_assets/brushdefault/LEFT IMAGE.jpg",
        "_assets/brushdefault/RIGHT IMAGE.jpg",
        "_assets/brushdefault/TOP IMAGE.jpg",
        "_assets/brushdefault/BOTTOM IMAGE.jpg",
        "_assets/brushdefault/FRONT IMAGE.jpg",
        "_assets/brushdefault/BACK IMAGE.jpg"
        ];
    defaultBrush.levelTitle = "default";
    defaultBrush.prefix = "_assets/brushdefault";

    
    return defaultBrush;

}
