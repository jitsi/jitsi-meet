import React, { useState } from "react";
import styled from "styled-components";
import { withRouter, useHistory } from "react-router-dom";
import { MediaButton, CommonH, CommonSpan } from "../welcome/Common";
import { selectLang } from "./lang";
import { useRecoilState } from "recoil";
import { LangState } from "./lib/atom";

const Grid = (props) => {
    const { grid } = props;
    const [lang, setLang] = useRecoilState(LangState);
    const {
        GridOneHeader,
        GridOneDescription,
        GridTwoHeader,
        GridTwoDescription,
        GridThreeHeader,
        GridThreeDescription,
        GridFourHeader,
        GridFourDescription,
    } = selectLang(lang);
    // const item = {
    //     beforeOpen: { y: "-100vh", display: "none", visibility: "hidden" },
    //     afterOpen: {
    //         opacity: 1,
    //         height: "auto",
    //         y: 0,
    //         display: "block",
    //         visibility: "visible",
    //         transition: {
    //             duration: 2,
    //         },
    //     },
    //     afterClose: {
    //         y: "-100vh",
    //         height: 0,
    //         transition: {
    //             duration: 2,
    //         },
    //         transitionEnd: {
    //             display: "none",
    //             visibility: "hidden",
    //         },
    //     },
    // };

    return (
        <Gridiv
        // grid={grid}
        // initial="beforeOpen"
        // animate={grid ? "afterOpen" : "afterClose"}
        // variants={item}
        >
            <GridLayout>
                <GridinnerDiv>
                    <CommonH>{GridOneHeader}</CommonH>
                    <CommonSpan>{GridOneDescription}</CommonSpan>
                </GridinnerDiv>
                <GridinnerDivImg img={"/images/gridimg1.png"} />
                <GridinnerDivImg img={"/images/gridimg2.png"} />
                <GridinnerDiv>
                    <CommonH>{GridTwoHeader}</CommonH>
                    <CommonSpan>{GridTwoDescription}</CommonSpan>
                    <CommonH>{GridThreeHeader}</CommonH>
                    <CommonSpan>{GridThreeDescription}</CommonSpan>
                </GridinnerDiv>
                <GridinnerDiv>
                    <CommonH>{GridFourHeader}</CommonH>
                    <CommonSpan>{GridFourDescription}</CommonSpan>
                </GridinnerDiv>
                <GridinnerDivImg img={"/images/gridimg3.png"} />
            </GridLayout>
        </Gridiv>
    );
};

//추가 이미지
const Gridiv = styled.div`
    display: block;
    width: 100%;
    margin-top: 2rem;
    margin-bottom: 3rem;
    position: relative;
    z-index: -100;
`;

const GridLayout = styled.div`
    margin: 0 auto;
    width: 60%;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 2rem;

    @media (max-width: 768px) {
        height: auto;
        grid-template-columns: repeat(1, 1fr);
        grid-template-rows: repeat(6, auto);
    }
    @media (max-width: 1200px) {
        height: auto;
        grid-template-rows: repeat(3, auto);
    }

    div:nth-child(1) {
        order: 1;
        @media (max-width: 768px) {
            order: 2;
        }
    }
    div:nth-child(2) {
        order: 2;
        @media (max-width: 768px) {
            order: 1;
        }
    }
    div:nth-child(3) {
        order: 3;
    }
    div:nth-child(4) {
        order: 4;
    }
    div:nth-child(5) {
        order: 5;
        @media (max-width: 768px) {
            order: 6;
        }
    }
    div:nth-child(6) {
        order: 6;
        @media (max-width: 768px) {
            order: 5;
        }
    }
`;

const GridinnerDiv = styled.div`
    width: 80%;
    @media (min-width: 2000px) {
        width: 50%;
    }
`;
const GridinnerDivImg = styled.div`
    background-image: ${(props) => `url(${props.img})`};
    background-repeat: no-repeat;
    background-size: 100% 100%;
    max-height: 400px;
    max-width: 500px;
    @media (max-width: 1200px) {
        width: 100%;
        min-height: 200px;
        max-height: 250px;
        background-position: center;
        align-self: center;
        justify-self: center;
    }
`;

export default Grid;
