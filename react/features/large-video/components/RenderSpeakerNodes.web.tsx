import React, { Component } from "react";
import { styled } from "@mui/material";
import { IconMic, IconMicSlash } from "../../base/icons/svg";
import { IParticipant } from "../../base/participants/types";
import { getAvatarColor } from "../../base/avatar/functions";
import Icon from "../../base/icons/components/Icon";

interface Props {
    list: Array<IParticipant>;
}

interface INode {
    x: number;
    y: number;
    video: any;
    url: string;
    name: string;
    isAudioMuted: boolean;
    isVideoPlayable: boolean;
}

const NodeSizes = {
    width: 78,
    height: 78,
}

const elementsInRow = [
    7, 15, 23, 28, 40, 70, 100, 200, 350, 450
]
let rowPositions: Array<any> = []

const getTheta = (totalElementsInARow: number) => {
    const frags = 360 / totalElementsInARow;
    let theta: any = [];
    for (let i = 0; i <= totalElementsInARow; i++) {
        theta.push((frags / 180) * i * Math.PI);
    }
    return theta
}

const getEachRowCords = (totalElementsInARow: number, rx: number, ry: number) => {
    const theta = getTheta(totalElementsInARow)
    const array: Array<any> = []
    let main: any = document.getElementById('react')
    let mainHeight = parseInt(window.getComputedStyle(main).height.slice(0, -2));
    let mainWidth = parseInt(window.getComputedStyle(main).width.slice(0, -2));
    for (let i = 0; i < totalElementsInARow; i++) {
        let x = Math.round(rx * (Math.cos(theta[i])))
        let y = Math.round(ry * (Math.sin(theta[i])))
        let top = (mainHeight / 2) - y
        let left = (mainWidth / 2) + x
        array.push({ x, y, top, left })
    }
    return array
};

const getTotalRows = (totalElements: number) => {
    let sum = 0
    for (let i = 1; i <= elementsInRow.length; i++) {
        sum += elementsInRow[i - 1]
        if (sum >= totalElements)
            return i
    }
    return 1
}

const generateRows = (list: Array<any>) => {
    const totalRows: number = getTotalRows(list.length)
    let rows: Array<any> = []

    let elementIndex: number = 0
    for (let i = 0; i < totalRows; i++) {
        let eachRow: Array<any> = []
        for (let j = 0; j < elementsInRow[i]; j++) {
            if (elementIndex == list.length) break
            let item = list[elementIndex]
            eachRow.push(item)
            elementIndex++
        }
        rows.push(eachRow)
    }

    // Generate round positions
    let radiusRow: Array<any> = []
    let rx = 180, ry = 90
    let increaseX = NodeSizes.width + 20
    let increaseY = NodeSizes.height + 20

    for (let i = 0; i < rows.length; i++) {
        radiusRow.push({ x: rx, y: ry })
        rx += increaseX
        ry += increaseY
    }

    rowPositions = []
    rows.forEach((eachRow: Array<any>, index: number) => {
        rowPositions.push(getEachRowCords(eachRow.length, radiusRow[index].x, radiusRow[index].y))
    })

    return rows
}

const getRenderedChild = ({
    x,
    y,
    name = "user",
    url,
    isAudioMuted,
    video,
    isVideoPlayable,
}: INode) => {
    let color = getAvatarColor(name, []);
    let index = String(name).indexOf(" ");
    let displayName = name[0] ?? "";

    try {
        if (index !== -1) {
            let firstName = String(name).substring(0, index)[0];
            let lastName = String(name).substring(index + 1, name.length)[0];
            displayName = firstName + lastName;
        }
    } catch (e) {
        displayName = "U";
    }

    displayName = String(displayName).toUpperCase();

    return (
        <UserNode
            style={{
                left: x,
                top: y,
                backgroundColor: color,
            }}
        >
            <RelativeContainer>
                {isVideoPlayable ? (
                    <VideoContainer>{video}</VideoContainer>
                ) : url ? (
                    <img src={url} />
                ) : (
                    displayName
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
        const rows = generateRows(list)

        return rows.map((eachRow: Array<any>, rowIndex: number) => {
            return <span id={'rendered-row-' + (rowIndex + 1)}>
                {eachRow.map((item: any, itemIndex: number) => {
                    const {
                        isVideoPlayable,
                        isAudioMuted,
                        displayName,
                        avatarURL,
                        video,
                    } = item;

                    const top = rowPositions[rowIndex][itemIndex].top
                    const left = rowPositions[rowIndex][itemIndex].left
                    return getRenderedChild({
                        video,
                        y: top,
                        x: left,
                        isAudioMuted,
                        url: avatarURL,
                        isVideoPlayable,
                        name: displayName ?? item.name,
                    });
                })}
            </span>
        })


    }
}

const VideoContainer = styled("div")({
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    overflow: "hidden",
    "& > video": {
        borderRadius: "50%",
    },
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
    width: NodeSizes.width,
    height: NodeSizes.height,
    fontSize: 28,
    display: "flex",
    fontWeight: "bold",
    borderRadius: "50%",
    position: "absolute",
    alignItems: "center",
    color: "#fff",
    justifyContent: "center",
    border: "2px solid white",
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
