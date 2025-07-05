#!/bin/bash

# E-learning System Deployment Script
set -e

# Configuration
PROJECT_NAME="elearning-system"
AWS_REGION="ap-northeast-1"
ECS_CLUSTER="${PROJECT_NAME}-cluster"
ECS_SERVICE="${PROJECT_NAME}-service"

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
    
    # Set ECR repository URLs after getting account ID
    ECR_REPOSITORY_BACKEND="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}-backend"
    ECR_REPOSITORY_FRONTEND="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}-frontend"
}

# Create ECR repositories
create_ecr_repositories() {
    print_status "Creating ECR repositories..."
    
    aws ecr describe-repositories --repository-names "${PROJECT_NAME}-backend" --region ${AWS_REGION} > /dev/null 2>&1 || \
    aws ecr create-repository --repository-name "${PROJECT_NAME}-backend" --region ${AWS_REGION}
    
    aws ecr describe-repositories --repository-names "${PROJECT_NAME}-frontend" --region ${AWS_REGION} > /dev/null 2>&1 || \
    aws ecr create-repository --repository-name "${PROJECT_NAME}-frontend" --region ${AWS_REGION}
}

# Build and push Docker images
build_and_push_images() {
    print_status "Building and pushing Docker images..."
    
    # Login to ECR
    aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
    
    # Build and push backend
    print_status "Building backend image..."
    docker build --platform linux/amd64 -f ../backend/Dockerfile.prod -t ${ECR_REPOSITORY_BACKEND}:latest ../backend/
    docker push ${ECR_REPOSITORY_BACKEND}:latest
    
    # Build and push frontend
    print_status "Building frontend image..."
    docker build --platform linux/amd64 --build-arg REACT_APP_API_URL=https://your-domain.com -f ../frontend/Dockerfile.prod -t ${ECR_REPOSITORY_FRONTEND}:latest ../frontend/
    docker push ${ECR_REPOSITORY_FRONTEND}:latest
}

# Create CloudFormation parameters file
create_parameters_file() {
    cat > /tmp/cf-parameters.json << EOF
[
    {
        "ParameterKey": "ProjectName",
        "ParameterValue": "${PROJECT_NAME}"
    },
    {
        "ParameterKey": "Environment",
        "ParameterValue": "production"
    },
    {
        "ParameterKey": "DBUsername",
        "ParameterValue": "${DB_USERNAME:-elearning_admin}"
    },
    {
        "ParameterKey": "DBPassword",
        "ParameterValue": "${DB_PASSWORD}"
    },
    {
        "ParameterKey": "DBName",
        "ParameterValue": "${DB_NAME:-elearning_db}"
    },
    {
        "ParameterKey": "DjangoSecretKey",
        "ParameterValue": "${DJANGO_SECRET_KEY}"
    },
    {
        "ParameterKey": "RedisPassword",
        "ParameterValue": "${REDIS_PASSWORD}"
    },
    {
        "ParameterKey": "AllowedHosts",
        "ParameterValue": "${ALLOWED_HOSTS:-*}"
    }
]
EOF
}

# Deploy infrastructure
deploy_infrastructure() {
    print_status "Deploying infrastructure with CloudFormation..."
    
    # Create parameters file
    create_parameters_file
    
    # Check if stack exists
    if aws cloudformation describe-stacks --stack-name ${PROJECT_NAME}-infrastructure --region ${AWS_REGION} > /dev/null 2>&1; then
        print_status "Updating existing stack..."
        aws cloudformation update-stack \
            --stack-name ${PROJECT_NAME}-infrastructure \
            --template-body file://cloudformation-infrastructure.yml \
            --parameters file:///tmp/cf-parameters.json \
            --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
            --region ${AWS_REGION}
    else
        print_status "Creating new stack..."
        aws cloudformation create-stack \
            --stack-name ${PROJECT_NAME}-infrastructure \
            --template-body file://cloudformation-infrastructure.yml \
            --parameters file:///tmp/cf-parameters.json \
            --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
            --region ${AWS_REGION}
    fi
    
    print_status "Waiting for stack deployment to complete..."
    aws cloudformation wait stack-create-complete --stack-name ${PROJECT_NAME}-infrastructure --region ${AWS_REGION} || \
    aws cloudformation wait stack-update-complete --stack-name ${PROJECT_NAME}-infrastructure --region ${AWS_REGION}
}

# Update ECS task definition
update_task_definition() {
    print_status "Updating ECS task definition..."
    
    # Replace placeholders in task definition
    sed -e "s/YOUR_ACCOUNT_ID/${AWS_ACCOUNT_ID}/g" \
        -e "s/YOUR_ECR_REPO/${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/g" \
        aws-ecs-task-definition.json > /tmp/task-definition.json
    
    # Register task definition
    aws ecs register-task-definition \
        --cli-input-json file:///tmp/task-definition.json \
        --region ${AWS_REGION}
}

# Deploy ECS service
deploy_ecs_service() {
    print_status "Deploying ECS service..."
    
    # Get network configuration from CloudFormation
    SUBNET_ID1=$(aws cloudformation describe-stack-resources \
        --stack-name ${PROJECT_NAME}-infrastructure \
        --region ${AWS_REGION} \
        --query 'StackResources[?LogicalResourceId==`PublicSubnet1`].PhysicalResourceId' \
        --output text)
    
    SUBNET_ID2=$(aws cloudformation describe-stack-resources \
        --stack-name ${PROJECT_NAME}-infrastructure \
        --region ${AWS_REGION} \
        --query 'StackResources[?LogicalResourceId==`PublicSubnet2`].PhysicalResourceId' \
        --output text)
    
    SECURITY_GROUP_ID=$(aws cloudformation describe-stack-resources \
        --stack-name ${PROJECT_NAME}-infrastructure \
        --region ${AWS_REGION} \
        --query 'StackResources[?LogicalResourceId==`ECSSecurityGroup`].PhysicalResourceId' \
        --output text)
    
    # Get target group ARNs
    BACKEND_TARGET_GROUP_ARN=$(aws cloudformation describe-stack-resources \
        --stack-name ${PROJECT_NAME}-infrastructure \
        --region ${AWS_REGION} \
        --query 'StackResources[?LogicalResourceId==`BackendTargetGroup`].PhysicalResourceId' \
        --output text)
    
    FRONTEND_TARGET_GROUP_ARN=$(aws cloudformation describe-stack-resources \
        --stack-name ${PROJECT_NAME}-infrastructure \
        --region ${AWS_REGION} \
        --query 'StackResources[?LogicalResourceId==`FrontendTargetGroup`].PhysicalResourceId' \
        --output text)
    
    # Update service or create if it doesn't exist
    aws ecs update-service \
        --cluster ${ECS_CLUSTER} \
        --service ${ECS_SERVICE} \
        --task-definition ${PROJECT_NAME} \
        --region ${AWS_REGION} || \
    # Create service if it doesn't exist
    aws ecs create-service \
        --cluster ${ECS_CLUSTER} \
        --service-name ${ECS_SERVICE} \
        --task-definition ${PROJECT_NAME} \
        --desired-count 1 \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_ID1},${SUBNET_ID2}],securityGroups=[${SECURITY_GROUP_ID}],assignPublicIp=ENABLED}" \
        --load-balancers "[{\"targetGroupArn\":\"${BACKEND_TARGET_GROUP_ARN}\",\"containerName\":\"backend\",\"containerPort\":8000},{\"targetGroupArn\":\"${FRONTEND_TARGET_GROUP_ARN}\",\"containerName\":\"frontend\",\"containerPort\":80}]" \
        --region ${AWS_REGION}
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # This would typically be done via ECS task or CI/CD pipeline
    print_warning "Database migrations should be run manually or via CI/CD pipeline"
    print_warning "Run: python manage.py migrate"
}

# Check required tools
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is required but not installed"
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker Desktop"
        exit 1
    fi
    
    print_status "All prerequisites are met"
}

# Load environment variables from .env.production if it exists
load_env_file() {
    if [[ -f "../.env.production" ]]; then
        print_status "Loading environment variables from .env.production"
        set -a
        source ../.env.production
        set +a
    elif [[ -f ".env.production" ]]; then
        print_status "Loading environment variables from .env.production"
        set -a
        source .env.production
        set +a
    fi
}

# Main deployment function
main() {
    print_status "Starting deployment of ${PROJECT_NAME}..."
    
    # Load environment variables
    load_env_file
    
    # Check for required environment variables
    if [[ -z "${DB_PASSWORD}" ]]; then
        print_error "DB_PASSWORD is required"
        print_error "Please set it in .env.production or as an environment variable"
        print_error "Example: DB_PASSWORD=your-password ./deploy/deploy.sh"
        exit 1
    fi
    
    check_prerequisites
    check_aws_cli
    create_ecr_repositories
    build_and_push_images
    deploy_infrastructure
    update_task_definition
    deploy_ecs_service
    run_migrations
    
    print_status "Deployment completed successfully!"
    print_status "Check AWS Console for service status and load balancer DNS"
}

# Run deployment
main "$@"