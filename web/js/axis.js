function CubeInstance(viewport, data){
    //turns on\off js console debug output
    this.isDebugMode = false;

    this.viewport = viewport;
    this.dataSet = new CubeDataSet(data);
    this.faceHeader = $(viewport).find('.faceHeader')[0];
    this.topAxis = $(viewport).find('.topAxis')[0];
    this.leftAxis = $(viewport).find('.leftAxis')[0];
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
        this.cubeSize = cubeSize;
        var marginUnit = 0.1*cubeSize;
        this.marginUnit = marginUnit;

        $('.grid').css("width", (xCount*(cubeSize + marginUnit)) + "px");
        $('.grid').css("height", (yCount*(cubeSize + marginUnit)+marginUnit) + "px");
        $('.slices').css("width", (xCount*(cubeSize + marginUnit)) + "px");
        $('.slices').css("height", (yCount*(cubeSize + marginUnit)+marginUnit) + "px");
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
        var index1Difference = index1MaxVal - index1MinVal;

        var color1 = rgb(255, 255, 255);
        var color2 = rgb(21, 92, 153);

        var hoverColor1 = rgb(255, 255, 204);
        var hoverColor2 = rgb(240, 173, 78);

        $('.cube').each(function(index, item){
            var itemColorPercent = ($(item).data().index1 - index1MinVal)/index1Difference;

            var itemColorValue = getGradientPoint(color1, color2, itemColorPercent);
            var itemHoverColorValue = getGradientPoint(hoverColor1, hoverColor2, itemColorPercent);
            $(item).find('div').css("background-color", "rgba("+itemColorValue.red+", "+itemColorValue.green+", "+itemColorValue.blue+", 1)");
            $(item).find('div').find('.dimList').css("color", "rgba("+itemColorValue.red+", "+itemColorValue.green+", "+itemColorValue.blue+", 1)");

            $(item).find('div').hover(function(e){
                var obj = e.target;
                var parentCube = $(obj).parents('.cube')[0];
                obj = $(parentCube).find('div');
                $(obj).css("background-color", "rgba("+itemHoverColorValue.red+", "+itemHoverColorValue.green+", "+itemHoverColorValue.blue+", 1)");
                $(obj).find('.dimList').css("color", "rgba("+0+", "+0+", "+0+", 1)");
            }, function(e){
                var obj = e.target;
                var parentCube = $(obj).parents('.cube')[0];
                obj = $(parentCube).find('div');
                $(obj).css("background-color", "rgba("+itemColorValue.red+", "+itemColorValue.green+", "+itemColorValue.blue+", 1)");
                $(obj).find('.dimList').css("color", "rgba("+itemColorValue.red+", "+itemColorValue.green+", "+itemColorValue.blue+", 1)");
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

        $(this.faceHeader).css("width", (1.1*cubeMaximumSize-20+marginUnit) + "px");
        setTransformStyle(this.faceHeader, "translateZ("+cubeMaximumSize/2+"px)");

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
        this.showFace("front");
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
        setTransitionStyle(this.domObject, "1s ease");
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
        this.activateFaceInfo(face);
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
        setTransitionStyle(this.domObject, "");
    };
    this.mouseUp = function(evt){
        if(this.mouseVector.isFinalized)return true;
        this.mouseVector.finalize(evt.pageX, evt.pageY);
        if(this.mouseVector.isNull)return true;
        if(this.isDebugMode){
            console.log("Final mouseUp: pageX="+evt.pageX+"; pageY="+evt.pageY);
            console.log("Final mouseUp: evt.target=" +evt.target.className);
        }

        //this.simpleSlowDown();
        this.showNearestFace();
    };
    this.drag = function(evt) {
        this.deActivateFaceInfo();
        evt.preventDefault();
        this.mouseVector.drag(evt.pageX, evt.pageY);
        this.rotateByMouse(this.mouseVector.dragX, this.mouseVector.dragY);
    };

    //After user interaction
    this.simpleSlowDown = function(){
        if(this.isDebugMode)console.log("Simple SlowDown: X="+this.mouseVector.x+"; Y="+this.mouseVector.y);
        setTransitionStyle(this.domObject, "300ms ease-out");
        this.rotateByMouse(this.mouseVector.x, this.mouseVector.y);
    };
    this.showNearestFace = function(){
        if(!this.autoRotateToNearestFace)return;
        var nearestFace = this.faces.getNearest(this.matrix);
        this.showFace(nearestFace.name);
    };
    this.activateFaceInfo = function(face){
        //Face Header
        $(this.faceHeader).toggleClass('faceHeaderUndefined', false);
        var fixedDimName = this.dataSet.getFaceFixedDimName(face);
        var fixedDimValue = this.dataSet.getFaceFixedDimValue(face);
        this.faceHeader.innerText = fixedDimName + "=" + fixedDimValue;
        //Axis
        this.constructAxis(face);
        $('.axis').toggleClass('axisUndefined', false);

        //Cubes faces
        //switch (face.fixedDimension){
        //    case "slicesDimension1":
        //        $(this.domObject).find('.dim1').css("text-decoration", "line-through").css("color", "rgba(1, 1, 1, 0.4)");
        //        $(this.domObject).find('.dim2').css("text-decoration", "none").css("color", "#000");
        //        $(this.domObject).find('.dim3').css("text-decoration", "none").css("color", "#000");
        //        break;
        //    case "cubesDimension2":
        //        $(this.domObject).find('.dim1').css("text-decoration", "none").css("color", "#000");
        //        $(this.domObject).find('.dim2').css("text-decoration", "line-through").css("color", "rgba(1, 1, 1, 0.4)");
        //        $(this.domObject).find('.dim3').css("text-decoration", "none").css("color", "#000");
        //        break;
        //    case "linesDimension3":
        //        $(this.domObject).find('.dim1').css("text-decoration", "none").css("color", "#000");
        //        $(this.domObject).find('.dim2').css("text-decoration", "none").css("color", "#000");
        //        $(this.domObject).find('.dim3').css("text-decoration", "line-through").css("color", "rgba(1, 1, 1, 0.4)");
        //        break;
        //}
    };

    this.deActivateFaceInfo = function(){
        //Face Header
        $(this.faceHeader).toggleClass('faceHeaderUndefined', true);
        //Axis
        $('.axis').toggleClass('axisUndefined', true);
        $('.axisSplitter').css("background-color", "rgba(255, 255, 255, 0)")
        //Cubes faces
        //$(this.domObject).find('.dim1').css("text-decoration", "none").css("color", "#000");
        //$(this.domObject).find('.dim2').css("text-decoration", "none").css("color", "#000");
        //$(this.domObject).find('.dim3').css("text-decoration", "none").css("color", "#000");
    };

    this.constructTopAxis = function(face){
        var dimNumber = this.dataSet.getTopDimNumber(face);
        var dimValues = this.dataSet.getTopDimValues(face);
        var faceDeepness = this.dataSet.getFaceDeepness(face);
        var maxDimCount = this.dataSet.getMaxDimCount();
        var faceHeight = this.dataSet.getFaceHeight(face);
        var diffY = maxDimCount - faceHeight;
        var marginUnit = this.marginUnit;
        $(".topAxis").empty();
        $(".topAxis").css("width", this.cubeSize*dimValues.length + marginUnit*(dimValues.length - 1)+"px");
        var transformProperty = "translateZ("+(this.cubeSize*faceDeepness + marginUnit*(faceDeepness - 1))/2+"px)" + " translateY("+(diffY*(this.cubeSize + marginUnit))/2+"px)";
        setTransformStyleToClass(".topAxis", transformProperty);
        $.each(dimValues, function(dimIndex, dim){
            if(dimIndex>0){
                var splitter = $('<div class="axisSplitter">').appendTo($(".topAxis"));
                splitter[0].innerHTML = "&nbsp;";
            }
            var dimDiv = $('<div class="axisDim">')
                .appendTo($(".topAxis"));
            dimDiv[0].innerText = dim;

            $(dimDiv).hover(function(e){
                var obj = e.target;
                var dimValue = obj.innerText;
                $(".cube[data-"+dimNumber+"="+dimValue+"]").find('div').trigger(e.type);
            }, function(e){
                var obj = e.target;
                var dimValue = obj.innerText;
                $(".cube[data-"+dimNumber+"="+dimValue+"]").find('div').trigger(e.type);
            });
        });
    };

    this.constructLeftAxis = function(face){
        var dimNumber = this.dataSet.getLeftDimNumber(face);
        var dimValues = this.dataSet.getLeftDimValues(face);
        var faceDeepness = this.dataSet.getFaceDeepness(face);
        var maxDimCount = this.dataSet.getMaxDimCount();
        var faceHeight = this.dataSet.getFaceHeight(face);
        var faceWidth = this.dataSet.getFaceWidth(face);
        var diffY = maxDimCount - faceHeight;
        var marginUnit = this.marginUnit;
        var leftAxisWidth = this.cubeSize*dimValues.length + marginUnit*(dimValues.length - 1);
        $(".leftAxis").empty();
        $(".leftAxis").css("width", leftAxisWidth + "px");
        var transformProperty =
            "translateZ("+(this.cubeSize*faceDeepness + marginUnit*(faceDeepness - 1))/2+"px) " +
            "translateY("+(leftAxisWidth/2 + 21 + (diffY*(this.cubeSize + marginUnit)/2))+"px) " +
            "translateX(-"+(faceWidth*(this.cubeSize + marginUnit)/2 + 12 + 20)+"px) " +
            "rotateZ(-90deg)";
        setTransformStyleToClass(".leftAxis", transformProperty);
        $.each(dimValues, function(dimIndex, dim){
            if(dimIndex>0){
                var splitter = $('<div class="axisSplitter">').appendTo($(".leftAxis"));
                splitter[0].innerHTML = "&nbsp;";
            }
            var dimDiv = $('<div class="axisDim">').appendTo($(".leftAxis"));
            dimDiv[0].innerText = dim;

            $(dimDiv).hover(function(e){
                var obj = e.target;
                var dimValue = obj.innerText;
                $(".cube[data-"+dimNumber+"="+dimValue+"]").find('div').trigger(e.type);
            }, function(e){
                var obj = e.target;
                var dimValue = obj.innerText;
                $(".cube[data-"+dimNumber+"="+dimValue+"]").find('div').trigger(e.type);
            });
        });
    };

    this.constructAxis = function(face){
        this.constructTopAxis(face);
        this.constructLeftAxis(face);
        $(".axisDim").css("width", this.cubeSize+"px");
        $(".axisSplitter").css("width", this.marginUnit+"px");
    };

    this.init();
}

function Faces(){
    this.facesArray = [
        {
            name: "front",
            normal: new THREE.Vector3(0,0,1),
            angles: {x: 0, y: 0, z: 0},
            fixedDimension: "slicesDimension1"
        },
        {
            name: "back",
            normal: new THREE.Vector3(0,0,-1),
            angles: {x: 0, y: 180, z: 0},
            fixedDimension: "slicesDimension1"
        },
        {
            name: "top",
            normal: new THREE.Vector3(0,-1,0),
            angles: {x: -90, y: 0, z: 0},
            fixedDimension: "linesDimension3"
        },
        {
            name: "bottom",
            normal: new THREE.Vector3(0,1,0),
            angles: {x: 90, y: 0, z: 0},
            fixedDimension: "linesDimension3"
        },
        {
            name: "left",
            normal: new THREE.Vector3(-1,0,0),
            angles: {x: 0, y: 90, z: 0},
            fixedDimension: "cubesDimension2"
        },
        {
            name: "right",
            normal: new THREE.Vector3(1,0,0),
            angles: {x: 0, y: -90, z: 0},
            fixedDimension: "cubesDimension2"
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

function setTransitionStyle(obj, transformAttributes){
    obj.style.webkitTransition = "-webkit-transform " + transformAttributes;
    obj.style.mozTransition    = "-moz-transform " + transformAttributes;
    obj.style.msTransition     = "-ms-transform " + transformAttributes;
    obj.style.oTransition      = "-o-transform " + transformAttributes;
    obj.style.transition       = "transform " + transformAttributes;
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

function CubeDataSet(data){
    this.data = data;
    this.dimValues;

    this.getFaceFixedDimName = function(face){
        var fixedDimName = this.data.grid[face.fixedDimension];
        return fixedDimName;
    };
    this.getFaceFixedDimValue = function(face){
        switch (face.name){
            case "front":
                return this.dimValues.dim1[0];
            case "back":
                return this.dimValues.dim1Reverse[0];
            case "left":
                return this.dimValues.dim2[0];
            case "right":
                return this.dimValues.dim2Reverse[0];
            case "top":
                return this.dimValues.dim3[0];
            case "bottom":
                return this.dimValues.dim3Reverse[0];
            default: return "undefined";
        }
    };
    this.getTopDimNumber = function (face){
        switch (face.name){
            case "front":
            case "back":
                return "dim2";
            case "left":
            case "right":
                return "dim1";
            case "top":
            case "bottom":
                return "dim2";
            default: return false;
        }
    };
    this.getLeftDimNumber = function (face){
        switch (face.name){
            case "front":
            case "back":
                return "dim3";
            case "left":
            case "right":
                return "dim3";
            case "top":
            case "bottom":
                return "dim1";
            default: return false;
        }
    };
    this.getTopDimValues = function (face){
        switch (face.name){
            case "front":
                return this.dimValues.dim2;
            case "back":
                return this.dimValues.dim2Reverse;
            case "left":
                return this.dimValues.dim1Reverse;
            case "right":
                return this.dimValues.dim1;
            case "top":
                return this.dimValues.dim2;
            case "bottom":
                return this.dimValues.dim2;
            default: return false;
        }
    };
    this.getLeftDimValues = function (face){
        switch (face.name){
            case "front":
                return this.dimValues.dim3Reverse;
            case "back":
                return this.dimValues.dim3Reverse;
            case "left":
                return this.dimValues.dim3Reverse;
            case "right":
                return this.dimValues.dim3Reverse;
            case "top":
                return this.dimValues.dim1;
            case "bottom":
                return this.dimValues.dim1Reverse;
            default: return false;
        }
    };
    this.getFaceDeepness = function(face){
        switch (face.name){
            case "front":
            case "back":
                return this.dimValues.dim1.length;
            case "left":
            case "right":
                return this.dimValues.dim2.length;
            case "top":
            case "bottom":
                return this.dimValues.dim3.length;
            default: return false;
        }
    };
    this.getFaceHeight = function(face){
        switch (face.name){
            case "front":
            case "back":
            case "left":
            case "right":
                return this.dimValues.dim3.length;
            case "top":
            case "bottom":
                return this.dimValues.dim1.length;
            default: return false;
        }
    };
    this.getFaceWidth = function(face){
        switch (face.name){
            case "front":
            case "back":
                return this.dimValues.dim2.length;
            case "left":
            case "right":
                return this.dimValues.dim1.length;
            case "top":
            case "bottom":
                return this.dimValues.dim2.length;
            default: return false;
        }
    };
    this.getMaxDimCount = function(){
        return Math.max(this.dimValues.dim1.length, this.dimValues.dim2.length, this.dimValues.dim3.length);
    };
    this.fillDimValues = function(){
        var dim1 = [];
        var dim2 = [];
        var dim3 = [];

        $.each(data.grid.slices, function(sliceIndex, slice){
            dim1[sliceIndex] = slice.lines[0].cubes[0].dim1;
        })
        $.each(data.grid.slices[0].lines, function(lineIndex, line){
            dim2[lineIndex] = line.cubes[0].dim2;
        })
        $.each(data.grid.slices[0].lines[0].cubes, function(cubeIndex, cube){
            dim3[cubeIndex] = cube.dim3;
        })
        this.dimValues = {
            dim1: dim1,
            dim2: dim2,
            dim3: dim3,
            dim1Reverse: dim1.slice(0).reverse(),
            dim2Reverse: dim2.slice(0).reverse(),
            dim3Reverse: dim3.slice(0).reverse()
        };
    };

    this.fillDimValues();
}

function getGradientPoint(color1, color2, percent){
    var result = {};
    result.red = parseInt(color1.red - percent * (color1.red - color2.red));
    result.green = parseInt(color1.green - percent * (color1.green - color2.green));
    result.blue = parseInt(color1.blue - percent * (color1.blue - color2.blue));
    return result;
}

function rgb(red, green, blue){
    return {
        red: red,
        green: green,
        blue: blue
    };
}