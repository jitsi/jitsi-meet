import React, { useEffect, useState } from "react";
import { screenState } from "../modules/navigator";
import { App } from "../features/app/components";
import LoginScreen from "../screens/LoginScreen/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen/RegisterScreen";
import { useRecoilValue } from "recoil";
import AsyncStorage from "@react-native-community/async-storage";
import { JWT_TOKEN } from "../config";
import JwtDecode from "jwt-decode";

const GeneralNavigator = ({ appProps }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const currScreen = useRecoilValue(screenState);

  const checkAuthorizedUser = async () => {
    const token = await AsyncStorage.getItem(JWT_TOKEN);
    if (token) {
      const { context } = JwtDecode(token);
      setIsAuthenticated(context.user);
    }
  };

  useEffect(() => {
    checkAuthorizedUser();
  }, []);

  useEffect(() => {
    console.log(currScreen);
  }, [currScreen]);

  return isAuthenticated && currScreen === "Home" ? (
    <App {...appProps} />
  ) : currScreen === "Register" ? (
    <RegisterScreen />
  ) : currScreen === "Login" ? (
    <LoginScreen />
  ) : (
    <LoginScreen />
  );
};

export default GeneralNavigator;
