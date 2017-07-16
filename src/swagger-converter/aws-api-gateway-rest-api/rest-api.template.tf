resource "aws_api_gateway_rest_api" "{{service.name}}" {
  name        = "${var.service["name"]}"
  description = "${var.service["description"]}"
}

output "rest_api_id" {
  value = "${aws_api_gateway_rest_api.{{service.name}}.id}"
}
