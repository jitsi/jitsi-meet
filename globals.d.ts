import { IStore } from "./react/features/app/types";
import { IConfig } from "./react/features/base/config/configType";

export {};

declare global {

    type Mutable<T> = { -readonly [P in keyof T]: T[P] };

    const APP: {
        store: IStore;
        UI: any;
        API: any;
        conference: any;
        debugLogs: any;
    };
    const interfaceConfig: any;

    interface Navigator {
        gpu?: {
            requestAdapter(): Promise<GPUAdapter | null>;
        };
    }

    interface GPUAdapter {
        requestAdapterInfo?(): Promise<{ device: string }>;
    }

    interface Window {
        config: IConfig;
        JITSI_MEET_LITE_SDK?: boolean;
        interfaceConfig?: any;
        JitsiMeetJS?: any;
        MediaStreamTrackGenerator: {
            new(options: { kind: string }): MediaStreamTrack & {
                writable: WritableStream<VideoFrame>;
            };
        };
        MediaStreamTrackProcessor: {
            new(options: { track: MediaStreamTrack; maxBufferSize?: number }): {
                readable: ReadableStream<VideoFrame>;
            };
        };
        PressureObserver?: any;
        PressureRecord?: any;
        ReactNativeWebView?: any;
        // selenium tests handler
        _sharedVideoPlayer: any;
        alwaysOnTop: { api: any };
    }

    interface Document {
        mozCancelFullScreen?: Function;
        webkitExitFullscreen?: Function;
    }

    const config: IConfig;

    const JitsiMeetJS: any;

    interface HTMLMediaElement {
        setSinkId: (id: string) => Promise<undefined>;
        stop: () => void;
    }
}
