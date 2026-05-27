import achievementModel from "../../models/achievements/achievement.model.js";

export class AchievementService {
  async listMine(userId: number) {
    return achievementModel.listMine(userId);
  }
}

export default new AchievementService();
