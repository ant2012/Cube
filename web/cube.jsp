<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
  <title>The Cube</title>
  <link rel="stylesheet" href="css/cube.css" />
  <!--[if lt IE 9]><script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script><![endif]-->
</head>
<body>
<h4>The Cube</h4>
<div class="wrapper">
  <section class="viewport">
    <div class="infoBox">
      <label>Nearest Face=front</label><br/>
      <label>dX = 0.00deg; dY = 0.00deg; dZ = 0.00deg;</label>
    </div>
    <div class="cube">
      <div class="front">front</div>
      <div class="back">back</div>
      <div class="right">right</div>
      <div class="left">left</div>
      <div class="top">top</div>
      <div class="bottom">bottom</div>
    </div>
  </section>
</div>
<div>
  <table>
    <tr>
      <td>
        <button id="showTop">Show Top</button>
      </td>
    </tr>
    <tr>
      <td>
        <button id="showFront">Show Front</button>
        <button id="showRight">Show Right</button>
        <button id="showBack">Show Back</button>
        <button id="showLeft">Show Left</button>
      </td>
    </tr>
    <tr>
      <td>
        <button id="showBottom">Show Bottom</button>
      </td>
    </tr>
  </table>
</div>

<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r71/three.js"></script>
<script src="js/cube.js"></script>

</body>
</html>
