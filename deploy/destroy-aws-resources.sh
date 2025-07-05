#!/bin/bash

# E-learning System AWS Resources Cleanup Script
set -e

# Configuration
PROJECT_NAME="elearning-system"
AWS_REGION="ap-northeast-1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if AWS CLI is configured
check_aws_cli() {
    print_status "Checking AWS CLI configuration..."
    if ! aws sts get-caller-identity > /dev/null 2>&1; then
        print_error "AWS CLI is not configured. Please run 'aws configure'"
        exit 1
    fi
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    print_status "AWS Account ID: ${AWS_ACCOUNT_ID}"
}

# Delete ECS Services
delete_ecs_services() {
    print_status "Checking for ECS services..."
    
    # Get all services in the cluster
    SERVICES=$(aws ecs list-services --cluster ${PROJECT_NAME}-cluster --region ${AWS_REGION} --query 'serviceArns[*]' --output text 2>/dev/null || echo "")
    
    if [ -n "$SERVICES" ]; then
        print_status "Found ECS services. Updating desired count to 0..."
        for service in $SERVICES; do
            SERVICE_NAME=$(echo $service | rev | cut -d'/' -f1 | rev)
            print_status "Stopping service: $SERVICE_NAME"
            aws ecs update-service --cluster ${PROJECT_NAME}-cluster --service $SERVICE_NAME --desired-count 0 --region ${AWS_REGION} >/dev/null 2>&1 || true
            
            print_status "Deleting service: $SERVICE_NAME"
            aws ecs delete-service --cluster ${PROJECT_NAME}-cluster --service $SERVICE_NAME --force --region ${AWS_REGION} >/dev/null 2>&1 || true
        done
        
        # Wait for services to be deleted
        print_status "Waiting for services to be deleted..."
        sleep 30
    else
        print_status "No ECS services found"
    fi
}

# Delete ECS Task Definitions
delete_task_definitions() {
    print_status "Deregistering ECS task definitions..."
    
    # Get all task definition families
    TASK_FAMILIES=$(aws ecs list-task-definition-families --family-prefix ${PROJECT_NAME} --region ${AWS_REGION} --query 'families[*]' --output text 2>/dev/null || echo "")
    
    if [ -n "$TASK_FAMILIES" ]; then
        for family in $TASK_FAMILIES; do
            print_status "Deregistering task definitions for family: $family"
            # Get all revisions for this family
            TASK_DEFINITIONS=$(aws ecs list-task-definitions --family-prefix $family --region ${AWS_REGION} --query 'taskDefinitionArns[*]' --output text)
            for task_def in $TASK_DEFINITIONS; do
                aws ecs deregister-task-definition --task-definition $task_def --region ${AWS_REGION} >/dev/null 2>&1 || true
            done
        done
    else
        print_status "No task definitions found"
    fi
}

# Delete ECS Cluster
delete_ecs_cluster() {
    print_status "Deleting ECS cluster..."
    aws ecs delete-cluster --cluster ${PROJECT_NAME}-cluster --region ${AWS_REGION} >/dev/null 2>&1 || true
}

# Delete CloudFormation Stack
delete_cloudformation_stack() {
    print_status "Deleting CloudFormation stack..."
    
    # Check if stack exists
    if aws cloudformation describe-stacks --stack-name ${PROJECT_NAME}-infrastructure --region ${AWS_REGION} >/dev/null 2>&1; then
        # First, we need to remove deletion protection from RDS if it exists
        print_status "Checking for RDS instances with deletion protection..."
        DB_INSTANCE="${PROJECT_NAME}-db"
        if aws rds describe-db-instances --db-instance-identifier $DB_INSTANCE --region ${AWS_REGION} >/dev/null 2>&1; then
            print_status "Removing deletion protection from RDS instance..."
            aws rds modify-db-instance --db-instance-identifier $DB_INSTANCE --no-deletion-protection --apply-immediately --region ${AWS_REGION} >/dev/null 2>&1 || true
            
            # Wait for modification to complete
            print_status "Waiting for RDS modification to complete..."
            aws rds wait db-instance-available --db-instance-identifier $DB_INSTANCE --region ${AWS_REGION} 2>/dev/null || true
        fi
        
        print_status "Deleting CloudFormation stack: ${PROJECT_NAME}-infrastructure"
        aws cloudformation delete-stack --stack-name ${PROJECT_NAME}-infrastructure --region ${AWS_REGION}
        
        print_status "Waiting for stack deletion to complete (this may take several minutes)..."
        aws cloudformation wait stack-delete-complete --stack-name ${PROJECT_NAME}-infrastructure --region ${AWS_REGION} || {
            print_error "Stack deletion failed or timed out. Please check AWS Console for details."
            print_warning "You may need to manually delete some resources."
        }
    else
        print_status "CloudFormation stack not found"
    fi
}

# Delete ECR Repositories
delete_ecr_repositories() {
    print_status "Deleting ECR repositories..."
    
    for repo in "${PROJECT_NAME}-backend" "${PROJECT_NAME}-frontend"; do
        if aws ecr describe-repositories --repository-names $repo --region ${AWS_REGION} >/dev/null 2>&1; then
            print_status "Deleting ECR repository: $repo"
            aws ecr delete-repository --repository-name $repo --force --region ${AWS_REGION} >/dev/null 2>&1 || true
        else
            print_status "ECR repository $repo not found"
        fi
    done
}

# Delete Secrets Manager Secrets
delete_secrets() {
    print_status "Deleting Secrets Manager secrets..."
    
    # List of potential secrets
    SECRETS=(
        "${PROJECT_NAME}/django-secret-key"
        "${PROJECT_NAME}/database-url"
        "${PROJECT_NAME}/redis-url"
        "${PROJECT_NAME}/db-password"
    )
    
    for secret in "${SECRETS[@]}"; do
        if aws secretsmanager describe-secret --secret-id $secret --region ${AWS_REGION} >/dev/null 2>&1; then
            print_status "Deleting secret: $secret"
            # Force delete without recovery window
            aws secretsmanager delete-secret --secret-id $secret --force-delete-without-recovery --region ${AWS_REGION} >/dev/null 2>&1 || true
        fi
    done
}

# Delete S3 Buckets
delete_s3_buckets() {
    print_status "Checking for S3 buckets..."
    
    # Static files bucket
    BUCKET_NAME="${PROJECT_NAME}-static-files-${AWS_ACCOUNT_ID}"
    if aws s3api head-bucket --bucket $BUCKET_NAME 2>/dev/null; then
        print_status "Deleting S3 bucket: $BUCKET_NAME"
        # First, delete all objects in the bucket
        aws s3 rm s3://$BUCKET_NAME --recursive >/dev/null 2>&1 || true
        # Delete all object versions (if versioning is enabled)
        aws s3api delete-objects --bucket $BUCKET_NAME \
            --delete "$(aws s3api list-object-versions --bucket $BUCKET_NAME \
            --query='{Objects: Versions[].{Key:Key,VersionId:VersionId}}')" >/dev/null 2>&1 || true
        # Delete the bucket
        aws s3api delete-bucket --bucket $BUCKET_NAME --region ${AWS_REGION} >/dev/null 2>&1 || true
    fi
}

# Delete CloudWatch Log Groups
delete_log_groups() {
    print_status "Deleting CloudWatch log groups..."
    
    LOG_GROUPS=(
        "/ecs/${PROJECT_NAME}-backend"
        "/ecs/${PROJECT_NAME}-frontend"
    )
    
    for log_group in "${LOG_GROUPS[@]}"; do
        if aws logs describe-log-groups --log-group-name-prefix $log_group --region ${AWS_REGION} --query 'logGroups[0]' >/dev/null 2>&1; then
            print_status "Deleting log group: $log_group"
            aws logs delete-log-group --log-group-name $log_group --region ${AWS_REGION} >/dev/null 2>&1 || true
        fi
    done
}

# Main cleanup function
main() {
    print_warning "This script will delete ALL AWS resources for ${PROJECT_NAME}"
    print_warning "This action is IRREVERSIBLE!"
    read -p "Are you sure you want to continue? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_status "Cleanup cancelled"
        exit 0
    fi
    
    check_aws_cli
    
    print_status "Starting AWS resources cleanup..."
    
    # Delete resources in dependency order
    delete_ecs_services
    delete_task_definitions
    delete_ecs_cluster
    delete_cloudformation_stack
    delete_ecr_repositories
    delete_secrets
    delete_s3_buckets
    delete_log_groups
    
    print_status "AWS resources cleanup completed!"
    print_warning "Some resources may still be terminating. Check AWS Console to confirm."
    print_warning "If you see any errors above, some resources may need to be deleted manually."
}

# Run cleanup
main "$@"