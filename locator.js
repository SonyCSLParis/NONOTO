"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var opensheetmusicdisplay_1 = require("opensheetmusicdisplay");
var fermata_1 = require("./fermata");
var chord_selector_1 = require("./chord_selector");
var $ = require("jquery");
require("nipplejs");
require("./styles/overlays.scss");
var eOSMD = /** @class */ (function (_super) {
    __extends(eOSMD, _super);
    function eOSMD(container, autoResize, leadsheet) {
        if (autoResize === void 0) { autoResize = false; }
        if (leadsheet === void 0) { leadsheet = false; }
        var _this = _super.call(this, container, autoResize) || this;
        _this._chordSelectors = [];
        _this._fermatas = [];
        _this._boundingBoxes = [];
        _this.leadsheet = leadsheet;
        if (leadsheet) {
        }
        return _this;
    }
    Object.defineProperty(eOSMD.prototype, "chordSelectors", {
        get: function () {
            return this._chordSelectors;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(eOSMD.prototype, "fermatas", {
        get: function () {
            return this._fermatas;
        },
        enumerable: true,
        configurable: true
    });
    eOSMD.prototype.render = function (onclickFactory) {
        if (onclickFactory === void 0) { onclickFactory = undefined; }
        _super.prototype.render.call(this);
        this.drawTimestampBoxes(onclickFactory);
    };
    eOSMD.prototype.computeBoundingBoxes = function () {
        // TODO find measureIndex and staffIndex
        var measureList = this.graphicalMusicSheet.MeasureList;
        var numberOfStaves = measureList[0].length;
        var staffIndex = 0;
        var boundingBoxes = [];
        for (var measureIndex in measureList) {
            var measure = measureList[measureIndex][staffIndex]; // first staff
            // let staff = measure.getVFStave();
            var system = measure.parentMusicSystem;
            var height = system.PositionAndShape.Size.height;
            var measureBoundingBox = measure.PositionAndShape;
            var x = measureBoundingBox.AbsolutePosition.x;
            var y = measureBoundingBox.AbsolutePosition.y;
            var width = measureBoundingBox.Size.width;
            var rectangle = {
                "xmin": x * 10,
                "ymin": y * 10,
                "xmax": (x + width) * 10,
                "ymax": (y + height) * 10
            };
            boundingBoxes.push(rectangle);
        }
        this._boundingBoxes = boundingBoxes;
    };
    ;
    // compute a position accounting for <this>'s zoom level
    eOSMD.prototype.computePositionZoom = function (value, shift) {
        if (shift === void 0) { shift = 1; }
        return ((value - shift) * 10.0 * this.zoom);
    };
    /*
    Create an overlay box with given shape and assign it the given divClass
    */
    eOSMD.prototype.createTimeDiv = function (x, y, width, height, divClass, divId, onclick, timestamps) {
        // container for positioning the timestamp box and attached boxes
        // needed to properly filter click actions
        var commonDivId = divId + '-common';
        var commonDiv = (document.getElementById(commonDivId) ||
            document.createElement("div"));
        var div = (document.getElementById(divId) ||
            document.createElement("div"));
        commonDiv.style.top = this.computePositionZoom(y, 0) + 'px';
        commonDiv.style.height = this.computePositionZoom(height, 0) + 'px';
        commonDiv.style.left = this.computePositionZoom(x, 1) + 'px';
        commonDiv.style.width = this.computePositionZoom(width) + 'px';
        if (commonDiv.id !== commonDivId) {
            // the div has no ID set yet: was created in this call
            commonDiv.id = commonDivId;
            commonDiv.classList.add('timecontainer');
            commonDiv.classList.add(divClass);
            div.id = divId;
            div.classList.add('notebox');
            div.classList.add('available');
            // div.classList.add(divClass);
            // FIXME constrains granularity
            var containedQuarterNotes = [];
            var quarterNoteStart = Math.floor(timestamps[0].RealValue * 4);
            var quarterNoteEnd = Math.floor(timestamps[1].RealValue * 4);
            for (var i = quarterNoteStart; i < quarterNoteEnd; i++) {
                containedQuarterNotes.push(i);
            }
            commonDiv.setAttribute('containedQuarterNotes', containedQuarterNotes.toString().replace(/,/g, ' '));
            // div.setAttribute('containedQuarterNotes',
            //     commonDiv.getAttribute('containedQuarterNotes'));
            var granularitySelect = document.getElementById('select-granularity').children[0];
            var currentGranularity = granularitySelect[parseInt(granularitySelect.value)].textContent;
            if (currentGranularity == divClass)
                div.classList.add('active');
            // // insert NipppleJS manager
            // var options = {
            //     zone: div,
            //     color: "blue"
            // };
            // var manager = nipplejs.create(options);
            // var joystick_data = {};
            // var last_click = [];
            div.addEventListener('click', onclick);
            // use bubbling and preventDefault to block window scrolling
            div.addEventListener('wheel', function (event) {
                event.preventDefault();
                var scrollUp = (-event.deltaY >= 0);
                cycleGranularity(scrollUp);
            }, false);
            // add div to the rendering backend's <HTMLElement> for positioning
            var inner = this.renderingBackend.getInnerElement();
            inner.appendChild(commonDiv);
            commonDiv.appendChild(div);
            if (!this.leadsheet && divClass === 'quarter-note') { // FIXME hardcoded quarter-note duration
                // add fermata selection box
                this.fermatas.push(new fermata_1.FermataBox(commonDiv, this.sequenceDuration()));
            }
            if (this.leadsheet && divClass == 'half-note') {
                // add chord selection boxes at the half-note level
                this._chordSelectors.push(new chord_selector_1.ChordSelector(commonDiv));
            }
        }
        return div;
    };
    ;
    eOSMD.prototype.sequenceDuration = function () {
        // FIXME hardcoded 4/4 time-signature
        return this.graphicalMusicSheet.MeasureList.length * 4;
    };
    eOSMD.prototype.drawChordBox = function (timestampDiv) {
        // Position chord box over `timestampElement`
        // FIXME hardcoded half-note duration
        var chordDivId = timestampDiv.id + '-chord';
        var chordDiv = (document.getElementById(chordDivId) ||
            document.createElement("div"));
        chordDiv.id = chordDivId;
        chordDiv.classList.add('chord');
        var containedQuarters_str = timestampDiv.getAttribute('containedquarternotes');
        chordDiv.setAttribute('containedquarternotes', containedQuarters_str);
        chordDiv.addEventListener('click', function () {
            chordDiv.classList.toggle('active');
        });
        timestampDiv.parentNode.appendChild(chordDiv);
    };
    eOSMD.prototype.drawTimestampBoxes = function (onclickFactory) {
        if (onclickFactory === void 0) { onclickFactory = undefined; }
        // FIXME this assumes a time signature of 4/4
        var measureList = this.graphicalMusicSheet.MeasureList;
        var numberOfStaves = measureList[0].length;
        function makeTimestamps(timeTuples) {
            return timeTuples.map(function (_a) {
                var num = _a[0], den = _a[1];
                return new opensheetmusicdisplay_1.Fraction(num, den);
            });
        }
        var timestampsQuarter = makeTimestamps([[0, 4], [1, 4],
            [2, 4], [3, 4], [4, 4]]);
        var timestampsHalf = makeTimestamps([[0, 2], [1, 2], [2, 2]]);
        var timestampsWhole = makeTimestamps([[0, 1], [1, 1]]);
        var timestampsAndNames = [
            [timestampsQuarter, "quarter-note"],
            [timestampsHalf, "half-note"],
            [timestampsWhole, "whole-note"]
        ];
        for (var measureIndex in measureList) {
            var measure = measureList[measureIndex][0];
            var beginInstructionsWidth = measure.beginInstructionsWidth;
            var sourceMeasure = measure.parentSourceMeasure;
            var absoluteTimestamp = sourceMeasure.AbsoluteTimestamp;
            var musicSystem = measure.parentMusicSystem;
            var systemTop = musicSystem.PositionAndShape.AbsolutePosition.y;
            var systemHeight = musicSystem.PositionAndShape.Size.height;
            // cf. sizing the Cursor in OpenSheetMusicDisplay/Cursor.ts
            var y = musicSystem.PositionAndShape.AbsolutePosition.y + musicSystem.StaffLines[0].PositionAndShape.RelativePosition.y;
            var endY = musicSystem.PositionAndShape.AbsolutePosition.y +
                musicSystem.StaffLines[musicSystem.StaffLines.length - 1].PositionAndShape.RelativePosition.y + 4.0;
            var height = endY - y;
            for (var _i = 0, timestampsAndNames_1 = timestampsAndNames; _i < timestampsAndNames_1.length; _i++) {
                var _a = timestampsAndNames_1[_i], timestampList = _a[0], granularityName = _a[1];
                for (var timestampIndex = 0; timestampIndex < timestampList.length - 1; timestampIndex++) {
                    var leftTimestamp = opensheetmusicdisplay_1.Fraction.plus(absoluteTimestamp, timestampList[timestampIndex]);
                    var rightTimestamp = opensheetmusicdisplay_1.Fraction.plus(absoluteTimestamp, timestampList[timestampIndex + 1]);
                    var xLeft = this.graphicalMusicSheet
                        .calculateXPositionFromTimestamp(leftTimestamp)[0];
                    var xRight = void 0;
                    if (timestampIndex < timestampList.length - 2) {
                        // x-coordinates for the bounding box
                        xRight = this.graphicalMusicSheet
                            .calculateXPositionFromTimestamp(rightTimestamp)[0];
                    }
                    else {
                        // reached last segment of the measure
                        // set xRight as the x-position of the next measure bar
                        xRight = (measure.PositionAndShape.AbsolutePosition.x +
                            measure.PositionAndShape.Size.width) + 1;
                    }
                    if (beginInstructionsWidth > 1) {
                        if (beginInstructionsWidth > 5) {
                            xLeft -= 1; // HACK hardcoded
                            xRight -= 1;
                        }
                        else {
                            xLeft -= 2;
                            xRight -= 2;
                        }
                    }
                    var width = xRight - xLeft;
                    var onclick_1 = function (event) { };
                    if (onclickFactory) {
                        onclick_1 = onclickFactory(leftTimestamp, rightTimestamp);
                    }
                    var timediv = this.createTimeDiv(xLeft, y, width, height, granularityName, granularityName + "-" + measureIndex + "-" + timestampIndex, onclick_1, [leftTimestamp, rightTimestamp]);
                }
            }
            var duration = sourceMeasure.Duration;
        }
    };
    Object.defineProperty(eOSMD.prototype, "boundingBoxes", {
        get: function () {
            this.computeBoundingBoxes();
            return this._boundingBoxes;
        },
        enumerable: true,
        configurable: true
    });
    return eOSMD;
}(opensheetmusicdisplay_1.OpenSheetMusicDisplay));
exports.eOSMD = eOSMD;
function cycleGranularity(increase) {
    var granularitySelect = $('#select-granularity > select');
    // if (granularitySelect.length > 0) {
    var granularitySelectElem = granularitySelect[0];
    // let granularitySelectElem: HTMLSelectElement = <HTMLSelectElement>document.getElementById('select-granularity').children[0]
    var selectedGranularity = parseInt(granularitySelect.val().toString());
    var numOptions = granularitySelectElem.children.length;
    if (increase) {
        granularitySelectElem.value =
            Math.min(selectedGranularity + 1, numOptions - 1).toString();
    }
    else {
        granularitySelectElem.value =
            Math.max(selectedGranularity - 1, 0).toString();
    }
    // trigger `onchange` callback
    granularitySelectElem.dispatchEvent(new Event('change'));
    // }
}
