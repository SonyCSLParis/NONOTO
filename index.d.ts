import './styles/osmd.scss';
import './styles/main.scss';
declare let serverUrl: string;
declare function getMetadata(): {
    leadsheet: boolean;
    fermatas: number[];
    chordLabels: object[];
};
export { getMetadata };
export declare var voice_samples: {};
export declare function loadMidi(url: string, draw_boxes?: boolean): void;
declare function load_chorale(xmldata: XMLDocument, isNew: boolean): void;
export { serverUrl };
export { load_chorale };
