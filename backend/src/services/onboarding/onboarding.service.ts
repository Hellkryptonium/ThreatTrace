import { UserModel } from "../../models/User.js";

/** Records a real first-use action so setup never relies solely on a UI click. */
export async function completeOnboardingForUser(userId: string) {
  await UserModel.updateOne(
    { _id: userId },
    { $set: { "onboarding.status": "completed", "onboarding.completedAt": new Date() } },
  );
}
