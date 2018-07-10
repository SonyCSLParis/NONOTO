"use strict";
exports.__esModule = true;
var AnnotationBox = /** @class */ (function () {
    function AnnotationBox(timestampContainer) {
        var _this = this;
        this.cssClass = this.constructor.name;
        // Store container element
        if (typeof timestampContainer === "string") {
            // ID passed
            this.timestampContainer = document.getElementById(timestampContainer);
        }
        else if (timestampContainer && "appendChild" in timestampContainer) {
            // Element passed
            this.timestampContainer = timestampContainer;
        }
        if (!this.timestampContainer || this.timestampContainer.getAttribute('containedquarternotes') === undefined) {
            throw new Error("Please pass a valid timestamp container for the annotation box");
        }
        this.validateTimestampContainer();
        this.containedQuarterNotes = (function () {
            var containedQuarters_str = (_this.timestampContainer.getAttribute('containedquarternotes'));
            var containedQuarters_strlist = containedQuarters_str.split(' ');
            var containedQuarterNotes = containedQuarters_strlist.map(parseInt);
            return containedQuarterNotes;
        })();
        this.createContainer();
    }
    AnnotationBox.prototype.validateTimestampContainer = function () { };
    ;
    // create containing div,
    AnnotationBox.prototype.createContainer = function () {
        var containerId = this.timestampContainer.id + '-' + this.cssClass;
        var containerByID = document.getElementById(containerId);
        var containerExistsInitially = containerByID !== null;
        this.container = (containerByID || document.createElement("div"));
        this.container.id = containerId;
        this.container.classList.add(this.cssClass);
        // let containedQuarters_str: string = this.timestampContainer.getAttribute('containedquarternotes')
        // this.container.setAttribute('containedquarternotes', containedQuarters_str);
        if (!containerExistsInitially) {
            this.timestampContainer.appendChild(this.container);
        }
    };
    ;
    AnnotationBox.prototype.draw = function () {
        throw new EvalError("Not implemented, please subclass the draw function");
    };
    ;
    return AnnotationBox;
}());
exports.AnnotationBox = AnnotationBox;
