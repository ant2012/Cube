<%--
  Created by IntelliJ IDEA.
  User: amuravyev
  Date: 07.05.2015
  Time: 12:31
  To change this template use File | Settings | File Templates.
--%>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
  <title>The Cube Demo</title>
  <link rel="stylesheet" href="css/bootstrap.some.css">
  <link rel="stylesheet" href="/octicons/octicons.css">
  <style>
    .navigation {
      margin: 10px;
    }
    a {
      color: #555555;
      text-decoration: none;
    }
    a:hover {
      color: darkcyan;
    }
  </style>
</head>
<body>
<div class="navigation">
  <button class="btn btn-default" onclick="window.location.href='cube.html'">Go Cube</button>
  <button class="btn btn-default" onclick="window.location.href='slice.html'">Go Slice</button>
  <button class="btn btn-default" onclick="window.location.href='grid.html'">Go 3DGrid</button>
  <button class="btn btn-default" onclick="window.location.href='dynamic.html'">Go Dynamic</button>
  <a href="https://github.com/ant2012/Cube"><span> View on GitHub </span><span class="octicon octicon-mark-github"></span></a>
</div><br/>
<img src="img/splash.png">

</body>
</html>
