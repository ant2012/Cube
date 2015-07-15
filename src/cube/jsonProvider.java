package cube;

import org.olap4j.*;
import org.olap4j.metadata.*;

import javax.json.*;
import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.List;

/**
 * Created by amuravyev on 10.06.2015.
 */
public class jsonProvider extends HttpServlet {
    private String mondrianXmlaUrl;
    private String mondrianXmlaUsername;
    private String mondrianXmlaPassword;
    OlapConnection olapConnection;

    @Override
    public void init(ServletConfig config) throws ServletException {
        super.init(config);
        mondrianXmlaUrl = config.getInitParameter("mondrianXmlaUrl");
        mondrianXmlaUsername = config.getInitParameter("mondrianXmlaUsername");
        mondrianXmlaPassword = config.getInitParameter("mondrianXmlaPassword");
//        connect();
    }

    private void connect() {
        try {
            Class.forName("org.olap4j.driver.xmla.XmlaOlap4jDriver");
            Connection connection = DriverManager.getConnection("jdbc:xmla:Server=" + mondrianXmlaUrl, mondrianXmlaUsername, mondrianXmlaPassword);
            olapConnection = connection.unwrap(OlapConnection.class);
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    private void disconnet() {
        try {
            olapConnection.close();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {

    }

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        connect();
        response.setCharacterEncoding("utf-8");

        String staticFlag = request.getParameter("static");
        String dynamicFlag = request.getParameter("dynamic");
        String catalogName = request.getParameter("catalog");
        String schemaName = request.getParameter("schema");
        String cubeName = request.getParameter("cube");

        if(staticFlag!=null){
            response.sendRedirect("data.json");
            return;
        }

        try {
            PrintWriter writer = response.getWriter();

            if(dynamicFlag!=null){
                String measure = request.getParameter("measure");
                String dim1 = request.getParameter("dim1");
                String dim2 = request.getParameter("dim2");
                String dim3 = request.getParameter("dim3");

                Cube3d cube3d = new Cube3d(olapConnection, catalogName, schemaName, cubeName, measure, dim1, dim2, dim3);
                String json = getJson(cube3d);
                writer.write(json);
                return;
            }

            response.setContentType("text/html");
            writer.println("<a href='/json?static'>Static json file</a>");
            writer.println("<a href='/json?query'>Test query</a>");

            if(schemaName==null){
                writer.println("<h4>Available schemas:</h4><ul>");
                NamedList<Schema> schemas = olapConnection.getOlapSchemas();
                for (Schema schema : schemas) {
                    writer.println("<li><a href='/json?schema=" + schema.getName() + "'>" + schema.getName() + "</a></li>");
                }
                writer.println("</ul>");
                return;
            }

            olapConnection.setSchema(schemaName);
            Schema olapSchema = olapConnection.getOlapSchema();
            NamedList<Cube> cubes = olapSchema.getCubes();

            if(cubeName==null){
                writer.println("<h4>Available cubes in "+schemaName+":</h4><ul>");
                for (Cube cube : cubes) {
                    writer.println("<li><a href='/json?schema=" + schemaName + "&cube=" + cube.getName() + "'>" + schemaName+"."+cube.getName() + "</a></li>");
                }
                writer.println("</ul>");
                return;
            }

            Cube cube = cubes.get(cubeName);
            NamedList<Hierarchy> hierarchies = cube.getHierarchies();
            List<Measure> measures = cube.getMeasures();
            writer.println("<h4>\""+schemaName+"."+cubeName+"\" cube structure:</h4><ul>");

            writer.println("<li>[Measures]");
            if (measures.size()>0){
                writer.println("<ul>");
                measures.forEach(measure -> {
                    writer.println("<li>"+measure.getUniqueName()+"</li>");
                });
                writer.println("</ul>");
            }
            writer.println("</li>");

            for (Hierarchy hierarchy : hierarchies) {
                if (hierarchy.getDimension().getDimensionType().name().equals("MEASURE")) continue;

                String hierarchyName = hierarchy.getUniqueName();
                writer.println("<li>" + hierarchyName);

                NamedList<Level> levels = hierarchy.getLevels();
                if(levels.size()>0){
                    writer.println("<ul>");
                    for(Level level: levels){
                        String levelName = level.getUniqueName();
                        writer.println("<li>"+levelName+"</li>");
                    }
                    writer.println("</ul>");
                }
                writer.println("</li>");
            }
            writer.println("</ul>");

            String dimensionsForm = "<form action='/json'>";
            dimensionsForm += "<input type='hidden' name='cube' value='"+cubeName+"'>";
            dimensionsForm += "<input type='hidden' name='dynamic' value='1'>";
            dimensionsForm += "<label>Measure: </label><input type='text' name='measure' value='Vg tg'><br/>";
            dimensionsForm += "<label>Dim1(Deepness, slices) hierarchy: </label><input type='text' name='dim1' value='V region'><br/>";
            dimensionsForm += "<label>Dim2(Columns, vLines) hierarchy: </label><input type='text' name='dim2' value='V time'><br/>";
            dimensionsForm += "<label>Dim3(Rows, cubes) hierarchy: </label><input type='text' name='dim3' value='V trader'><br/>";
            dimensionsForm += "<button type='submit'>submit</button></form>";
            writer.println(dimensionsForm);

        } catch (OlapException e) {
            e.printStackTrace();
        }finally {
            disconnet();
        }
    }

    private String getJson(Cube3d cube) {

        JsonBuilderFactory factory = Json.createBuilderFactory(null);

        JsonObjectBuilder jsonRoot = factory.createObjectBuilder();
        JsonObjectBuilder grid = factory.createObjectBuilder()
                .add("slicesDimension1", cube.dimNameZ1)
                .add("linesDimension2", cube.dimNameX2)
                .add("cubesDimension3", cube.dimNameY3)
                .add("index1", cube.measureName);
        JsonArrayBuilder slices = factory.createArrayBuilder();

        int slicesCount = cube.getSlicesCount();
        for (int i = 0; i < slicesCount; i++) {
            JsonObjectBuilder slice = getSlice(factory, cube, i);
            slices.add(slice);
        }

        grid.add("slices", slices);
        jsonRoot.add("grid", grid);
        return jsonRoot.build().toString();
    }

    private JsonObjectBuilder getSlice(JsonBuilderFactory factory, Cube3d cube3d, int sliceNum) {

        JsonObjectBuilder slice = factory.createObjectBuilder().add("sliceNum", sliceNum);
        JsonArrayBuilder lines = factory.createArrayBuilder();

        int colsCount = cube3d.getColumnsCount();
        int rowsCount = cube3d.getRowsCount();

        for (int c = 0; c < colsCount; c++) {
            JsonObjectBuilder line = factory.createObjectBuilder();
            JsonArrayBuilder cubes = factory.createArrayBuilder();
            for (int r = 0; r < rowsCount; r++) {
                CubeCell cell = cube3d.getCell(c, r, sliceNum);

                JsonObjectBuilder cube = factory.createObjectBuilder()
                        .add("dim1", cell.dim1.value)
                        .add("dim2", cell.dim2.value)
                        .add("dim3", cell.dim3.value)
                        .add("index1", cell.value);
                cubes.add(cube);
            }
            line.add("cubes", cubes);
            lines.add(line);
        }

        slice.add("lines", lines);
        return slice;
    }

}
