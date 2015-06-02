function constructCube(data){
    if(!data)return false;

    $.each(data.grid.slices, function(sliceIndex, slice){
        var sliceDom = $("<div class='slice'>").attr("data-slice-num", slice.sliceNum);
        $.each(slice.lines, function(lineIndex, line){
            var lineDom = $("<div class='line'>").appendTo(sliceDom);
            $.each(line.cubes, function(cubeIndex, cube){
                var cubeDom = $("<div class='cube'>").attr("data-index1", cube.index1).appendTo(lineDom);

                var cubeFrontContent = "<ul>";
                cubeFrontContent += "<li title='"+data.grid.slicesDimension1+"'>" + cube.dim1 + "</li>";
                cubeFrontContent += "<li title='"+data.grid.cubesDimension2+"'>" + cube.dim2 + "</li>";
                cubeFrontContent += "<li title='"+data.grid.linesDimension3+"'>" + cube.dim3 + "</li>";
                cubeFrontContent += "</ul>";

                cubeFrontContent += "<label title='"+data.grid.index1+"'>"+cube.index1+"</label>";

                $("<div class='front'>").append(cubeFrontContent).appendTo(cubeDom);
                $("<div class='back'>").append(cubeFrontContent).appendTo(cubeDom);
                $("<div class='right'>").append(cubeFrontContent).appendTo(cubeDom);
                $("<div class='left'>").append(cubeFrontContent).appendTo(cubeDom);
                $("<div class='top'>").append(cubeFrontContent).appendTo(cubeDom);
                $("<div class='bottom'>").append(cubeFrontContent).appendTo(cubeDom);
            })
        });
        sliceDom.appendTo($('.slices'));
    })
}
function getJsonData(){
    var jqxhr = $.getJSON("data.json", function(){
        console.log( "success" );
    }).done(function() {
        console.log( "second success" );
    }).fail(function() {
        console.log( "error" );
    }).always(function() {
        console.log( "complete" );
    });
    jqxhr.done(function(data) {
        constructCube(data);
        var cube = new CubeInstance($('.viewport')[0]);
        subscribeCubeEvents(cube);
    });
}