
# Deploying the Python Backend to Google Cloud Functions

This guide provides instructions on how to deploy the Python backend to Google Cloud Functions with Claude AI integration.

## Prerequisites

1. Install Google Cloud SDK: [Google Cloud SDK Installation Guide](https://cloud.google.com/sdk/docs/install)
2. Initialize the SDK: `gcloud init`
3. Authenticate with Google Cloud: `gcloud auth login`
4. Set your project: `gcloud config set project YOUR_PROJECT_ID`

## API Keys and Environment Variables

Ensure you have these API keys ready for the deployment:

1. Supabase credentials (URL and service role key)
2. Firecrawl API key (for job scraping)
3. Anthropic API key (for Claude AI model)

## Deployment Steps

### 1. Create Cloud Function Entry Point

Create a file named `main.py` in the `python_backend` directory:

```python
import functions_framework
from flask import Request
import app
import nltk

# Download necessary NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

@functions_framework.http
def handler(request: Request):
    """
    HTTP Cloud Function entry point.
    This function is invoked by Google Cloud Functions and forwards requests to the Flask app.
    """
    return app.app(request.environ, lambda x, y: [])
```

### 2. Update Dependencies

Ensure your `requirements.txt` includes all necessary packages:

```
functions-framework==3.3.0
anthropic==0.9.0
langchain==0.0.335
langchain_community==0.0.16
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
  --gen2 \
  --runtime python310 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point handler \
  --memory 512MB \
  --timeout 300s \
  --region us-central1 \
  --set-env-vars SUPABASE_URL=your-supabase-url,SUPABASE_ANON_KEY=your-anon-key,SUPABASE_SERVICE_ROLE_KEY=your-service-role-key,JWT_SECRET=your-jwt-secret,FIRECRAWL_API_KEY=your-firecrawl-api-key,ANTHROPIC_API_KEY=your-anthropic-api-key
```

Note: We're using `--gen2` for the newer Cloud Functions runtime which supports more memory and longer timeouts, needed for AI processing.

### 5. Or Deploy to Cloud Run (Recommended for Production)

For better performance and scalability, deploy to Cloud Run:

1. Create a Dockerfile (already provided in the codebase)

2. Build and push the container:
   ```bash
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/job-backend
   ```

3. Deploy to Cloud Run:
   ```bash
   gcloud run deploy job-backend \
     --image gcr.io/YOUR_PROJECT_ID/job-backend \
     --platform managed \
     --allow-unauthenticated \
     --memory 1Gi \
     --cpu 1 \
     --region us-central1 \
     --set-env-vars SUPABASE_URL=your-supabase-url,SUPABASE_ANON_KEY=your-anon-key,SUPABASE_SERVICE_ROLE_KEY=your-service-role-key,JWT_SECRET=your-jwt-secret,FIRECRAWL_API_KEY=your-firecrawl-api-key,ANTHROPIC_API_KEY=your-anthropic-api-key
   ```

### 6. Update the Frontend

After deployment, update your frontend to use the new API URL:

1. Log in to your application
2. Navigate to Settings > Python Backend
3. Enter the Cloud Function or Cloud Run URL
4. Test the connection to verify it's working

## Additional Configuration

### Setting Up CORS

To enable CORS in Google Cloud Functions:

1. Update your `main.py` to handle CORS:
   ```python
   import functions_framework
   from flask import Request, make_response
   import app
   import nltk

   # Download necessary NLTK data
   try:
       nltk.data.find('tokenizers/punkt')
   except LookupError:
       nltk.download('punkt')

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

### Setting Up Monitoring for Claude API Usage

1. Create a custom metric for Claude API calls:
   ```bash
   gcloud logging metrics create claude-api-calls \
     --description="Claude API calls" \
     --log-filter="resource.type=cloud_function AND resource.labels.function_name=job-backend AND textPayload:\"Claude API call\""
   ```

2. Set up an alert policy:
   ```bash
   gcloud alpha monitoring policies create \
     --display-name="Excessive Claude API Usage" \
     --condition-filter="metric.type=\"logging.googleapis.com/user/claude-api-calls\" resource.type=\"cloud_function\" resource.label.function_name=\"job-backend\"" \
     --condition-threshold-value=100 \
     --condition-threshold-comparison=COMPARISON_GT \
     --condition-aggregations-per-series-aligner=ALIGN_RATE \
     --condition-aggregations-alignment-period=3600s \
     --notification-channels=YOUR_NOTIFICATION_CHANNEL_ID
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
     --gen2 \
     --runtime python310 \
     --trigger-topic job-scraping-schedule \
     --entry-point scheduled_scraping \
     --memory 512MB \
     --timeout 300s \
     --region us-central1 \
     --set-env-vars SUPABASE_URL=your-supabase-url,SUPABASE_ANON_KEY=your-anon-key,SUPABASE_SERVICE_ROLE_KEY=your-service-role-key,FIRECRAWL_API_KEY=your-firecrawl-api-key,ANTHROPIC_API_KEY=your-anthropic-api-key
   ```

3. Create a Cloud Scheduler job:
   ```bash
   gcloud scheduler jobs create pubsub daily-job-scraping \
     --schedule="0 0 * * *" \
     --topic=job-scraping-schedule \
     --message-body="{}" \
     --location=us-central1
   ```

### Scaling and Performance Considerations

When using Claude AI in production, consider:

1. Set up autoscaling for Cloud Run:
   ```bash
   gcloud run services update job-backend \
     --min-instances=1 \
     --max-instances=10 \
     --concurrency=50
   ```

2. Implement caching to reduce API calls (already implemented in the `claude_client.py` file)

3. Set up Cloud CDN if serving processed data frequently:
   ```bash
   gcloud compute backend-services create job-backend-cdn \
     --protocol=HTTP \
     --cache-mode=CACHE_ALL_STATIC \
     --cdn-policy-cache-mode=CACHE_ALL_STATIC
   ```

4. Use separate service accounts with minimal permissions:
   ```bash
   gcloud iam service-accounts create job-backend-sa \
     --display-name="Job Backend Service Account"
   
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:job-backend-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/cloudfunctions.invoker"
   ```
