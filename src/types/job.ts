
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description?: string;
  jobType: string;
  salary?: number;
  status: string;
  dateApplied: string;
  favorite: boolean;
  skills: string[];
  resumeId?: string;
  notes?: string;
}
