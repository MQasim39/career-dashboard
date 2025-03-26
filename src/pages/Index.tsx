
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Briefcase, 
  FileText, 
  Sparkles, 
  Clock, 
  Target, 
  LineChart, 
  Robot, 
  User, 
  Mail, 
  Github, 
  Twitter, 
  CheckCircle 
} from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="border-b">
        <div className="container flex justify-between items-center h-16 px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold font-heading">JobMatch</span>
          </Link>
          <nav className="hidden md:flex gap-6 items-center">
            <Link to="/#features" className="text-sm font-medium hover:text-primary">
              Features
            </Link>
            <Link to="/#testimonials" className="text-sm font-medium hover:text-primary">
              Testimonials
            </Link>
            <Link to="/#pricing" className="text-sm font-medium hover:text-primary">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/auth/login">
              <Button variant="outline">Log in</Button>
            </Link>
            <Link to="/auth/signup">
              <Button>Sign up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-background to-muted/30 py-20">
        <div className="container px-4 md:px-6 flex flex-col md:flex-row items-center gap-6 md:gap-12">
          <div className="flex flex-col gap-4 md:w-1/2">
            <h1 className="text-4xl md:text-5xl font-bold font-heading tracking-tight max-w-prose">
              Streamline Your Job Search with Smart Technology
            </h1>
            <p className="text-xl text-muted-foreground">
              JobMatch helps you organize applications, match with perfect opportunities, and 
              optimize your career growth with AI-powered assistance.
            </p>
            <div className="flex gap-4 mt-4">
              <Link to="/auth/signup">
                <Button size="lg" className="px-8 font-medium">
                  Get Started
                </Button>
              </Link>
              <Link to="/#features">
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="relative bg-background border rounded-lg shadow-xl p-4 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <div className="text-xs text-muted-foreground">JobMatch Dashboard</div>
              </div>
              <div className="space-y-4">
                <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-24 bg-primary/10 rounded flex flex-col items-center justify-center">
                    <FileText className="h-8 w-8 text-primary mb-2" />
                    <div className="h-4 w-16 bg-muted rounded" />
                  </div>
                  <div className="h-24 bg-primary/10 rounded flex flex-col items-center justify-center">
                    <Briefcase className="h-8 w-8 text-primary mb-2" />
                    <div className="h-4 w-16 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-32 bg-muted/50 rounded" />
                <div className="h-8 bg-primary rounded-full w-40 mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="container px-4 md:px-6">
          <div className="text-center max-w-[800px] mx-auto mb-12">
            <h2 className="text-3xl font-bold font-heading tracking-tight sm:text-4xl md:text-5xl">
              Powerful Features to Boost Your Career
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to manage your job search effectively and make informed career decisions.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex flex-col p-6 bg-card text-card-foreground rounded-lg border shadow-sm hover:shadow-md transition-shadow">
              <FileText className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-bold text-xl mb-2">Resume Management</h3>
              <p className="text-muted-foreground flex-grow">
                Store multiple versions of your resume and optimize them for different job applications.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm">Automatic resume parsing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm">Tailored resume versions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm">ATS compatibility analysis</span>
                </li>
              </ul>
            </div>
            <div className="flex flex-col p-6 bg-card text-card-foreground rounded-lg border shadow-sm hover:shadow-md transition-shadow">
              <Briefcase className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-bold text-xl mb-2">Job Tracking</h3>
              <p className="text-muted-foreground flex-grow">
                Track all your job applications in one place with status updates and follow-up reminders.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm">Application status monitoring</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm">Interview scheduling</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm">Follow-up reminders</span>
                </li>
              </ul>
            </div>
            <div className="flex flex-col p-6 bg-card text-card-foreground rounded-lg border shadow-sm hover:shadow-md transition-shadow">
              <Robot className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-bold text-xl mb-2">AI Assistant</h3>
              <p className="text-muted-foreground flex-grow">
                Get personalized career advice and application assistance from our AI assistant.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm">Cover letter generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm">Interview preparation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm">Skill gap analysis</span>
                </li>
              </ul>
            </div>
            <div className="flex flex-col p-6 bg-card text-card-foreground rounded-lg border shadow-sm hover:shadow-md transition-shadow">
              <LineChart className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-bold text-xl mb-2">Analytics</h3>
              <p className="text-muted-foreground flex-grow">
                Visualize your job search progress and identify areas for improvement.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm">Application success rate</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm">Skills demand analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm">Market trends insights</span>
                </li>
              </ul>
            </div>
            <div className="flex flex-col p-6 bg-card text-card-foreground rounded-lg border shadow-sm hover:shadow-md transition-shadow">
              <Target className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-bold text-xl mb-2">Smart Matching</h3>
              <p className="text-muted-foreground flex-grow">
                Find jobs that match your skills, experience, and preferences with our intelligent algorithm.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm">Skill-based matching</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm">Company culture fit</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm">Salary range optimization</span>
                </li>
              </ul>
            </div>
            <div className="flex flex-col p-6 bg-card text-card-foreground rounded-lg border shadow-sm hover:shadow-md transition-shadow">
              <Clock className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-bold text-xl mb-2">Time Saving</h3>
              <p className="text-muted-foreground flex-grow">
                Spend less time on administrative tasks and more time on high-value job search activities.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm">One-click applications</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm">Automated follow-ups</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm">Quick resume tailoring</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="text-center max-w-[800px] mx-auto mb-12">
            <h2 className="text-3xl font-bold font-heading tracking-tight sm:text-4xl md:text-5xl">
              Loved by Job Seekers
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Hear what our users have to say about how JobMatch transformed their job search.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex flex-col p-6 bg-background rounded-lg border shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Sarah Johnson</h3>
                  <p className="text-sm text-muted-foreground">Software Engineer</p>
                </div>
              </div>
              <p className="text-muted-foreground flex-grow">
                "JobMatch helped me land my dream job at a tech startup. The AI assistant gave me
                invaluable feedback on my resume and prepared me for tough interview questions."
              </p>
              <div className="flex mt-4 text-amber-500">
                <Star />
                <Star />
                <Star />
                <Star />
                <Star />
              </div>
            </div>
            <div className="flex flex-col p-6 bg-background rounded-lg border shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Michael Rodriguez</h3>
                  <p className="text-sm text-muted-foreground">Marketing Manager</p>
                </div>
              </div>
              <p className="text-muted-foreground flex-grow">
                "The analytics feature showed me exactly where I needed to improve my application strategy.
                Within weeks, I started getting more interviews than ever before."
              </p>
              <div className="flex mt-4 text-amber-500">
                <Star />
                <Star />
                <Star />
                <Star />
                <Star />
              </div>
            </div>
            <div className="flex flex-col p-6 bg-background rounded-lg border shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Emily Chen</h3>
                  <p className="text-sm text-muted-foreground">UX Designer</p>
                </div>
              </div>
              <p className="text-muted-foreground flex-grow">
                "As a designer, I was skeptical about an AI tool, but JobMatch surprised me.
                It helped me organize my portfolio and track all my applications seamlessly."
              </p>
              <div className="flex mt-4 text-amber-500">
                <Star />
                <Star />
                <Star />
                <Star />
                <HalfStar />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold font-heading tracking-tight sm:text-4xl md:text-5xl mb-6">
            Ready to Supercharge Your Job Search?
          </h2>
          <p className="text-xl mb-8 max-w-[800px] mx-auto opacity-90">
            Join thousands of successful job seekers who found their perfect career match with our platform.
          </p>
          <Link to="/auth/signup">
            <Button size="lg" variant="secondary" className="px-8 font-medium text-lg">
              Get Started For Free
            </Button>
          </Link>
          <p className="mt-4 text-sm opacity-80">No credit card required • Free 14-day trial</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold font-heading">JobMatch</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Intelligent job matching and application tracking for modern professionals.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-muted-foreground hover:text-primary">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary">
                  <Github className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary">
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Features</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Pricing</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Testimonials</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">About</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Blog</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Careers</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Terms of Service</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} JobMatch. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Star icon component for testimonials
const Star = () => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
};

// Half star icon component for testimonials
const HalfStar = () => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star-half">
      <path d="M12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2" />
      <path d="M12 2v15.8" fill="none" stroke="currentColor" />
      <path d="m12 17.8 6.2 3.2-1.2-6.9 5-4.8-6.9-1-3.1-6.3z" fill="none" stroke="currentColor" />
    </svg>
  );
};

export default Index;
