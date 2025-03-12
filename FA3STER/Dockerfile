# Set up the Python backend
FROM python:3.11-slim AS backend

# Set the working directory for the backend
WORKDIR /app/backend_server

# Install system dependencies for building Python packages
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    gfortran \
    libopenblas-dev \
    liblapack-dev \
    libpango-1.0-0 \
    libharfbuzz0b \
    libpangoft2-1.0-0 \
    libharfbuzz-subset0 \
    && rm -rf /var/lib/apt/lists/*

# Copy backend code and requirements
COPY backend_server/requirements.txt ./
RUN pip install -r requirements.txt

COPY backend_server/requirements2.txt ./
RUN pip install -r requirements2.txt

# Copy the rest of the backend code
COPY backend_server ./
COPY .env ./
COPY backend_server/rag/credentials.json ./

# Expose the backend port
EXPOSE 8011
EXPOSE 7771
EXPOSE 7770
EXPOSE 8501
EXPOSE 8502
EXPOSE 5091
EXPOSE 8156

# Copy the start script
# COPY backend_server/start_services.sh .

# Ensure the script is executable
RUN chmod +x start_service.sh

# Use the script to start the services
CMD ["./start_service.sh"]
