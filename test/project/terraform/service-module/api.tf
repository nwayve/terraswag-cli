resource "aws_api_gateway_rest_api" "service_name" {
  name        = "${var.service["name"]}"
  description = "${var.service["description"]}"
}

#
# GET /
#
resource "aws_api_gateway_method" "get_root" {
  rest_api_id   = "${aws_api_gateway_rest_api.service_name.id}"
  resource_id   = "${aws_api_gateway_rest_api.service_name.root_resource_id}"
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "get_root" {
  rest_api_id = "${aws_api_gateway_rest_api.service_name.id}"
  resource_id = "${aws_api_gateway_rest_api.service_name.root_resource_id}"
  http_method = "${aws_api_gateway_method.get_root.http_method}"
  type        = "MOCK"
}
