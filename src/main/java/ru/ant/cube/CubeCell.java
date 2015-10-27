package ru.ant.cube;

/**
 * Created by amuravyev on 11.06.2015.
 */
public class CubeCell {
    public CubeCellDimension dim1;
    public CubeCellDimension dim2;
    public CubeCellDimension dim3;
    public String value;

    public CubeCell(CubeCellDimension dim1, CubeCellDimension dim2, CubeCellDimension dim3, String value){
        this.dim1 = dim1;
        this.dim2 = dim2;
        this.dim3 = dim3;
        this.value = value;
    }
}
