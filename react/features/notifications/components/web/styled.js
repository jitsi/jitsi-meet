import styled from 'styled-components';

export const Container = styled.div`
    position: absolute;
    left: 20px;
    bottom: 90px;
    width: 400px;
    z-index: 600;

    & > * {
        margin-bottom: 20px;
    }
`;
