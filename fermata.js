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
require("./styles/overlays.scss");
var annotationBox_1 = require("./annotationBox");
var FermataBox = /** @class */ (function (_super) {
    __extends(FermataBox, _super);
    function FermataBox(timestampContainer, sequenceDuration) {
        var _this = _super.call(this, timestampContainer) || this;
        _this.containedQuarterNote = _this.containedQuarterNotes[0];
        _this.sequenceDuration = sequenceDuration;
        _this.draw();
        return _this;
    }
    FermataBox.prototype.validateTimestampContainer = function () {
        if (!this.timestampContainer.classList.contains('quarter-note')) {
            throw new EvalError("Fermata should be associated to a quarter-note box");
        }
        ;
    };
    FermataBox.prototype.draw = function () {
        var _this = this;
        if (this.containedQuarterNote >= this.sequenceDuration - 2) {
            // Add imposed fermata at the end of the sequence
            // Do not add onclick callback
            this.container.classList.add('imposed');
            this.container.classList.add('active');
        }
        else {
            this.container.addEventListener('click', function () {
                _this.container.classList.toggle('active');
            });
        }
        ;
    };
    return FermataBox;
}(annotationBox_1.AnnotationBox));
exports.FermataBox = FermataBox;
