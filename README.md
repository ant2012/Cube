# Pure HTML(div) 3d Cube
Based on CSS3, JQuery and ThreeJS <br/>
![Chrome](http://www.google.com/images/icons/material/product/1x/chrome_32dp.png) *For Chrome browser only!*

Demo: [Heroku snapshot](http://cube-analytics.herokuapp.com/)

![Slice Splash](/src/main/webapp/img/splash.png)

Inspired by [Paul Hayes's cube](https://github.com/fofr/paulrhayes.com-experiments/tree/master/cube-3d/)

### Getting started

- Link style
```HTML
  <link rel="stylesheet" href="css/cube.glass.css" />
```
- Link Cube JQuery plugin and it's dependencies
```HTML
  <script src="js/jquery.min.js"></script>
  <script src="js/three.min.js"></script>
  <script src="js/jquery.cube.js"></script>
```
- Prepare DOM container
```HTML
<div id="cube"></div>
```
- Run cube for inline data object
```javascript
  $(function(){
    $('#cube').cube({
      data: {
        grid: {
            xDimension: {name: "xDim", values: ["x"]},
            yDimension: {name: "yDim", values: ["y"]},
            zDimension: {name: "zDim", values: ["z"]},
            index1: {name: "Value", values: ["Cube"]}
        }
      }
    });
  });
```
- Or load JSON
```javascript
  $(function(){
    $('#cube').cube({
        url: 'data.json'
      , title: 'The Cube Analytics'
    });
  });
```
- Learn all options and defaults
```javascript
        var defaultOptions = {
              title: 'The Cube Analytics'
            , pageHeader: true
            , faceHeader: true
            , axis: true
            , joystick: true
            , infoBox: false
            , viewportSize: 600
        };
```
