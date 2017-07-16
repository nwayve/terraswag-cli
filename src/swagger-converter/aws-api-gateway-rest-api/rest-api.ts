// Vendor
import { compile } from 'handlebars';

// Project
import { RestApiServiceConfiguration as ServiceConfiguration } from './rest-api.configuration';

const TEMPLATE =
`resource "aws_api_gateway_rest_api" "{{service.name}}" {
  name        = "\${var.service["name"]}"
  description = "\${var.service["description"]}"
}

output "rest_api_id" {
  value = "\${aws_api_gateway_rest_api.{{service.name}}.id}"
}
`;

export class AwsApiGatewayRestApi {
    template = compile(TEMPLATE);

    constructor(private service: ServiceConfiguration) { }

    toTerraformString(): string {
        return this.template({ service: this.service });
    }
}
