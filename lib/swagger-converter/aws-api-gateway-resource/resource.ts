// vendor
import { compile } from 'handlebars';

const TEMPLATE = `\
resource "aws_api_gateway_resource" "{{resource.name}}" {
  rest_api_id = "\${aws_api_gateway_rest_api.{{resource.serviceName}}.id}"
  parent_id   = "\${aws_api_gateway_rest_api.{{resource.serviceName}}.root_resource_id}"
  path_part   = "{{resource.pathPart}}"
}
`;

const RESOURCE_TEMPLATE = TEMPLATE.replace(
    'aws_api_gateway_rest_api.{{resource.serviceName}}.root_resource_id',
    'aws_api_gateway_resource.{{resource.parentName}}.id');

export class AwsApiGatewayResource {
    template = compile(TEMPLATE);

    constructor(private config: ResourceConfiguration) { }

    toTerraformString(): string {
        if (this.config.parentName && this.config.parentName.length) {
            this.template = compile(RESOURCE_TEMPLATE);
        }
        return this.template({ resource: this.config });
    }
}

export interface ResourceConfiguration {
    name: string;
    serviceName: string;
    parentName?: string;
    pathPart: string;
}
