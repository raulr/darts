(function(window, document, PIXI, Charm, $) {
  console.log($('#canvas_wrap').height());
  //Aliases
  var Container = PIXI.Container,
      autoDetectRenderer = PIXI.autoDetectRenderer,
      loader = PIXI.loader,
      resources = PIXI.loader.resources,
      TextureCache = PIXI.utils.TextureCache,
      Texture = PIXI.Texture,
      Sprite = PIXI.Sprite,
      Text = PIXI.Text,
      Graphics = PIXI.Graphics,
      Point = PIXI.Point,
      filters = PIXI.filters,
      c = new Charm(PIXI);

  // Constants
  var GAME_WIDTH = 512,
    GAME_HEIGHT = GAME_WIDTH,
    BOARD_SIZE = GAME_WIDTH;

  //Create a Pixi stage and renderer and add the 
  //renderer.view to the DOM
  var stage = new Container(),
      renderer = autoDetectRenderer(
        GAME_WIDTH, GAME_HEIGHT,
        {antialias: true, transparent: true, resolution: 1, autoResize: true}
      );
  $('#canvas_wrap').append(renderer.view);
  
  loader
    .add("dart", "img/dart.png")
    .load(setup);

  // Global variables
  var dartboard,
    results,
    darts = [],
    lineX,
    lineY,
    lineXTween,
    lineYTween,
    started = false,
    in_x_axis = false,
    in_y_axis = false,
    currentRound = 0,
    totalRounds = 3,
    totalScore = 0,
    points = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5],
    button = $('#button').get(0),
    // style and color
    colorWhite = 0xF7E9CD,
    colorBlack = 0x000000,
    colorGreen = 0x4F9962,
    colorRed = 0xED3737,
    colorHit = 0xFE26F6,
    colorLine = 0xFFB400,
    textStyleBoardNumber = {
      fontFamily : 'sans-serif',
      fontSize : '24px',
      fontWeight : 'bold',
      fill : '#000000'
    },
    textStyleMiss = {
      fontFamily : 'Arial',
      fontSize : '70px',
      fontStyle : 'italic',
      fontWeight : 'bold',
      fill : '#ED3737',
      stroke : '#4a1850',
      strokeThickness : 5,
      dropShadow : true,
      dropShadowColor : '#000000',
      dropShadowAngle : Math.PI / 6,
      dropShadowDistance : 6
    },
    textStyleHit = {
      fontFamily : 'Arial',
      fontSize : '90px',
      fontStyle : 'italic',
      fontWeight : 'bold',
      fill : '#F7EDCA',
      stroke : '#4a1850',
      strokeThickness : 5,
      dropShadow : true,
      dropShadowColor : '#000000',
      dropShadowAngle : Math.PI / 6,
      dropShadowDistance : 6
    }
    ;

  function setup() {

    drawDartboard();

    lineX = new Graphics();
    lineX.lineStyle(3, colorLine, 1);
    lineX.moveTo(0, 0);
    lineX.lineTo(0, BOARD_SIZE);
    lineX.x = 0;
    lineX.y = 0;
    lineX.visible = false;
    stage.addChild(lineX);

    lineY = new Graphics();
    lineY.lineStyle(3, colorLine, 1);
    lineY.moveTo(0, 0);
    lineY.lineTo(BOARD_SIZE, 0);
    lineY.x = 0;
    lineY.y = 0;
    lineY.visible = false;
    stage.addChild(lineY);

    resize();

    //Start the game loop
    gameLoop();
  }

  function gameLoop() {

    //Loop this function at 60 frames per second
    requestAnimationFrame(gameLoop);

    //Update charm
    c.update();

    //Render the stage to see the animation
    renderer.render(stage);
  }

  function polarToCartesian(centerX, centerY, radius, angle) {
    var x = centerX + ( radius * Math.cos( angle ) );
    var y = centerY + ( radius * Math.sin( angle ) );
    return [x, y];
  }

  function drawDartboard() {
    dartboard = new Container();
    var centerX = BOARD_SIZE / 2;
    var centerY = BOARD_SIZE / 2;
    var radius = BOARD_SIZE / 2.5;
    var ringHeight = 10;
    var areas = points.length;
    var angleStep = (Math.PI * 2 / areas);

    for (var i = 0; i < areas; i++) {
      
      var colorSingle = i % 2 == 0 ? colorBlack : colorWhite;
      var colorOther = i % 2 == 0 ? colorRed : colorGreen;
      var pathSingle = [];
      var pathDouble = [];
      var pathTriple = [];

      pathSingle.push(centerX, centerY);
      for (var j = i; j <= i + 1; j += 0.5) {
        var angle = (angleStep * (j - 0.5)) - (Math.PI / 2);
        pathSingle.push( polarToCartesian(centerX, centerY, radius, angle) );
        pathDouble.push( polarToCartesian(centerX, centerY, radius, angle) );
        pathTriple.push( polarToCartesian(centerX, centerY, radius / 2, angle) );
      }

      for (var j = i + 1; j >= i; j -= 0.5) {
        var angle = (angleStep * (j - 0.5)) - (Math.PI / 2);
        pathDouble.push( polarToCartesian(centerX, centerY, radius - ringHeight, angle) );
        pathTriple.push( polarToCartesian(centerX, centerY, (radius / 2) + ringHeight, angle) );
      }

      pathSingle = [].concat.apply([], pathSingle);
      pathDouble = [].concat.apply([], pathDouble);
      pathTriple = [].concat.apply([], pathTriple);

      var single = new Graphics();
      single.beginFill(colorSingle);
      single.drawPolygon(pathSingle);
      single.endFill();
      single.value = points[i];
      dartboard.addChild(single);

      var double = new Graphics();
      double.beginFill(colorOther);
      double.drawPolygon(pathDouble);
      double.endFill();
      double.value = points[i] * 2;
      dartboard.addChild(double);

      var triple = new Graphics();
      triple.beginFill(colorOther);
      triple.drawPolygon(pathTriple);
      triple.endFill();
      triple.value = points[i] * 3;
      dartboard.addChild(triple);

      var number = new Text(points[i], {
        fontFamily : 'sans-serif',
        fontSize : '24px',
        fontWeight : 'bold',
        fill : '#000000'
      });
      var numberPoint = polarToCartesian(centerX, centerY, radius + 20, (angleStep * i) - (Math.PI / 2));
      number.x = numberPoint[0];
      number.y = numberPoint[1];
      number.anchor.x = 0.5;
      number.anchor.y = 0.5;
      var rotation = (angleStep * i);
      if (rotation > Math.PI/2 && rotation < Math.PI*3/2) rotation = rotation + Math.PI;
      number.rotation = rotation;
      dartboard.addChild(number);

    }

    var outer = new Graphics();
    outer.beginFill(colorGreen);
    outer.drawCircle(0, 0, 20);
    outer.endFill();
    outer.x = BOARD_SIZE / 2;
    outer.y = BOARD_SIZE / 2;
    outer.value = 25;
    dartboard.addChild(outer);

    var bull = new Graphics();
    bull.beginFill(colorRed);
    bull.drawCircle(0, 0, 10);
    bull.endFill();
    bull.x = BOARD_SIZE / 2;
    bull.y = BOARD_SIZE / 2;
    bull.value = 50;
    dartboard.addChild(bull);

    stage.addChild(dartboard);
  }

  function startGame() {
    started = true;
    currentRound = 0;
    totalScore = 0;
    if (results) {
      stage.removeChild(results);
    }
    dartboard.filters = null;
    $('.icon-play3', button).hide();
    $('.icon-arrow-up2', button).show();
    nextRound();
  }

  function nextRound() {
    currentRound++;
    if (currentRound > totalRounds) {
      end();
    } else {
      lineX.x = 0;
      lineX.y = 0;
      lineY.x = 0;
      lineY.y = 0;
      startXAxis();
    }
  }

  function startXAxis() {
    lineX.visible = true;
    lineXTween = c.slide(lineX, BOARD_SIZE, 0, 120, 'smoothstep', true);
    in_x_axis = true;
  }

  function startYAxis() {
    in_x_axis = false;
    lineY.visible = true;
    lineYTween = c.slide(lineY, 0, BOARD_SIZE, 120, 'smoothstep', true);
    in_y_axis = true;
  }

  function throwDart() {
    in_y_axis = false;
    var dart = new Sprite(resources.dart.texture);
    dart.pivot.x = 19;
    dart.pivot.y = -3;
    dart.scale.x = 5;
    dart.scale.y = 5;
    var curve = [
      [lineX.x, BOARD_SIZE / 2],
      [lineX.x, lineY.y - 200],
      [lineX.x, lineY.y - 200],
      [lineX.x, lineY.y]
    ];
    c.scale(dart, 1, 1, 20);
    c.followCurve(dart, curve, 20, 'smoothstep').onComplete = function() {
      lineX.visible = false;
      lineY.visible = false;
      checkThrow(dart.x, dart.y);
    };
    stage.addChild(dart);
    darts.push(dart);
  }

  function collisionDetect(x, y) {
    var elements = dartboard.children;
    var point = new Point(x, y);
    for (var i = elements.length - 1; i >= 0; i--) {
      var element = elements[i];
      if (element.containsPoint(point)) {
        return element;
      }
    }
  }

  function checkThrow(x, y) {
    var target = collisionDetect(x, y),
      score = target ? target.value : 0,
      message = 'MISS',
      textStyle = textStyleMiss;

    if (score > 0) {
      message = score + '!';
      textStyle = textStyleHit;
      var originalColor = target.graphicsData[0].fillColor;
      var shape = target.graphicsData[0].shape;
      
      target.clear();
      target.beginFill(colorHit);
      target.drawShape(shape);
      target.endFill();

      setTimeout(function() {
        target.clear();
        target.beginFill(originalColor);
        target.drawShape(shape);
        target.endFill();
      }, 100);

      totalScore += score;
    }

    var text = new PIXI.Text(message, textStyle);
    text.x = BOARD_SIZE / 2;
    text.y = BOARD_SIZE / 2;
    text.anchor.x = 0.5;
    text.anchor.y = 0.5;
    c.fadeOut(text, 80);
    c.slide(text, BOARD_SIZE / 2, 0, 100, 'sineCubed').onComplete = function() {
      stage.removeChild(text);
    };
    stage.addChild(text);

    setTimeout(function() {
      nextRound();
    }, 300);
  }

  function action() {
    if (in_x_axis) {
      lineXTween.pause();
      startYAxis();
    } else if (in_y_axis) {
      lineYTween.pause();
      throwDart();
    }
  }

  function end() {
    started = false;
    darts.forEach(function(dart) {
      stage.removeChild(dart);
    });
    results = new Container();
    var text = new PIXI.Text('Your Score:', textStyleMiss);
    text.x = BOARD_SIZE / 2;
    text.y = BOARD_SIZE / 2.5;
    text.anchor.x = 0.5;
    text.anchor.y = 0.5;
    results.addChild(text);
    var text = new PIXI.Text(totalScore, textStyleHit);
    text.x = BOARD_SIZE / 2;
    text.y = BOARD_SIZE / 1.7;
    text.anchor.x = 0.5;
    text.anchor.y = 0.5;
    results.addChild(text);
    stage.addChild(results);
    var blur = new filters.BlurFilter();
    blur.blur = 1.5;
    dartboard.filters = [blur];
    $('.icon-play3', button).show();
    $('.icon-arrow-up2', button).hide();
  }

  function resize() {
    var wrap = $('#canvas_wrap').get(0);
    var width = $('#canvas_wrap').width();
    renderer.view.style.width = width + 'px';
    renderer.view.style.height = width + 'px';
  }

  $(window).on('resize',function() {
    resize();
  });

  $(button)
    .on('touchstart mousedown', function(e) {
      e.preventDefault();
      $(this).addClass('hover');
      if (!started) {
        startGame();
      } else {
        action();
      }
    })
    .on('touchend mouseup', function(e) {
      $(this).removeClass('hover');
    })
  ;

  $('#dartboard_wrap').contents().find('#dartboard').click(function(e) {
    var targetId = e.target.id;
  });

})(window, document, PIXI, Charm, Zepto);