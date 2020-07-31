// import * as nipplejs from "nipplejs";
import { Spectrogram } from './locator';
import $ from "jquery";
import * as WebMidi from 'webmidi';
import * as MidiConvert from "midiconvert";
import * as Tone from 'tone';
import * as log from 'loglevel';
import * as path from 'path';
let Nexus = require('./nexusColored');
import * as url from 'url';
import * as JSZIP from 'jszip';

import * as Header from './header';
import * as PlaybackCommands from './playbackCommands';
import { PlaybackManager } from './playback';
import { SpectrogramPlaybackManager, renderFadeInControl } from './spectrogramPlayback';
import { NumberControl, BPMControl } from './numberControl';
// import LinkClient from './linkClient';
// import * as LinkClientCommands from './linkClientCommands';
import { DownloadButton } from './downloadCommand';
import * as HelpTour from './helpTour';
import { createLFOControls } from './lfo';
import { CycleSelect } from './cycleSelect';
import { static_correct} from './staticPath';
import * as ControlLabels from './controlLabels';
import { createWavInput } from './file_upload';
import * as SplashScreen from './startup';

import 'simplebar';
import 'simplebar/src/simplebar.css';

import '../common/styles/osmd.scss';
import '../common/styles/spectrogram.scss';
import '../common/styles/main.scss';
import '../common/styles/controls.scss';
import '../common/styles/simplebar.scss';
import '../common/styles/disableMouse.scss';
import { isNull } from 'util';
import {getContext} from "tone";

// defined at compile-time via webpack.DefinePlugin
declare var COMPILE_ELECTRON: boolean;

declare var ohSnap: any;

let defaultConfiguration = require('../common/default_config.json');

let playbackManager: PlaybackManager;
let spectrogramPlaybackManager: SpectrogramPlaybackManager;
let bpmControl: BPMControl;
let pitchControl: NumberControl;
let instrumentSelect: CycleSelect;
let vqvaeLayerSelect: CycleSelect;
let downloadButton: DownloadButton;

function triggerInterfaceRefresh(): void {
    vqvaeLayerSelect.value = vqvaeLayerSelect.value;
};

// TODO don't create globals like this
let currentCodes_top: number[][] = null;
let currentCodes_bottom: number[][] = null;
let currentConditioning_top: Map<string, (number|string)[][]> = null;
let currentConditioning_bottom: Map<string, (number|string)[][]> = null;
let currentXML: XMLDocument;

function toggleBusyClass(state: boolean): void {
    $('body').toggleClass('busy', state);
    $('.notebox').toggleClass('busy', state);
    $('.notebox').toggleClass('available', !state);
    $('#spectrogram-container').toggleClass('busy', state);
}

function blockall(e) {
    // block propagation of events in bubbling/capturing
    e.stopPropagation();
    e.preventDefault();
}

function disableChanges(): void {
    toggleBusyClass(true);
    $('.timecontainer').addClass('busy');
    $('.timecontainer').each(function() {
        this.addEventListener("click", blockall, true);}
    )
}

function enableChanges(): void {
    $('.timecontainer').each(function() {
        this.removeEventListener("click", blockall, true);}
    )
    $('.timecontainer').removeClass('busy');
    toggleBusyClass(false);
}

//////Initialisation element function///////
function init(name, attributes, ...rest) {
    var node = document.createElement(name);
    if (attributes) {
        for (var attr in attributes)
            if (attributes.hasOwnProperty(attr))
                node.setAttribute(attr, attributes[attr]);
    }
    for (var i = 2; i < arguments.length; i++) {
        var child = arguments[i];
        if (typeof child == "string")
            child = document.createTextNode(child);
        node.appendChild(child);
    }
    return node;
}

/////CANVAS CREATION///////
var controls = Object.create(null);
var tools = Object.create(null);
var points = [];
var redoStack = [];
var canvasGrid = [];
var canvasGridPos = [];
var canvasGridModified = [];

function createPaint(parent) {
    var canvas = init("canvas", { id: "Canvas" });
    canvas.width = document.getElementById("spectrogram-container-interface-container").clientWidth;
    canvas.height = document.getElementById("spectrogram-container-interface-container").offsetHeight;
    var cx = canvas.getContext("2d");
    let bottomControlsGridElem = document.getElementById('bottom-controls');
//    var toolbar = init("div", { class: "toolbar" });
    for (var name in controls)
        bottomControlsGridElem.appendChild(controls[name](cx));

//    var panel = init("div", { class: "picturepanel" }, canvas);
//    parent.appendChild(init("div", null, toolbar));
    canvas = createCanvasGrid(canvas);
    return canvas;
}

// CREATE CANVAS GRID -----------------------------------------------------------

function createCanvasGrid(canvas) {
    var width = document.getElementById("spectrogram-container-interface-container").clientWidth;
    var height = document.getElementById("spectrogram-container-interface-container").offsetHeight;
    var cx = canvas.getContext("2d");
    var col = 4;
    var row = 32;
    var ratioColWidth = width / col;
    var ratioRowHeight = height / row;

    // Stock the info of the future Rectangle of the grid
    for (let i = 0; i < row; i++) {
        for (let j = 0; j < col; j++) {
            cx.beginPath();
            canvasGrid.push({
                x: ratioColWidth * j,
                y: ratioRowHeight * i,
                width: ratioColWidth,
                height: ratioRowHeight,
                strokeStyle: "whiteSmoke",
                lineWidth: "1",
                isDragging: false,
                dominantColor: 'white'
            });
        }
    }

    // Create the list of Rectangles
    for (var i = 0; i < canvasGrid.length; i++) {
        canvasGridPos.push(new Rectangle(canvasGrid[i]));
    }

    // Setter of the Rectangles
    function Rectangle(rec) {
        var posX = this.posX = rec.x;
        var posY = this.posY = rec.y;

        this.width = rec.width;
        this.height = rec.height;

        // Draw the component
        this.draw = function () {
            cx.beginPath();
            cx.strokeStyle = rec.strokeStyle;
            cx.lineWidth = rec.lineWidth;
            cx.rect(this.posX, this.posY, this.width, this.height);
            cx.stroke();
        }
    }

    drawGrid();
    cx.strokeStyle = colors['bass'];
    return canvas;
}

// Redraw the grid
// TODO UNDO/REDO/CLEAR reboot the canvas -> have to redraw
function drawGrid() {
    for (var i = 0; i < canvasGridPos.length; i++) {
        canvasGridPos[i].draw();
    }
}

//-------------------------------------------------------------------------------
// GET RGB ----------------------------------------------------------------------

function getAverageRGB(canvas, i) {
    var rgb = {r: 0, g: 0, b: 0};
    var blockSize = 5;
    var context = canvas.getContext && canvas.getContext('2d');
    var data = context.getImageData(canvasGridPos[i].x, canvasGridPos[i].y, canvasGridPos[i].width, canvasGridPos[i].height);
    var length = data.data.length;
    var j = -4;
    var count = 0;

    while ((j += blockSize * 4) < length) {
        ++count;
        rgb.r += data.data[i];
        rgb.g += data.data[i + 1];
        rgb.b += data.data[i + 2];
    }
    // ~~ used to floor values
    rgb.r = ~~(rgb.r / count);
    rgb.g = ~~(rgb.g / count);
    rgb.b = ~~(rgb.b / count);

    return rgb;
}

var nbPxForEachColor = {
    'Black': 0,
    'Blue': 0,
    'Aquamarine': 0,
    'BlueViolet': 0,
    'YellowGreen': 0,
    'Yellow': 0,
    'Green': 0,
    'Red': 0,
    'Gray': 0,
    'Indigo': 0,
    'DarkOrange': 0,
}

function getDominantRGB(canvas, i) {
    var rgb = {r: 0, g: 0, b: 0};
    var blockSize = 1; // Each pixel analyzed, 2 each two, 5 each five etc...
    var context = canvas.getContext && canvas.getContext('2d');
    var data = context.getImageData(canvasGridPos[i].x, canvasGridPos[i].y, canvasGridPos[i].width, canvasGridPos[i].height);
    var length = data.data.length;
    var j = -4;
    var returnIndex;
    var maxValue;

    //Reset Array
    for (let i = 0; i < 11; i++)
        nbPxForEachColor[i] = 0;

    //Find another Way to calcul px color
    while ((j += blockSize * 4) < length) {
        rgb.r = data.data[i];
        rgb.g = data.data[i + 1];
        rgb.b = data.data[i + 2];
        if (rgb.r == 0, rgb.g == 0, rgb.b == 0)
            nbPxForEachColor.Black++;
        else if (rgb.r == 0, rgb.g == 0, rgb.b == 255)
            nbPxForEachColor.Blue++;
        else if (rgb.r == 127, rgb.g == 255, rgb.b == 212)
            nbPxForEachColor.Aquamarine++;
        else if (rgb.r == 138, rgb.g == 43, rgb.b == 226)
            nbPxForEachColor.BlueViolet++;
        else if (rgb.r == 154, rgb.g == 205, rgb.b == 50)
            nbPxForEachColor.YellowGreen++;
        else if (rgb.r == 255, rgb.g == 255, rgb.b == 0)
            nbPxForEachColor.Yellow++;
        else if (rgb.r == 0, rgb.g == 128, rgb.b == 0)
            nbPxForEachColor.Green++;
        else if (rgb.r == 255, rgb.g == 0, rgb.b == 0)
            nbPxForEachColor.Red++;
        else if (rgb.r == 128, rgb.g == 128, rgb.b == 128)
            nbPxForEachColor.Gray++;
        else if (rgb.r == 75, rgb.g == 0, rgb.b == 130)
            nbPxForEachColor.Indigo++;
        else if (rgb.r == 255, rgb.g == 140, rgb.b == 0)
            nbPxForEachColor.DarkOrange++;
    }

    maxValue = nbPxForEachColor[0];
    for (let i = 0; i < 11; i++) {
        if (nbPxForEachColor[i] > maxValue) {
            returnIndex = i;
            maxValue = nbPxForEachColor[i];
        }
    }

    let colorsArray = ['Black', "Blue", "Aquamarine", "BlueViolet", "YellowGreen", "Yellow",
        "Green", "Red", "Gray", "Indigo", "DarkOrange"
    ];

    return colorsArray[returnIndex];
}

//_______________________________________________________________________________
controls.brushSize = function (cx) {
    var select = init("select", {id: 'brushSizeSelector'});
    var sizes = [1, 2, 3, 5, 8, 12, 25, 35, 50, 75, 100];
    sizes.forEach(function (size) {
        select.appendChild(init("option", { value: size },
            size + " pixels"));
    });
    select.addEventListener("change", function () {
        cx.lineWidth = select.value;
    });
    return init("span", null, "Brush size: ", select);
};

controls.tool = function (cx) {
    var select = init("select", {});
    for (var name in tools)
        select.appendChild(init("option", null, name));

    cx.canvas.addEventListener("mousedown", function (event) {
        if (event.which == 1) {
            tools[select.value](event, cx);
            redoStack = [];         //Clear the RedoStack when an action is complete
            event.preventDefault();
        }
    });

    return init("span", null, "Tool: ", select);
};

var colors = {
    'bass': "Black", 
    'brass': "Blue",
    'flute': "Aquamarine",
    'guitar': "BlueViolet",
    'keyboard': "YellowGreen",
    'mallet': "Yellow",
    'organ': "Green",
    'reed' : "Red", 
    'string' : "Gray", 
    'synth_lead': "Indigo", 
    'vocal' : "DarkOrange"
}

controls.instrument = function (cx) {

    let instrumentSelectElem: HTMLElement = document.createElement('control-item');
    instrumentSelectElem.id = 'instrument-control';
//    bottomControlsGridElem.appendChild(instrumentSelectElem);
    instrumentSelect = new Nexus.Select('#instrument-control', {
        'size': [150, 50],
        'options': ['bass', 'brass', 'flute',
            'guitar', 'keyboard', 'mallet', 'organ',
            'reed', 'string', 'synth_lead', 'vocal'
        ],
        'value': 'organ',
    }, function () {
        cx.fillStyle = colors[this.value];
        cx.strokeStyle = colors[this.value];
    });
/*    instrumentSelect.innerContainerElement.addEventListener("change", function () {
        cx.fillStyle = colors[instrumentSelect.value];
        cx.strokeStyle = colors[instrumentSelect.value];
    });*/
    ControlLabels.createLabel(instrumentSelectElem, 'instrument-control-label');
    return instrumentSelectElem;
}

/*controls.color = function (cx) {
    var input = init("input", { type: "color" });
    input.addEventListener("change", function () {
        cx.fillStyle = input.value;
        cx.strokeStyle = input.value;
    });
    return init("span", null, "Color: ", input);
};*/

controls.clear = function (cx) {
    var input = init("input", { type: "button", value: "Clear" });
    input.addEventListener("click", function () {
        cx.canvas.getContext("2d").clearRect(0, 0, cx.canvas.width, cx.canvas.height);
        points.push({size: cx.lineWidth, color: cx.fillStyle, tool: "Clear",});
        drawGrid()
    });
    return init("span", null, "", input);
}

function DrawPoint(cx, p) {

    //Keep actual color & size
    var actualColor = cx.fillStyle;
    var actualWidth = cx.lineWidth;


    cx.fillStyle = p.color;
    cx.strokeStyle = p.color;
    cx.lineWidth = p.size;

    switch (p.tool) {
        case "Line":
            var last = null
            p.all.forEach(point => {
                cx.beginPath();
                if (last)
                    cx.moveTo(last.x, last.y);
                cx.lineTo(point.x, point.y);
                cx.stroke();
                last = point;
            });
            break;

        case "Text":
            cx.fillText(p.text, p.x, p.y);
            break;
        case "Spray":
            p.all.forEach(point => {
                cx.fillRect(point.x, point.y, 1, 1);
            });
            break;
        case "Rectangle":
            cx.fillRect(p.Rect.x, p.Rect.y, p.Rect.sizex, p.Rect.sizey);
            break;
        case "Clear":
            cx.canvas.getContext("2d").clearRect(0, 0, cx.canvas.width, cx.canvas.height);
            break;
    }

    var canvas = document.getElementById('Canvas')
    for (let i = 0; i < canvasGrid.length; i++)
        var dominantColor = getDominantRGB(canvas, i); // TODO Get Color of each rectangle -> link with rec

    //Re set the actual color a size selected
    cx.fillStyle = actualColor;
    cx.strokeStyle = actualColor;
    cx.lineWidth = actualWidth;
}

controls.undo = function (cx) {
    var input = init("input", { type: "button", value: "Undo", id: "Undo" });
    input.addEventListener("click", function () {
        //remove the last draw point
        var lastPoint = points.pop();

        //add point removed to redo stack
        redoStack.push(lastPoint);

        //Clear all the canvas
        cx.canvas.getContext("2d").clearRect(0, 0, cx.canvas.width, cx.canvas.height);

        //Redraw all without the last action
        points.forEach(p => {
            DrawPoint(cx, p);
        });
    });

    return init("span", null, "", input);
}

controls.redo = function (cx) {
    var input = init("input", { type: "button", value: "Redo", id: "Redo" });
    input.addEventListener("click", function () {

        //remove the last Undo Action
        var lastPoint = redoStack.pop();

        if (!lastPoint)
            return;

        //Draw the last Undo Action
        DrawPoint(cx, lastPoint);

        //Re push the redo action in the points buffer for undo it
        points.push(lastPoint);
    });

    return init("span", null, "", input);
}

controls.switchButton = function(cx) {
    var input = init("input", {type: "button", value: "Switch"});
    let paintContainer = document.getElementById('paintContainer');
    let spectrogramImage = document.getElementById('spectrogram-image-container');
    let spectrogramInterface = document.getElementById('spectrogram-container-interface-container');

    input.addEventListener("click", function () {
        if (paintContainer.style.visibility == "hidden") {
            paintContainer.style.visibility = "visible";
            spectrogramImage.style.visibility = "hidden";
            spectrogramInterface.style.visibility = "hidden";
        } else if (paintContainer.style.display != "visible") {
            paintContainer.style.visibility = "hidden";
            spectrogramImage.style.visibility = "visible";
            spectrogramInterface.style.visibility = "visible";
        }
    });
    return init("span", null, input);
}

function relativePos(event, element) {
    var rect = element.getBoundingClientRect();
    return {
        x: Math.floor(event.clientX - rect.left),
        y: Math.floor(event.clientY - rect.top)
    };
}

function trackDrag(onMove, onEnd) {
    function end(event) {
        removeEventListener("mousemove", onMove);
        removeEventListener("mouseup", end);
        if (onEnd)
            onEnd(event);
    }
    addEventListener("mousemove", onMove);
    addEventListener("mouseup", end);
}

tools.Line = function (event, cx, onEnd) {
    cx.lineCap = "round";

    var allPoints = [];

    var pos = relativePos(event, cx.canvas);
    trackDrag(function (event) {
        cx.beginPath();
        cx.moveTo(pos.x, pos.y);
        pos = relativePos(event, cx.canvas);
        cx.lineTo(pos.x, pos.y);
        cx.stroke();
        allPoints.push({x: pos.x, y: pos.y});
    }, onEnd ? onEnd : function () {
        points.push({
            size: cx.lineWidth,
            color: cx.fillStyle,            
            tool: "Line",
            all: allPoints,
            }); //Push the drawed line for Undo task
        }
    );
};

tools.Erase = function (event, cx) {
    cx.globalCompositeOperation = "destination-out";
    tools.Line(event, cx, function () {
        cx.globalCompositeOperation = "source-over";
        points.push({
            size: cx.lineWidth,
            color: cx.fillStyle,
            tool: "Erased",
        }); //Push the drawed line for Undo task
    })
};

tools.Text = function (event, cx) {
    var text = prompt("Text:", "");
    if (text) {
        var pos = relativePos(event, cx.canvas);
        cx.font = Math.max(7, cx.lineWidth) + "px sans-serif";
        cx.fillText(text, pos.x, pos.y);
        points.push({
            x: pos.x,
            y: pos.y,
            text: text,
            size: cx.lineWidth,
            color: cx.fillStyle,
            tool: "Text",
        }); //Push the drawed Text for Undo task
    }
};

function randomPointInRadius(radius) {
    for (; ;) {
        var x = Math.random() * 2 - 1;
        var y = Math.random() * 2 - 1;
        if (x * x + y * y <= 1)
            return { x: x * radius, y: y * radius };
    }
}

tools.Spray = function (event, cx) {
    var radius = cx.lineWidth;
    var area = radius * radius * Math.PI;
    var dotsPerTick = Math.ceil(area / 30);

    var allPoints = [];

    var currentPos = relativePos(event, cx.canvas);
    var spray = setInterval(function () {
        for (var i = 0; i < dotsPerTick; i++) {
            var offset = randomPointInRadius(radius);
            cx.fillRect(currentPos.x + offset.x,
                currentPos.y + offset.y, 1, 1);
            allPoints.push({
                x: currentPos.x + offset.x,
                y: currentPos.y + offset.y
            })
        }
    }, 25);     //Draw random point each 25 millisecond
    trackDrag(function (event) {
        currentPos = relativePos(event, cx.canvas);
    }, function () {    //On end
        clearInterval(spray);
        points.push({
            size: cx.lineWidth,
            color: cx.fillStyle,
            tool: "Spray",
            all: allPoints
        }); //Push the drawed Spray for Undo task
    });
};

tools.Rectangle = function (event, cx) {
    var currentPos = relativePos(event, cx.canvas);
    var Rect = null;
    trackDrag(function (event) {
        var newPos = relativePos(event, cx.canvas);
        cx.fillRect(currentPos.x, currentPos.y, (currentPos.x - newPos.x) * -1, (currentPos.y - newPos.y) * -1);
        Rect = {
            x: currentPos.x,
            y: currentPos.y,
            sizex: (currentPos.x - newPos.x) * -1,
            sizey: (currentPos.y - newPos.y) * -1,
        }
    }, function () {
        points.push({
            Rect: Rect,
            size: cx.lineWidth,
            color: cx.fillStyle,
            tool: "Rectangle",
        }); //Push the drawed Rectangle for Undo task
    })
}
////////

function KeyPress(e) {
    var evtobj = window.event ? event : e
    if (evtobj.keyCode == 90 && evtobj.ctrlKey) {
        document.getElementById("Undo").click();
    }
    if (evtobj.keyCode == 85 && evtobj.ctrlKey) {
        document.getElementById("Redo").click();
    }
}

document.onkeydown = KeyPress;

async function render(configuration=defaultConfiguration) {
    disableChanges();

    let COMPILE_MUSEUM_VERSION: boolean = true;

    if ( COMPILE_MUSEUM_VERSION ) {
        require('../common/styles/museum.scss');
    }

    // set to true to display the help tour after two minutes of inactivity on the
    // interface
    let REGISTER_IDLE_STATE_DETECTOR: boolean = configuration["display_help_on_idle"];

    // set to true to completely hide the mouse pointer on the interface
    // for touchscreens
    let DISABLE_MOUSE: boolean = configuration['disable_mouse'];
    $(() => {
        if ( DISABLE_MOUSE ) {
            document.body.classList.add('disable-mouse');
        }
    });

    let useAdvancedControls: boolean = configuration['insert_advanced_controls'];
    $(() => {
        if (useAdvancedControls) {
            document.body.classList.add('advanced-controls');
        }
    });

    // Tone.context.latencyHint = 'playback';

    $(() => {
        let headerGridElem: HTMLElement = document.createElement('header');
        document.body.appendChild(headerGridElem);
        Header.render(headerGridElem, configuration);
    });

    let bottomControlsGridElem: HTMLDivElement;

    $(() => {
        bottomControlsGridElem = document.createElement('div');
        bottomControlsGridElem.id = 'bottom-controls';
        document.body.appendChild(bottomControlsGridElem);
    });

    $(() => {
        let vqvaeLayerIcons: Map<string, string> = new Map([
                ['top-brush', 'paint-roller.svg'],
                ['bottom-brush', 'paint-brush-small.svg'],
                ['top-brush-random', 'paint-roller-random.svg'],
                ['bottom-brush-random', 'paint-brush-small-random.svg'],
                ['top-eraser', 'edit-tools.svg'],
            ])

        let vqvaeLayerDimensions: Map<string, [number, number]> = new Map([
            ['bottom', [64, 8]],
            ['top', [32, 4]]
        ])

        let iconsBasePath: string = path.join(static_correct, 'icons');

        let granularitySelectContainerElem: HTMLElement = document.createElement('control-item');
        granularitySelectContainerElem.id = 'vqvae-layer-select-container';
        bottomControlsGridElem.appendChild(granularitySelectContainerElem);

        ControlLabels.createLabel(granularitySelectContainerElem,
            'vqvae-layer-select-label');

        function vqvaeLayerOnChange(ev) {
            let newLayer: string = <string>this.value.split('-')[0];
            let [newNumRows, newNumColumns] = vqvaeLayerDimensions.get(newLayer);
            let [_, numColumnsTop] = vqvaeLayerDimensions.get('top');
            spectrogramPlaybackManager.spectrogramLocator.render(newNumRows, newNumColumns,
                numColumnsTop);
        };

        vqvaeLayerSelect = new CycleSelect(granularitySelectContainerElem,
            'vqvae-layer-select',
            {handleEvent: vqvaeLayerOnChange},
            vqvaeLayerIcons,
            iconsBasePath);
    });


    $(() => {
        let insertLFO: boolean = configuration["insert_variations_lfo"];
        if (insertLFO) {
            createLFOControls();
        }
    });

    let serverIp: string = configuration['server_ip'];
    if (serverIp.charAt(serverIp.length-1) == '/') {
        // strip irrelevant slash at end of IP or address
        serverIp = serverIp.substring(0, serverIp.length-1);
    }
    let serverPort: number = configuration['server_port'];
    let serverUrl = `http://${serverIp}:${serverPort}/`;

    function insertLoadingSpinner(container: HTMLElement): HTMLElement {
        let spinnerElem: HTMLElement = document.createElement('i');
        container.appendChild(spinnerElem);
        spinnerElem.classList.add('fas');
        spinnerElem.classList.add('fa-4x');
        spinnerElem.style.color = 'black';
        spinnerElem.classList.add('fa-spin');
        spinnerElem.classList.add('fa-cog');
        spinnerElem.id = 'osmd-loading-spinner';

        return spinnerElem
    }

    if ( configuration['spectrogram'] ) {
        $(() => {
            let bottomControlsGridElem = document.getElementById('bottom-controls');
            pitchControl = new NumberControl(bottomControlsGridElem,
                'pitch-control', [24, 84], 60);
            pitchControl.render();

            let instrumentSelectElem: HTMLElement = document.createElement('control-item');
            instrumentSelectElem.id = 'instrument-control';
            bottomControlsGridElem.appendChild(instrumentSelectElem);
/*            instrumentSelect = new Nexus.Select('#instrument-control', {
                'size': [150, 50],
                'options': ['bass', 'brass', 'flute',
                    'guitar', 'keyboard', 'mallet', 'organ',
                    'reed', 'string', 'synth_lead', 'vocal'
                ],
                'value': 'organ',
            });*/
            ControlLabels.createLabel(instrumentSelectElem, 'instrument-control-label');
        });
    };

    $(() => {
        let mainPanel = <HTMLElement>document.createElement("div");
        mainPanel.id = 'main-panel';
        document.body.appendChild(mainPanel);

        let spinnerElem = insertLoadingSpinner(mainPanel);

        let spectrogramContainerElem = document.createElement('div');
        spectrogramContainerElem.id = 'spectrogram-container';
        mainPanel.appendChild(spectrogramContainerElem);

        let spectrogramImageContainerElem = document.createElement('div');
        spectrogramImageContainerElem.id = 'spectrogram-image-container';
        spectrogramImageContainerElem.style.visibility = "hidden"
        spectrogramImageContainerElem.toggleAttribute('data-simplebar', true);
        // spectrogramImageContainerElem.setAttribute('data-simplebar-auto-hide', "false");
        // spectrogramImageContainerElem.setAttribute('force-visible', 'x');
        spectrogramContainerElem.appendChild(spectrogramImageContainerElem);

        let spectrogramPictureElem = document.createElement('picture');
        spectrogramPictureElem.id = 'spectrogram-picture';
        spectrogramImageContainerElem.appendChild(spectrogramPictureElem);
        let spectrogramImageElem = document.createElement('img');
        spectrogramImageElem.id = 'spectrogram-image';
        spectrogramPictureElem.appendChild(spectrogramImageElem);
        let spectrogramSnapPointsElem = document.createElement('div');
        spectrogramSnapPointsElem.id = 'snap-points';
        spectrogramPictureElem.appendChild(spectrogramSnapPointsElem);

        let spectrogram = new Spectrogram(spectrogramContainerElem);

        let paintContainer = init("div", { id: "paintContainer" });
        spectrogramContainerElem.appendChild(paintContainer);
        paintContainer.appendChild(createPaint(spectrogramContainerElem));

        spectrogramPlaybackManager = new SpectrogramPlaybackManager(spectrogram);
        playbackManager = spectrogramPlaybackManager;
        PlaybackCommands.setPlaybackManager(spectrogramPlaybackManager);

        vqvaeLayerSelect.value = 'top-brush';  // trigger correct rendering of the spectrogram grid
        const sendCodesWithRequest = false;
        const initial_command = ('?pitch=' + pitchControl.value.toString()
            + '&instrument_family_str=' + instrumentSelect.value
            + '&layer=' + vqvaeLayerSelect.value.split('-')[0]
            + '&temperature=1'
            + '&duration_top=4');

        loadAudioAndSpectrogram(spectrogramPlaybackManager, serverUrl,
            'sample-from-dataset' + initial_command, sendCodesWithRequest).then(
                () => {
                    enableChanges();
                    if ( REGISTER_IDLE_STATE_DETECTOR ) {
                        HelpTour.registerIdleStateDetector();
                    };
                }
            );
    })

    // TODO(theis): could use a more strict type-hint (number[][]|string[][])
    // but this has the TS type-schecker fail, considering the map method (which
    // receives a union type itself) non-callable
    // see https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-3.html#caveats
    function updateConditioningMap(mask: number[][],
            currentConditioningMap: Map<string, (number|string)[][]>
            ): Map<string, (number|string)[][]> {
        // retrieve up-to-date user-selected conditioning
        const newConditioning_value = new Map()
        newConditioning_value.set('pitch', pitchControl.value)
        newConditioning_value.set('instrument_family_str', instrumentSelect.value)

        for (const [ modality, conditioning_map ] of currentConditioningMap.entries()) {
            currentConditioningMap.set(modality, (
                conditioning_map.map((row: (number|string)[], row_index: number) => {
                    return row.map((currentConditioning_value: number|string, column_index: number) => {
                        if ( mask[row_index][column_index] == 1 ) {
                            return newConditioning_value.get(modality)
                        }
                        else {
                            return currentConditioning_value
                        }
                    })
                })))
        };

        return currentConditioningMap
    }

    function getCurrentSpectrogramPositionTopLayer(): number {
        const spectrogramImageContainerElem = document.getElementById('spectrogram-image-container');
        const scrollElem = spectrogramImageContainerElem.getElementsByClassName('simplebar-content-wrapper')[0];
        const isScrollable: boolean = (scrollElem.scrollWidth - scrollElem.clientWidth) > 0;
        if (!isScrollable) {
            return 0
        }
        else {
            const currentScrollRatio = scrollElem.scrollLeft / (scrollElem.scrollWidth - scrollElem.clientWidth);
            const numSnapElems: number = document.getElementById('snap-points').getElementsByTagName('snap').length;
            // snaps happen on <snap>'s left boundaries
            const numSnapLocations: number = numSnapElems - 1;
            return Math.round(currentScrollRatio * numSnapLocations);
        }
    }

    if ( configuration['spectrogram'] ) {
        $(() => {
            let regenerationCallback = (
                (v) => {
                    let mask = spectrogramPlaybackManager.spectrogramLocator.mask;
                    let startIndexTop: number = getCurrentSpectrogramPositionTopLayer();

                    switch ( vqvaeLayerSelect.value ) {
                        case "top": {
                            currentConditioning_top = updateConditioningMap(
                                mask, currentConditioning_top
                            );
                            break;
                        };
                        case "bottom": {
                            currentConditioning_bottom = updateConditioningMap(
                                mask, currentConditioning_bottom
                            );
                            break;
                        }
                    }

                    let sendCodesWithRequest = true;
                    let generationParameters = ('?pitch=' + pitchControl.value.toString()
                        + '&instrument_family_str=' + instrumentSelect.value
                        + '&layer=' + vqvaeLayerSelect.value.split('-')[0]
                        + '&temperature=1'
                        + '&eraser_amplitude=0.1'
                        + '&start_index_top=' + startIndexTop);
                    const split_tool_select = vqvaeLayerSelect.value.split('-')
                    let command: string;
                    if ( split_tool_select.length >= 2 ) {
                        switch ( split_tool_select[1] ) {
                                case 'eraser': {
                                    command = 'erase';
                                    break;
                                };
                                case 'brush': {
                                    command = 'timerange-change';
                                    break;
                                };
                        };
                    }
                    else {
                        throw EvalError;
                    }

                    generationParameters += '&uniform_sampling=' + (
                        ( split_tool_select.length == 3 && split_tool_select[2] == 'random' )
                    ).toString();

                    loadAudioAndSpectrogram(spectrogramPlaybackManager, serverUrl,
                        command + generationParameters, sendCodesWithRequest, mask);
                }
            )
            spectrogramPlaybackManager.spectrogramLocator.registerCallback(regenerationCallback);
        });
    };

    $(() => {
        $(() => {
            let playbuttonContainerElem: HTMLElement = document.createElement('control-item');
            playbuttonContainerElem.id = 'play-button';

            bottomControlsGridElem.appendChild(playbuttonContainerElem);

            ControlLabels.createLabel(playbuttonContainerElem, 'play-button-label');

            PlaybackCommands.render(playbuttonContainerElem);
        });
    });

    function loadNewMap(newConditioningMap: Map<string, (number|string)[][]>
            ): Map<string, (number|string)[][]> {
        let conditioning_map = new Map();
        conditioning_map.set('pitch', newConditioningMap['pitch']);
        conditioning_map.set('instrument_family_str', newConditioningMap['instrument_family_str']);
        return conditioning_map
    }

    function mapToObject(conditioning_map: Map<string, (number|string)[][]>) {
        return {
            'pitch': conditioning_map.get('pitch'),
            'instrument_family_str': conditioning_map.get('instrument_family_str')
        };
    };

    async function updateAudio(audioBlob: Blob): Promise<void> {
        // clear previous blob URL
        downloadButton.revokeBlobURL();

        // allocate new local blobURL for the received audio
        const blobUrl = URL.createObjectURL(audioBlob);

        return spectrogramPlaybackManager.loadAudio(blobUrl).then(() => {
            log.debug("Tone.js Player audio succesfully loaded!");
            downloadButton.targetURL = blobUrl;
        });
    };

    async function updateSpectrogramImage(imageBlob: Blob): Promise<void> {
        return new Promise((resolve, _) => {
            const blobUrl = URL.createObjectURL(imageBlob);
            const spectrogramImageElem: HTMLImageElement = (
                <HTMLImageElement>document.getElementById('spectrogram-image'));
            spectrogramImageElem.src = blobUrl;
            $(() => {URL.revokeObjectURL(blobUrl); resolve();})
        });
    };

    async function updateAudioAndImage(audioPromise: Promise<Blob>,
            spectrogramImagePromise: Promise<Blob>): Promise<void> {
        return await Promise.all([audioPromise, spectrogramImagePromise]).then(
            // unpack the received results and update the interface
            ([audioBlob, spectrogramImageBlob]: [Blob, Blob]) => {
                updateAudio(audioBlob);
                updateSpectrogramImage(spectrogramImageBlob);
            }
        );
    };

    /**
     * Load a MusicXml file via xhttp request, and display its contents.
     */
    async function loadAudioAndSpectrogram(spectrogramPlaybackManager: SpectrogramPlaybackManager,
            serverURL: string, generationCommand: string, sendCodesWithRequest: boolean,
            mask: number[][] = null): Promise<void> {
        disableChanges();

        let payload_object = {};

        if (sendCodesWithRequest) {
            payload_object['top_code'] = currentCodes_top;
            payload_object['bottom_code'] = currentCodes_bottom;
            payload_object['top_conditioning'] = mapToObject(
                currentConditioning_top);
            payload_object['bottom_conditioning'] = mapToObject(
                currentConditioning_bottom);
        }
        if ( mask !== null ) {
            // send the mask with low-frequencies first
            payload_object['mask'] = mask.reverse();
        };

        let newCodes_top: number[][];
        let newCodes_bottom: number[][];
        let newConditioning_top: Map<string, (string | number)[][]>;
        let newConditioning_bottom: Map<string, (string | number)[][]>;

        try {
            const jsonResponse = await $.post({
                url: url.resolve(serverURL, generationCommand),
                data: JSON.stringify(payload_object),
                contentType: 'application/json',
                dataType: 'json',
            })

            newCodes_top = jsonResponse['top_code']
            newCodes_bottom = jsonResponse['bottom_code']
            newConditioning_top = loadNewMap(
                jsonResponse['top_conditioning'])
            newConditioning_bottom = loadNewMap(
                jsonResponse['bottom_conditioning'])

            const audioPromise = getAudioRequest(spectrogramPlaybackManager, serverURL,
                newCodes_top, newCodes_bottom);
            const spectrogramImagePromise = getSpectrogramImageRequest(
                spectrogramPlaybackManager, serverURL, newCodes_top, newCodes_bottom);

            await updateAudioAndImage(audioPromise, spectrogramImagePromise);
        }
        catch(e) {
            console.log(e);
            spectrogramPlaybackManager.spectrogramLocator.clear();
            enableChanges();
            return
        }

        currentCodes_top = newCodes_top;
        currentCodes_bottom = newCodes_bottom;
        currentConditioning_top = newConditioning_top;
        currentConditioning_bottom = newConditioning_bottom;

        spectrogramPlaybackManager.spectrogramLocator.vqvaeTimestepsTop = currentCodes_top[0].length;
        triggerInterfaceRefresh();
        spectrogramPlaybackManager.spectrogramLocator.clear();
        enableChanges();
    };

    function dropHandler(e: DragEvent) {
        // Prevent default behavior (Prevent file from being opened)
        e.preventDefault();
        e.stopPropagation();

        if (e.dataTransfer.items) {
            // Use DataTransferItemList interface to access the file(s)
            for (var i = 0; i < e.dataTransfer.items.length; i++) {
            // If dropped items aren't files, reject them
            if (e.dataTransfer.items[i].kind === 'file') {
                var file = e.dataTransfer.items[i].getAsFile();
                console.log('... file[' + i + '].name = ' + file.name);
                const generationParameters = (
                    '?pitch=' + pitchControl.value.toString()
                    + '&instrument_family_str=' + instrumentSelect.value);
                sendAudio(file, spectrogramPlaybackManager, serverUrl,
                    'analyze-audio' + generationParameters);
                return  // only send the first file
            }
            }
        } else {
            // Use DataTransfer interface to access the file(s)
            for (var i = 0; i < e.dataTransfer.files.length; i++) {
                console.log('... file[' + i + '].name = ' + e.dataTransfer.files[i].name);
            }
        }
    };

    async function sendAudio(audioBlob: Blob, spectrogramPlaybackManager: SpectrogramPlaybackManager,
            serverURL: string, generationCommand: string) {
        disableChanges();

        let payload_object = {};

        let form = new FormData();
        form.append('audio', audioBlob);

        let newCodes_top: number[][];
        let newCodes_bottom: number[][];
        let newConditioning_top: Map<string, (string | number)[][]>;
        let newConditioning_bottom: Map<string, (string | number)[][]>;

        try {
            const jsonResponse = await $.post({
                url: url.resolve(serverURL, generationCommand),
                data: form,
                contentType: false,
                dataType: 'json',
                processData: false,
            })

            newCodes_top = jsonResponse['top_code']
            newCodes_bottom = jsonResponse['bottom_code']
            newConditioning_top = loadNewMap(
                jsonResponse['top_conditioning'])
            newConditioning_bottom = loadNewMap(
                jsonResponse['bottom_conditioning'])

            const audioPromise = getAudioRequest(spectrogramPlaybackManager, serverURL,
                newCodes_top, newCodes_bottom);
            const spectrogramImagePromise = getSpectrogramImageRequest(
                spectrogramPlaybackManager, serverURL, newCodes_top, newCodes_bottom);

            await updateAudioAndImage(audioPromise, spectrogramImagePromise);
        }
        catch(e) {
            console.log(e);
            spectrogramPlaybackManager.spectrogramLocator.clear();
            enableChanges();
            return
        }

        currentCodes_top = newCodes_top;
        currentCodes_bottom = newCodes_bottom;
        currentConditioning_top = newConditioning_top;
        currentConditioning_bottom = newConditioning_bottom;

        spectrogramPlaybackManager.spectrogramLocator.vqvaeTimestepsTop = currentCodes_top[0].length;
        triggerInterfaceRefresh();
        spectrogramPlaybackManager.spectrogramLocator.clear();
        enableChanges();
    };

    async function getAudioRequest(spectrogramPlaybackManager: SpectrogramPlaybackManager,
            serverURL: string, top_code: number[][], bottom_code: number[][]): Promise<Blob> {
        let payload_object = {};
        payload_object['top_code'] = top_code;
        payload_object['bottom_code'] = bottom_code;

        const generationCommand: string = '/get-audio';
        return $.post({
                url: url.resolve(serverURL, generationCommand),
                data: JSON.stringify(payload_object),
                xhrFields: {
                    responseType: 'blob'
                },
                contentType: 'application/json'
            })
    }

    async function getSpectrogramImageRequest(spectrogramPlaybackManager: SpectrogramPlaybackManager,
            serverURL: string, top_code: number[][], bottom_code: number[][]): Promise<Blob> {
        let payload_object = {};

        payload_object['top_code'] = top_code;
        payload_object['bottom_code'] = bottom_code;

        const generationCommand: string = '/get-spectrogram-image';
        return $.post({
            url: url.resolve(serverURL, generationCommand),
            data: JSON.stringify(payload_object),
            xhrFields: {
                responseType: 'blob'
            },
            contentType: 'application/json',
        })
    }

    $(() => {
        let insertWavInput: boolean = configuration['insert_wav_input'];
        if (insertWavInput) {
            // createWavInput(() => loadMusicXMLandMidi(sheetPlaybackManager, osmd, serverUrl, 'get-musicxml'))
    }});

    $(() => {
        let bottomControlsGridElem = document.getElementById('bottom-controls')
        downloadButton = new DownloadButton(bottomControlsGridElem,
            configuration);
    });

    $(() => {
       let bottomControlsGridElem = document.getElementById('bottom-controls')

    });

    $(() => {
        // LinkClient.kill();
        // if (useAdvancedControls) {
        //     // Insert LINK client controls
        //     LinkClientCommands.render();
        //     LinkClientCommands.renderDownbeatDisplay();
        // }
    }
    );

    // $(() => {
    //     if ( useAdvancedControls ) {
    //         // Add manual Link-Sync button
    //         const bottomControlsGridElem = document.getElementById('bottom-controls')
    //         PlaybackCommands.renderSyncButton(bottomControlsGridElem);
    //     }}
    // );

    $(() => {
        // register file drop handler
        document.body.addEventListener('drop', dropHandler);
    })

    $(() => {
        let bottomControlsGridElem = document.getElementById('bottom-controls');
        let fadeInControlElement: HTMLElement = document.createElement('control-item');
        fadeInControlElement.id = 'fade-in-control';
        bottomControlsGridElem.appendChild(fadeInControlElement);
        renderFadeInControl(fadeInControlElement, spectrogramPlaybackManager);
    });
}

$(() => {
    // register minimal error handler
    $(document).ajaxError((error) => console.log(error));

    SplashScreen.render(render);
});

$(() => {
    // disable drop events on whole window
    window.addEventListener("dragover", function(e) {
        e.preventDefault(); e.stopPropagation();}, false);
    window.addEventListener("drop", function(e) {
        e.preventDefault(); e.stopPropagation();}, false);
});

if (module.hot) { }
