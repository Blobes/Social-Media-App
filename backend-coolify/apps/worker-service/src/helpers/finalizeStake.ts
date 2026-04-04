import mongoose from "mongoose";

export const finalizeStake = async (params: {
  stakeId: string;
  userId: string;
  caption: string;
  media: any[];
  modResult: any;
  session: mongoose.ClientSession;
}) => {};
