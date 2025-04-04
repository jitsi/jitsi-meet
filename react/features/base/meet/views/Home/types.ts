export interface AuthFormValues {
    email: string;
    password: string;
    twoFactorCode?: string;
}

export interface AuthCredentials {
    token: string;
    newToken: string;
    mnemonic: string;
    user: UserInfo;
}

export interface UserInfo {
    id: string;
    email: string;
    name?: string;
    lastname?: string;
}

export interface MeetToken {
    token: string;
    room: string;
}

export interface ValidationRule {
    value: any;
    message: string;
}

export interface InputValidation {
    required?: boolean | string;
    minLength?: ValidationRule;
    maxLength?: ValidationRule;
    pattern?: ValidationRule;
}

export interface TranslateProps {
    translate: (key: string) => string;
}

export interface LoadingProps {
    isLoading: boolean;
}

export interface ErrorProps {
    error?: string;
}
