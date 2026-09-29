import type { NextFunction, Request, Response } from "express";
import prisma from "../db/index.js";

type UpdateProfileBody = {
  profile: {
    full_name: string;
    professional_title?: string | null;
    email?: string | null;
    phone?: string | null;
    country?: string | null;
    profile_summary?: string | null;
    linkedin_url?: string | null;
    xing_url?: string | null;
    github_url?: string | null;
    photo_base64?: string | null;
    photo_mime_type?: string | null;
  };
  work_experience: Array<{
    company_name: string;
    job_title: string;
    location: string;
    start_date: string;
    end_date?: string | null;
    is_current?: boolean;
    description?: string | null;
  }>;
  education: Array<{
    institution_name: string;
    qualification?: string | null;
    field_of_study?: string | null;
    location?: string | null;
    start_date: string;
    end_date?: string | null;
    description?: string | null;
  }>;
  skills: Array<{
    name: string;
    category?: string | null;
    level?: string | null;
    years_experience?: number | null;
  }>;
  documents: Array<{
    title: string;
    category: string;
    description?: string | null;
    external_url?: string | null;
    file_name?: string | null;
    file_content_base64?: string | null;
    file_mime_type?: string | null;
    issue_date?: string | null;
  }>;
};

const parseDate = (date: string): Date => {
  return new Date(`${date}T00:00:00.000Z`);
};

const formatDate = (date: Date | null): string | null => {
  if (!date) return null;
  return date.toISOString().slice(0, 10);
};

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const profile = await prisma.profile_info.findFirst({
      orderBy: { id: "asc" },
    });

    if (!profile) {
      res.status(404).json({ message: "Profile not found" });
      return;
    }

    const { photo, ...profileData } = profile;

    res.json({
      ...profileData,
      photo_base64: photo ? Buffer.from(photo).toString("base64") : null,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request<{}, {}, UpdateProfileBody>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { profile, work_experience, education, skills, documents } = req.body;

    if (
      !profile ||
      !Array.isArray(work_experience) ||
      !Array.isArray(education) ||
      !Array.isArray(skills) ||
      !Array.isArray(documents)
    ) {
      res.status(400).json({
        message:
          "profile, work_experience, education, skills and documents are required",
      });
      return;
    }

    if (!profile.full_name?.trim()) {
      res.status(400).json({ message: "profile.full_name is required" });
      return;
    }

    const profileId = await prisma.$transaction(async (tx) => {
      const existingProfile = await tx.profile_info.findFirst({
        orderBy: { id: "asc" },
        select: { id: true },
      });

      let currentProfileId: number;

      if (existingProfile) {
        const updatedProfile = await tx.profile_info.update({
          where: { id: existingProfile.id },
          data: {
            full_name: profile.full_name,
            professional_title: profile.professional_title ?? null,
            email: profile.email ?? null,
            phone: profile.phone ?? null,
            country: profile.country ?? null,
            profile_summary: profile.profile_summary ?? null,
            linkedin_url: profile.linkedin_url ?? null,
            xing_url: profile.xing_url ?? null,
            github_url: profile.github_url ?? null,
            photo: profile.photo_base64
              ? Buffer.from(profile.photo_base64, "base64")
              : null,
            photo_mime_type: profile.photo_mime_type ?? null,
          },
        });

        currentProfileId = updatedProfile.id;
      } else {
        const createdProfile = await tx.profile_info.create({
          data: {
            full_name: profile.full_name,
            professional_title: profile.professional_title ?? null,
            email: profile.email ?? null,
            phone: profile.phone ?? null,
            country: profile.country ?? null,
            profile_summary: profile.profile_summary ?? null,
            linkedin_url: profile.linkedin_url ?? null,
            xing_url: profile.xing_url ?? null,
            github_url: profile.github_url ?? null,
            photo: profile.photo_base64
              ? Buffer.from(profile.photo_base64, "base64")
              : null,
            photo_mime_type: profile.photo_mime_type ?? null,
          },
        });

        currentProfileId = createdProfile.id;
      }

      await tx.work_experience.deleteMany({
        where: { profile_info_id: currentProfileId },
      });

      await tx.education.deleteMany({
        where: { profile_info_id: currentProfileId },
      });

      await tx.skill.deleteMany({
        where: { profile_info_id: currentProfileId },
      });

      await tx.document.deleteMany({
        where: { profile_info_id: currentProfileId },
      });

      if (work_experience.length > 0) {
        await tx.work_experience.createMany({
          data: work_experience.map((item) => ({
            profile_info_id: currentProfileId,
            company_name: item.company_name,
            job_title: item.job_title,
            location: item.location,
            start_date: parseDate(item.start_date),
            end_date: item.end_date ? parseDate(item.end_date) : null,
            is_current: item.is_current ?? false,
            description: item.description ?? null,
          })),
        });
      }

      if (education.length > 0) {
        await tx.education.createMany({
          data: education.map((item) => ({
            profile_info_id: currentProfileId,
            institution_name: item.institution_name,
            qualification: item.qualification ?? null,
            field_of_study: item.field_of_study ?? null,
            location: item.location ?? null,
            start_date: parseDate(item.start_date),
            end_date: item.end_date ? parseDate(item.end_date) : null,
            description: item.description ?? null,
          })),
        });
      }

      if (skills.length > 0) {
        await tx.skill.createMany({
          data: skills.map((item) => ({
            profile_info_id: currentProfileId,
            name: item.name,
            category: item.category ?? null,
            level: item.level ?? null,
            years_experience: item.years_experience ?? null,
          })),
        });
      }

      if (documents.length > 0) {
        await tx.document.createMany({
          data: documents.map((item) => ({
            profile_info_id: currentProfileId,
            title: item.title,
            category: item.category,
            description: item.description ?? null,
            external_url: item.external_url ?? null,
            file_name: item.file_name ?? null,
            file_content: item.file_content_base64
              ? Buffer.from(item.file_content_base64, "base64")
              : null,
            file_mime_type: item.file_mime_type ?? null,
            issue_date: item.issue_date ? parseDate(item.issue_date) : null,
          })),
        });
      }

      return currentProfileId;
    });

    const savedProfile = await prisma.profile_info.findUnique({
      where: { id: profileId },
      include: {
        work_experience: {
          orderBy: { start_date: "desc" },
        },
        education: {
          orderBy: { start_date: "desc" },
        },
        skill: {
          orderBy: { id: "asc" },
        },
        document: {
          orderBy: { id: "asc" },
        },
      },
    });

    if (!savedProfile) {
      res.status(500).json({
        message: "Profile could not be retrieved after saving",
      });
      return;
    }

    const { photo, document, ...profileData } = savedProfile;

    res.status(200).json({
      ...profileData,
      photo_base64: photo ? Buffer.from(photo).toString("base64") : null,

      work_experience: savedProfile.work_experience.map((item) => ({
        ...item,
        start_date: formatDate(item.start_date),
        end_date: formatDate(item.end_date),
      })),

      education: savedProfile.education.map((item) => ({
        ...item,
        start_date: formatDate(item.start_date),
        end_date: formatDate(item.end_date),
      })),

      documents: document.map((item) => {
        const { file_content, ...documentData } = item;

        return {
          ...documentData,
          file_content_base64: file_content
            ? Buffer.from(file_content).toString("base64")
            : null,
          issue_date: formatDate(item.issue_date),
        };
      }),
    });
  } catch (error) {
    next(error);
  }
};
