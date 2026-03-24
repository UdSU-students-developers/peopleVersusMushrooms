import BaseManager from '../BaseManager';
interface UserManagerOptions {
    mediator: any;
    db: any;
    io: any;
    answer: any;
    common: any;
}
declare class UserManager extends BaseManager {
    private users;
    constructor(options: UserManagerOptions);
    private validateLogin;
    private validatePassword;
    private socketRegistration;
    private socketLogin;
    private socketLogout;
}
export default UserManager;
