import React, { useState } from "react";
import { withRouter, useHistory } from "react-router-dom";
import styled from "styled-components";
import { CommonH, CommonSpan, CommonTitle } from "../welcome/Common";

const Footer = () => {
    return (
        <FooterLay>
            <FooterLayout>
                <FooterDiv>
                    <FooterTitle>
                        <img
                            src="/images/NXDFLogo.png"
                            width="20px"
                            height="20px"
                        />
                        <span>NXDF</span>
                    </FooterTitle>
                </FooterDiv>
                <FooterDiv2></FooterDiv2>
            </FooterLayout>
        </FooterLay>
    );
};

//푸터
const FooterLay = styled.div`
    background: #f3f3f3;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 5vh;
`;

const FooterLayout = styled.div`
    width: 60%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const FooterTitle = styled.div`
    width: 35%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    span {
        color: #000000;
        font-size: 1rem;
    }
    img {
        margin-right: 1rem;
    }
`;

const FooterDiv = styled.div`
    width: 50%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
`;
const FooterDiv2 = styled.div`
    margin: 10px 0px;
    width: 50%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
`;

export default Footer;
