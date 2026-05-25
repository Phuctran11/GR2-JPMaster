import userAuthService from "./userAuth.service.js";
import userProfileService from "./userProfile.service.js";

export class UserService {
  googleLogin = userAuthService.googleLogin.bind(userAuthService);
  login = userAuthService.login.bind(userAuthService);
  createUser = userAuthService.createUser.bind(userAuthService);

  getMe = userProfileService.getMe.bind(userProfileService);
  updateMe = userProfileService.updateMe.bind(userProfileService);
}

export default new UserService();
