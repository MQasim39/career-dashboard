
import { useToast } from "@/hooks/use-toast";

/**
 * Service for making requests to the Python backend
 */
export class PythonBackendService {
  private static backendUrl: string | null = null;
  private static initialized = false;

  /**
   * Initialize the Python backend service by retrieving the URL from localStorage
   */
  static initialize(): void {
    if (this.initialized) return;
    
    const url = localStorage.getItem("python_backend_url");
    if (url) {
      this.backendUrl = url;
    }
    
    this.initialized = true;
  }

  /**
   * Set the Python backend URL
   */
  static setBackendUrl(url: string): void {
    this.backendUrl = url;
    localStorage.setItem("python_backend_url", url);
    this.initialized = true;
  }

  /**
   * Get the Python backend URL
   */
  static getBackendUrl(): string | null {
    if (!this.initialized) {
      this.initialize();
    }
    return this.backendUrl;
  }

  /**
   * Check if the Python backend is configured
   */
  static isConfigured(): boolean {
    if (!this.initialized) {
      this.initialize();
    }
    return !!this.backendUrl;
  }

  /**
   * Make a request to the Python backend
   */
  static async request<T>(
    path: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
    data?: any,
    token?: string
  ): Promise<T> {
    if (!this.initialized) {
      this.initialize();
    }

    if (!this.backendUrl) {
      throw new Error("Python backend URL is not configured");
    }

    const url = `${this.backendUrl}${path}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Python backend request failed: ${error}`);
      throw error;
    }
  }

  /**
   * Upload a file to the Python backend
   */
  static async uploadFile<T>(
    path: string,
    file: File,
    formData: Record<string, string>,
    token?: string
  ): Promise<T> {
    if (!this.initialized) {
      this.initialize();
    }

    if (!this.backendUrl) {
      throw new Error("Python backend URL is not configured");
    }

    const url = `${this.backendUrl}${path}`;
    
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Create form data object
    const body = new FormData();
    body.append('file', file);
    
    // Add additional form data
    Object.entries(formData).forEach(([key, value]) => {
      body.append(key, value);
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Python backend file upload failed: ${error}`);
      throw error;
    }
  }

  /**
   * Get API status
   */
  static async getApiStatus(): Promise<{
    api: string;
    claude_api: string;
    supabase: string;
    firecrawl: string;
  }> {
    return this.request<{
      api: string;
      claude_api: string;
      supabase: string;
      firecrawl: string;
    }>('/api-status');
  }

  /**
   * Activate AI agent
   */
  static async activateAgent(
    data: {
      user_id: string;
      resume_id: string;
      location?: string;
      job_type?: string;
      department?: string;
      salary_range?: [number, number];
      email_alerts?: boolean;
      browser_alerts?: boolean;
    },
    token?: string
  ): Promise<any> {
    return this.request('/activate-agent', 'POST', data, token);
  }

  /**
   * Get job matches
   */
  static async getJobMatches(
    userId: string,
    resumeId: string,
    token?: string
  ): Promise<any> {
    return this.request(`/job-matches?user_id=${userId}&resume_id=${resumeId}`, 'GET', undefined, token);
  }
}

/**
 * Hook to use the Python backend service in components
 */
export const usePythonBackend = () => {
  const { toast } = useToast();
  
  const isConfigured = (): boolean => {
    return PythonBackendService.isConfigured();
  };

  const checkConfiguration = (): boolean => {
    const configured = isConfigured();
    if (!configured) {
      toast({
        title: "Python Backend Not Configured",
        description: "Please configure the Python backend URL in the settings",
        variant: "destructive",
      });
    }
    return configured;
  };

  return {
    isConfigured,
    checkConfiguration,
    getBackendUrl: PythonBackendService.getBackendUrl,
    setBackendUrl: PythonBackendService.setBackendUrl,
    request: PythonBackendService.request,
    uploadFile: PythonBackendService.uploadFile,
    getApiStatus: PythonBackendService.getApiStatus,
    activateAgent: PythonBackendService.activateAgent,
    getJobMatches: PythonBackendService.getJobMatches
  };
};
