import './styles/overlays.scss';
import { AnnotationBox } from './annotationBox';

export class FermataBox extends AnnotationBox {
    constructor(timestampContainer: string|HTMLElement,
            sequenceDuration: number) {
        super(timestampContainer);
        this.sequenceDuration = sequenceDuration;
        this.draw()
    }

    protected validateTimestampContainer(): void {
        if (!this.timestampContainer.classList.contains('quarter-note')) {
            throw new EvalError("Fermata should be associated to a quarter-note box");
        };
    }

    private sequenceDuration: number;

    private containedQuarterNote: number = this.containedQuarterNotes[0];

    public draw(): void {
        if (this.containedQuarterNote >= this.sequenceDuration-2) {
            // Add imposed fermata at the end of the sequence
            // Do not add onclick callback
            this.container.classList.add('imposed');
            this.container.classList.add('active');
        }

        else {
            this.container.addEventListener('click', () => {
                this.container.classList.toggle('active')
            });
        };
    }

}
