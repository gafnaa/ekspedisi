# Deployment Guide: Ekspedisi to AWS EC2 (Sandbox)

This guide provides step-by-step instructions to deploy the **Ekspedisi** application and its **PostgreSQL** database to a single **AWS EC2** instance using **Docker Compose**. This is the recommended configuration for a Sandbox/Learner Lab environment.

## Prerequisites
- AWS Learner Lab account active.
- SSH Key Pair (`vockey.pem`) downloaded from the AWS Console.

## Step 1: Launch an EC2 Instance
1.  **Go to AWS Console** > **EC2** > **Launch Instances**.
2.  **Name**: `Ekspedisi-Server`.
3.  **OS Image**: **Amazon Linux 2023 AMI** (Free tier eligible).
4.  **Instance Type**: `t3.micro` (or `t2.micro` if `t3` is unavailable).
5.  **Key pair**: Select `vockey`.
6.  **Network settings**:
    - **Allow SSH traffic** from **Anywhere** (0.0.0.0/0) or My IP.
    - **Allow HTTP traffic** from the internet.
    - **Allow HTTPS traffic** from the internet.
7.  **Configure Storage**: 20 GiB gp3 (Default is 8, bump it to 20 for safety).
8.  **Launch Instance**.

## Step 2: Configure Security Group (Open Port 3000)
By default, Next.js runs on port 3000. We need to open this port.
1.  Go to your Instance summary.
2.  Click the **Security** tab -> Click the **Security Group** (e.g., `launch-wizard-1`).
3.  **Edit inbound rules**.
4.  **Add rule**:
    - **Type**: Custom TCP
    - **Port range**: `3000`
    - **Source**: `0.0.0.0/0` (Anywhere)
5.  **Save rules**.

## Step 3: Connect to your Instance
1.  Open your terminal (or Git Bash on Windows).
2.  Navigate to where your `vockey.pem` is located.
3.  Run:
    ```bash
    chmod 400 vockey.pem
    ssh -i "vockey.pem" ec2-user@<YOUR_EC2_PUBLIC_IP>
    ```
    *(Replace `<YOUR_EC2_PUBLIC_IP>` with the actual IP address)*.

## Step 4: Setup the Server
1.  **Clone the repository**:
    ```bash
    git clone <YOUR_GITHUB_REPO_URL> ekspedisi
    cd ekspedisi
    ```
    *(If your repo is private, you may need to use a Personal Access Token or upload the zip file manually).*

2.  **Run the Setup Script**:
    We have created a script to install Docker and Git for you.
    ```bash
    chmod +x script/setup_ec2.sh
    ./script/setup_ec2.sh
    ```

3.  **Log out and Log back in**:
    This is required for Docker permissions to take effect.
    ```bash
    exit
    # Now SSH in again
    ssh -i "vockey.pem" ec2-user@<YOUR_EC2_PUBLIC_IP>
    cd ekspedisi
    ```

## Step 5: Configure Environment Variables
1.  Create a `.env` file in the root directory:
    ```bash
    nano .env
    ```
2.  Paste your environment variables. **Important**: Use the service name `db` as the host for the database.
    ```env
    # Database Configuration
    POSTGRES_USER=postgres
    POSTGRES_PASSWORD=securepassword123
    POSTGRES_DB=buku_ekspedisi
    
    # Connect to the 'db' service defined in docker-compose
    DATABASE_URL="postgresql://postgres:securepassword123@db:5432/buku_ekspedisi?schema=public"
    
    # Next.js Configuration
    NODE_ENV=production
    NEXTAUTH_SECRET=changethistoasupersecretrandomstring
    NEXTAUTH_URL=http://<YOUR_EC2_PUBLIC_IP>:3000

    # Vercel Blob (For Image Uploads)
    BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
    ```
3.  Press `Ctrl+O`, `Enter` to save, and `Ctrl+X` to exit.

## Step 6: Start the Application
1.  Build and start the containers:
    ```bash
    docker-compose up -d --build
    ```
    *(This might take a few minutes to build the Next.js app)*.

2.  **Check Status**:
    ```bash
    docker-compose ps
    ```
    Both `app` and `db` should be `Up`.

3.  **View Logs** (if needed):
    ```bash
    docker-compose logs -f
    ```

## Step 7: Access the Application
Open your browser and visit:
`http://<YOUR_EC2_PUBLIC_IP>:3000`

## Database Management
- The database data is stored in a docker volume `db_data`. It persists even if you stop the containers (`docker-compose down`).
- To reset the database completely: `docker-compose down -v`.

