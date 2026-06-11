export interface Profile {
  id: string
  username: string
  first_name: string | null
  last_name: string | null
  job_title: string | null
  location: string | null
  bio: string | null
  skills: string[]
  open_to_work: boolean
  work_pref: 'remote' | 'onsite' | 'hybrid' | 'flexible' | null
  years_exp: string | null
  availability: 'full-time' | 'part-time' | 'freelance' | 'contract' | 'internship' | null
  github_url: string | null
  portfolio_url: string | null
  linkedin_url: string | null
  pronouns: string | null
  website_url: string | null
  twitter_url: string | null
  discord_handle: string | null
  intro_video_url: string | null
  hourly_rate: string | null
  college: string | null
  timezone: string | null
  looking_for: string | null
  created_at: string
}

export interface Manager {
  id: string
  name: string
  company: string | null
  role: string | null
  company_description: string | null
  company_size: 'solo' | 'startup' | 'smb' | 'enterprise' | null
  industries: string[]
  location: string | null
  website_url: string | null
  created_at: string
}

export interface Reel {
  id: string
  user_id: string
  url: string
  title: string | null
  source: string | null
  skills: string[]
  visibility: 'public' | 'private'
  created_at: string
}

export interface IndividualProject {
  id: string
  user_id: string
  title: string
  description: string | null
  status: 'completed' | 'in-progress' | 'idea' | null
  skills: string[]
  demo_link: string | null
  github_url: string | null
  video_url: string | null
  visibility: 'public' | 'private'
  created_at: string
}

export interface ManagerProject {
  id: string
  manager_id: string
  title: string
  description: string | null
  skills_required: string[]
  timeline: string | null
  pay_type: 'paid' | 'unpaid' | 'bounty' | 'equity' | 'tbd' | null
  visibility: 'public' | 'private'
  assigned_to: string | null
  status: 'open' | 'closed' | 'draft'
  video_url: string | null
  created_at: string
  managers?: Pick<Manager, 'name' | 'company'>
}

export interface ProfileView {
  id: string
  profile_user_id: string
  manager_id: string
  viewed_at: string
  managers?: Pick<Manager, 'name' | 'company'>
}

export type AccountType = 'individual' | 'manager'

export interface ProjectSubmission {
  id: string
  project_id: string
  individual_id: string
  submission_url: string | null
  note: string | null
  submitted_at: string
  status: 'pending' | 'accepted' | 'rejected'
  profiles?: Pick<Profile, 'first_name' | 'last_name' | 'username' | 'job_title'>
}
