import { Response } from "express";
import mongoose from "mongoose";
import { IAuthRequest } from "../types";
import { MESSAGES_REGISTRY } from "../constants/msgRegistry";
import {
  executeErrorLogDetailsFetch,
  executeErrorLogsFetch,
  executeErrorLogsPurge,
  executeUserLogsFetch,
} from "../services/log";

/**
 * Controller endpoint to pull account history logs with contextual timeline boundaries.
 */
export const getUserLogs = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const targetUserId = req.params.id as string;
  const authUserId = req.user?.id;
  const userRole = req.user?.role;

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.PROFILE.INVALID_ID_FORMAT,
      payload: null,
    });
  }

  // Restrict ledger visibility to account owner or administrative staff
  if (targetUserId !== authUserId && userRole !== "ADMIN") {
    return res.status(403).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.FORBIDDEN,
      payload: null,
    });
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string | undefined;

    const serviceResult = await executeUserLogsFetch({
      userId: targetUserId,

      page,
      limit,
      category,
    });

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
      meta: {
        page,
        limit,
        count: serviceResult.payload.length,
      },
    });
  } catch (error: any) {
    console.error("Get User Logs Error:", error);
    return res.status(500).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.PROFILE.FETCH_USER_LOGS_ERROR,
      payload: null,
    });
  }
};

/**
 * Controller endpoint to pull system diagnostic indexes under administrative constraints.
 */
export const getErrorLogs = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const userRole = req.user?.role;

  if (userRole !== "ADMIN") {
    return res.status(403).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.FORBIDDEN,
      payload: null,
    });
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const statusCode = req.query.statusCode
      ? parseInt(req.query.statusCode as string)
      : undefined;
    const errorCode = req.query.errorCode as string | undefined;

    const serviceResult = await executeErrorLogsFetch({
      page,
      limit,
      statusCode,
      errorCode,
    });

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
      meta: {
        page,
        limit,
        count: serviceResult.payload.length,
      },
    });
  } catch (error: any) {
    console.error("Get Error Logs Controller Failed:", error);
    return res.status(500).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.SYSTEM.FETCH_ERROR_LOGS_FAILED,
      payload: null,
    });
  }
};

/**
 * Controller endpoint to resolve deep trace profiles by unique string identifiers or native keys.
 */
export const getErrorLogDetails = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const userRole = req.user?.role;
  const lookupTarget = req.params.idOrCode as string;

  if (userRole !== "ADMIN") {
    return res.status(403).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.FORBIDDEN,
      payload: null,
    });
  }

  try {
    const serviceResult = await executeErrorLogDetailsFetch(lookupTarget);

    if (serviceResult.status === "NOT_FOUND") {
      return res.status(404).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error("Get Error Details Controller Failed:", error);
    return res.status(500).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.SYSTEM.FETCH_ERROR_LOGS_FAILED,
      payload: null,
    });
  }
};

/**
 * Controller endpoint to truncate collected trace entries manually before structural automated schema TTL policies fire.
 */
export const purgeErrorLogs = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const userRole = req.user?.role;

  if (userRole !== "ADMIN") {
    return res.status(403).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.FORBIDDEN,
      payload: null,
    });
  }

  try {
    const statusCode = req.body.statusCode
      ? parseInt(req.body.statusCode as string)
      : undefined;

    const serviceResult = await executeErrorLogsPurge({ statusCode });

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: null,
    });
  } catch (error: any) {
    console.error("Purge Error Logs Controller Failed:", error);
    return res.status(500).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.SYSTEM.PURGE_ERROR_LOGS_FAILED,
      payload: null,
    });
  }
};
