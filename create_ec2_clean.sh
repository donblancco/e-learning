#!/bin/bash

# Script to create EC2 instance for elearning RDS setup

# Variables
VPC_ID="vpc-YOUR_VPC_ID"
SUBNET_ID="subnet-YOUR_SUBNET_ID"
INSTANCE_NAME="elearning-rds-setup"
INSTANCE_TYPE="t2.micro"
REGION="ap-northeast-1"  # Tokyo region

echo "Creating EC2 instance for elearning RDS setup..."

# Get the latest Amazon Linux 2 AMI ID
echo "Getting latest Amazon Linux 2 AMI ID..."
AMI_ID=$(aws ec2 describe-images \
    --owners amazon \
    --filters \
        "Name=name,Values=amzn2-ami-hvm-*-x86_64-gp2" \
        "Name=state,Values=available" \
    --query 'Images | sort_by(@, &CreationDate) | [-1].ImageId' \
    --output text \
    --region $REGION)

echo "Found AMI ID: $AMI_ID"

# Use existing security group or create new one
SG_ID="sg-YOUR_SECURITY_GROUP_ID"
echo "Using security group: $SG_ID"

# Use existing IAM instance profile
INSTANCE_PROFILE_NAME="elearning-ec2-ssm-profile"
echo "Using IAM instance profile: $INSTANCE_PROFILE_NAME"

# Create EC2 instance
echo "Creating EC2 instance..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --instance-type $INSTANCE_TYPE \
    --subnet-id $SUBNET_ID \
    --security-group-ids $SG_ID \
    --iam-instance-profile Name=$INSTANCE_PROFILE_NAME \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME}]" \
    --region $REGION \
    --query 'Instances[0].InstanceId' \
    --output text)

if [ -z "$INSTANCE_ID" ] || [ "$INSTANCE_ID" == "None" ]; then
    echo "Error: Failed to create instance"
    exit 1
fi

echo "Instance created with ID: $INSTANCE_ID"

# Wait for instance to be running
echo "Waiting for instance to be running..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $REGION

# Get instance details
INSTANCE_INFO=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --region $REGION \
    --query 'Reservations[0].Instances[0]' \
    --output json)

PUBLIC_IP=$(echo $INSTANCE_INFO | jq -r '.PublicIpAddress // "N/A"')
PRIVATE_IP=$(echo $INSTANCE_INFO | jq -r '.PrivateIpAddress')
STATE=$(echo $INSTANCE_INFO | jq -r '.State.Name')

echo ""
echo "========================================="
echo "EC2 Instance Created Successfully!"
echo "========================================="
echo "Instance ID: $INSTANCE_ID"
echo "Instance Name: $INSTANCE_NAME"
echo "Instance Type: $INSTANCE_TYPE"
echo "State: $STATE"
echo "Public IP: $PUBLIC_IP"
echo "Private IP: $PRIVATE_IP"
echo "Security Group: $SG_ID"
echo "Subnet: $SUBNET_ID"
echo "VPC: $VPC_ID"
echo ""
echo "To connect using Session Manager:"
echo "aws ssm start-session --target $INSTANCE_ID --region $REGION"
echo ""
echo "Or use the AWS Console:"
echo "https://console.aws.amazon.com/ec2/v2/home?region=$REGION#InstanceDetails:instanceId=$INSTANCE_ID"
echo "========================================="