variable "service" { type = "map" }

provider "aws" {
  region = "${var.service["region"]}"
  assume_role {
    role_arn     = "${var.service["assumeRoleArn"]}"
    session_name = "test-service-deploy"
  }
}
