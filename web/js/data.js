function constructCube(data){
    if(!data)return false;

    $.each(data.grid.slices, function(sliceIndex, slice){
        var sliceDom = $("<div class='slice'>").attr("data-slice-num", slice.sliceNum);
        $.each(slice.lines, function(lineIndex, line){
            var lineDom = $("<div class='line'>").appendTo(sliceDom);
            $.each(line.cubes, function(cubeIndex, cube){
                var cubeDom = $("<div class='cube'>").appendTo(lineDom);

                $("<div class='front'>").append("front").appendTo(cubeDom);
                $("<div class='back'>").append("back").appendTo(cubeDom);
                $("<div class='right'>").append("right").appendTo(cubeDom);
                $("<div class='left'>").append("left").appendTo(cubeDom);
                $("<div class='top'>").append("top").appendTo(cubeDom);
                $("<div class='bottom'>").append("bottom").appendTo(cubeDom);
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