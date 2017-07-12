resource "aws_api_gateway_rest_api" "service_name" {
  name        = "${var.service["name"]}"
  description = "${var.service["description"]}"
}

output "rest_api_id" {
  value = "${aws_api_gateway_rest_api.service_name.id}"
}

#
# /
#

#
# GET
#
resource "aws_api_gateway_method" "get_root" {
  rest_api_id   = "${aws_api_gateway_rest_api.service_name.id}"
  resource_id   = "${aws_api_gateway_rest_api.service_name.root_resource_id}"
  http_method   = "GET"
  authorization = "AWS_IAM"
}

resource "aws_api_gateway_integration" "get_root" {
  rest_api_id = "${aws_api_gateway_rest_api.service_name.id}"
  resource_id = "${aws_api_gateway_rest_api.service_name.root_resource_id}"
  http_method = "${aws_api_gateway_method.get_root.http_method}"
  integration_http_method = "GET"
  type        = "AWS"
  uri         = "arn:aws:apigateway:${var.service["region"]}:lambda:path/2015-03-31/functions/${var.lambdaArn}/invocations"
}
