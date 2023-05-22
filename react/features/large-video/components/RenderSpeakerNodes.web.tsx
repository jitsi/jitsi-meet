import React, { Component } from "react";
import { styled } from "@mui/material";
import { IconMic, IconMicSlash } from "../../base/icons/svg";
import { IParticipant } from "../../base/participants/types";
import Icon from "../../base/icons/components/Icon";

interface Props {
    list: Array<IParticipant>;
}

const elementPositionList = [
    { x: 538, y: 440 },
    { x: 658, y: 440 },
    { x: 777, y: 440 },
    { x: 397, y: 457 },
    { x: 950, y: 457 },
    { x: 128, y: 588 },
    { x: 128, y: 588 },
    { x: 200, y: 237 },
    { x: 1282, y: 621 },
    { x: 1162, y: 178 },
    { x: 1350, y: 132 },
    { x: 656, y: 130 },
    { x: 768, y: 130 },
    { x: 892, y: 132 },
];

const getRenderedChild = ({
    x,
    y,
    name,
    url,
    isAudioMuted,
    video,
    isVideoPlayable,
}) => {
    return (
        <UserNode
            style={{
                left: x,
                top: y,
            }}
        >
            <RelativeContainer>
                {isVideoPlayable ? (
                    <VideoContainer>{video}</VideoContainer>
                ) : url ? (
                    <img src={url} />
                ) : (
                    String(name).toUpperCase().substring(0, 2)
                )}
                <CircleShapeContainer>
                    <Icon src={isAudioMuted ? IconMicSlash : IconMic} />
                </CircleShapeContainer>
            </RelativeContainer>
        </UserNode>
    );
};

class RenderSpeakerNodes extends Component<Props> {
    render() {
        const { list } = this.props;
        return list.map((item: any, index) => {
            const {
                isAudioMuted,
                video,
                isVideoPlayable,
                displayName,
                avatarURL,
            } = item;
            const { x, y } = elementPositionList[index];

            return getRenderedChild({
                x,
                y,
                name: displayName ?? item.name,
                url: avatarURL,
                isAudioMuted,
                video,
                isVideoPlayable,
            });
        });
    }
}

const VideoContainer = styled("div")({
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    overflow: "hidden",
});

const RelativeContainer = styled("div")({
    width: "100%",
    height: "100%",
    display: "flex",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
});

const UserNode = styled("div")({
    width: 78,
    height: 78,
    fontSize: 28,
    display: "flex",
    fontWeight: "bold",
    borderRadius: "50%",
    position: "absolute",
    alignItems: "center",
    color: "darkslategray",
    justifyContent: "center",
    border: "2px solid white",
    backgroundColor: "peachpuff",
    transform: "translate(-50%, -50%)",
    "& > img": {
        width: "100%",
        height: "100%",
        objectFit: "cover",
    },
});

const CircleShapeContainer = styled("div")({
    right: 0,
    bottom: 0,
    width: 20,
    height: 20,
    padding: 8,
    display: "flex",
    position: "absolute",
    borderRadius: "50%",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0, 0, 0, 0.7)",
});

export default RenderSpeakerNodes;
