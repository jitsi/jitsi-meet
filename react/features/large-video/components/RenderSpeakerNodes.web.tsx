import React from "react";
import { styled } from "@mui/material";
import { IParticipant } from "../../base/participants/types";

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

const getRenderedChild = ({ x, y, name, url }) => {
    return (
        <UserNode
            style={{
                left: x,
                top: y,
            }}
        >
            {url ? (
                <img src={url} />
            ) : (
                String(name).toUpperCase().substring(0, 2)
            )}
        </UserNode>
    );
};

const RenderSpeakerNodes = (props: Props) => {
    const { list } = props;

    return list.map((item: IParticipant, index) => {
        const { x, y } = elementPositionList[index];
        let name = item.displayName ?? item.name;
        let url = item.avatarURL;
        return getRenderedChild({ x, y, name, url });
    });
};

const UserNode = styled("div")({
    width: 78,
    height: 78,
    fontSize: 28,
    display: "flex",
    fontWeight: "bold",
    overflow: "hidden",
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

export default RenderSpeakerNodes;
