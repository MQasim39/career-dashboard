
import { useState, useEffect, createContext, useContext } from "react";
import { Job } from "@/types/job";
import { demoJobs } from "@/data/demo-jobs";

interface JobsContextType {
  jobs: Job[];
  addJob: (job: Job) => void;
  removeJob: (id: string) => void;
  updateJobStatus: (id: string, status: string) => void;
  toggleFavorite: (id: string) => void;
}

const JobsContext = createContext<JobsContextType | undefined>(undefined);

export function JobsProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);

  // Load jobs from localStorage or use demo jobs on initial render
  useEffect(() => {
    const savedJobs = localStorage.getItem("jobs");
    
    if (savedJobs) {
      setJobs(JSON.parse(savedJobs));
    } else {
      // Use demo jobs if no saved jobs found
      setJobs(demoJobs);
    }
  }, []);

  // Save jobs to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("jobs", JSON.stringify(jobs));
  }, [jobs]);

  const addJob = (job: Job) => {
    setJobs((prevJobs) => [...prevJobs, job]);
  };

  const removeJob = (id: string) => {
    setJobs((prevJobs) => prevJobs.filter((job) => job.id !== id));
  };

  const updateJobStatus = (id: string, status: string) => {
    setJobs((prevJobs) =>
      prevJobs.map((job) =>
        job.id === id ? { ...job, status } : job
      )
    );
  };

  const toggleFavorite = (id: string) => {
    setJobs((prevJobs) =>
      prevJobs.map((job) =>
        job.id === id ? { ...job, favorite: !job.favorite } : job
      )
    );
  };

  return (
    <JobsContext.Provider
      value={{
        jobs,
        addJob,
        removeJob,
        updateJobStatus,
        toggleFavorite,
      }}
    >
      {children}
    </JobsContext.Provider>
  );
}

export function useJobs() {
  const context = useContext(JobsContext);
  if (context === undefined) {
    throw new Error("useJobs must be used within a JobsProvider");
  }
  return context;
}
