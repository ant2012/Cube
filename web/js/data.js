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

                $("<div class='front'>").appendTo(cubeDom);
                $("<div class='back'>").appendTo(cubeDom);
                $("<div class='right'>").appendTo(cubeDom);
                $("<div class='left'>").appendTo(cubeDom);
                $("<div class='top'>").appendTo(cubeDom);
                $("<div class='bottom'>").appendTo(cubeDom);
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
        window.afterCubeInit(cube);
    });
}