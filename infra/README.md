# Wind Prediction Infrastructure

This repository contains the complete infrastructure setup for deploying a React application to AWS with a custom domain, SSL certificate, and automated deployments.

## Architecture Overview

```
User Request (https://wind-prediction.live)
    ↓
GoDaddy Nameservers → AWS Route53
    ↓
Route53 A Records → CloudFront Distribution
    ↓
CloudFront (with SSL) → S3 Bucket (Private)
    ↓
React Application Served with HTTPS
```

### Components:
- **Route53**: DNS management and domain resolution
- **ACM Certificate**: SSL/TLS certificate for HTTPS
- **CloudFront**: Global CDN with SSL termination
- **S3 Bucket**: Static website hosting (private bucket)
- **Origin Access Identity (OAI)**: Secure CloudFront → S3 access
- **GitHub Actions**: Automated deployment pipeline

## Two-Stage Deployment Process

This infrastructure uses a **two-stage deployment** approach to handle DNS validation and propagation:

### Stage 1: DNS Setup & Certificate Validation
- Creates Route53 hosted zone (new nameservers)
- Creates SSL certificate with DNS validation
- Creates validation records
- **User Action Required**: Update nameservers in domain registrar

### Stage 2: CloudFront & Production Deployment  
- Creates CloudFront distribution
- Creates Route53 A records pointing to CloudFront
- Creates S3 bucket policy for OAI access
- Website goes live!

## Prerequisites

### Required Tools:
- [Terraform](https://www.terraform.io/downloads.html) (>= 1.0)
- [AWS CLI](https://aws.amazon.com/cli/) configured with credentials
- Domain registered (we use GoDaddy in this example)
- GitHub repository with React app

### AWS Permissions Required:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "route53:*",
        "acm:*",
        "cloudfront:*",
        "s3:*",
        "iam:CreateRole",
        "iam:AttachRolePolicy",
        "iam:GetRole"
      ],
      "Resource": "*"
    }
  ]
}
```

## Configuration

### 1. Update Variables

Edit `variables.tf`:
```hcl
variable "domain_name" {
  type    = string
  default = "your-domain.com"  # Change this!
}

variable "bucket_name" {
  type    = string  
  default = "your-bucket-name"  # Change this!
}

variable "alternate_names" {
  type    = list(string)
  default = ["www.your-domain.com"]  # Change this!
}
```

### 2. GitHub Secrets

Add these secrets to your GitHub repository:
- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key

## Deployment Steps

### Stage 1: DNS Setup

1. **Set Stage 1 mode**:
   ```hcl
   # In variables.tf
   variable "stage2" {
     type    = bool
     default = false  # Stage 1
   }
   ```

2. **Deploy infrastructure**:
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

3. **Get nameservers**:
   ```bash
   terraform output route53_nameservers
   ```

4. **Update domain registrar** (e.g., GoDaddy):
   - Log into your domain registrar
   - Update nameservers to the AWS nameservers from step 3
   - Wait 15 minutes to 2 hours for propagation

5. **Verify propagation**:
   ```bash
   nslookup -type=NS your-domain.com 8.8.8.8
   ```

### Stage 2: Go Live

1. **Set Stage 2 mode**:
   ```hcl
   # In variables.tf  
   variable "stage2" {
     type    = bool
     default = true  # Stage 2
   }
   ```

2. **Deploy final infrastructure**:
   ```bash
   terraform plan
   terraform apply
   ```

3. **Deploy your React app**:
   ```bash
   # Push to uat branch to trigger GitHub Actions
   git checkout uat
   git push origin uat
   
   # OR deploy manually:
   cd ../web
   npm run build
   aws s3 sync build/ s3://your-bucket-name --region ap-southeast-2 --delete
   ```

4. **Test your website**:
   - Visit `https://your-domain.com`
   - Visit `https://www.your-domain.com`
   - Both should show your React app with valid SSL! 🎉

## Automated Deployments

The GitHub Actions workflow (`../.github/workflows/deploy.yml`) automatically:

1. **Triggers** on push to `uat` branch
2. **Builds** React app (`npm run build`)
3. **Deploys** to S3 bucket
4. **Updates** website instantly (CloudFront serves new content)

### Deployment Workflow:
```bash
# Make changes to your React app
git add .
git commit -m "Update website"
git push origin uat  # Triggers automatic deployment
```

## Infrastructure Resources

### Created Resources:
- `aws_route53_zone.main` - DNS hosted zone
- `aws_acm_certificate.cert` - SSL certificate (us-east-1)
- `aws_route53_record.cert_validation` - Certificate validation records
- `aws_cloudfront_distribution.cdn` - CDN distribution  
- `aws_cloudfront_origin_access_identity.oai` - Secure S3 access
- `aws_route53_record.alias_root` - A record for root domain
- `aws_route53_record.alias_www` - A record for www subdomain
- `aws_s3_bucket.site` - Website hosting bucket
- `aws_s3_bucket_policy.bucket_policy` - OAI access policy
- `aws_s3_bucket_public_access_block.block_all_public` - Security policy

### Estimated AWS Costs:
- **Route53**: ~$0.50/month per domain
- **CloudFront**: ~$0.085 per GB + requests
- **S3**: ~$0.023 per GB stored
- **ACM Certificate**: FREE! 
- **Total**: Usually < $5/month for small websites

## 🔍 Troubleshooting

### Common Issues:

#### Website shows 403/404 errors:
```bash
# Check if files are in S3
aws s3 ls s3://your-bucket-name/

# Redeploy if empty
cd ../web && npm run build
aws s3 sync build/ s3://your-bucket-name --delete
```

#### DNS not resolving:
```bash
# Test with different DNS servers
nslookup your-domain.com 8.8.8.8
nslookup your-domain.com 1.1.1.1

# Clear local DNS cache
ipconfig /flushdns  # Windows
sudo dscacheutil -flushcache  # Mac
```

#### SSL certificate issues:
- Certificates are created in `us-east-1` (required for CloudFront)
- Validation can take 5-15 minutes
- Check certificate status in AWS Console

#### CloudFront not updating:
```bash
# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## File Structure

```
infra/
├── main.tf              # Provider configuration
├── variables.tf         # Input variables  
├── route53.tf          # DNS configuration
├── acm.tf              # SSL certificate
├── cloudfront.tf       # CDN configuration
├── s3.tf               # Storage configuration
├── outputs.tf          # Output values
└── README.md           # This file

.github/workflows/
└── deploy.yml          # GitHub Actions deployment
```

## Key Features

- ✅ **Custom Domain**: Professional branding
- ✅ **HTTPS/SSL**: Secure connections  
- ✅ **Global CDN**: Fast loading worldwide
- ✅ **Automated Deployments**: Push to deploy
- ✅ **Infrastructure as Code**: Version controlled infrastructure
- ✅ **Two-stage Setup**: Handles DNS complexity gracefully
- ✅ **Cost Effective**: Serverless architecture
- ✅ **Secure**: Private S3 bucket with OAI access


## 📄 License

This project is licensed under the MIT License.


