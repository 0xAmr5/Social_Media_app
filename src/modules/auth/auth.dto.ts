export interface ISignUpType {
    name: string;
    email: string;
    password: string;
}

export interface ISignInType {
    email: string;
    password: string;
}


export type SignupRequestBody = ISignUpType;
export type SigninRequestBody = ISignInType;

