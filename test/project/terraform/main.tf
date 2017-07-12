variable "service_config" {
  type    = "map"
  default = {}
}

provider "aws" {
  region = "${var.service_config["region"]}"
  assume_role {
    role_arn     = "${var.service_config["assumeRoleArn"]}"
    session_name = "test-service-deploy"
  }
}

module "service_name" {
  source    = "service-module"
  service   = "${var.service_config}"
  lambdaArn = "${aws_lambda_function.test_lambda.arn}"
}

resource "aws_api_gateway_deployment" "development" {
  depends_on = ["module.service_name"]

  rest_api_id = "${module.service_name.rest_api_id}"
  stage_name = "development"
  description = "Description of the deployment."
  stage_description = "Description of the stage."
  variables = {
    "stage" = "development"
  }
}

resource "aws_lambda_function" "test_lambda" {
  filename         = "../lambda_function_payload.zip"
  function_name    = "test-service"
  role             = "arn:aws:iam::827763215205:role/simple_lambda_Role"
  handler          = "index.handler"
  source_code_hash = "${base64sha256(file("../lambda_function_payload.zip"))}"
  runtime          = "nodejs6.10"
}
