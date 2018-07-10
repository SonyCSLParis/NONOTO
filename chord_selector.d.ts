import { AnnotationBox } from './annotationBox';
export declare class ChordSelector extends AnnotationBox {
    constructor(timestampContainer: string | HTMLElement, wheelSize_px?: number);
    protected validateTimestampContainer(): void;
    private slur_symbol;
    private notes;
    private accidentals;
    private chordTypes;
    private noteWheel;
    private accidentalWheel;
    private chordTypeWheel;
    private wheelSize_px;
    private previouslySelectedNoteIndex;
    private currentNote;
    private currentAccidental;
    private currentChordType;
    currentChord: {
        note: string;
        accidental: string;
        chordType: string;
    };
    private updateSpreader;
    private hideCurrentAccidentalNavItems;
    private closeNoteWheel;
    private closeChordTypeWheel;
    private closeNoteWheelAndCleanAfterNoteAndAccidentalSelectionDone;
    private toggleActiveContainer;
    protected closeSelector(): void;
    private outsideClickListener;
    private initHideOnClickOutside;
    private removeClickListener;
    protected createWheelNav(): any;
    draw(): void;
}
