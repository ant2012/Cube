package cube;

import org.olap4j.*;
import org.olap4j.metadata.*;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Created by amuravyev on 11.06.2015.
 */
public class Cube3d {

    private OlapConnection conn;
    private String catalogName;
    private String schemaName;
    private String name;

    public String measureName;
    public String dimNameX2;
    public String dimNameY3;
    public String dimNameZ1;

    private Collection<CubeCell> cells = new ArrayList<CubeCell>();
    private Collection<CellSet> originalCellSets = new ArrayList<CellSet>();

    public Cube3d(OlapConnection olapConnection, String catalogName, String schemaName, String cubeName, String measureName, String dimNameX2, String dimNameY3, String dimNameZ1){
        this.conn = olapConnection;
        this.catalogName = catalogName;
        this.schemaName = schemaName;
        this.name = cubeName;
        this.measureName = measureName;
        this.dimNameX2 = dimNameX2;
        this.dimNameY3 = dimNameY3;
        this.dimNameZ1 = dimNameZ1;

        olapFetch();
        parseOriginalSets();
        filterEmpty();
    }

    private void filterEmpty() {
        Collection<CubeCell> filteredCells = new ArrayList<CubeCell>();
        int z = 0;
        Collection<Integer> zEmptyNums = new ArrayList<Integer>();
        for (int i = 0; i < getSlicesCount(); i++) {
            if(isPlaneEmptyZ(i))zEmptyNums.add(i);
        }
        cells = cells.stream().filter(cell -> !zEmptyNums.contains(cell.dim1.position)).collect(Collectors.toList());

        Collection<Integer> yEmptyNums = new ArrayList<Integer>();
        for (int i = 0; i < getColumnsCount(); i++) {
            if(isPlaneEmptyY(i))yEmptyNums.add(i);
        }
        cells = cells.stream().filter(cell -> !yEmptyNums.contains(cell.dim3.position)).collect(Collectors.toList());

        Collection<Integer> xEmptyNums = new ArrayList<Integer>();
        for (int i = 0; i < getRowsCount(); i++) {
            if(isPlaneEmptyX(i))xEmptyNums.add(i);
        }
        cells = cells.stream().filter(cell -> !xEmptyNums.contains(cell.dim2.position)).collect(Collectors.toList());
        RenumCells();
    }

    private void RenumCells() {
        int i = 0;
        for (Object pos : cells.stream().map(cell -> cell.dim1.position).distinct().toArray()) {
            final int iCopy = i;
            cells.stream().filter(cell->cell.dim1.position==(int) pos).forEach(cubeCell -> cubeCell.dim1.position = iCopy);
            i++;
        }

        i = 0;
        for (Object pos : cells.stream().map(cell -> cell.dim2.position).distinct().toArray()) {
            final int iCopy = i;
            cells.stream().filter(cell->cell.dim2.position==(int) pos).forEach(cubeCell -> cubeCell.dim2.position = iCopy);
            i++;
        }

        i = 0;
        for (Object pos : cells.stream().map(cell -> cell.dim3.position).distinct().toArray()) {
            final int iCopy = i;
            cells.stream().filter(cell->cell.dim3.position==(int) pos).forEach(cubeCell -> cubeCell.dim3.position = iCopy);
            i++;
        }
    }

    private boolean isPlaneEmptyZ(int i) {
        return cells.stream().filter(cell->cell.dim1.position==i&&!cell.value.isEmpty()).count()==0;
    }
    private boolean isPlaneEmptyY(int i) {
        return cells.stream().filter(cell->cell.dim3.position==i&&!cell.value.isEmpty()).count()==0;
    }
    private boolean isPlaneEmptyX(int i) {
        return cells.stream().filter(cell->cell.dim2.position==i&&!cell.value.isEmpty()).count()==0;
    }

    private void parseOriginalSets() {
        int dimPosZ1 = 0;
        for (CellSet cellSet : originalCellSets) {
            String sliceDimValue = cellSet.getFilterAxis().getPositions().get(0).getMembers().get(0).getName();
            CubeCellDimension dimZ1 = new CubeCellDimension(dimPosZ1++, sliceDimValue);

            CellSetAxis cubeColumns = cellSet.getAxes().get(0);
            CellSetAxis cubeRows = cellSet.getAxes().get(1);
            if(cubeColumns.getPositionCount()==0 || cubeRows.getPositionCount()==0)continue;

            int dimPosX2 = 0;
            for (Position col : cubeColumns) {
                String colDimValue = col.getMembers().get(1).getName();
                CubeCellDimension dimX2 = new CubeCellDimension(dimPosX2++, colDimValue);

                int dimPosY3 = 0;
                for (Position row : cubeRows) {
                    String rowDimValue = row.getMembers().get(0).getName();
                    CubeCellDimension dimY3 = new CubeCellDimension(dimPosY3++, rowDimValue);

                    final Cell cell = cellSet.getCell(col, row);
                    cells.add(new CubeCell(dimZ1, dimX2, dimY3, cell.getFormattedValue()));
                }
            }
        }
    }

    private void olapFetch() {
        try {
            conn.setCatalog(catalogName);
            conn.setSchema(schemaName);
            Cube cube = conn.getOlapSchema().getCubes().get(name);
            String baseQuery = createSliceQuery(cube, measureName, dimNameX2, dimNameY3);
            NamedList<? extends Member> zItems = cube.getHierarchies().get(dimNameZ1).getDefaultMember().getChildMembers();
            for (Member member : zItems) {
                String query = baseQuery + "WHERE " + member.getUniqueName();
                OlapStatement statement = conn.createStatement();
                CellSet cellSet = statement.executeOlapQuery(query);
                originalCellSets.add(cellSet);
            }
        } catch (OlapException e) {
            e.printStackTrace();
        }
    }

    private String createSliceQuery(Cube cube, String measureName, String colHierarchyName, String rowHierarchyName) throws OlapException {
        Measure measure = cube.getMeasures().stream().filter(m -> m.getName().equals(measureName)).findFirst().get();
        NamedList<Hierarchy> hierarchies = cube.getHierarchies();

        String query = "SELECT CrossJoin({"+measure.getUniqueName()+"}, " +hierarchies.get(colHierarchyName).getUniqueName()+".Children) ON COLUMNS, ";
        query += ""+hierarchies.get(rowHierarchyName).getUniqueName()+".Children ON ROWS FROM ["+cube.getName()+"] ";

        return query;
    }

    public int getSlicesCount(){
        return (int) cells.stream().mapToInt(cell -> (int) cell.dim1.position).distinct().count();
    }
    public int getColumnsCount(){
        return (int) cells.stream().mapToInt(cell -> (int) cell.dim2.position).distinct().count();
    }
    public int getRowsCount(){
        return (int) cells.stream().mapToInt(cell -> (int) cell.dim3.position).distinct().count();
    }

    public CubeCell getCell(int x, int y, int z){
        try{
            return cells.stream().filter(cell->(cell.dim1.position==z && cell.dim2.position==x && cell.dim3.position==y)).findFirst().get();
        }catch (NoSuchElementException e){
            System.err.println("Exception on x="+x+"; y="+y+"; z="+z);
            e.printStackTrace();
        }
        return null;
    }
}
