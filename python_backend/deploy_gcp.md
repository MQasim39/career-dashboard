
# Deploying the Python Backend to Google Cloud Functions

This guide provides instructions on how to deploy the Python backend to Google Cloud Functions.

## Prerequisites

1. Install Google Cloud SDK: [Google Cloud SDK Installation Guide](https://cloud.google.com/sdk/docs/install)
2. Initialize the SDK: `gcloud init`
3. Authenticate with Google Cloud: `gcloud auth login`
4. Set your project: `gcloud config set project YOUR_PROJECT_ID`

## Deployment Steps

### 1. Create Cloud Function Entry Point

Create a file named `main.py` in the `python_backend` directory:

```python
import functions_framework
from flask import Request
import app

@functions_framework.http
def handler(request: Request):
    """
    HTTP Cloud Function entry point.
    This function is invoked by Google Cloud Functions and forwards requests to the Flask app.
    """
    return app.app(request.environ, lambda x, y: [])
```

### 2. Update Requirements

Ensure your `requirements.txt` includes the Functions Framework:

```
functions-framework==3.3.0
```

### 3. Create a `.gcloudignore` File

Create a `.gcloudignore` file to exclude unnecessary files from deployment:

```
.git
.gitignore
.env
venv/
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
```

### 4. Deploy to Google Cloud Functions

Deploy the function using the gcloud CLI:

```bash
gcloud functions deploy job-backend \
  --runtime python310 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point handler \
  --memory 1024MB \
  --timeout 120s \
  --region us-central1 \
  --set-env-vars SUPABASE_URL=your-supabase-url,SUPABASE_ANON_KEY=your-anon-key,SUPABASE_SERVICE_ROLE_KEY=your-service-role-key,JWT_SECRET=your-jwt-secret,FIRECRAWL_API_KEY=your-firecrawl-api-key
```

### 5. Set Up API Gateway (Optional)

For better control over your API, you can set up API Gateway:

1. Create an API Gateway configuration:
   ```bash
   gcloud api-gateway apis create job-api --project=YOUR_PROJECT_ID
   ```

2. Define your API using an OpenAPI specification:
   ```yaml
   # api-spec.yaml
   swagger: '2.0'
   info:
     title: Job Backend API
     description: API for job scraping and resume parsing
     version: 1.0.0
   schemes:
     - https
   produces:
     - application/json
   paths:
     /parse-resume:
       post:
         summary: Parse a resume
         operationId: parseResume
         x-google-backend:
           address: https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/job-backend/parse-resume
         responses:
           '200':
             description: Resume parsed successfully
     # Define other endpoints similarly
   ```

3. Deploy the API configuration:
   ```bash
   gcloud api-gateway api-configs create job-api-config \
     --api=job-api \
     --openapi-spec=api-spec.yaml \
     --project=YOUR_PROJECT_ID
   ```

4. Create a gateway:
   ```bash
   gcloud api-gateway gateways create job-api-gateway \
     --api=job-api \
     --api-config=job-api-config \
     --location=us-central1 \
     --project=YOUR_PROJECT_ID
   ```

### 6. Update the Frontend

After deployment, update your frontend to use the new API URL:

```javascript
// In your frontend API client configuration
const backendUrl = 'https://job-backend-abc123-uc.a.run.app';
// Or if using API Gateway:
// const backendUrl = 'https://job-api-gateway-abc123.uc.gateway.dev';
```

## Additional Configuration

### Setting Up CORS

To enable CORS in Google Cloud Functions:

1. Update your `main.py` to handle CORS:
   ```python
   import functions_framework
   from flask import Request, make_response
   import app

   @functions_framework.http
   def handler(request: Request):
       """HTTP Cloud Function with CORS."""
       # Handle OPTIONS request (preflight)
       if request.method == 'OPTIONS':
           headers = {
               'Access-Control-Allow-Origin': '*',
               'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
               'Access-Control-Allow-Headers': 'Content-Type, Authorization',
               'Access-Control-Max-Age': '3600'
           }
           return ('', 204, headers)
       
       # Handle the actual request
       resp = app.app(request.environ, lambda x, y: [])
       
       # Add CORS headers to the response
       headers = dict(resp.headers)
       headers['Access-Control-Allow-Origin'] = '*'
       headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
       headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
       
       return (resp.data, resp.status_code, headers)
   ```

### Setting Up Cloud Scheduler for Regular Job Scraping

To set up scheduled job scraping:

1. Create a separate function for the scheduled task:
   ```python
   # scheduled_job.py
   import functions_framework
   from handlers.job_scraper import run_scheduled_scraping

   @functions_framework.cloud_event
   def scheduled_scraping(cloud_event):
       """Function triggered by Cloud Scheduler."""
       run_scheduled_scraping()
       return "Scheduled job scraping completed successfully."
   ```

2. Deploy the scheduled function:
   ```bash
   gcloud functions deploy scheduled-job-scraping \
     --runtime python310 \
     --trigger-topic job-scraping-schedule \
     --entry-point scheduled_scraping \
     --memory 1024MB \
     --timeout 300s \
     --region us-central1 \
     --set-env-vars SUPABASE_URL=your-supabase-url,SUPABASE_ANON_KEY=your-anon-key,SUPABASE_SERVICE_ROLE_KEY=your-service-role-key,FIRECRAWL_API_KEY=your-firecrawl-api-key
   ```

3. Create a Cloud Scheduler job:
   ```bash
   gcloud scheduler jobs create pubsub daily-job-scraping \
     --schedule="0 0 * * *" \
     --topic=job-scraping-schedule \
     --message-body="{}" \
     --location=us-central1
   ```

### Monitoring and Logging

Set up monitoring and logging for your Cloud Functions:

1. View logs:
   ```bash
   gcloud functions logs read job-backend
   ```

2. Set up log-based metrics:
   ```bash
   gcloud logging metrics create job-backend-errors \
     --description="Job backend errors" \
     --log-filter="resource.type=cloud_function AND resource.labels.function_name=job-backend AND severity>=ERROR"
   ```

3. Create alerts based on metrics:
   ```bash
   gcloud alpha monitoring policies create \
     --display-name="Job Backend Error Alert" \
     --conditions="metric.type=logging.googleapis.com/user/job-backend-errors resource.type=cloud_function resource.label.function_name=job-backend threshold.value=1 threshold.comparison=COMPARISON_GT" \
     --notification-channels=YOUR_NOTIFICATION_CHANNEL_ID
   ```
