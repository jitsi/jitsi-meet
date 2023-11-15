import React, { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import styled, { css } from "styled-components";
import { isShown } from "./lib/atom";
import media from "./lib/media";
import transitions from "./lib/transitions";

export function Register({ _, children, onClose }) {
    const [visible, setVisible] = useRecoilState(isShown);
    const onClick = () => {
        setVisible((prev) => !prev);
    };

    return (
        <>
            <AuthModalBlock visible={visible} id="exit">
                <Wrapper>
                    <WhiteBlock>
                        <BlockContent>{children}</BlockContent>
                    </WhiteBlock>
                </Wrapper>
            </AuthModalBlock>
        </>
    );
}

export default Register;

const W5 = styled.div``;

const AuthModalBlock = styled.div`
    position: absolute;
    top: 0;
    width: 100%;
    height: 100%;
    margin-top: 2rem;

    display: ${(props) => (props.visible ? "flex" : "none")};
    align-items: center;
    justify-content: center;
    z-index: 400;

    ${media.custom(768)} {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }
`;

const Wrapper = styled.div`
    position: absolute;
    overflow-y: auto;
    top: 0;
    width: 1000px;
    z-index: 400;

    ${media.custom(1500)} {
        width: 80%;
    }

    ${media.custom(1000)} {
        width: 90%;
    }

    ${media.small} {
        width: 100%;
        flex: 1;
        width: auto;
        height: 100%;
    }

    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.09);
    display: flex;
`;

const WhiteBlock = styled.div`
    flex: 1;
    background: #121212;

    display: flex;
    flex-direction: column;
    ${media.small} {
        overflow-y: auto;
    }
`;

const BlockContent = styled.div`
    flex: 1;
    padding-bottom: 10rem;
    display: flex;
    flex-direction: column;
`;
