/*
  # Add Business Social Network Features

  1. New Tables
    - `bookmarks` - Save posts for later viewing
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `post_id` (uuid, foreign key to posts)
      - `created_at` (timestamp)
    
    - `hashtags` - Store unique hashtags
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `usage_count` (integer)
      - `created_at` (timestamp)
    
    - `post_hashtags` - Junction table for posts and hashtags
      - `post_id` (uuid, foreign key)
      - `hashtag_id` (uuid, foreign key)
    
    - `shares` - Track post shares/reposts
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `original_post_id` (uuid, foreign key)
      - `comment` (text, optional)
      - `created_at` (timestamp)
    
    - `companies` - Company/business pages
      - `id` (uuid, primary key)
      - `name` (text)
      - `slug` (text, unique)
      - `description` (text)
      - `industry` (text)
      - `website` (text)
      - `logo_url` (text)
      - `cover_url` (text)
      - `location` (text)
      - `employee_count` (text)
      - `founded_year` (integer)
      - `owner_id` (uuid, foreign key)
      - `created_at` (timestamp)
    
    - `company_followers` - Users following companies
      - `user_id` (uuid, foreign key)
      - `company_id` (uuid, foreign key)
      - `created_at` (timestamp)
    
    - `jobs` - Job postings
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key)
      - `title` (text)
      - `description` (text)
      - `location` (text)
      - `job_type` (text) - full-time, part-time, contract, etc.
      - `experience_level` (text)
      - `salary_min` (integer)
      - `salary_max` (integer)
      - `skills` (text array)
      - `is_active` (boolean)
      - `posted_by` (uuid, foreign key)
      - `created_at` (timestamp)
    
    - `job_applications` - Track job applications
      - `id` (uuid, primary key)
      - `job_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `cover_letter` (text)
      - `resume_url` (text)
      - `status` (text) - pending, reviewed, accepted, rejected
      - `created_at` (timestamp)
    
    - `skills` - User skills
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `name` (text)
      - `endorsement_count` (integer)
      - `created_at` (timestamp)
    
    - `skill_endorsements` - Skill endorsements
      - `skill_id` (uuid, foreign key)
      - `endorsed_by` (uuid, foreign key)
      - `created_at` (timestamp)
    
    - `experiences` - Work experience
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `company_name` (text)
      - `title` (text)
      - `location` (text)
      - `start_date` (date)
      - `end_date` (date, nullable for current)
      - `is_current` (boolean)
      - `description` (text)
      - `created_at` (timestamp)

  2. Modified Tables
    - `profiles` - Add professional fields
      - `headline` (text) - Professional headline
      - `job_title` (text)
      - `company` (text)
      - `location` (text)
      - `website` (text)
      - `linkedin_url` (text)
      - `twitter_url` (text)

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for each table
*/

-- Add professional fields to profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'headline') THEN
    ALTER TABLE profiles ADD COLUMN headline text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'job_title') THEN
    ALTER TABLE profiles ADD COLUMN job_title text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company') THEN
    ALTER TABLE profiles ADD COLUMN company text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location') THEN
    ALTER TABLE profiles ADD COLUMN location text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'website') THEN
    ALTER TABLE profiles ADD COLUMN website text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'linkedin_url') THEN
    ALTER TABLE profiles ADD COLUMN linkedin_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'twitter_url') THEN
    ALTER TABLE profiles ADD COLUMN twitter_url text;
  END IF;
END $$;

-- Bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookmarks"
  ON bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Hashtags table
CREATE TABLE IF NOT EXISTS hashtags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view hashtags"
  ON hashtags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage hashtags"
  ON hashtags FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Post hashtags junction
CREATE TABLE IF NOT EXISTS post_hashtags (
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  hashtag_id uuid NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, hashtag_id)
);

ALTER TABLE post_hashtags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view post hashtags"
  ON post_hashtags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Post owners can manage hashtags"
  ON post_hashtags FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM posts WHERE posts.id = post_id AND posts.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM posts WHERE posts.id = post_id AND posts.user_id = auth.uid()));

-- Shares table
CREATE TABLE IF NOT EXISTS shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  original_post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shares"
  ON shares FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can share posts"
  ON shares FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own shares"
  ON shares FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  industry text,
  website text,
  logo_url text,
  cover_url text,
  location text,
  employee_count text,
  founded_year integer,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view companies"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update companies"
  ON companies FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete companies"
  ON companies FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Company followers
CREATE TABLE IF NOT EXISTS company_followers (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, company_id)
);

ALTER TABLE company_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view company followers"
  ON company_followers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can follow companies"
  ON company_followers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow companies"
  ON company_followers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  location text,
  job_type text DEFAULT 'full-time',
  experience_level text,
  salary_min integer,
  salary_max integer,
  skills text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  posted_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (is_active = true OR posted_by = auth.uid());

CREATE POLICY "Company owners can create jobs"
  ON jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = posted_by AND 
    EXISTS (SELECT 1 FROM companies WHERE companies.id = company_id AND companies.owner_id = auth.uid())
  );

CREATE POLICY "Company owners can update jobs"
  ON jobs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = company_id AND companies.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = company_id AND companies.owner_id = auth.uid())
  );

CREATE POLICY "Company owners can delete jobs"
  ON jobs FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = company_id AND companies.owner_id = auth.uid())
  );

-- Job applications
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cover_letter text,
  resume_url text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  UNIQUE(job_id, user_id)
);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications"
  ON job_applications FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM jobs 
      JOIN companies ON jobs.company_id = companies.id 
      WHERE jobs.id = job_id AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can apply to jobs"
  ON job_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Company owners can update applications"
  ON job_applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      JOIN companies ON jobs.company_id = companies.id 
      WHERE jobs.id = job_id AND companies.owner_id = auth.uid()
    )
  );

-- Skills table
CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  endorsement_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view skills"
  ON skills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own skills"
  ON skills FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Skill endorsements
CREATE TABLE IF NOT EXISTS skill_endorsements (
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  endorsed_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (skill_id, endorsed_by)
);

ALTER TABLE skill_endorsements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view endorsements"
  ON skill_endorsements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can endorse skills"
  ON skill_endorsements FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = endorsed_by AND
    NOT EXISTS (SELECT 1 FROM skills WHERE skills.id = skill_id AND skills.user_id = auth.uid())
  );

CREATE POLICY "Users can remove own endorsements"
  ON skill_endorsements FOR DELETE
  TO authenticated
  USING (auth.uid() = endorsed_by);

-- Work experiences
CREATE TABLE IF NOT EXISTS experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  title text NOT NULL,
  location text,
  start_date date NOT NULL,
  end_date date,
  is_current boolean DEFAULT false,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view experiences"
  ON experiences FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own experiences"
  ON experiences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_post_id ON bookmarks(post_id);
CREATE INDEX IF NOT EXISTS idx_hashtags_name ON hashtags(name);
CREATE INDEX IF NOT EXISTS idx_hashtags_usage ON hashtags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_shares_user_id ON shares(user_id);
CREATE INDEX IF NOT EXISTS idx_shares_post_id ON shares(original_post_id);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_user_id ON skills(user_id);
CREATE INDEX IF NOT EXISTS idx_experiences_user_id ON experiences(user_id);
