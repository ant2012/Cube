function CubeInstance(viewport, options){
    //turns on\off js console debug output
    this.isDebugMode = false;

    this.viewport = viewport;
    this.options = options;
    this.dataSet = new CubeDataSet(options.data);
    this.faceHeader = $('.faceHeader')[0];
    this.topAxis = $(viewport).find('.topAxis')[0];
    this.leftAxis = $(viewport).find('.leftAxis')[0];
    this.infoBox = $('.infoBox')[0];
    this.domObject = $(viewport).find('.grid')[0];
    this.faces = new Faces();
    this.matrix = new THREE.Matrix4();

    this.mouseVector;

    this.autoRotateToNearestFace = true;
    this.showDimensions = false;

    this.init = function(){
        this.fillFaces();

        var slicesContainer = $(this.domObject).find('.slices')[0];
        var slicesArray = $(slicesContainer).find('.slice');
        var cubeArray = $('.cube');

        $(this.viewport).css("perspective", 2*options.viewportSize+"px");

        var zCount = slicesArray.length;
        var firstSliceLines = $(slicesArray[0]).find('.line');
        var xCount = firstSliceLines.length;
        var firstLineCubes = $(firstSliceLines[0]).find('.cube');
        var yCount = firstLineCubes.length;

        var maxDimCount = Math.max(xCount, yCount, zCount);
        var cubeSize = options.viewportSize/(maxDimCount);
        this.cubeSize = cubeSize;
        var marginUnit = 0.1*cubeSize;
        this.marginUnit = marginUnit;

        var frontFaceHeight = this.dataSet.getFaceHeight(this.faces.getByName('front'));
        var diffY = maxDimCount - frontFaceHeight;
        this.gridBaseTranslationY = (diffY*(this.cubeSize + marginUnit))/2;

        var perspectiveOriginY = 2*this.gridBaseTranslationY + (this.cubeSize + marginUnit)/2;

        $('.grid').css("width", (xCount*(cubeSize + marginUnit)) + "px");
        $('.grid').css("height", (yCount*(cubeSize + marginUnit)+marginUnit) + "px");
        $('.slices').css("width", (xCount*(cubeSize + marginUnit)) + "px");
        $('.slices').css("height", (yCount*(cubeSize + marginUnit)+marginUnit) + "px");
        $('.line').css("margin", "0 "+marginUnit/2+"px 0");

        perspectiveOriginY = Number($(this.viewport).css("perspective-origin").split(' ')[1].replace('px', ''));
        perspectiveOriginY += this.gridBaseTranslationY;
        if(this.options.faceHeader){
            perspectiveOriginY += $(this.faceHeader).outerHeight();
        }

        $(this.viewport).css("perspective-origin", "50% " + perspectiveOriginY +"px");

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

        var color1 = getRgbaFromCss('cubeColor1');
        var color2 = getRgbaFromCss('cubeColor2');

        var hoverColor1 = getRgbaFromCss('cubeHoverColor1');
        var hoverColor2 = getRgbaFromCss('cubeHoverColor2');

        $('.cube').each(function(index, item){
            var itemColorPercent = (isNaN(index1Difference) || index1Difference==0)?0:($(item).data().index1 - index1MinVal)/index1Difference;

            var itemColorValue = getGradientPoint(color1, color2, itemColorPercent);
            var itemHoverColorValue = getGradientPoint(hoverColor1, hoverColor2, itemColorPercent);
            $(item).find('div').css("background-color", "rgba("+itemColorValue.red+", "+itemColorValue.green+", "+itemColorValue.blue+", "+itemColorValue.opacity+")");

            $(item).find('div').hover(function(e){
                var obj = e.target;
                var parentCube = $(obj).parents('.cube')[0];
                obj = $(parentCube).find('div');
                $(obj).css("background-color", "rgba("+itemHoverColorValue.red+", "+itemHoverColorValue.green+", "+itemHoverColorValue.blue+", "+itemHoverColorValue.opacity+")");
            }, function(e){
                var obj = e.target;
                var parentCube = $(obj).parents('.cube')[0];
                obj = $(parentCube).find('div');
                $(obj).css("background-color", "rgba("+itemColorValue.red+", "+itemColorValue.green+", "+itemColorValue.blue+", "+itemColorValue.opacity+")");
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

        if(this.options.faceHeader){
            $(this.faceHeader).css("width", (1.1*options.viewportSize-20+marginUnit) + "px");
            //setTransformStyle(this.faceHeader, "translateZ("+options.viewportSize/2+"px)");
        }

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
        if(this.isDebugMode) console.log("Cube instance created");
    };

    // X,Y - 2d vector of mouse's movement
    this.rotateByMouse = function(x, y){
        if(this.isDebugMode)console.log("Rotate by mouse: dX="+x+"; dY="+y);
        var normal = new THREE.Vector3(-y, x, 0).normalize();
        var degree = Math.sqrt(x*x + y*y);
        var rotationMatrix = new THREE.Matrix4().makeRotationAxis(normal,toRadians(degree));
        rotationMatrix.multiplyMatrices(rotationMatrix, this.matrix);
        var euler = new THREE.Euler().setFromRotationMatrix(rotationMatrix);
        var angles = {
            x: toDegree(euler.x),
            y: toDegree(euler.y),
            z: toDegree(euler.z)
        };
        this.rotateToAngles(angles);
    };

    //X, Y, Z - is Euler rotation angles about axes
    //rotate viewport from starting position (none relative)
    this.rotateToAngles = function(angles){
        if(this.isDebugMode)console.log("Rotate by angles: dX="+angles.x+"; dY="+angles.y+"; dZ="+angles.z);
        var x = toRadians(angles.x);
        var y = toRadians(angles.y);
        var z = toRadians(angles.z);

        var translation = new THREE.Matrix4().makeTranslation(0, this.gridBaseTranslationY, 0);
        var rotationX = new THREE.Matrix4().makeRotationX(x);
        var rotationY = new THREE.Matrix4().makeRotationY(y);
        var rotationZ = new THREE.Matrix4().makeRotationZ(z);

        this.matrix = new THREE.Matrix4().multiply(translation).multiply(rotationX).multiply(rotationY).multiply(rotationZ);
        var matrixStyle = constructStyle(this.matrix);
        setTransformStyle(this.domObject, matrixStyle);
        this.setInfo();
    };

    this.showFace = function(faceName){
        var face = this.faces.getByName(faceName);
        this.activateFaceInfo(face);
        setTransitionStyle(this.domObject, "1s ease");
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
        if(this.options.faceHeader){
            $(this.faceHeader).toggleClass('faceHeaderUndefined', false);
            var fixedDimName = this.dataSet.getFaceFixedDimName(face);
            var fixedDimValue = this.dataSet.getFaceFixedDimValue(face);
            this.faceHeader.innerText = fixedDimName + "=" + fixedDimValue;
        }
        //Axis
        if(this.options.axis){
            this.constructAxis(face);
            $('.axis').toggleClass('axisUndefined', false);
        }

        //Cubes faces
        if(this.showDimensions){
            switch (face.fixedDimension){
                case "xDimension":
                    $(this.domObject).find('.dimX').css("text-decoration", "line-through").css("color", "rgba(1, 1, 1, 0.4)");
                    $(this.domObject).find('.dimY').css("text-decoration", "none").css("color", "#000");
                    $(this.domObject).find('.dimZ').css("text-decoration", "none").css("color", "#000");
                    break;
                case "yDimension":
                    $(this.domObject).find('.dimX').css("text-decoration", "none").css("color", "#000");
                    $(this.domObject).find('.dimY').css("text-decoration", "line-through").css("color", "rgba(1, 1, 1, 0.4)");
                    $(this.domObject).find('.dimZ').css("text-decoration", "none").css("color", "#000");
                    break;
                case "zDimension":
                    $(this.domObject).find('.dimX').css("text-decoration", "none").css("color", "#000");
                    $(this.domObject).find('.dimY').css("text-decoration", "none").css("color", "#000");
                    $(this.domObject).find('.dimZ').css("text-decoration", "line-through").css("color", "rgba(1, 1, 1, 0.4)");
                    break;
            }
        }
    };

    this.deActivateFaceInfo = function(){
        //Face Header
        if(this.options.faceHeader)
            $(this.faceHeader).toggleClass('faceHeaderUndefined', true);
        //Axis
        if(this.options.axis){
            $('.axis').toggleClass('axisUndefined', true);
            $('.axisSplitter').css("background-color", "rgba(255, 255, 255, 0)");
        }

        //Cubes faces
        if(this.showDimensions){
            $(this.domObject).find('.dimX').css("text-decoration", "none").css("color", "#000");
            $(this.domObject).find('.dimY').css("text-decoration", "none").css("color", "#000");
            $(this.domObject).find('.dimZ').css("text-decoration", "none").css("color", "#000");
        }
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
        var transformProperty = "translateZ("+(this.cubeSize*faceDeepness + marginUnit*(faceDeepness - 1))/2+"px)" + " translateY("+((diffY*(this.cubeSize + marginUnit))/2 + marginUnit) +"px)";
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
                $(".cube[data-"+dimNumber+"='"+dimValue+"']").find('div').trigger(e.type);
            }, function(e){
                var obj = e.target;
                var dimValue = obj.innerText;
                $(".cube[data-"+dimNumber+"='"+dimValue+"']").find('div').trigger(e.type);
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
            "translateY("+(leftAxisWidth/2 + (diffY*(this.cubeSize + marginUnit)/2) + marginUnit + 10)+"px) " +
            "translateX(-"+(faceWidth*(this.cubeSize + marginUnit)/2 + marginUnit) +"px) " +
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
                $(".cube[data-"+dimNumber+"='"+dimValue+"']").find('div').trigger(e.type);
            }, function(e){
                var obj = e.target;
                var dimValue = obj.innerText;
                $(".cube[data-"+dimNumber+"='"+dimValue+"']").find('div').trigger(e.type);
            });
        });
    };

    this.constructAxis = function(face){
        this.constructTopAxis(face);
        this.constructLeftAxis(face);
        $(".axisDim").css("width", this.cubeSize+"px");
        $(".axisSplitter").css("width", this.marginUnit+"px");
    };
    this.fillFaces = function(){
        var data = this.dataSet.data;
        var showDimensions = this.showDimensions;
        $('.cube').each(function(cubeIndex, cube){
            var dimensionsHint = "measure: " + data.grid.index1.name + "\n";
            dimensionsHint += "dimensions:\n";
            dimensionsHint += data.grid.zDimension.name + "=" + $(cube).data().dimZ + "\n";
            dimensionsHint += data.grid.xDimension.name + "=" + $(cube).data().dimX + "\n";
            dimensionsHint += data.grid.yDimension.name + "=" + $(cube).data().dimY;
            var cubeFrontContent = "";

            if(showDimensions){
                cubeFrontContent += "<ul class='dimList'>";
                cubeFrontContent += "<li class='dimZ' title='"+data.grid.zDimension.name+"'>" + $(cube).data().dimZ + "</li>";
                cubeFrontContent += "<li class='dimX' title='"+data.grid.xDimension.name+"'>" + $(cube).data().dimX + "</li>";
                cubeFrontContent += "<li class='dimY' title='"+data.grid.yDimension.name+"'>" + $(cube).data().dimY + "</li>";
                cubeFrontContent += "</ul>";
            }

            cubeFrontContent += "<label title='"+dimensionsHint+"'>"+$(cube).data().index1+"</label>";

            $(cube).find('div').each(function(divIndex, div){
                div.innerHTML = cubeFrontContent;
            });
        });
    }

    this.init();
}

function Faces(){
    this.facesArray = [
        {
            name: "front",
            normal: new THREE.Vector3(0,0,1),
            angles: {x: 0, y: 0, z: 0},
            fixedDimension: "zDimension"
        },
        {
            name: "back",
            normal: new THREE.Vector3(0,0,-1),
            angles: {x: 0, y: 180, z: 0},
            fixedDimension: "zDimension"
        },
        {
            name: "top",
            normal: new THREE.Vector3(0,-1,0),
            angles: {x: -90, y: 0, z: 0},
            fixedDimension: "yDimension"
        },
        {
            name: "bottom",
            normal: new THREE.Vector3(0,1,0),
            angles: {x: 90, y: 0, z: 0},
            fixedDimension: "yDimension"
        },
        {
            name: "left",
            normal: new THREE.Vector3(-1,0,0),
            angles: {x: 0, y: 90, z: 0},
            fixedDimension: "xDimension"
        },
        {
            name: "right",
            normal: new THREE.Vector3(1,0,0),
            angles: {x: 0, y: -90, z: 0},
            fixedDimension: "xDimension"
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

Array.min = function( array ){
    return Math.min.apply( Math, array );
};

function CubeDataSet(data){
    this.data = data;
    this.dimValues;

    this.getFaceFixedDimName = function(face){
        var fixedDimName = this.data.grid[face.fixedDimension].name;
        return fixedDimName;
    };
    this.getFaceFixedDimValue = function(face){
        switch (face.name){
            case "front":
                return this.dimValues.dimZ[0];
            case "back":
                return this.dimValues.dimZReverse[0];
            case "left":
                return this.dimValues.dimX[0];
            case "right":
                return this.dimValues.dimXReverse[0];
            case "top":
                return this.dimValues.dimY[0];
            case "bottom":
                return this.dimValues.dimYReverse[0];
            default: return "undefined";
        }
    };
    this.getTopDimNumber = function (face){
        switch (face.name){
            case "front":
            case "back":
                return "dim-x";
            case "left":
            case "right":
                return "dim-z";
            case "top":
            case "bottom":
                return "dim-x";
            default: return false;
        }
    };
    this.getLeftDimNumber = function (face){
        switch (face.name){
            case "front":
            case "back":
                return "dim-y";
            case "left":
            case "right":
                return "dim-y";
            case "top":
            case "bottom":
                return "dim-z";
            default: return false;
        }
    };
    this.getTopDimValues = function (face){
        switch (face.name){
            case "front":
                return this.dimValues.dimX;
            case "back":
                return this.dimValues.dimXReverse;
            case "left":
                return this.dimValues.dimZReverse;
            case "right":
                return this.dimValues.dimZ;
            case "top":
                return this.dimValues.dimX;
            case "bottom":
                return this.dimValues.dimX;
            default: return false;
        }
    };
    this.getLeftDimValues = function (face){
        switch (face.name){
            case "front":
                return this.dimValues.dimYReverse;
            case "back":
                return this.dimValues.dimYReverse;
            case "left":
                return this.dimValues.dimYReverse;
            case "right":
                return this.dimValues.dimYReverse;
            case "top":
                return this.dimValues.dimZ;
            case "bottom":
                return this.dimValues.dimZReverse;
            default: return false;
        }
    };
    this.getFaceDeepness = function(face){
        switch (face.name){
            case "front":
            case "back":
                return this.dimValues.dimZ.length;
            case "left":
            case "right":
                return this.dimValues.dimX.length;
            case "top":
            case "bottom":
                return this.dimValues.dimY.length;
            default: return false;
        }
    };
    this.getFaceHeight = function(face){
        switch (face.name){
            case "front":
            case "back":
            case "left":
            case "right":
                return this.dimValues.dimY.length;
            case "top":
            case "bottom":
                return this.dimValues.dimZ.length;
            default: return false;
        }
    };
    this.getFaceWidth = function(face){
        switch (face.name){
            case "front":
            case "back":
                return this.dimValues.dimX.length;
            case "left":
            case "right":
                return this.dimValues.dimZ.length;
            case "top":
            case "bottom":
                return this.dimValues.dimX.length;
            default: return false;
        }
    };
    this.getMaxDimCount = function(){
        return Math.max(this.dimValues.dimZ.length, this.dimValues.dimX.length, this.dimValues.dimY.length);
    };
    this.fillDimValues = function(){
        this.dimValues = {
            dimX: data.grid.xDimension.values,
            dimY: data.grid.yDimension.values,
            dimZ: data.grid.zDimension.values,
            dimXReverse: data.grid.xDimension.values.slice(0).reverse(),
            dimYReverse: data.grid.yDimension.values.slice(0).reverse(),
            dimZReverse: data.grid.zDimension.values.slice(0).reverse()
        };
    };

    this.fillDimValues();
}

function getGradientPoint(color1, color2, percent){
    var red = parseInt(color1.red - percent * (color1.red - color2.red));
    var green = parseInt(color1.green - percent * (color1.green - color2.green));
    var blue = parseInt(color1.blue - percent * (color1.blue - color2.blue));
    return rgba(red, green, blue, color1.opacity);
}

function getRgbaFromCss(cssClassName){
    var obj = $('<div class="'+cssClassName+'">').appendTo('body');
    var rgbaString = $(obj).css('backgroundColor');
    var rgba = parseRgba(rgbaString);
    obj.remove();
    return rgba;
}

function parseRgba(rgbaString){
    var arr = rgbaString.replace('rgba(', '').replace('rgb(', '').replace(')', '').replace(/\ /g, '').split(',');
    var opacity = (!arr[3] || isNaN(arr[3]))?1:arr[3];
    return rgba(arr[0], arr[1], arr[2], opacity);
}

function rgba(red, green, blue, opacity){
    return {
        red: red,
        green: green,
        blue: blue,
        opacity: opacity
    };
}

function getFlatIndexFromXYZ(X, Y, Z, xIndex, yIndex, zIndex){
    return zIndex + yIndex*Z + xIndex*Y*Z;
}

function constructCube(options){
    var data = options.data;

    if(!data)return false;

    $('.grid')
        .attr("data-dim-x-name", data.grid.xDimension.name)
        .attr("data-dim-y-name", data.grid.yDimension.name)
        .attr("data-dim-z-name", data.grid.zDimension.name);

    $('.slices').empty();
    var xSize = data.grid.xDimension.values.length;
    var ySize = data.grid.yDimension.values.length;
    var zSize = data.grid.zDimension.values.length;
    $.each(data.grid.zDimension.values, function(zIndex, z){
        var sliceDom = $("<div class='slice'>").attr("data-slice-num", zIndex);
        $.each(data.grid.xDimension.values, function(xIndex, x){
            var lineDom = $("<div class='line'>").appendTo(sliceDom);
            $.each(data.grid.yDimension.values, function(yIndex, y){
                index1Ind = getFlatIndexFromXYZ(xSize, ySize, zSize, xIndex, yIndex, zIndex);
                var cubeDom = $("<div class='cube'>")
                    .attr("data-dim-z", z)
                    .attr("data-dim-x", x)
                    .attr("data-dim-y", y)
                    .attr("data-index1", data.grid.index1.values[index1Ind])
                    .appendTo(lineDom);

                $("<div class='front'>").appendTo(cubeDom);
                $("<div class='back'>").appendTo(cubeDom);
                $("<div class='right'>").appendTo(cubeDom);
                $("<div class='left'>").appendTo(cubeDom);
                $("<div class='top'>").appendTo(cubeDom);
                $("<div class='bottom'>").appendTo(cubeDom);
            });
        });
        sliceDom.appendTo($('.slices'));
    });
}

function getJsonData(options){
    var jsonServletUrl = options.url;
    var jqxhr = $.getJSON(jsonServletUrl, function(){
        //console.log( "success" );
    }).done(function() {
        //console.log( "second success" );
    }).fail(function() {
        //console.log( "error" );
    }).always(function() {
        //console.log( "complete" );
    });
    jqxhr.done(function(data) {
        options.data = data;
        setData(options);
    });
}

function setData(options){
    constructCube(options);
    var cube = new CubeInstance($('.viewport')[0], options);
    afterCubeInit(cube);
}

function makeContainerDom(domContainer, options){
    makeInfoBox(domContainer, options);

    if(options.pageHeader){
        var pageHeader = $('<div class="pageHeader"></div>').appendTo(domContainer);
        $('<div>'+options.title+'</div>').appendTo(pageHeader);
        $('<div class="measure"></div>').appendTo(pageHeader);
    }

    if(options.faceHeader)
        $('<div class="faceHeader faceHeaderUndefined">Face Header</div>').appendTo(domContainer);

    var wrapper = $('<div class="wrapper"></div>').appendTo(domContainer);
    var viewport = $('<section class="viewport"></section>').appendTo(wrapper);

    if(options.axis){
        $('<div class="axis topAxis axisUndefined">Top Axis</div>').appendTo(viewport);
        $('<div class="axis leftAxis axisUndefined">Left Axis</div>').appendTo(viewport);
    }

    var grid = $('<div class="grid"></div>').appendTo(viewport);
    $('<div class="slices">Loading Cube..</div>').appendTo(grid);

    makeJoystickDom(domContainer, options);
}

function makeInfoBox(domContainer, options) {
    if (!options.infoBox) return;

    var infoBox = $('<div class="infoBox">').appendTo(domContainer);
    infoBox
        .append('<label>Nearest Face=front</label>')
        .append('<br/>')
        .append('<label>dX = 0.00deg; dY = 0.00deg; dZ = 0.00deg;</label>');
}

function makeJoystickDom(domContainer, options){
    if(!options.joystick) return;

    var joystick = $('<div class="joystick"></div>').appendTo(domContainer);
    var joystickTab = $('<table class="joystickHidden"></table>').appendTo(joystick);

    var tr = $('<tr></tr>').append('<td></td>').append('<td></td>').appendTo(joystickTab);
    var td = $('<td></td>').append('<button class="btn btn-default" id="showBack">Show Back</button>').appendTo(tr);

    tr = $('<tr></tr>').append('<td></td>').appendTo(joystickTab);
    td = $('<td></td>').append('<button class="btn btn-default" id="showTop">Show Top</button>').appendTo(tr);
    tr.append('<td></td>');

    tr = $('<tr></tr>').appendTo(joystickTab);
    td = $('<td></td>').append('<button class="btn btn-default" id="showLeft">Show Left</button>').appendTo(tr);
    td = $('<td></td>').append('<button class="btn btn-default" id="showFront">Show Front</button>').appendTo(tr);
    td = $('<td></td>').append('<button class="btn btn-default" id="showRight">Show Right</button>').appendTo(tr);

    tr = $('<tr></tr>').append('<td></td>').appendTo(joystickTab);
    td = $('<td></td>').append('<button class="btn btn-default" id="showBottom">Show Bottom</button>').appendTo(tr);
    tr.append('<td></td>');

    tr = $('<tr></tr>').appendTo(joystickTab);
    td = $('<td colspan="3" align="right"></td>')
        .append('<label for="autoRotate">AutoRotate to nearest face</label>')
        .append('<input id="autoRotate" type="checkbox" checked>')
        .append('<br/>')
        .append('<label for="showDimensions">Show dimensions</label>')
        .append('<input id="showDimensions" type="checkbox" unchecked>')
        .appendTo(tr);

    $('<div class="joystickHandler" title="Show\Hide Joystick">&nbsp;&#9650; Joystick&nbsp;</div>').appendTo(joystick);

    $('.joystickHandler').on('click', function(evt){
        if($('.joystick>table').hasClass('joystickHidden')){
            $('.joystickHandler')[0].innerHTML = "&nbsp;&#9660; Joystick&nbsp;";
        }else{
            $('.joystickHandler')[0].innerHTML = "&nbsp;&#9650; Joystick&nbsp;";
        }
        $('.joystick>table').toggleClass('joystickHidden');
    });
}

function afterCubeInit(cube){
    if(cube.options.pageHeader){
        $('.measure')[0].innerText = "Cube measure: " + cube.dataSet.data.grid.index1.name;
    }

    if(!cube.options.joystick) return;
    //Buttons
    $('#showRight').on('click', function(){
        cube.showFace("right");
    });

    $('#showLeft').on('click', function(){
        cube.showFace("left");
    });

    $('#showFront').on('click', function(){
        cube.showFace("front");
    });

    $('#showBack').on('click', function(){
        cube.showFace("back");
    });

    $('#showTop').on('click', function(){
        cube.showFace("top");
    });

    $('#showBottom').on('click', function(){
        cube.showFace("bottom");
    });

    //Auto Rotate
    $('#autoRotate')[0].checked = cube.autoRotateToNearestFace;
    $('#autoRotate').on('click', function(evt){
        cube.autoRotateToNearestFace = evt.target.checked;
        cube.showNearestFace();
    });

    //Dimensions
    $('#showDimensions')[0].checked = cube.showDimensions;
    $('#showDimensions').on('click', function(evt){
        cube.showDimensions = evt.target.checked;
        cube.fillFaces();
    });
}

(function( $ ){
    $.fn.cube = function(customOptions) {
        if(this.length == 0) return;
        var domContainer = this[0];

        var defaultOptions = {
            title: 'The Cube Analytics'
            , pageHeader: true
            , faceHeader: true
            , axis: true
            , joystick: true
            , infoBox: false
            , viewportSize: 600
        };
        var options = $.extend(defaultOptions, customOptions);

        makeContainerDom(domContainer, options);
        if(options.url)
            getJsonData(options);
        else
            setData(options);
    };
})( jQuery );
