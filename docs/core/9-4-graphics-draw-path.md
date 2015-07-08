#Lark Core 编程指南 - 绘制路径

事实上，在前边两节(绘制直线和曲线/绘制形状)已经是绘制路径了。   
正如这两节的代码示例，绘制路径都是从调用 beginPath() 开始的。   

不过，绘制路径不但支持简单的两点间绘制，还可以对若干的线条进行连续绘制。   
这里，我们绘制一条包含直线、二次曲线和贝塞尔曲线的连续线条，如下：

![](image/9-4-graphics-draw-path-ex.png)   

绘制代码：
``` TypeScript
var shape = new lark.Shape();
var graphics = shape.graphics;
graphics.lineWidth = 2;
graphics.strokeStyle="#990000";
graphics.beginPath();
graphics.moveTo(100, 20);

// line 1
graphics.lineTo(200, 160);

// quadratic curve
graphics.quadraticCurveTo(230, 200, 250, 120);

// bezier curve
graphics.bezierCurveTo(290, -40, 300, 200, 400, 150);

// line 2
graphics.lineTo(500, 90);

graphics.lineWidth = 5;
graphics.strokeStyle = 'blue';
graphics.stroke();
```

每段线条的位置，如下图所示：
![](image/9-4-html5-canvas-paths-diagram.png)   