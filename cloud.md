gcloud projects create lighter-cloud-bot --name="Lighter Cloud Bot"
gcloud config set project lighter-cloud-bot

gcloud services enable \
compute.googleapis.com \
artifactregistry.googleapis.com \
iam.googleapis.com \
dns.googleapis.com \
cloudresourcemanager.googleapis.com

gcloud compute networks create prod-vpc \
--subnet-mode=custom

gcloud compute networks subnets create prod-public-us \
  --network=prod-vpc \
  --region=us-south1 \
  --range=10.10.1.0/24

gcloud compute networks subnets create prod-private-us \
  --network=prod-vpc \
  --region=us-south1 \
  --range=10.10.2.0/24


# HTTP/HTTPS
gcloud compute firewall-rules create allow-http-https \
  --network=prod-vpc \
  --allow=tcp:80,tcp:443 \
  --source-ranges=0.0.0.0/0

# SSH (replace YOUR_IP/32)
gcloud compute firewall-rules create allow-ssh-from-home \
  --network=prod-vpc \
  --allow=tcp:22 \
  --source-ranges=YOUR_IP/32

gcloud iam service-accounts create app-vm-sa \
  --display-name="App VM Service Account"

gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member="serviceAccount:app-vm-sa@$(gcloud config get-value project).iam.gserviceaccount.com" \
  --role="roles/logging.logWriter"

gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member="serviceAccount:app-vm-sa@$(gcloud config get-value project).iam.gserviceaccount.com" \
  --role="roles/monitoring.metricWriter"

gcloud iam service-accounts create github-ci-sa \
  --display-name="GitHub CI Service Account"

  PROJECT=$(gcloud config get-value project)

gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:github-ci-sa@$PROJECT.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.admin"

gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:github-ci-sa@$PROJECT.iam.gserviceaccount.com" \
  --role="roles/compute.admin"

gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:github-ci-sa@$PROJECT.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud iam service-accounts keys create github-ci-key.json \
  --iam-account=github-ci-sa@$PROJECT.iam.gserviceaccount.com 

gcloud artifacts repositories create lighter-repo \
  --repository-format=docker \
  --location=us \
  --description="Docker images for lighter-cloud-bot"

gcloud compute addresses create app-ip \
  --region=gcloud compute addresses create app-ip \
  --region=us-south1

gcloud compute instances create app-vm-1 \
  --zone=us-south1-a \
  --machine-type=e2-medium \
  --network=prod-vpc \
  --subnet=prod-public-us \
  --address=app-ip \
  --service-account=app-vm-sa@$PROJECT.iam.gserviceaccount.com \
  --scopes=https://www.googleapis.com/auth/cloud-platform \
  --tags=http-server,https-server \
  --metadata=startup-script='#!/bin/bash
  apt-get update
  apt-get install -y ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian bookworm stable" > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io
  systemctl enable docker
  '