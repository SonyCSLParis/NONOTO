import {fabric} from 'fabric';
import {serverUrl, load_chorale} from './index'
import * as Nexus from 'nexusui'

import './styles/drawing_area.scss'

function isForward(path) {
  return path.path.every((val, i, arr) => !i || (val[1] >= arr[i - 1][1]));
}

function isBackward(path) {
  return path.path.every((val, i, arr) => !i || (val[1] <= arr[i - 1][1]));
}

function Initialize_canvas() {

  var get_notes;
  let canvasElem: HTMLCanvasElement = document.createElement("canvas");
  canvasElem.id = 'c';
  canvasElem.height = 200;
  canvasElem.width = 3200;
  document.body.appendChild(canvasElem);
  var canvas = new fabric.Canvas('c', { selection: false });

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
  get_notes = Initialize_free_mode();

  let drawingControlsElem: HTMLDivElement = document.createElement('div');
  drawingControlsElem.id = 'drawing-controls';
  drawingControlsElem.style.display = 'grid';
  drawingControlsElem.style.gridTemplateColumns = 'repeat(3, 1fr)';
  drawingControlsElem.style.width = '30%';
  document.body.appendChild(drawingControlsElem);

  let selectModebuttonElem: HTMLElement = document.createElement("div");
  selectModebuttonElem.id = 'select-mode-button';
  drawingControlsElem.appendChild(selectModebuttonElem);

  let selectModebutton = new Nexus.TextButton('#select-mode-button',{
      'size': [150,50],
      'state': false,
      'text': 'Mode : linear',
      'alternateText' : 'Mode : free'
  });
  selectModebutton.textElement.style.fontSize = '16px';

  selectModebutton.on('change', (event) => { if (selectModebutton.state) {get_notes = Initialize_linear_mode();}
                                              else {get_notes = Initialize_free_mode();}
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

  clearbutton.on('change', (event) => { if (clearbutton.state) {canvas.clear().renderAll()} });

  let sendbuttonElem: HTMLElement = document.createElement("div");
  sendbuttonElem.id = 'send-button';
  drawingControlsElem.appendChild(sendbuttonElem);

  let sendbutton = new Nexus.TextButton('#send-button',{
      'size': [150,50],
      'state': false,
      'text': 'Send'
  });

  sendbutton.on('change', (e) => {if (sendbutton.state) {send_notes()}});
  sendbutton.textElement.style.fontSize = '16px';

  // in order to update get_notes value in sendbutton callback
  function send_notes() {
    return(get_notes.send())
  }

  function Initialize_linear_mode() {
      canvas.isDrawingMode = 0;
      canvas.clear().renderAll();

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

      var drawn_notes = {
        send: () => { var notes = {};
                            var k = 0;
                            canvas.forEachObject((obj) => { var coords = [obj.x1, obj.y1, obj.x2, obj.y2];
                                                            Object.assign(notes, {['line' + k] : coords})
                                                            k++;
                                                          });
                            $.post({
                                url: serverUrl + 'compute-drawn-notes' + `?length=${k}` + `&mode=${'linear'}`
                                          + `&absWidth=${canvas.width}` + `&absHeight=${canvas.height}`,
                                data: JSON.stringify(notes),
                                contentType: 'application/json',
                                dataType: 'xml',
                                success: load_chorale
                                    })
                         }
      }
      return(drawn_notes);

  }

  function Initialize_free_mode() {

      canvas.clear().renderAll();
      canvas.off('mouse:up');
      canvas.off('mouse:down');
      canvas.off('mouse:move');
      canvas.isDrawingMode = 1;
      canvas.freeDrawingBrush.color = 'cyan'
      canvas.freeDrawingBrush.width = 2;

      var path;
      canvas.on('path:created', (e) => {
                canvas.isDrawingMode = 0;
    						path = e.path;
                canvas.isDrawingMode = 1;
                path.selectable = false;
                path.hoverCursor = 'pointer';
                canvas.renderAll()
                if (isForward(path) || isBackward(path)) {
                    canvas.forEachObject((obj) => {if (!(typeof(obj) === 'undefined') && !(obj === path)) {
                                                        let point_tl = new fabric.Point(obj.path[0][1], 0);
                                                        let point_br = new fabric.Point(obj.path[obj.path.length -1][1], canvas.height);
                                                        if (path.intersectsWithRect(point_tl, point_br) || path.isContainedWithinRect(point_tl, point_br)) {canvas.remove(path).renderAll()}
                                                      }
                                                    })

                                        }
                else {canvas.remove(path).renderAll()}
              })

      var drawn_notes = {
        send: () => { var notes = {};
                                  var k = 0;
                                  canvas.forEachObject((obj) => { Object.assign(notes, { ['line' + k] : obj.path})
                                                                  k++;});
                                  $.post({
                                      url: serverUrl + 'compute-drawn-notes' + `?length=${k}` + `&mode=${'free'}`
                                              + `&absWidth=${canvas.width}` + `&absHeight=${canvas.height}`,
                                      data: JSON.stringify(notes),
                                      contentType: 'application/json',
                                      dataType: 'xml',
                                      success: load_chorale
                                          })



                                 }
                        }
      return(drawn_notes)
    }

}

export {Initialize_canvas};
