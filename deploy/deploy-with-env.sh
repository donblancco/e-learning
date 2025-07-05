#!/bin/bash

# Deploy with CloudFormation using environment variables
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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Load environment variables from .env.production
load_env_file() {
    if [[ -f "../.env.production" ]]; then
        print_status "Loading environment variables from .env.production"
        export $(cat ../.env.production | grep -v '^#' | grep -v '^$' | xargs)
    elif [[ -f ".env.production" ]]; then
        print_status "Loading environment variables from .env.production"
        export $(cat .env.production | grep -v '^#' | grep -v '^$' | xargs)
    else
        print_error ".env.production file not found"
        print_error "Please copy .env.production.example to .env.production and configure it"
        exit 1
    fi
}

# Deploy CloudFormation stack
deploy_stack() {
    print_status "Deploying CloudFormation stack..."
    
    # Load environment variables
    load_env_file
    
    # Check required variables
    if [[ -z "${DB_PASSWORD}" ]]; then
        print_error "DB_PASSWORD is not set in .env.production"
        exit 1
    fi
    
    # Create or update stack
    aws cloudformation deploy \
        --stack-name ${PROJECT_NAME}-infrastructure \
        --template-file cloudformation-infrastructure.yml \
        --parameter-overrides \
            DBPassword="${DB_PASSWORD}" \
            DBUsername="${DB_USERNAME:-elearning_admin}" \
            DBName="${DB_NAME:-elearning_db}" \
            DjangoSecretKey="${DJANGO_SECRET_KEY}" \
            RedisPassword="${REDIS_PASSWORD}" \
            AllowedHosts="${ALLOWED_HOSTS:-*}" \
            DomainName="${DOMAIN_NAME:-your-domain.com}" \
            HostedZoneId="${HOSTED_ZONE_ID}" \
            CertificateArn="${CERTIFICATE_ARN}" \
        --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
        --region ${AWS_REGION} \
        --no-fail-on-empty-changeset
    
    print_status "Stack deployment completed!"
    
    # Get stack outputs
    print_status "Stack outputs:"
    aws cloudformation describe-stacks \
        --stack-name ${PROJECT_NAME}-infrastructure \
        --region ${AWS_REGION} \
        --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
        --output table
}

# Main function
main() {
    case "${1}" in
        "stack")
            deploy_stack
            ;;
        "all")
            deploy_stack
            print_status "To deploy the full application, run: ./deploy.sh"
            ;;
        *)
            echo "Usage: $0 {stack|all}"
            echo "  stack - Deploy only the CloudFormation infrastructure"
            echo "  all   - Deploy infrastructure and application"
            exit 1
            ;;
    esac
}

main "$@"