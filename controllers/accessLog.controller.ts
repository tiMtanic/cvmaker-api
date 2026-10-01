import type { NextFunction, Request, Response } from "express";

import prisma from "../db/index.js";

type IpWhoisResponse = {
  success: boolean;
  country?: string;
  city?: string;
  message?: string;
};

type IpLocation = {
  country: string | null;
  city: string | null;
};

function normalizeIp(ip: string | undefined) {
  if (!ip) {
    return null;
  }

  if (ip.startsWith("::ffff:")) {
    return ip.substring(7);
  }

  return ip;
}

function isLocalOrPrivateIp(ip: string) {
  if (ip === "::1" || ip === "127.0.0.1" || ip === "0.0.0.0") {
    return true;
  }

  if (ip.startsWith("10.")) {
    return true;
  }

  if (ip.startsWith("192.168.")) {
    return true;
  }

  if (ip.startsWith("169.254.")) {
    return true;
  }

  const parts = ip.split(".");

  if (parts.length === 4) {
    const first = Number(parts[0]);
    const second = Number(parts[1]);

    if (first === 172 && second >= 16 && second <= 31) {
      return true;
    }
  }

  const lowerIp = ip.toLowerCase();

  if (
    lowerIp.startsWith("fc") ||
    lowerIp.startsWith("fd") ||
    lowerIp.startsWith("fe80:")
  ) {
    return true;
  }

  return false;
}

async function getIpLocation(req: Request): Promise<IpLocation> {
  const ip = normalizeIp(req.ip);

  if (!ip || isLocalOrPrivateIp(ip)) {
    return {
      country: null,
      city: null,
    };
  }

  try {
    const response = await fetch(
      `https://ipwho.is/${ip}?fields=success,country,city,message`,
      {
        signal: AbortSignal.timeout(3000),
      },
    );

    if (!response.ok) {
      console.error(`IPWhois request failed with status ${response.status}`);

      return {
        country: null,
        city: null,
      };
    }

    const data = (await response.json()) as IpWhoisResponse;

    if (!data.success) {
      console.error("IPWhois lookup failed:", data.message);

      return {
        country: null,
        city: null,
      };
    }

    return {
      country: data.country?.trim() || null,
      city: data.city?.trim() || null,
    };
  } catch (error) {
    console.error("Could not determine IP location:", error);

    return {
      country: null,
      city: null,
    };
  }
}

export async function recordAccess(code: string, req: Request) {
  const location = await getIpLocation(req);

  return prisma.access_log.create({
    data: {
      access_code_code: code,
      access_time: new Date(),
      country: location.country,
      city: location.city,
    },
  });
}

export const getAccessLogs = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const logs = await prisma.access_log.findMany({
      orderBy: {
        access_time: "desc",
      },

      select: {
        access_code_code: true,
        access_time: true,
        country: true,
        city: true,
      },
    });

    res.status(200).json(logs);
  } catch (error) {
    next(error);
  }
};
