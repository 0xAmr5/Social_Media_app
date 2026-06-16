export enum GenderEnum {
  Male = 'male',
  Female = 'female',
  Other = 'other',
}

export enum ProviderEnum {
  Local = 'local',
  Google = 'google',
  Facebook = 'facebook',
}

export enum RoleEnum {
  User = 'user',
  Admin = 'admin',
}

export enum friendsFlagEnum {
    friend    = "friend",
    requested = "requested",
    reject    = 'reject'
};
export enum friendsRequestEnum {
    accept   = "accept-request",
    reject   = "reject-request",
};
export enum blockUserEnum {
    block    = "block",
    unBlock  = "un-block",
};
export enum confirmEmailFlagEnum {
    confirmMail = "confirm-sign-up",
    enable2FA = "enable-2fa",
};
