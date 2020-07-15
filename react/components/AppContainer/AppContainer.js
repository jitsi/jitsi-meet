import React from "react";
import { RecoilRoot } from "recoil";
import GeneralNavigator from "../../navigation/GeneralNavigator";

const AppContainer = (props) => {
  return (
    <RecoilRoot>
      <GeneralNavigator appProps={props} />
    </RecoilRoot>
  );
};

export default AppContainer;
