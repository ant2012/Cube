function constructCube(data){
    if(!data)return false;

    $('.grid')
        .attr("data-dim1-name", data.grid.slicesDimension1)
        .attr("data-dim2-name", data.grid.cubesDimension2)
        .attr("data-dim3-name", data.grid.linesDimension3);

    $('.slices').empty();
    $.each(data.grid.slices, function(sliceIndex, slice){
        var sliceDom = $("<div class='slice'>").attr("data-slice-num", slice.sliceNum);
        $.each(slice.lines, function(lineIndex, line){
            var lineDom = $("<div class='line'>").appendTo(sliceDom);
            $.each(line.cubes, function(cubeIndex, cube){
                var cubeDom = $("<div class='cube'>")
                    .attr("data-dim1", cube.dim1)
                    .attr("data-dim2", cube.dim2)
                    .attr("data-dim3", cube.dim3)
                    .attr("data-index1", cube.index1)
                    .appendTo(lineDom);

                var dimensionsHint = "measure: " + data.grid.index1 + "\n";
                dimensionsHint += "dimensions:\n";
                dimensionsHint += data.grid.slicesDimension1 + "=" + cube.dim1 + "\n";
                dimensionsHint += data.grid.cubesDimension2 + "=" + cube.dim2 + "\n";
                dimensionsHint += data.grid.linesDimension3 + "=" + cube.dim3;
                var cubeFrontContent = "";

                cubeFrontContent += "<label title='"+dimensionsHint+"'>"+cube.index1+"</label>";

                //cubeFrontContent += "<ul class='dimList'>";
                //cubeFrontContent += "<li class='dim1' title='"+data.grid.slicesDimension1+"'>" + cube.dim1 + "</li>";
                //cubeFrontContent += "<li class='dim2' title='"+data.grid.cubesDimension2+"'>" + cube.dim2 + "</li>";
                //cubeFrontContent += "<li class='dim3' title='"+data.grid.linesDimension3+"'>" + cube.dim3 + "</li>";
                //cubeFrontContent += "</ul>";

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
        var cube = new CubeInstance($('.viewport')[0], data);
        subscribeCubeEvents(cube);
    });
}