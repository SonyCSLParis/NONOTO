import {fabric} from 'fabric';
import {serverUrl, load_chorale, getMetadata} from './index'
import * as Nexus from 'nexusui'

import './styles/drawing_area.scss'

const maximum_sixteenth_notes = 64
var canvas;
const time_step = 25;
var composition_mode;

function isForward(path) {
  return path.path.every((val, i, arr) => !i || (val[1] >= arr[i - 1][1]));
}

function isBackward(path) {
  return path.path.every((val, i, arr) => !i || (val[1] <= arr[i - 1][1]));
}

function Initialize_canvas() {
  var canvasElem: HTMLCanvasElement = document.createElement("canvas");
  canvasElem.id = 'c';
  canvasElem.height = 220;
  canvasElem.width = time_step * maximum_sixteenth_notes;
  document.body.appendChild(canvasElem);
  canvas = new fabric.Canvas('c', { selection: false });


  // Enable handling right-click event to remove lines
  $('.upper-canvas').bind('contextmenu', function (e) {
      var objectFound = false;
      var clickPoint = new fabric.Point(e.offsetX, e.offsetY);

      e.preventDefault();
      canvas.forEachObject(function (obj) {
          if (!objectFound && obj.containsPoint(clickPoint)) {
              objectFound = true;
              canvas.remove(obj); }
            });
      });


// Default mode : free drawing mode
  Initialize_free_mode();

  let drawingControlsElem: HTMLDivElement = document.createElement('div');
  drawingControlsElem.id = 'drawing-controls';
  drawingControlsElem.style.display = 'grid';
  drawingControlsElem.style.gridTemplateColumns = 'repeat(5, 2fr)';
  drawingControlsElem.style.width = '50%';
  document.body.appendChild(drawingControlsElem);

  let selectCompoModebuttonElem: HTMLElement = document.createElement("div");
  selectCompoModebuttonElem.id = 'select-compo-mode-button';
  drawingControlsElem.appendChild(selectCompoModebuttonElem);

  let selectCompoModebutton = new Nexus.TextButton('#select-compo-mode-button',{
      'size': [200,50],
      'state': false,
      'text': 'Composition mode : Edit',
      'alternateText' : 'Composition mode : Modify'
  });
  selectCompoModebutton.textElement.style.fontSize = '16px';

  selectCompoModebutton.on('change', (event) => { if (selectCompoModebutton.state) {Initialize_modif_mode(composition_mode);}
                                              else {if (selectDrawingModebutton.state) {Initialize_linear_mode();}
                                                    else {Initialize_free_mode();}}
              });

  let selectDrawingModebuttonElem: HTMLElement = document.createElement("div");
  selectDrawingModebuttonElem.id = 'select-mode-button';
  drawingControlsElem.appendChild(selectDrawingModebuttonElem);

  let selectDrawingModebutton = new Nexus.TextButton('#select-mode-button',{
      'size': [200,50],
      'state': false,
      'text': 'Drawing mode : Linear',
      'alternateText' : 'Drawing mode : Free'
  });
  selectDrawingModebutton.textElement.style.fontSize = '16px';

  selectDrawingModebutton.on('change', (event) => { if (selectDrawingModebutton.state) {canvas.clear().renderAll();
                                                                                        Initialize_linear_mode();}
                                                    else {canvas.clear().renderAll();
                                                          Initialize_free_mode();}
              });

  let clearbuttonElem: HTMLElement = document.createElement("div");
  clearbuttonElem.id = 'clear-button';
  drawingControlsElem.appendChild(clearbuttonElem);

  let clearbutton = new Nexus.TextButton('#clear-button',{
      'size': [150,50],
      'state': false,
      'text': 'Clear all'
  });
  clearbutton.textElement.style.fontSize = '16px';

  clearbutton.on('change', (event) => { if (clearbutton.state) {canvas.clear().renderAll()}});

  let sendbuttonElem: HTMLElement = document.createElement("div");
  sendbuttonElem.id = 'send-button';
  drawingControlsElem.appendChild(sendbuttonElem);

  let sendbutton = new Nexus.TextButton('#send-button',{
      'size': [150,50],
      'state': false,
      'text': 'Send'
  });

  sendbutton.on('change', (e) => {if (sendbutton.state) {send_callback();}});
  sendbutton.textElement.style.fontSize = '16px';

  // var canvasElem2: HTMLCanvasElement = document.createElement("canvas");
  // canvasElem2.id = 'c2';
  // canvasElem2.height = 220;
  // canvasElem2.width = time_step * maximum_sixteenth_notes;
  // document.body.appendChild(canvasElem2);
  // canvas2 = new fabric.Canvas('c2', { selection: false });
  // Initialize_edition_mode();

}

function send_callback(note_start=undefined, note_end=undefined){
  return (send_notes(note_start, note_end, composition_mode))
}
// function Initialize_edition_mode() {
//   canvas2.off('mouse:down');
//   canvas2.isDrawingMode = 1;
//   canvas2.freeDrawingBrush.color = 'red';
//   canvas2.freeDrawingBrush.width = 2;
//   var notes;
//   var path;
//   canvas2.on('path:created', (e) => {
//             canvas2.isDrawingMode = 0;
//             path = e.path;
//             canvas2.isDrawingMode = 1;
//             path.selectable = false;
//             path.hoverCursor = 'pointer';
//             canvas2.renderAll();
//             if (isForward(path) || isBackward(path)) {
//                 canvas2.forEachObject((obj) => {if (!(typeof(obj) === 'undefined') && !(obj === path)) {
//                                                     let point_tl = new fabric.Point(obj.path[0][1], 0);
//                                                     let point_br = new fabric.Point(obj.path[obj.path.length -1][1], canvas.height);
//                                                     if (path.intersectsWithRect(point_tl, point_br) || path.isContainedWithinRect(point_tl, point_br)) {canvas2.remove(path).renderAll()}
//                                                   }
//                                                 })
//
//                                     }
//             else {canvas2.remove(path).renderAll()}
//             notes = {}
//             var k = 0;
//             canvas2.forEachObject((obj) => { Object.assign(notes, { ['line' + k] : obj.path})
//                                             k++;});
//               $.post({
//                   url: serverUrl + 'compute-drawn-notes' + `?length=${k}` + `&mode=${'immediate_edition'}`
//                           + `&timeStep=${time_step}` + `&absHeight=${canvas.height}`,
//                   data: JSON.stringify(notes),
//                   contentType: 'application/json',
//                   success: (data) => {loadMidi(serverUrl + 'get-midi', false);}
//                       })
//
//             });
//   }

function Initialize_modif_mode(composition_mode) {
  canvas.isDrawingMode = 0;
  var note_start;
  var note_end;
  canvas.on('mouse:up', function(o){
    var objectFound = false;
    var clickPoint = new fabric.Point(o.e.offsetX, o.e.offsetY);
    canvas.forEachObject(function (obj) {
        if (!objectFound && obj.containsPoint(clickPoint)) {
            objectFound = true;

            if (composition_mode === 'free'){
              note_start = Math.floor(obj.path[0][1] / (time_step * 4)) + 1
              note_end = Math.floor(obj.path[obj.path.length -1][1] / (time_step * 4))
            }
            else{
              note_start = Math.floor(Math.min(obj.x1,obj.x2) / (time_step * 4))
              note_end = Math.floor(Math.max(obj.x1,obj.x2) / (time_step * 4)) + 1
            }
            console.log(note_start)
            console.log(note_end)
            send_notes(note_start, note_end, composition_mode)
            ;}
          });
    });
}

function send_notes(note_start=undefined, note_end=undefined, composition_mode) {
    var notes = {};
    var k = 0
    if (composition_mode === 'linear'){
      canvas.forEachObject((obj) => {var coords = [obj.x1, obj.y1, obj.x2, obj.y2];
                                      Object.assign(notes, {['line' + k] : coords})
                                      k++; })
    }
    else {
      canvas.forEachObject((obj) => {Object.assign(notes, {['line' + k] : obj.path})
                                      k++; })
    }

    if (note_start !== undefined){
      console.log(JSON.stringify(getMetadata()));
      $.post({
          url: serverUrl + 'compute-drawn-notes' + `?length=${Object.keys(notes).length}` + `&mode=${composition_mode}`
                    + `&timeStep=${time_step}` + `&absHeight=${canvas.height}` + `&quarterNoteStart=${note_start}` +
                        `&quarterNoteEnd=${note_end}`,
          data: JSON.stringify({'notes' : notes,
                                'metadata' : getMetadata()}),
          contentType: 'application/json',
          dataType: 'xml',
          success: (xmldata : XMLDocument) => {load_chorale(xmldata, false);}
              })
    }
    else{
      $.post({
          url: serverUrl + 'compute-drawn-notes' + `?length=${Object.keys(notes).length}` + `&mode=${composition_mode}`
                  + `&timeStep=${time_step}` + `&absHeight=${canvas.height}`,
          data: JSON.stringify(notes),
          contentType: 'application/json',
          dataType: 'xml',
          success: (xmldata : XMLDocument) => {load_chorale(xmldata, true);}
              })
            }
}

function Initialize_linear_mode() {
    canvas.isDrawingMode = 0;
    composition_mode = 'linear';
    var line, isDown;
    canvas.on('mouse:down', function(o){
      isDown = true;
      var pointer = canvas.getPointer(o.e);
      var points = [ pointer.x, pointer.y, pointer.x, pointer.y ];
      line = new fabric.Line(points, {
        strokeWidth: 2,
        stroke: 'purple',
        originX: 'center',
        originY: 'center'
      });
      canvas.add(line);
    });

    canvas.on('mouse:move', function(o) {
      if (!isDown) return;
      var pointer = canvas.getPointer(o.e);
      line.set({ x2: pointer.x, y2: pointer.y });
      canvas.renderAll();
    });

    canvas.on('mouse:up', function(o) {
      isDown = false;
      line.setCoords();
      line.selectable = false;
      line.hoverCursor = 'pointer';
      canvas.renderAll();
      canvas.forEachObject((obj) => {if (!(typeof(obj) === 'undefined') && !(obj === line)) {
                                          let point_tl = new fabric.Point(obj.x1, 0);
                                          let point_br = new fabric.Point(obj.x2, canvas.height);
                                          if (line.intersectsWithRect(point_tl, point_br) || line.isContainedWithinRect(point_tl, point_br)) {canvas.remove(line).renderAll()}
                                        }

                                      });
                                    });
  };


function Initialize_free_mode() {
    canvas.off('mouse:up');
    canvas.off('mouse:down');
    canvas.off('mouse:move');
    canvas.isDrawingMode = 1;
    canvas.freeDrawingBrush.color = 'red';
    canvas.freeDrawingBrush.width = 2;
    composition_mode = 'free';
    var path;
    canvas.on('path:created', (e) => {
              canvas.isDrawingMode = 0;
              path = e.path;
              canvas.isDrawingMode = 1;
              path.selectable = false;
              path.hoverCursor = 'pointer';
              canvas.renderAll();
              if (isForward(path) || isBackward(path)) {
                  canvas.forEachObject((obj) => {if (!(typeof(obj) === 'undefined') && !(obj === path)) {
                                                      let point_tl = new fabric.Point(obj.path[0][1], 0);
                                                      let point_br = new fabric.Point(obj.path[obj.path.length -1][1], canvas.height);
                                                      if (path.intersectsWithRect(point_tl, point_br) || path.isContainedWithinRect(point_tl, point_br)) {canvas.remove(path).renderAll();}
                                                    }
                                                  })
                                      }
              else {canvas.remove(path).renderAll();}
            });
}

export {send_callback}
export {Initialize_canvas};
