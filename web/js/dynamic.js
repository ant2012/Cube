function CubeInstance(viewport){
    //turns on\off js console debug output
    this.isDebugMode = false;

    this.viewport = viewport;
    this.infoBox = $(viewport).find('.infoBox')[0];
    this.domObject = $(viewport).find('.grid')[0];
    this.faces = new Faces();
    this.matrix = new THREE.Matrix4();

    this.mouseVector;

    this.autoRotateToNearestFace = true;

    this.init = function(){

        var slicesContainer = $(this.domObject).find('.slices')[0];
        var slicesArray = $(slicesContainer).find('.slice');
        var cubeArray = $('.cube');

        //Cube size
        var cubeMaximumSize = 600;

        $(this.viewport).css("perspective", 2*cubeMaximumSize+"px");

        var zCount = slicesArray.length;
        var firstSliceLines = $(slicesArray[0]).find('.line');
        var xCount = firstSliceLines.length;
        var firstLineCubes = $(firstSliceLines[0]).find('.cube');
        var yCount = firstLineCubes.length;

        var maxDimCount = Math.max(xCount, yCount, zCount);
        var cubeSize = cubeMaximumSize/maxDimCount;
        var marginUnit = 0.1*cubeSize;

        $('.slices').css("width", (xCount*(cubeSize + marginUnit)+10) + "px");
        $('.slices').css("height", (yCount*(cubeSize + marginUnit)) + "px");
        $('.line').css("margin", "0 "+marginUnit/2+"px 0");

        $('.cube')
            .css("margin-top", marginUnit+"px")
            .css("margin-bottom", marginUnit+"px")
            .css("height", cubeSize+"px")
            .css("width", cubeSize+"px");
        $('.cube div')
            .css("height", 0.8*cubeSize+"px")
            .css("width", 0.8*cubeSize+"px")
            .css("padding", marginUnit+"px");

        //Dynamic Coloring
        var index1Array = $('.cube').map(function(index, item){
            return $(item).data().index1;
        });
        var index1MaxVal = Array.max(index1Array);
        var index1MinVal = Array.min(index1Array);
        var colorPerUnit = 200 / (index1MaxVal - index1MinVal);

        $('.cube').each(function(index, item){
            var itemColorValue = parseInt(255 - ($(item).data().index1 - index1MinVal) * colorPerUnit);
            $(item).find('div').css("background-color", "rgba("+itemColorValue+", "+itemColorValue+", 255, 0.85)");
            //$(item).find('div').css("background-color", "rgba("+itemColorValue+", 255, "+itemColorValue+", 0.85)");
            //$(item).find('div').css("background-color", "rgba(255, "+itemColorValue+", "+itemColorValue+", 0.85)");

            $(item).find('div').hover(function(e){
                var obj = e.target;
                var parentCube = $(obj).parents('.cube')[0];
                obj = $(parentCube).find('div');
                $(obj).css("background-color", "rgba(220, 220, 255, 1)");
            }, function(e){
                var obj = e.target;
                var parentCube = $(obj).parents('.cube')[0];
                obj = $(parentCube).find('div');
                $(obj).css("background-color", "rgba("+itemColorValue+", "+itemColorValue+", 255, 0.85)");
            });
        });

        var translateZ = " translateZ("+cubeSize/2+"px)";

        var starterTransform = $('.front').css("transform");
        setTransformStyleToClass('.front', starterTransform + translateZ);

        starterTransform = $('.back').css("transform");
        setTransformStyleToClass('.back', starterTransform + translateZ);

        starterTransform = $('.top').css("transform");
        setTransformStyleToClass('.top', starterTransform + translateZ);

        starterTransform = $('.bottom').css("transform");
        setTransformStyleToClass('.bottom', starterTransform + translateZ);

        starterTransform = $('.left').css("transform");
        setTransformStyleToClass('.left', starterTransform + translateZ);

        starterTransform = $('.right').css("transform");
        setTransformStyleToClass('.right', starterTransform + translateZ);

        //Construct and transit slices
        slicesArray.each(function(index, element){
                var slicePositionZ = (cubeSize + marginUnit)*$(element).data().sliceNum;
                setTransformStyle(element, "translateZ(-"+slicePositionZ+"px)")
            }
        );
        var gridTranslateZ = ((cubeSize + marginUnit)*(zCount - 1))/2;
        setTransformStyle(slicesContainer, "translateZ("+gridTranslateZ+"px)");

        //subscribe events
        var iceCube = this;
        $(viewport).on('mousedown', function(evt) {
            iceCube.mouseDown(evt);

            $(document).on('mousemove', function(evt) {
                iceCube.drag(evt);
            });

            $(document).on('mouseup', function (evt) {
                iceCube.mouseUp(evt);
                $(document).off('mousemove');
            });
        });
        console.log("Cube instance created");
    };

    // X,Y - 2d vector of mouse's movement
    this.rotateByMouse = function(x, y){
        if(this.isDebugMode)console.log("Rotate by mouse: dX="+x+"; dY="+y);
        var normal = new THREE.Vector3(-y, x, 0).normalize();
        var degree = Math.sqrt(x*x + y*y);
        var rotationMatrix = new THREE.Matrix4().makeRotationAxis(normal,toRadians(degree));
        this.matrix.multiplyMatrices(rotationMatrix, this.matrix);
        var matrixStyle = constructStyle(this.matrix);
        setTransformStyle(this.domObject, matrixStyle);
        this.setInfo();
    };

    //X, Y, Z - is Euler rotation angles about axes
    //rotate viewport from starting position (none relative)
    this.rotateToAngles = function(angles){
        if(this.isDebugMode)console.log("Rotate by angles: dX="+angles.x+"; dY="+angles.y+"; dZ="+angles.z);
        setTransitionStyle(this.domObject, "transform 1s ease");
        var x = toRadians(angles.x);
        var y = toRadians(angles.y);
        var z = toRadians(angles.z);

        var rotationX = new THREE.Matrix4().makeRotationX(x);
        var rotationY = new THREE.Matrix4().makeRotationY(y);
        var rotationZ = new THREE.Matrix4().makeRotationZ(z);

        this.matrix = new THREE.Matrix4().multiply(rotationX).multiply(rotationY).multiply(rotationZ);
        var matrixStyle = constructStyle(this.matrix);
        setTransformStyle(this.domObject, matrixStyle);
        this.setInfo();
    };

    this.showFace = function(faceName){
        var face = this.faces.getByName(faceName);
        this.rotateToAngles(face.angles);
    };

    //Fill InfoBox
    this.setInfo = function(){
        if(!this.infoBox)return false;
        var eulerState = new THREE.Euler().setFromRotationMatrix(this.matrix);
        var x = toDegree(eulerState.x).toFixed(2);
        var y = toDegree(eulerState.y).toFixed(2);
        var z = toDegree(eulerState.z).toFixed(2);

        var nearestFace = "<label>Nearest Face="+this.faces.getNearest(this.matrix).name+"</label><br/>";
        this.infoBox.innerHTML = nearestFace + "<label>dX = "+x+"deg; dY = "+y+"deg; dZ = "+z+"deg;</label>";
    };

    //Events
    this.mouseDown = function(evt){
        if($(evt.target).is('a, iframe'))return true;
        if(this.isDebugMode)console.log("Starter mouseDown: pageX="+evt.pageX+"; pageY="+evt.pageY);

        this.mouseVector = new MouseVector(evt.pageX, evt.pageY);
        setTransitionStyle(this.domObject, "transform");
    };
    this.mouseUp = function(evt){
        if(this.mouseVector.isFinalized)return true;
        this.mouseVector.finalize(evt.pageX, evt.pageY);
        if(this.mouseVector.isNull)return true;
        if(this.isDebugMode){
            console.log("Final mouseUp: pageX="+evt.pageX+"; pageY="+evt.pageY);
            console.log("Final mouseUp: evt.target=" +evt.target.className);
        }

        this.simpleSlowDown();
        this.showNearestFace();
    };
    this.drag = function(evt) {
        evt.preventDefault();
        this.mouseVector.drag(evt.pageX, evt.pageY);
        this.rotateByMouse(this.mouseVector.dragX, this.mouseVector.dragY);
    };

    //After user interaction
    this.simpleSlowDown = function(){
        if(this.isDebugMode)console.log("Simple SlowDown: X="+this.mouseVector.x+"; Y="+this.mouseVector.y);
        setTransitionStyle(this.domObject, "transform 300ms ease-out");
        this.rotateByMouse(this.mouseVector.x, this.mouseVector.y);
    };
    this.showNearestFace = function(){
        if(!this.autoRotateToNearestFace)return;
        var nearestFace = this.faces.getNearest(this.matrix);
        this.rotateToAngles(nearestFace.angles);
    };

    this.init();
}

function Faces(){
    this.facesArray = [
        {
            name: "front",
            normal: new THREE.Vector3(0,0,1),
            angles: {x: 0, y: 0, z: 0}
        },
        {
            name: "back",
            normal: new THREE.Vector3(0,0,-1),
            angles: {x: 0, y: 180, z: 0}
        },
        {
            name: "top",
            normal: new THREE.Vector3(0,-1,0),
            angles: {x: -90, y: 0, z: 0}
        },
        {
            name: "bottom",
            normal: new THREE.Vector3(0,1,0),
            angles: {x: 90, y: 0, z: 0}
        },
        {
            name: "left",
            normal: new THREE.Vector3(-1,0,0),
            angles: {x: 0, y: 90, z: 0}
        },
        {
            name: "right",
            normal: new THREE.Vector3(1,0,0),
            angles: {x: 0, y: -90, z: 0}
        }
    ];
    this.cameraVector = new THREE.Vector3(0,0,1);

    this.getNearest = function (matrix){
        var nearestNumber = 0;
        var maxProjection = 0;
        for(var i=0;i<6;i++){
            var face = this.facesArray[i];
            face.onCameraProjection = face.normal.clone().applyMatrix4(matrix).projectOnVector(this.cameraVector).z;
            if(face.onCameraProjection>maxProjection){
                maxProjection = face.onCameraProjection;
                nearestNumber = i;
            }
        }
        return this.facesArray[nearestNumber];
    };
    this.getByName = function(name){
        for(var i=0;i<6;i++){
            var face = this.facesArray[i];
            if(name == face.name)return face;
        }
        return false;
    };
}

function MouseVector(xStart, yStart){
    this.normalizationCoeff = 10;
    this.start = new MousePoint(xStart, yStart);
    this.last = this.start.clone();

    this.dragX = 0;
    this.dragY = 0;
    this.x = 0;
    this.y = 0;

    this.isFinalized = false;
    this.isNull = true;

    this.drag = function(xDrag, yDrag){
        var movementScaleFactor = 3;

        this.dragX = (xDrag - this.last.x)/movementScaleFactor;
        this.dragY = (yDrag - this.last.y)/movementScaleFactor;
        this.last.x = xDrag;
        this.last.y = yDrag;
    };

    this.finalize = function(xEnd, yEnd){
        this.isFinalized = true;
        this.last = new MousePoint(xEnd, yEnd);

        var dX = this.last.x - this.start.x;
        var dY = this.last.y - this.start.y;

        var abs = Math.sqrt(dX*dX+dY*dY);
        if(abs==0)return true;

        this.isNull = false;
        this.x = dX/abs*this.normalizationCoeff;
        this.y = dY/abs*this.normalizationCoeff;
    };
}

function MousePoint(x, y){
    this.x = x;
    this.y = y;
    this.clone = function(){
        return new MousePoint(this.x, this.y);
    }
}

function constructStyle(matrix){
    var style = "matrix3d(";
    for(var i = 0; i < 16; i++){
        style += matrix.elements[i];
        if(i < 15)style += ",";
    }
    style += ")";
    return style;
}

function setTransformStyleToClass(className, style){
    $(className).css("WebkitTransform", style);
    $(className).css("MozTransform", style);
    $(className).css("OTransform", style);
    $(className).css("msTransform", style);
    $(className).css("transform", style);
}

function setTransformStyle(obj, style){
    obj.style.WebkitTransform = style;
    obj.style.MozTransform    = style;
    obj.style.OTransform      = style;
    obj.style.msTransform     = style;
    obj.style.transform       = style;
}

function setTransitionStyle(obj, style){
    obj.style.webkitTransition = style;
    obj.style.mozTransition    = style;
    obj.style.oTransition      = style;
    obj.style.transition       = style;
}

function toRadians (angle) {
    return angle * (Math.PI / 180);
}

function toDegree (angle) {
    return angle / (Math.PI / 180);
}

Array.max = function( array ){
    return Math.max.apply( Math, array );
};

// Function to get the Min value in Array
Array.min = function( array ){
    return Math.min.apply( Math, array );
};

function setAlpha(obj, alpha){
    if(obj.tagName!='DIV')return;
    var baseColor = $(obj).css("background-color");
    var rgb = rgb2hex(baseColor);
    var newColor = "rgba("+rgb.R+", "+rgb.G+", "+rgb.B+", "+alpha+")";
    $(obj).css("background-color", newColor);
};

function rgb2hex(rgb){
    rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
    return {R:parseInt(rgb[1],10), G:parseInt(rgb[2],10), B:parseInt(rgb[3],10)};
}