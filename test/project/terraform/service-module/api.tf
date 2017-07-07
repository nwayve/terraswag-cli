resource "aws_api_gateway_rest_api" "service_name" {
  name        = "${var.service["name"]}"
  description = "${var.service["description"]}"
}
