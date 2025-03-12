import React from "react";
import Video from "../../../../media/components/web/Video";
import clsx from "clsx";

interface VideoPreviewProps {
    videoTrack: any;
    isAudioMuted: boolean;
    videoMuted: boolean;
    flipX?: boolean;
}

const AudioMutedIndicator = () => (
    <div className="absolute bottom-2 left-2 flex items-center justify-center w-9 h-7 bg-black/50 rounded-[20px]">
        <img src="/images/premeetingscreen/MicrophoneSlash.png" alt="Audio Muted" width={16} />
    </div>
);

const VideoPreview: React.FC<{ videoTrack: any; isAudioMuted?: boolean; flipX?: boolean }> = ({
    videoTrack,
    isAudioMuted,
    flipX,
}) => (
    <div className="relative w-[264px] h-[147px] rounded-[20px]">
        {/*  // to remove when finish this view
        // <Preview
        //     videoMuted={videoMuted}
        //     videoTrack={videoTrack}
        //     className="w-[264px] h-[147px] rounded-[20px]"
        // /> */}
        <Video
            className={clsx("w-[264px] h-[147px] rounded-[20px]", flipX && "scale-x-[-1]")}
            id="prejoinVideo"
            videoTrack={{ jitsiTrack: videoTrack }}
        />
        {isAudioMuted && <AudioMutedIndicator />}
    </div>
);

const NoVideoPreview = () => (
    <div className="w-[264px] h-[147px] rounded-[20px] bg-white/10 flex items-center justify-center">
        <img src="/images/VideoCameraSlash.png" alt="No Video" width={60} />
    </div>
);

const VideoPreviewSection = React.memo(({ videoTrack, isAudioMuted, videoMuted, flipX }: VideoPreviewProps) => {
    if (!videoTrack || videoMuted) {
        return <NoVideoPreview />;
    }
    return <VideoPreview videoTrack={videoTrack} isAudioMuted={isAudioMuted} flipX={flipX} />;
});

export default VideoPreviewSection;
