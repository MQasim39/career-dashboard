
FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install NLTK data
RUN python -m nltk.downloader punkt

# Copy application code
COPY . .

# Run gunicorn server
CMD gunicorn --bind 0.0.0.0:${PORT:-5000} app:app

