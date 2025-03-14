
import { useState, useEffect, createContext, useContext, useCallback } from "react";
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
  const [isInitialized, setIsInitialized] = useState(false);

  // Load resumes from localStorage on initial render (optimized)
  useEffect(() => {
    const loadData = () => {
      try {
        const savedResumes = localStorage.getItem("resumes");
        const savedDefaultId = localStorage.getItem("defaultResumeId");
        
        if (savedResumes) {
          setResumes(JSON.parse(savedResumes));
        }
        
        if (savedDefaultId) {
          setDefaultResumeId(savedDefaultId);
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error("Error loading resume data:", error);
        setIsInitialized(true);
      }
    };

    // Use a small timeout to prevent blocking the main thread during initial load
    const timer = setTimeout(loadData, 100);
    return () => clearTimeout(timer);
  }, []);

  // Save resumes to localStorage whenever it changes (optimized with debounce-like behavior)
  useEffect(() => {
    if (!isInitialized) return;
    
    const timer = setTimeout(() => {
      localStorage.setItem("resumes", JSON.stringify(resumes));
    }, 200);
    
    return () => clearTimeout(timer);
  }, [resumes, isInitialized]);

  // Save default resume ID to localStorage whenever it changes
  useEffect(() => {
    if (!isInitialized) return;
    
    if (defaultResumeId) {
      localStorage.setItem("defaultResumeId", defaultResumeId);
    } else {
      localStorage.removeItem("defaultResumeId");
    }
  }, [defaultResumeId, isInitialized]);

  const addResume = useCallback((resume: Resume) => {
    setResumes((prevResumes) => [...prevResumes, resume]);
    
    // If this is the first resume, set it as default
    if (resumes.length === 0 && !defaultResumeId) {
      setDefaultResumeId(resume.id);
    }
  }, [resumes.length, defaultResumeId]);

  const removeResume = useCallback((id: string) => {
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
  }, [defaultResumeId, resumes]);

  const setDefaultResume = useCallback((id: string) => {
    setDefaultResumeId(id);
  }, []);

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
