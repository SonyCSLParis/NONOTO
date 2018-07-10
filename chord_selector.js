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
var annotationBox_1 = require("./annotationBox");
var $ = require("jquery");
var ChordSelector = /** @class */ (function (_super) {
    __extends(ChordSelector, _super);
    function ChordSelector(timestampContainer, wheelSize_px) {
        if (wheelSize_px === void 0) { wheelSize_px = 250; }
        var _this = _super.call(this, timestampContainer) || this;
        _this.notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B', '-'];
        _this.accidentals = (function () {
            var accidentals = [];
            for (var i in _this.notes) {
                accidentals.push('b');
                accidentals.push('#');
            }
            ;
            return accidentals;
        })();
        _this.chordTypes = ['M', '-', 'M7', '-7'];
        // keep track the previously selected index to detect re-clicks
        // on the same note and don't disaply accidental selector in that case
        _this.previouslySelectedNoteIndex = null;
        _this.container.classList.add('noselect');
        _this.wheelSize_px = wheelSize_px;
        _this.draw();
        return _this;
    }
    ChordSelector.prototype.validateTimestampContainer = function () {
        if (!this.timestampContainer.classList.contains('half-note')) {
            throw new EvalError("Chord selector should be associated to a half-note box");
        }
        ;
    };
    Object.defineProperty(ChordSelector.prototype, "currentNote", {
        get: function () {
            return this.notes[this.noteWheel.selectedNavItemIndex];
        },
        set: function (note) {
            var note_index = this.notes.indexOf(note);
            this.noteWheel.navigateWheel(note_index);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ChordSelector.prototype, "currentAccidental", {
        get: function () {
            var selectedAccidentalIndex = this.accidentalWheel.selectedNavItemIndex;
            if (selectedAccidentalIndex !== null && selectedAccidentalIndex > 0) {
                return this.accidentals[selectedAccidentalIndex];
            }
            else {
                return '';
            }
        },
        set: function (accidental) {
            var accidentalIndex = this.accidentals.indexOf(accidental);
            if (accidentalIndex >= 0) {
                var fullIndex = 2 * this.noteWheel.selectedNavItemIndex + accidentalIndex;
                // this.accidentalWheel.navItems[fullIndex].selected = true;
                // this.accidentalWheel.navItems[fullIndex].refreshNavItem();
                // this.accidentalWheel.selectedNavItemIndex = fullIndex;
                this.accidentalWheel.navigateWheel(fullIndex);
            }
            else {
                if (this.accidentalWheel.selectedNavItemIndex !== null && this.accidentalWheel.selectedNavItemIndex >= 0) {
                    this.accidentalWheel.navItems[this.accidentalWheel.selectedNavItemIndex].selected = false;
                    this.accidentalWheel.navItems[this.accidentalWheel.selectedNavItemIndex].refreshNavItem();
                }
                this.accidentalWheel.selectedNavItemIndex = null;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ChordSelector.prototype, "currentChordType", {
        get: function () {
            return this.chordTypes[this.chordTypeWheel.selectedNavItemIndex];
        },
        set: function (chordType) {
            var chordType_index = this.chordTypes.indexOf(chordType);
            this.chordTypeWheel.navigateWheel(chordType_index);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ChordSelector.prototype, "currentChord", {
        get: function () {
            return { note: this.currentNote, accidental: this.currentAccidental,
                chordType: this.currentChordType };
        },
        set: function (chord_obj) {
            // FIXME add proper parsing and checks
            this.currentNote = chord_obj['note'];
            if (this.currentNote !== this.notes[this.notes.length - 1]) {
                this.currentAccidental = chord_obj['accidental'];
                this.currentChordType = chord_obj['chordType'];
            }
            else {
                this.currentAccidental = '';
                this.currentChordType = this.chordTypes[0]; // WARNING could break if change to chordTypes list
            }
            ;
            this.closeSelector();
        },
        enumerable: true,
        configurable: true
    });
    ;
    ChordSelector.prototype.updateSpreader = function () {
        var currentNote = this.currentNote;
        var spreaderText = currentNote + this.currentAccidental;
        if (this.currentChordType !== 'M') {
            spreaderText = spreaderText + this.currentChordType;
        }
        this.noteWheel.spreader.inTitle.title = spreaderText;
        this.noteWheel.spreader.outTitle.title = spreaderText;
        this.noteWheel.refreshWheel();
    };
    ;
    ChordSelector.prototype.hideCurrentAccidentalNavItems = function () {
        this.accidentalWheel.navItems[2 * this.noteWheel.selectedNavItemIndex].navItem.hide();
        this.accidentalWheel.navItems[2 * this.noteWheel.selectedNavItemIndex + 1].navItem.hide();
        // if (self.chordTypeWheel.currentPercent === self.chordTypeWheel.maxPercent) {
        //   self.chordTypeWheel.spreadWheel();
        // };
    };
    ;
    ChordSelector.prototype.closeNoteWheel = function () {
        if (this.noteWheel.currentPercent === this.noteWheel.maxPercent) {
            this.noteWheel.spreadWheel();
        }
    };
    ChordSelector.prototype.closeChordTypeWheel = function () {
        if (this.chordTypeWheel.currentPercent === this.chordTypeWheel.maxPercent) {
            this.chordTypeWheel.spreadWheel();
        }
    };
    // trigger this when a note+accidental is selected to hide wnote wheels
    // and display chord type wheel
    ChordSelector.prototype.closeNoteWheelAndCleanAfterNoteAndAccidentalSelectionDone = function () {
        this.updateSpreader();
        this.hideCurrentAccidentalNavItems();
        this.previouslySelectedNoteIndex = null;
        this.closeNoteWheel();
    };
    ChordSelector.prototype.toggleActiveContainer = function (force) {
        if (force === void 0) { force = undefined; }
        var isActive = this.container.classList.toggle('active', force);
        // if (!isActive) this.removeClickListener();
    };
    ChordSelector.prototype.closeSelector = function () {
        this.closeNoteWheelAndCleanAfterNoteAndAccidentalSelectionDone();
        this.closeChordTypeWheel();
        this.toggleActiveContainer(false);
        // this.removeClickListener();
    };
    // private outsideClickListener = (event) => {
    //     // HACK!!!! wheelnav creates a <tspan style="-webkit-tap-highlight-color">
    //     // when the title of the spreader is clicked, which immeditaley disappears,
    //     // thus being considered as a click outside the spreader because this elemen,t then has no parents
    //     let target: HTMLElement = event.target
    //     target.ta
    //     if (!$(target).closest(this.container).length || (
    //         target.tagName == 'tspan' && target.style.getPropertyValue()) {
    //       console.log("Wow, clicked outside")
    //       console.log(target)
    //       console.log(target.parentElement)
    //       this.closeSelector()
    //     }
    // };
    //
    //  private initHideOnClickOutside() {
    //     // detects clicks out of the containing div and closes the selector
    //     // bind this callback when the selector is activated and unbind it when
    //     // it is closed
    //     let self = this;
    //     console.log("Binding click outside callback!!")
    //     document.body.addEventListener('click', self.outsideClickListener);
    //  };
    //
    //  private removeClickListener() {
    //      let self = this;
    //      document.body.removeEventListener('click', self.outsideClickListener)
    //  };
    ChordSelector.prototype.createWheelNav = function () {
        var _this = this;
        var self = this;
        var accidentalContainer = document.createElement('div');
        accidentalContainer.id = this.container.id + '-accidental';
        this.container.appendChild(accidentalContainer);
        var chordTypeContainer = document.createElement('div');
        chordTypeContainer.id = this.container.id + '-chordType';
        this.container.appendChild(chordTypeContainer);
        wheelnav.cssMode = true;
        //Use advanced constructor for more wheelnav on same div
        this.noteWheel = new wheelnav(this.container.id, null, this.wheelSize_px, this.wheelSize_px);
        // offset containing <svg> tag for proper positioning
        // let svgElem = $(this.container).children('svg')[0]  //offset({
        //     left: this.wheelSize_px / 2,
        //     top: this.wheelSize_px / 2
        // });
        this.accidentalWheel = new wheelnav(accidentalContainer.id, this.noteWheel.raphael);
        this.chordTypeWheel = new wheelnav(chordTypeContainer.id, this.noteWheel.raphael);
        this.noteWheel.spreaderEnable = true;
        // wheel.spreaderPathInAttr = { fill: '#FFF', 'stroke-width': 3, stroke: '#555' };
        // wheel.spreaderPathOutAttr = { fill: '#FFF', 'stroke-width': 3, stroke: '#FFF' };
        this.noteWheel.spreaderRadius = 28;
        // wheel1.spreadWheel();
        this.noteWheel.animatetime = 150;
        this.noteWheel.animateeffect = 'easeInOut';
        this.noteWheel.spreaderTitleFont = "100 20px Helvetica";
        this.noteWheel.spreaderFillColor = 'white';
        this.chordTypeWheel.spreaderEnable = false;
        this.chordTypeWheel.spreaderRadius = 28;
        // wheel1.spreadWheel();
        this.chordTypeWheel.animatetime = 105;
        this.chordTypeWheel.animateeffect = 'easeInOut';
        this.noteWheel.colors = new Array('#009CEB');
        this.accidentalWheel.colors = new Array('#FFB6C1');
        this.chordTypeWheel.colors = new Array('#FFD0B6');
        //Customize slicePaths for proper size
        this.noteWheel.slicePathFunction = slicePath().DonutSlice;
        this.noteWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this.noteWheel.slicePathCustom.minRadiusPercent = 0.18;
        this.noteWheel.slicePathCustom.maxRadiusPercent = 0.6;
        this.noteWheel.sliceSelectedPathCustom = this.noteWheel.slicePathCustom;
        this.noteWheel.sliceInitPathCustom = this.noteWheel.slicePathCustom;
        this.accidentalWheel.slicePathFunction = slicePath().DonutSlice;
        this.accidentalWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this.accidentalWheel.slicePathCustom.minRadiusPercent = 0.6;
        this.accidentalWheel.slicePathCustom.maxRadiusPercent = 0.9;
        this.accidentalWheel.sliceSelectedPathCustom = this.accidentalWheel.slicePathCustom;
        this.accidentalWheel.sliceInitPathCustom = this.accidentalWheel.slicePathCustom;
        this.chordTypeWheel.slicePathFunction = slicePath().DonutSlice;
        this.chordTypeWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this.chordTypeWheel.slicePathCustom.minRadiusPercent = 0.21;
        this.chordTypeWheel.slicePathCustom.maxRadiusPercent = 0.6;
        this.chordTypeWheel.sliceSelectedPathCustom = this.chordTypeWheel.slicePathCustom;
        this.chordTypeWheel.sliceInitPathCustom = this.chordTypeWheel.slicePathCustom;
        //Disable rotation, set navAngle and create the menus
        this.noteWheel.clickModeRotate = false;
        this.accidentalWheel.clickModeRotate = false;
        this.chordTypeWheel.clickModeRotate = false;
        this.noteWheel.navAngle = -90;
        this.accidentalWheel.navAngle = -103;
        this.chordTypeWheel.navAngle = -135;
        // start wheels in closed state
        this.noteWheel.currentPercent = 0;
        this.chordTypeWheel.currentPercent = 0;
        // init wheels
        this.noteWheel.createWheel(this.notes);
        this.accidentalWheel.createWheel(this.accidentals);
        this.chordTypeWheel.createWheel(this.chordTypes);
        // offset the svg to have the wheelnav spreader positionned correctly
        var spreaderRadius = this.noteWheel.spreaderRadius;
        var offset_px = this.wheelSize_px / 2 - spreaderRadius;
        var svgElem = $(this.container).children('svg')[0];
        svgElem.style.setProperty('position', 'absolute');
        svgElem.style.setProperty('left', "-" + offset_px + "px");
        svgElem.style.setProperty('top', "-" + offset_px + "px");
        for (var _i = 0, _a = this.accidentalWheel.navItems; _i < _a.length; _i++) {
            var item = _a[_i];
            item.navItem.hide();
        }
        this.noteWheel.spreaderTitleFont = this.noteWheel.navItems[0].titleFont;
        this.updateSpreader();
        for (var _b = 0, _c = this.noteWheel.navItems; _b < _c.length; _b++) {
            var navItem = _c[_b];
            navItem.navigateFunction = function () {
                if (this.itemIndex === (self.notes.length - 1)) {
                    // selected the 'chord continuation' symbol, close selector
                    self.currentAccidental = '';
                    self.currentChordType = self.chordTypes[0]; // WARNING could break if change to chordTypes list
                    self.closeSelector();
                    return;
                }
                if (self.previouslySelectedNoteIndex == this.itemIndex) {
                    // double click: select underlying note without accidentals
                    self.currentAccidental = '';
                    self.accidentalWheel.navItems[2 * this.itemIndex].navItem.hide();
                    self.accidentalWheel.navItems[2 * this.itemIndex + 1].navItem.hide();
                    // hide the wheel
                    self.closeNoteWheelAndCleanAfterNoteAndAccidentalSelectionDone();
                    self.chordTypeWheel.spreadWheel();
                }
                else {
                    if (self.accidentalWheel.selectedNavItemIndex !== null &&
                        self.accidentalWheel.selectedNavItemIndex !== this.itemIndex) {
                        // deselect previously selected accidental
                        self.currentAccidental = '';
                    }
                    // first click on this navSlice: display accidental selectors
                    if (self.previouslySelectedNoteIndex) {
                        self.accidentalWheel.navItems[2 * self.previouslySelectedNoteIndex].navItem.hide();
                        self.accidentalWheel.navItems[2 * self.previouslySelectedNoteIndex + 1].navItem.hide();
                    }
                    self.accidentalWheel.navItems[2 * this.itemIndex].navItem.show();
                    self.accidentalWheel.navItems[2 * this.itemIndex + 1].navItem.show();
                    self.updateSpreader();
                }
                self.previouslySelectedNoteIndex = this.itemIndex;
            };
        }
        for (var _d = 0, _e = this.accidentalWheel.navItems; _d < _e.length; _d++) {
            var navItem = _e[_d];
            navItem.navigateFunction = function () {
                self.accidentalWheel.navItems[Math.max(this.itemIndex - 1, 0)].navItem.hide();
                self.accidentalWheel.navItems[this.itemIndex].navItem.hide();
                self.accidentalWheel.navItems[Math.min(this.itemIndex + 1, self.accidentalWheel.navItems.length - 1)].navItem.hide();
                self.closeNoteWheelAndCleanAfterNoteAndAccidentalSelectionDone();
                self.chordTypeWheel.spreadWheel();
            };
        }
        for (var _f = 0, _g = this.chordTypeWheel.navItems; _f < _g.length; _f++) {
            var navItem = _g[_f];
            navItem.navigateFunction = function () {
                self.chordTypeWheel.animatetime = 0;
                self.chordTypeWheel.spreadWheel();
                self.chordTypeWheel.animatetime = 150;
                self.previouslySelectedNoteIndex = null;
                self.updateSpreader();
                self.toggleActiveContainer(false);
            };
        }
        this.noteWheel.spreader.spreaderPath.click(self.hideCurrentAccidentalNavItems.bind(self));
        this.noteWheel.spreader.spreaderTitle.click(self.hideCurrentAccidentalNavItems.bind(self));
        this.noteWheel.spreader.spreaderPath.click(self.closeChordTypeWheel.bind(self));
        this.noteWheel.spreader.spreaderTitle.click(self.closeChordTypeWheel.bind(self));
        this.noteWheel.spreader.spreaderPath.click(function () { _this.container.classList.toggle('active'); });
        this.noteWheel.spreader.spreaderTitle.click(function () { _this.container.classList.toggle('active'); });
        // focus selector div on opening to allow closing it on unfocus (= blur event)
        // function onOpenSelector() {
        //     self.initHideOnClickOutside()
        // };
        // this.noteWheel.spreader.spreaderPath.click(onOpenSelector.bind(self));
        // this.noteWheel.spreader.spreaderTitle.click(onOpenSelector.bind(self));
        this.noteWheel.refreshWheel();
    };
    ChordSelector.prototype.draw = function () {
        this.createWheelNav();
        // this.container.addEventListener('click', () => {
        //     this.container.classList.toggle('active')
        // });
    };
    return ChordSelector;
}(annotationBox_1.AnnotationBox));
exports.ChordSelector = ChordSelector;
