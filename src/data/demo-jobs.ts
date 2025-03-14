
import { Job } from "@/types/job";

export const demoJobs: Job[] = [
  {
    id: "1",
    title: "Frontend Developer",
    company: "TechCorp",
    location: "San Francisco, CA (Remote)",
    description: "We're looking for a Frontend Developer to join our team. You'll be responsible for building and maintaining user interfaces for our web applications.",
    jobType: "full-time",
    salary: 120000,
    status: "applied",
    dateApplied: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    favorite: true,
    skills: ["React", "TypeScript", "Tailwind CSS", "Next.js"]
  },
  {
    id: "2",
    title: "Senior React Developer",
    company: "InnovateTech",
    location: "New York, NY",
    description: "Join our team to build cutting-edge web applications using React and TypeScript. You'll work on complex problems and mentor junior developers.",
    jobType: "full-time",
    salary: 150000,
    status: "interview",
    dateApplied: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    favorite: false,
    skills: ["React", "TypeScript", "Redux", "GraphQL"]
  },
  {
    id: "3",
    title: "UI/UX Designer",
    company: "DesignHub",
    location: "Seattle, WA (Hybrid)",
    description: "Help us create beautiful and functional user interfaces for our products. You'll work with our product team to design and implement new features.",
    jobType: "full-time",
    salary: 110000,
    status: "offer",
    dateApplied: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    favorite: true,
    skills: ["Figma", "Adobe XD", "User Research", "Prototyping"]
  },
  {
    id: "4",
    title: "Web Developer (Contract)",
    company: "FreelanceHub",
    location: "Remote",
    description: "Short-term contract to help build a new e-commerce website. Experience with modern frontend frameworks and responsive design required.",
    jobType: "contract",
    salary: 90000,
    status: "rejected",
    dateApplied: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    favorite: false,
    skills: ["JavaScript", "HTML/CSS", "React", "E-commerce"]
  },
  {
    id: "5",
    title: "Frontend Engineer",
    company: "StartupX",
    location: "Austin, TX",
    description: "Join our fast-growing startup to help build our flagship product. You'll work directly with the CTO and have a significant impact on our product direction.",
    jobType: "full-time",
    salary: 130000,
    status: "applied",
    dateApplied: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    favorite: true,
    skills: ["React", "TypeScript", "Material UI", "Testing"]
  }
];
