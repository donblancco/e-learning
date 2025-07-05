#!/bin/bash

# Script to create EC2 instance for elearning RDS setup

# Variables
VPC_ID="vpc-YOUR_VPC_ID"
SUBNET_ID="subnet-YOUR_SUBNET_ID"
INSTANCE_NAME="elearning-rds-setup"
INSTANCE_TYPE="t2.micro"
REGION="ap-northeast-1"  # Tokyo region (adjust if needed)

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

# Create or get security group
echo "Creating security group..."
SG_NAME="elearning-rds-setup-sg"
SG_DESCRIPTION="Security group for elearning RDS setup EC2 instance"

# Check if security group already exists
SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=$SG_NAME" "Name=vpc-id,Values=$VPC_ID" \
    --query 'SecurityGroups[0].GroupId' \
    --output text \
    --region $REGION 2>/dev/null)

if [ "$SG_ID" == "None" ] || [ -z "$SG_ID" ]; then
    # Create new security group
    SG_ID=$(aws ec2 create-security-group \
        --group-name $SG_NAME \
        --description "$SG_DESCRIPTION" \
        --vpc-id $VPC_ID \
        --region $REGION \
        --query 'GroupId' \
        --output text)
    
    echo "Created security group: $SG_ID"
    
    # Add SSH rule (for Session Manager)
    aws ec2 authorize-security-group-ingress \
        --group-id $SG_ID \
        --protocol tcp \
        --port 22 \
        --cidr 0.0.0.0/0 \
        --region $REGION
    
    echo "Added SSH ingress rule"
    
    # Add MySQL outbound rule (default allows all outbound, but explicitly adding for clarity)
    aws ec2 authorize-security-group-egress \
        --group-id $SG_ID \
        --protocol tcp \
        --port 3306 \
        --cidr 0.0.0.0/0 \
        --region $REGION 2>/dev/null || true
    
    echo "Added MySQL egress rule"
else
    echo "Using existing security group: $SG_ID"
fi

# Create or get IAM role for SSM
echo "Setting up IAM role for Session Manager..."
ROLE_NAME="elearning-ec2-ssm-role"
INSTANCE_PROFILE_NAME="elearning-ec2-ssm-profile"

# Check if role exists
ROLE_EXISTS=$(aws iam get-role --role-name $ROLE_NAME 2>/dev/null || echo "not_exists")

if [ "$ROLE_EXISTS" == "not_exists" ]; then
    # Create trust policy
    cat > trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

    # Create role
    aws iam create-role \
        --role-name $ROLE_NAME \
        --assume-role-policy-document file://trust-policy.json
    
    # Attach SSM policy
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
    
    # Create instance profile
    aws iam create-instance-profile \
        --instance-profile-name $INSTANCE_PROFILE_NAME
    
    # Add role to instance profile
    aws iam add-role-to-instance-profile \
        --instance-profile-name $INSTANCE_PROFILE_NAME \
        --role-name $ROLE_NAME
    
    # Clean up
    rm trust-policy.json
    
    echo "Created IAM role and instance profile"
    
    # Wait for IAM resources to propagate
    echo "Waiting for IAM resources to propagate..."
    sleep 10
else
    echo "Using existing IAM role: $ROLE_NAME"
fi

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

echo "Instance created with ID: $INSTANCE_ID"

# Wait for instance to be running
echo "Waiting for instance to be running..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $REGION

# Get instance details
INSTANCE_INFO=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --region $REGION \
    --query 'Reservations[0].Instances[0].[PublicIpAddress,PrivateIpAddress,State.Name]' \
    --output text)

PUBLIC_IP=$(echo $INSTANCE_INFO | awk '{print $1}')
PRIVATE_IP=$(echo $INSTANCE_INFO | awk '{print $2}')
STATE=$(echo $INSTANCE_INFO | awk '{print $3}')

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