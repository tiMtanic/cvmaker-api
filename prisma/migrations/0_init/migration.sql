-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "document" (
    "id" SERIAL NOT NULL,
    "profile_info_id" INTEGER NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "category" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "external_url" VARCHAR(1024),
    "file_name" VARCHAR(512),
    "file_content" BYTEA,
    "file_mime_type" VARCHAR(128),
    "issue_date" DATE,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education" (
    "id" SERIAL NOT NULL,
    "profile_info_id" INTEGER NOT NULL,
    "institution_name" VARCHAR(256) NOT NULL,
    "qualification" VARCHAR(256),
    "field_of_study" VARCHAR(256),
    "location" VARCHAR(256),
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "description" TEXT,

    CONSTRAINT "education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_info" (
    "id" SERIAL NOT NULL,
    "full_name" VARCHAR(256) NOT NULL,
    "professional_title" VARCHAR(256),
    "email" VARCHAR(320),
    "phone" VARCHAR(50),
    "country" VARCHAR(128),
    "profile_summary" TEXT,
    "linkedin_url" VARCHAR(512),
    "xing_url" VARCHAR(512),
    "github_url" VARCHAR(512),
    "photo" BYTEA,
    "photo_mime_type" VARCHAR(100),

    CONSTRAINT "profile_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill" (
    "id" SERIAL NOT NULL,
    "profile_info_id" INTEGER NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "category" VARCHAR(128),
    "level" VARCHAR(128),
    "years_experience" DECIMAL(4,1),

    CONSTRAINT "skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_experience" (
    "id" SERIAL NOT NULL,
    "profile_info_id" INTEGER NOT NULL,
    "company_name" VARCHAR(256) NOT NULL,
    "job_title" VARCHAR(256) NOT NULL,
    "location" VARCHAR(256) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,

    CONSTRAINT "work_experience_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "fk_document_profile" FOREIGN KEY ("profile_info_id") REFERENCES "profile_info"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "education" ADD CONSTRAINT "fk_education_profile" FOREIGN KEY ("profile_info_id") REFERENCES "profile_info"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "skill" ADD CONSTRAINT "fk_skill_profile" FOREIGN KEY ("profile_info_id") REFERENCES "profile_info"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "work_experience" ADD CONSTRAINT "fk_work_experience_profile" FOREIGN KEY ("profile_info_id") REFERENCES "profile_info"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

