
# Deploying the Python Backend to AWS Lambda

This guide provides instructions on how to deploy the Python backend to AWS Lambda using AWS SAM (Serverless Application Model).

## Prerequisites

1. Install AWS CLI: [AWS CLI Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
2. Install AWS SAM CLI: [AWS SAM CLI Installation Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
3. Configure AWS CLI with your credentials: `aws configure`

## API Keys and Environment Variables

Ensure you have these API keys ready for the deployment:

1. Supabase credentials (URL and service role key)
2. Firecrawl API key (for job scraping)
3. Anthropic API key (for Claude AI model)

## Deployment Steps

### 1. Create a SAM Template

Create a file named `template.yaml` in the `python_backend` directory:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: Job Scraper and Resume Parser Backend

Globals:
  Function:
    Timeout: 60
    MemorySize: 1024
    Environment:
      Variables:
        SUPABASE_URL: ${SUPABASE_URL}
        SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
        SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
        JWT_SECRET: ${JWT_SECRET}
        FIRECRAWL_API_KEY: ${FIRECRAWL_API_KEY}
        ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
        FLASK_DEBUG: false

Resources:
  ApiGatewayApi:
    Type: AWS::Serverless::Api
    Properties:
      StageName: prod
      BinaryMediaTypes:
        - multipart/form-data
        - application/pdf
        - application/vnd.openxmlformats-officedocument.wordprocessingml.document

  JobBackendFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: ./
      Handler: aws_lambda.handler
      Runtime: python3.10
      Events:
        ApiEvent:
          Type: Api
          Properties:
            RestApiId: !Ref ApiGatewayApi
            Path: /{proxy+}
            Method: ANY

Outputs:
  ApiUrl:
    Description: "API Gateway endpoint URL"
    Value: !Sub "https://${ApiGatewayApi}.execute-api.${AWS::Region}.amazonaws.com/prod/"
  LambdaFunction:
    Description: "Lambda Function ARN"
    Value: !GetAtt JobBackendFunction.Arn
```

### 2. Create the Lambda Handler

Create a file named `aws_lambda.py` in the `python_backend` directory:

```python
import app
import awsgi
import nltk

# Download necessary NLTK data
nltk.download('punkt')

def handler(event, context):
    """
    AWS Lambda handler function.
    This function is invoked by AWS Lambda and forwards requests to the Flask app.
    """
    return awsgi.response(app.app, event, context)
```

### 3. Update the Requirements

Add required packages to your `requirements.txt`:

```
aws-wsgi==0.2.7
```

### 4. Create a Deployment Package

1. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Build the SAM application:
   ```bash
   sam build
   ```

### 5. Deploy to AWS

1. Create a file named `samconfig.toml` with your configuration:
   ```toml
   version = 0.1
   [default]
   [default.deploy]
   [default.deploy.parameters]
   stack_name = "job-backend"
   s3_bucket = "your-deployment-bucket"
   s3_prefix = "job-backend"
   region = "us-east-1"
   confirm_changeset = true
   capabilities = "CAPABILITY_IAM"
   parameter_overrides = "SUPABASE_URL=your-supabase-url SUPABASE_ANON_KEY=your-anon-key SUPABASE_SERVICE_ROLE_KEY=your-service-role-key JWT_SECRET=your-jwt-secret FIRECRAWL_API_KEY=your-firecrawl-api-key ANTHROPIC_API_KEY=your-anthropic-api-key"
   ```

2. Deploy the application:
   ```bash
   sam deploy --guided
   ```

   Follow the prompts to set up your deployment. You'll need to provide:
   - Stack name
   - AWS Region
   - Parameter values for environment variables
   - Confirmation of IAM role creation

### 6. Update the Frontend

After deployment, update your frontend to use the new API URL:

1. Log in to your application
2. Navigate to Settings > Python Backend
3. Enter the API Gateway URL (from the deployment output)
4. Test the connection to verify it's working

## Additional Configuration

### Adding Layers for Large Dependencies

For large dependencies like Claude, scikit-learn, and NLTK, use Lambda Layers:

1. Create a layer for large dependencies:
   ```bash
   mkdir -p layer/python
   pip install anthropic nltk scikit-learn pandas -t layer/python
   ```

2. Update your `template.yaml` to include the layer:
   ```yaml
   Resources:
     JobDependenciesLayer:
       Type: AWS::Serverless::LayerVersion
       Properties:
         ContentUri: layer/
         CompatibleRuntimes:
           - python3.10
     
     JobBackendFunction:
       Type: AWS::Serverless::Function
       Properties:
         # Other properties...
         Layers:
           - !Ref JobDependenciesLayer
   ```

### Setting Up Cloud Watch Alarms for API Usage

To monitor Claude API usage:

1. Set up CloudWatch Log Metric Filters to track Claude API calls:
   ```yaml
   ClaudeApiMetricFilter:
     Type: AWS::Logs::MetricFilter
     Properties:
       LogGroupName: !Ref JobBackendLogGroup
       FilterPattern: "[timestamp, level, message, component=Claude, event=API_CALL]"
       MetricTransformations:
         - MetricNamespace: "JobBackend"
           MetricName: "ClaudeApiCalls"
           MetricValue: "1"
   ```

2. Create a CloudWatch Alarm for excessive usage:
   ```yaml
   ClaudeApiUsageAlarm:
     Type: AWS::CloudWatch::Alarm
     Properties:
       AlarmName: "ExcessiveClaudeAPIUsage"
       AlarmDescription: "Alert when Claude API usage exceeds threshold"
       Namespace: "JobBackend"
       MetricName: "ClaudeApiCalls"
       Statistic: "Sum"
       Period: 3600
       EvaluationPeriods: 1
       Threshold: 100
       ComparisonOperator: "GreaterThanThreshold"
       AlarmActions:
         - !Ref AlertTopic
   ```

### Schedule Regular Job Scraping

To set up scheduled job scraping:

1. Add a new Lambda function in your `template.yaml`:
   ```yaml
   ScheduledScraperFunction:
     Type: AWS::Serverless::Function
     Properties:
       CodeUri: ./
       Handler: scheduled_jobs.handler
       Runtime: python3.10
       Events:
         ScheduledEvent:
           Type: Schedule
           Properties:
             Schedule: rate(1 day)
             Name: DailyJobScraping
             Description: Run job scraping once per day
   ```

2. Create a `scheduled_jobs.py` file to handle the scheduled events
