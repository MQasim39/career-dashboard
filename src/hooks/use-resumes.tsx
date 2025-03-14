
import { useState, useEffect, createContext, useContext } from "react";
import { Resume } from "@/types/resume";

interface ResumesContextType {
  resumes: Resume[];
  addResume: (resume: Resume) => void;
  removeResume: (id: string) => void;
  defaultResumeId: string | null;
  setDefaultResume: (id: string) => void;
}

const ResumesContext = createContext<ResumesContextType | undefined>(undefined);

export function ResumesProvider({ children }: { children: React.ReactNode }) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [defaultResumeId, setDefaultResumeId] = useState<string | null>(null);

  // Load resumes from localStorage on initial render
  useEffect(() => {
    const savedResumes = localStorage.getItem("resumes");
    const savedDefaultId = localStorage.getItem("defaultResumeId");
    
    if (savedResumes) {
      setResumes(JSON.parse(savedResumes));
    }
    
    if (savedDefaultId) {
      setDefaultResumeId(savedDefaultId);
    }
  }, []);

  // Save resumes to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("resumes", JSON.stringify(resumes));
  }, [resumes]);

  // Save default resume ID to localStorage whenever it changes
  useEffect(() => {
    if (defaultResumeId) {
      localStorage.setItem("defaultResumeId", defaultResumeId);
    } else {
      localStorage.removeItem("defaultResumeId");
    }
  }, [defaultResumeId]);

  const addResume = (resume: Resume) => {
    setResumes((prevResumes) => [...prevResumes, resume]);
    
    // If this is the first resume, set it as default
    if (resumes.length === 0 && !defaultResumeId) {
      setDefaultResumeId(resume.id);
    }
  };

  const removeResume = (id: string) => {
    setResumes((prevResumes) => prevResumes.filter((resume) => resume.id !== id));
    
    // If the default resume is removed, set the first available resume as default
    if (defaultResumeId === id) {
      const remainingResumes = resumes.filter((resume) => resume.id !== id);
      if (remainingResumes.length > 0) {
        setDefaultResumeId(remainingResumes[0].id);
      } else {
        setDefaultResumeId(null);
      }
    }
  };

  const setDefaultResume = (id: string) => {
    setDefaultResumeId(id);
  };

  return (
    <ResumesContext.Provider
      value={{
        resumes,
        addResume,
        removeResume,
        defaultResumeId,
        setDefaultResume,
      }}
    >
      {children}
    </ResumesContext.Provider>
  );
}

export function useResumes() {
  const context = useContext(ResumesContext);
  if (context === undefined) {
    throw new Error("useResumes must be used within a ResumesProvider");
  }
  return context;
}
