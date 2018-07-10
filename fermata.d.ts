import './styles/overlays.scss';
import { AnnotationBox } from './annotationBox';
export declare class FermataBox extends AnnotationBox {
    constructor(timestampContainer: string | HTMLElement, sequenceDuration: number);
    protected validateTimestampContainer(): void;
    private sequenceDuration;
    private containedQuarterNote;
    draw(): void;
}
