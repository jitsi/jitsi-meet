import styled from "styled-components";

export const MediaButton = styled.button`
    background: linear-gradient(45deg, #9281e1, #de2f89);
    width: 40%;
    font-size: 1rem;
    padding: 10px;
    color: white;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    img {
        margin-right: 10px;
    }
    @media (max-width: 1200px) {
        width: 80%;
    }
    @media (max-width: 768px) {
        width: 50%;
    }
    @media (max-width: 400px) {
        img {
            margin: 0px;
        }
    }
`;

export const CommonH = styled.span`
    color: #000000;
    display: inline-block;
    font-size: 2.5rem;
    padding-bottom: 10px;
    @media (max-width: 1400px) {
        font-size: 1.2rem;
    }
    @media (max-width: 768px) {
        font-size: 1rem;
    }
`;

export const CommonSpan = styled.span`
    display: inline-block;
    font-size: 1rem;
    color: gray;
    padding-bottom: 10px;
    @media (max-width: 768px) {
        font-size: 0.5rem;
    }
`;

export const CommonTitle = styled.div`
    padding: 10px 0px;
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
