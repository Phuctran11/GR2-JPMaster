import userAuthModel from "./userAuth.model.js";
import userPublicModel from "./userPublic.model.js";
import type { PublicUser, User, UserRole, UserStatus, UserWithPassword } from "./user.types.js";

export type { PublicUser, User, UserRole, UserStatus, UserWithPassword };

export class UserModel {
  createUser = userAuthModel.createUser.bind(userAuthModel);
  getUserByEmail = userAuthModel.getUserByEmail.bind(userAuthModel);
  getUserByEmailIncludingDeleted = userAuthModel.getUserByEmailIncludingDeleted.bind(userAuthModel);

  getUserById = userPublicModel.getUserById.bind(userPublicModel);
  getAllUsers = userPublicModel.getAllUsers.bind(userPublicModel);
  updateUser = userPublicModel.updateUser.bind(userPublicModel);
  updateUserProfile = userPublicModel.updateUserProfile.bind(userPublicModel);
  softDeleteUser = userPublicModel.softDeleteUser.bind(userPublicModel);
  deleteUser = userPublicModel.deleteUser.bind(userPublicModel);
}

export default new UserModel();
