﻿Array.prototype.last = function () {
    return this[this.length - 1];
}

var LabelButton = function (game, x, y, key, label, callback, callbackContext, overFrame, outFrame, downFrame, upFrame) {
    Phaser.Button.call(this, game, x, y, key, callback, callbackContext, overFrame, 1, 0, 2 /*outFrame, downFrame, upFrame*/);
    //Style how you wish...  
    this.style = { 'font': '15px monospace', 'fill': 'black' };
    this.anchor.setTo(0.5, 0.5);
    this.label = new Phaser.Text(game, 0, 0, label, this.style);
    //puts the label in the center of the button    
    this.label.anchor.setTo(0.5, 0.5);
    this.addChild(this.label);
    this.setLabel(label);
    //adds button to game 
    game.add.existing(this);
};
LabelButton.prototype = Object.create(Phaser.Button.prototype);
LabelButton.prototype.constructor = LabelButton;
LabelButton.prototype.setLabel = function (label) { this.label.setText(label);};


function DataForVisualization(deckHeight,
                              containers,
                              hoistX,
                              hoistY,
                              containerSpeedX,
                              containerSpeedY,
                              hoistSpeedX,
                              containerWeight,
                              windSpeed,
                              changeContainerSpeedY,
                              changeHoistSpeedX,
                              targetX,
                              targetY) {
    this.deckHeight = deckHeight
    this.containers = containers
    this.hoistX = hoistX
    this.hoistY = hoistY
    this.containerSpeedX = containerSpeedX
    this.containerSpeedY = containerSpeedY
    this.hoistSpeedX = hoistSpeedX
    this.containerWeight = containerWeight
    this.windSpeed = windSpeed
    this.changeContainerSpeedY = changeContainerSpeedY
    this.changeHoistSpeedX = changeHoistSpeedX
    this.targetX = targetX
    this.targetY = targetY
    this.magicOutput = 100
}

function Container(x, y, slotXId, slotYId) {
    this.x = x
    this.y = y
    this.slotXId = slotXId
    this.slotYId = slotYId
}

var arrayOldData = [null, null, null]
var countContainersOnSlot = [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]]
var oldData = null
var MAX_CONTAINER_SPEED_Y = 4
var MAX_CHANGE_SPEED = 0.1
var MAX_HOIST_SPEED_X = 1
var currentTime = Math.random() * 10
var CHANGE_TIME = 0.01
var wavesK = 25
var CONTAINER_WIDTH = 100
var CONTAINER_IMAGE_WIDTH = 68
var CONTAINER_IMAGE_HEIGHT = 43
var isComplete = true
var SUCCESS_DISTANCE = 1
var isRunning = false

var minimap;
var onlanding = function(pos) {
    console.log(pos, countContainersOnSlot);
    minimap[pos.x][pos.z].setLabel(countContainersOnSlot[pos.z][pos.x].toString());
}

var MAX_WIND_CHANGE_SPEED = 0.1

var minimapClick = function (z, x) {
    return function() {
        if (isComplete && (countContainersOnSlot[z][x] < 5)) {
            this.targetSlotX = x
            this.targetSlotZ = z
            isComplete = false
        }
    }
}

var getData = function (targetSlotX, targetSlotZ) {
    if (arrayOldData[targetSlotZ] == null) {
        var xs = [];
        arrayOldData[targetSlotZ] = new DataForVisualization(
            500,
            xs,
            100, 100,
            0, 0, 0,
            0.1, 0,
            0, 0,
            100, 500)
    }
    oldData = arrayOldData[targetSlotZ]
    oldData.magicOutput = targetSlotX

    var containerHeight = 43
    wavesK = global.wavesK
    oldData.deckHeight = 500 + Math.sin(currentTime) * wavesK
    currentTime += CHANGE_TIME

    if (targetSlotX >= 5) {
        oldData.magicOutput = 100
        for (i = 0; i < oldData.containers.length; ++i) {
            oldData.containers[i].y = oldData.deckHeight - containerHeight;
            oldData.containers[i].y -= containerHeight * oldData.containers[i].slotYId;
        }
        return oldData
    }

    if (isRunning == false) {
        oldData.targetX = 100 + 80 * targetSlotX
        oldData.containers.push(new Container(oldData.hoistX, 120, targetSlotX, countContainersOnSlot[targetSlotZ][targetSlotX]))
        isRunning = true
        isComplete = false
    }

    if (-(oldData.containers.last().y + containerHeight +
        (countContainersOnSlot[targetSlotZ][targetSlotX] * containerHeight) - oldData.deckHeight) <= SUCCESS_DISTANCE) {
        isComplete = true
        isRunning = false
        oldData.magicOutput = 100
        countContainersOnSlot[targetSlotZ][targetSlotX]++;
        onlanding({x: targetSlotX, z: targetSlotZ});
    }
    oldData.targetY = oldData.deckHeight - countContainersOnSlot[targetSlotZ][targetSlotX] * containerHeight

    for (i = 0; i < oldData.containers.length - 1; ++i) {
        oldData.containers[i].y = oldData.deckHeight - containerHeight;
        oldData.containers[i].y -= containerHeight * oldData.containers[i].slotYId;
    }

    if (isComplete) {
        for (i = 0; i < oldData.containers.length; ++i) {
            oldData.containers[i].y = oldData.deckHeight - containerHeight;
            oldData.containers[i].y -= containerHeight * oldData.containers[i].slotYId;
        }
        return oldData
    }

    {
        oldData.windSpeed = global.windSpeed / 150.0
        var aaa = new PortCraneFuzzyLogic()
        var distX = oldData.containers.last().x - oldData.targetX
        var newSpeedX = aaa.getHorizontalMovement(distX, oldData.containerSpeedX)
        var dist = Math.abs(oldData.deckHeight - oldData.containers.last().y - containerHeight - containerHeight * oldData.containers.last().slotYId)
        var newSpeedY = aaa.getVerticalMovement(dist, oldData.containerSpeedY, distX)

        newSpeedX *= MAX_HOIST_SPEED_X
        newSpeedY *= MAX_CONTAINER_SPEED_Y
        if (newSpeedX > 0)
            newSpeedX = Math.min(newSpeedX, MAX_CHANGE_SPEED)
        if (newSpeedX < 0)
            newSpeedX = Math.max(newSpeedX, -MAX_CHANGE_SPEED)
        if (newSpeedY > 0)
            newSpeedY = Math.min(newSpeedY, MAX_CHANGE_SPEED)
        if (newSpeedY < 0)
            newSpeedY = Math.max(newSpeedY, -MAX_CHANGE_SPEED)
        oldData.changeContainerSpeedY = newSpeedY
        oldData.changeHoistSpeedX = newSpeedX
    }

    doMove(oldData)
    return oldData
}

var applyWindAndVerticalSpeed = function (data) {
    var curX = data.containers[data.containers.length - 1].x
    var curY = data.containers[data.containers.length - 1].y
    var distToCabin = Math.sqrt((curX - data.hoistX) * (curX - data.hoistX) +
        (curY - data.hoistY) * (curY - data.hoistY))
    var sinPhi = Math.abs(curX - data.hoistX) / distToCabin
    var cosPhi = Math.abs(curY - data.hoistY) / distToCabin
    var resultSpeed = data.containerSpeedX
    if (curX < data.hoistX) {
        resultSpeed += sinPhi * data.containerWeight
    }
    if (curX > data.hoistX) {
        resultSpeed -= sinPhi * data.containerWeight
    }
    resultSpeed += cosPhi * data.windSpeed
    resultSpeed *= 0.93
    data.containerSpeedX = resultSpeed
    data.containerSpeedY += data.changeContainerSpeedY
    data.hoistSpeedX += data.changeHoistSpeedX
    data.hoistSpeedX *= 0.9
    if (data.hoistSpeedX > 0)
        data.hoistSpeedX = Math.min(data.hoistSpeedX, MAX_HOIST_SPEED_X)
    if (data.hoistSpeedX < 0)
        data.hoistSpeedX = Math.max(data.hoistSpeedX, -MAX_HOIST_SPEED_X)
    if (data.containerSpeedY > 0)
        data.containerSpeedY = Math.min(data.containerSpeedY, MAX_CONTAINER_SPEED_Y)
    if (data.containerSpeedY < 0)
        data.containerSpeedY = Math.max(data.containerSpeedY, -MAX_CONTAINER_SPEED_Y)
    data.containerSpeedY = Math.max(0, data.containerSpeedY)
}

var doMove = function (data) {
    applyWindAndVerticalSpeed(data)
    data.hoistX += data.hoistSpeedX
    data.containers[data.containers.length - 1].y += data.containerSpeedY
    data.containers[data.containers.length - 1].x += data.containerSpeedX + data.hoistSpeedX * 0.7;
}

var updateWindSpeed = function() {
    if (global.windSpeed < global.windSpeedSlider) {
        global.windSpeed = Math.min(global.windSpeed + MAX_WIND_CHANGE_SPEED,
                                    global.windSpeedSlider)
    } else if (global.windSpeed > global.windSpeedSlider) {
        global.windSpeed = Math.max(global.windSpeed - MAX_WIND_CHANGE_SPEED,
                                    global.windSpeedSlider)
    }
}

GameStates.Game = function (game) {

};

GameStates.Game.prototype = {
    create: function () {
        this.bg = this.add.sprite(0, 0, 'bg')
        this.deck = this.add.sprite(this.world.centerX, 0, 'deck')
        this.deck.anchor.x = 0.5
        this.deck.anchor.y = 0
        this.rails = this.add.sprite(0, 0, 'rails')
        this.hoist = this.add.sprite(0, 100, 'hoist')
        this.hoist.anchor.y = 0.7
        this.hoist.anchor.x = 0.295
        this.rails.anchor.y = 0.1

        this.targetSlotX = 100  // won't be updated when > 5
        this.targetSlotZ = 0

        this.ropeGraphics = game.add.graphics(0, 0);

        this.target = game.add.sprite(0, 0, 'target')
        this.target.anchor.x = 0.5
        this.target.anchor.y = 1.0

        // create minimap
        this.slotsX = 5
        this.slotsZ = 3
        
        minimap = [];

        for (var i = 0; i < this.slotsX; ++i) {
            var col = [];
            for (var j = 0; j < this.slotsZ; ++j) {
                var x = 600 + i * 32
                var y = 32 + j * 32

                var b = new LabelButton(game, x, y, 'square', " ", minimapClick(j, i), this);
                // var b = game.add.sprite(x, y, 'square')
                // b.inputEnabled = true;
                // b.events.onInputDown.add(minimapClick(j, i), this);
                col.push(b);
            }
            
            minimap.push(col);
        }

        var maxContainers = 50
        this.containers = []
        for (i = 0; i < maxContainers; ++i) {
            var newSprite = this.add.sprite(-1000, -1000, 'container')
            newSprite.visible = true
            this.containers.push(newSprite)
        }
    },

    update: function () {
        var g = this.ropeGraphics;
        g.clear()

        {
            updateWindSpeed()  
            var data = getData(this.targetSlotX, this.targetSlotZ)
            this.targetSlotX = data.magicOutput

            var trunc = function (s) {
                return String(s).substring(0, 6)
            }


            this.hoist.x = data.hoistX
            this.deck.y = data.deckHeight
            if (isRunning) {
                this.target.x = data.targetX + CONTAINER_IMAGE_WIDTH / 2 
                this.target.y = data.targetY
            } else {
                this.target.x = -1000
                this.target.y = -1000
            }

            for (var i  = data.containers.length; i < this.containers.length; ++i) {
                this.containers[i].x = -1000
                this.containers[i].y = -1000
            }

            for (var i = 0; i < data.containers.length; ++i) {
                this.containers[i].x = data.containers[i].x
                this.containers[i].y = data.containers[i].y
            }



            if (isRunning) {
                var rw = 4, leftRopeX = data.hoistX, topRopeY = data.hoistY + 9,
                    cx = data.containers[data.containers.length - 1].x,
                    cy = data.containers[data.containers.length - 1].y,
                    cw = CONTAINER_IMAGE_WIDTH;

                g.lineStyle(rw, 0x333333, 1);

                // left & right ropes
                g.moveTo(rw / 2 + leftRopeX, topRopeY);
                g.lineTo(rw / 2 + cx, cy);

                g.moveTo(cw - rw / 2 + leftRopeX, topRopeY);
                g.lineTo(cw - rw / 2 + cx, cy);

                // circles near to box
                g.lineStyle(0);
                g.beginFill(0xFFFF0B, 0.5);
                g.drawCircle(cx + rw / 2, cy, 6);
                g.drawCircle(cw + cx - rw / 2, cy, 6);
                g.endFill();
            }
        }
        game.debug.text('wind: ' + global.windSpeed, 11, 11)
    },

    render: function () {
    },
};
