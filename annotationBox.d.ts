export declare class AnnotationBox {
    readonly containedQuarterNotes: number[];
    readonly: any;
    constructor(timestampContainer: string | HTMLElement);
    protected timestampContainer: HTMLElement;
    protected validateTimestampContainer(): void;
    container: HTMLDivElement;
    readonly cssClass: string;
    private createContainer;
    draw(): void;
}
