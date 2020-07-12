import React from "react";
import { App } from "../../features/app";
import { RecoilRoot } from "recoil";

const AppContainer = (props) => {
  return (
    <RecoilRoot>
      <App {...props} />
    </RecoilRoot>
  );
};

export default AppContainer;
