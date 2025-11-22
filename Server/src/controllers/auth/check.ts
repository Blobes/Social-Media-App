import { Request, Response, NextFunction } from "express";
import { UserModel } from "@/models";

export const checkUsername = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { username } = req.body as { username?: string };
  if (!username) {
    return res.status(400).json({
      message: "username query is required",
    });
  }
  // Check if the exact username is IsAvailable
  const exists = await UserModel.exists({ username });
  if (!exists) {
    // It’s free—no need for suggestions
    return res.json({ IsAvailable: true });
  }

  //Generate username suggestions
  const suggestions: string[] = [];
  const maxSuggestions = 5;

  // Fetch all conflicting variants in one go to minimize DB calls
  // e.g. if username="alex", this regex matches "alex", "alex1", "alex2", ...
  const regex = new RegExp(`^${username}\\d*$`, "i");
  const taken = await UserModel.find({ username: regex }).select(
    "username -_id"
  );

  const takenSet = new Set(
    taken.map((u) => (u.username ? u.username.toLowerCase() : ""))
  );

  // 3. Build suggestions by appending incremental digits
  let counter = 1;
  while (suggestions.length < maxSuggestions) {
    const candidate = `${username}${counter}`;
    if (!takenSet.has(candidate.toLowerCase())) {
      suggestions.push(candidate);
    }
    counter++;
  }
  return res.json({
    IsAvailable: false,
    suggestions,
  });
  next();
};

export const checkEmail = async (req: Request, res: Response): Promise<any> => {
  const { email } = req.body as { email?: string };
  if (!email) {
    return res.status(400).json({ message: "email query is required" });
  }
  const exists = await UserModel.exists({ email });
  return res.json({ IsAvailable: !exists });
};
