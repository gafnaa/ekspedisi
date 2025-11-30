# Deployment Guide: Ekspedisi to AWS Learner Lab

This guide will walk you through deploying your Next.js application to the AWS Learner Lab using **Elastic Beanstalk** (for the app) and **Amazon RDS** (for the database).

> [!IMPORTANT]
> **Prerequisites**: Ensure you have started your Lab Session and have access to the AWS Console.

## Step 1: Prepare Your Code
1.  **Zip your project**:
    - Select all files in your project folder (`ekspedisi`).
    - **Exclude** `node_modules` and `.next` folders if possible (to keep the file small), but it's critical to include `package.json`, `package-lock.json`, `prisma`, `app`, `public`, `next.config.ts`, etc.
    - Create a zip file (e.g., `ekspedisi-deploy.zip`).

## Step 2: Create the Database (Amazon RDS)
1.  Go to the **AWS Console** and search for **RDS**.
2.  Click **Create database**.
3.  **Choose a database creation method**: Standard create.
4.  **Engine options**: PostgreSQL.
5.  **Templates**: Free tier (or Dev/Test if Free tier isn't an option, but keep it small).
6.  **Settings**:
    - **DB instance identifier**: `ekspedisi-db`
    - **Master username**: `postgres`
    - **Master password**: Create a strong password (e.g., `Ekspedisi2024!`). **Write this down!**
7.  **Instance configuration**: `db.t3.micro` (or `db.t4g.micro` if available/cheaper).
8.  **Storage**: 20 GiB (General Purpose SSD gp2 or gp3).
9.  **Connectivity**:
    - **Compute resource**: Don't connect to an EC2 compute resource.
    - **Public access**: **Yes** (This makes it easier to connect from your local machine for debugging, though strictly for production "No" is better. For this lab, "Yes" is fine).
    - **VPC security group**: Create new. Name: `rds-launch-wizard`.
10. Click **Create database**.
11. **Wait**: It will take 5-10 minutes to create.
12. **Get Endpoint**: Once created, click the database name. Copy the **Endpoint** (e.g., `ekspedisi-db.cw...us-east-1.rds.amazonaws.com`).

## Step 3: Create the Application (Elastic Beanstalk)
1.  Go to the **AWS Console** and search for **Elastic Beanstalk**.
2.  Click **Create Application**.
3.  **Application Name**: `ekspedisi-app`.
4.  **Platform**:
    - **Platform**: Node.js
    - **Platform branch**: Node.js 20 running on 64bit Amazon Linux 2023
    - **Platform version**: Recommended (latest)
5.  **Application code**:
    - Choose **Upload your code**.
    - **Local file**: Choose the `ekspedisi-deploy.zip` file you created in Step 1.
    - **Version label**: `v1`
6.  **Presets**: Single instance (free tier eligible).
7.  Click **Next**.

## Step 4: Configure Service Access
1.  **Service role**: Select `Use an existing service role`.
    - Choose `LabRole` (This is provided by the Learner Lab).
2.  **EC2 key pair**: Select `vockey` (This allows you to SSH if needed).
3.  **EC2 instance profile**: Select `LabInstanceProfile` (Provided by Learner Lab).
4.  Click **Next**.

## Step 5: Configure Networking & Database
1.  **Virtual Private Cloud (VPC)**: Select the default VPC.
2.  **Instance subnets**: Select `us-east-1a` (or any available).
3.  **Database**: **Disable** (We already created one in RDS separately to have more control).
4.  Click **Next**.

## Step 6: Configure Instance Traffic and Scaling
1.  **Root volume type**: General Purpose (SSD).
2.  **Size**: 10 GB.
3.  **Capacity**:
    - **Environment type**: Single instance.
    - **Instances**: Min 1, Max 1.
4.  Click **Next**.

## Step 7: Configure Updates, Monitoring, and Logging
1.  **Environment properties** (Scroll down to the bottom):
    - This is where we set Environment Variables. Click **Add environment property**.
    - Add the following:
        - `DATABASE_URL`: `postgresql://postgres:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/postgres`
          - Replace `YOUR_PASSWORD` with the password you set in Step 2.
          - Replace `YOUR_RDS_ENDPOINT` with the endpoint from Step 2.
        - `NEXTAUTH_SECRET`: `supersecretkey123` (Change this to a random string).
        - `NEXTAUTH_URL`: Leave blank for now, or set to `http://localhost:3000` (we will update this after deployment).
        - `NODE_ENV`: `production`
2.  Click **Next**.

## Step 8: Review and Submit
1.  Review all settings.
2.  Click **Submit**.
3.  **Wait**: Elastic Beanstalk will take 5-10 minutes to provision the environment.
4.  **Success**: Once the health is "Green", click the **Domain** link (e.g., `ekspedisi-app.env.eba-xyz.us-east-1.elasticbeanstalk.com`) to view your app!

## Troubleshooting
- **502 Bad Gateway**: This usually means the app failed to start.
    - Go to **Logs** -> **Request Last 100 Lines**.
    - Check for errors like "Connection refused" (Database issue) or "Command not found".
- **Database Connection Error**:
    - Go to **RDS** -> **Databases** -> Click your DB.
    - Click the **VPC security groups** link (active).
    - Click **Edit inbound rules**.
    - Add Rule: Type `PostgreSQL`, Source `Anywhere-IPv4` (0.0.0.0/0) - *For testing only*.
    - Or better: Find the Security Group ID of your Elastic Beanstalk instance and allow that.
