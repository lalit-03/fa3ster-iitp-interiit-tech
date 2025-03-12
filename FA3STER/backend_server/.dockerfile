# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /backend

# Copy the current directory contents into the container at /app
COPY . /backend

# Install any needed packages specified in requirements_mac.txt
RUN pip install --no-cache-dir -r requirements_mac.txt

# # Copy the environment variables from .env file
# COPY .env .env

# Expose the ports
EXPOSE 7770
EXPOSE 7771

# Run the two Python files
CMD ["sh", "-c", "streamlit run graph.py & python3 graph_websockets.py"]