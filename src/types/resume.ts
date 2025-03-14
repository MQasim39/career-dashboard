
export interface Resume {
  id: string;
  name: string;
  type: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  dateUploaded: string;
  file: string;
  matchScore?: number;
  tags?: string[];
  description?: string;
  isDefault?: boolean;
}

export type ResumeType = 'general' | 'technical' | 'executive' | 'creative' | 'entry-level' | 'specialized';

export interface ResumeStats {
  totalCount: number;
  byType: Record<string, number>;
  avgSize: number;
  newestId?: string;
}
