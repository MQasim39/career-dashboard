
import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        {/* Left side branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-primary/10 p-8 items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4 font-heading text-primary">JobMatch</h1>
            <p className="text-lg text-foreground mb-6">
              Your ultimate career dashboard for job applications, resume management, and career growth
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-background p-4 shadow-sm">
                <div className="text-2xl font-bold">Resume Management</div>
                <p className="text-muted-foreground">Organize and optimize your resumes for job applications</p>
              </div>
              <div className="rounded-lg bg-background p-4 shadow-sm">
                <div className="text-2xl font-bold">Job Tracking</div>
                <p className="text-muted-foreground">Track applications and stay on top of your job search</p>
              </div>
              <div className="rounded-lg bg-background p-4 shadow-sm">
                <div className="text-2xl font-bold">AI Assistant</div>
                <p className="text-muted-foreground">Get personalized career advice and recommendations</p>
              </div>
              <div className="rounded-lg bg-background p-4 shadow-sm">
                <div className="text-2xl font-bold">Analytics</div>
                <p className="text-muted-foreground">Visualize your job search progress with insights</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side auth form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
