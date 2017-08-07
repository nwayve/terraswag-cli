// Node
import * as fs from 'fs';
import * as path from 'path';

// Vendor
import { compile } from 'handlebars';
import * as _ from 'lodash';

// Project
import {
    AuthorizationTypes,
    AwsApiGatewayIntegration,
    AwsApiGatewayIntegrationResponse,
    AwsApiGatewayMethod,
    AwsApiGatewayMethodResponse,
    AwsApiGatewayResource,
    AwsApiGatewayRestApi,
    HttpVerbs,
    IntegrationTypes,
    PassthroughBehaviors,
    PathsObject,
    SwaggerDocument
} from './index';

const METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch'];

const MAIN_TEMPLATE = `\
terraform {
  required_version = ">= 0.9.3"
}

variable "lambdaArn" { }
variable "service" { type = "map" }

provider "aws" {
  region = "\${var.service["region"]}"
  assume_role {
    role_arn     = "\${var.service["assumeRoleArn"]}"
    session_name = "swagger-terraform-deployment"
  }
}
`;

export function swaggerToTerraform(swaggerDoc: SwaggerDocument, callback?: Function | undefined): void {
    if (!swaggerDocIsValid(swaggerDoc, callback)) {
        return;
    }

    const serviceModuleFolder = path.join(process.cwd(), 'api-module');
    if (!fs.existsSync(serviceModuleFolder)) {
        fs.mkdirSync(serviceModuleFolder);
    }

    const mainModuleTf = path.join(serviceModuleFolder, 'main.tf');
    const mainRender = compile(MAIN_TEMPLATE)(null);
    fs.writeFileSync(mainModuleTf, mainRender, 'utf8');

    const apitf = path.join(serviceModuleFolder, 'api.tf');
    const service = {
        name: swaggerDoc.info.title,
        description: ''
    };
    const restApi = new AwsApiGatewayRestApi(service).toTerraformString();
    fs.writeFileSync(apitf, restApi, 'utf8');

    if (_(swaggerDoc.paths).has('/')) {
        fs.appendFileSync(apitf, '\n' + sectionComment('/'));

        const orderedPaths = _(swaggerDoc.paths['/']).toPairs().sortBy(0).fromPairs().value();
        _(orderedPaths).forEach(function (value: any, methodName: string, context: any) {
            const method = new AwsApiGatewayMethod({
                name: `${methodName}_root`,
                serviceName: service.name,
                httpVerb: (<any>HttpVerbs)[methodName.toUpperCase()],
                authorizationType: AuthorizationTypes.NONE
            });
            const amzItegration = value['x-amazon-apigateway-integration'];
            const integration = new AwsApiGatewayIntegration({
                name: `${methodName}_root`,
                serviceName: service.name,
                type: (<any>IntegrationTypes)[amzItegration.type.toUpperCase()],
                passthroughBehavior: (<any>PassthroughBehaviors)[amzItegration.passthroughBehavior.toUpperCase()]
            });
            fs.appendFileSync(apitf, '\n' + sectionComment(methodName.toUpperCase()));
            fs.appendFileSync(apitf, method.toTerraformString());
            fs.appendFileSync(apitf, '\n' + integration.toTerraformString());
            for (const selectionPattern of Object.keys(amzItegration.responses)) {
                const response = amzItegration.responses[selectionPattern];
                const integrationResponse = new AwsApiGatewayIntegrationResponse({
                    name: `${methodName}_root`,
                    serviceName: service.name,
                    statusCode: response.statusCode,
                    selectionPattern: selectionPattern === 'default' ? void 0 : selectionPattern
                });
                fs.appendFileSync(apitf, '\n' + integrationResponse.toTerraformString());
            }
            for (const statusCode of Object.keys(value.responses)) {
                const methodResponse = new AwsApiGatewayMethodResponse({
                    name: `${methodName}_root`,
                    serviceName: service.name,
                    statusCode: statusCode
                });
                fs.appendFileSync(apitf, '\n' + methodResponse.toTerraformString());
            }
        });
    }
    const createdResources: string[] = [];
    const orderedPaths = _(swaggerDoc.paths).omit('/').toPairs().sortBy(0).fromPairs().value();
    _(orderedPaths).forEach(function (pathItem: any, pathName: string) {
        const pathSegments = _.split(pathName, '/');

        // reference parent resource
        let parentName = pathSegments.slice(0, -1).join('/').replace(/\//g, '_').replace(/\{|\}/g, '-').substr(1);
        if (parentName && !_(createdResources).includes(parentName)) {
            fs.appendFileSync(apitf, createResourceFromPath(pathSegments.slice(0, -1).join('/'), service.name, createdResources));
        }

        // create target resource
        const resourceName = pathName.replace(/\//g, '_').replace(/\{|\}/g, '-').substr(1);
        const resource = new AwsApiGatewayResource({
            name: resourceName,
            serviceName: service.name,
            parentName: parentName,
            pathPart: pathSegments.slice(-1)[0]
        });
        fs.appendFileSync(apitf, '\n' + sectionComment(pathName));
        fs.appendFileSync(apitf, resource.toTerraformString());
        createdResources.push(resourceName);

        // loop through each OperationObject
        _(pathItem).keys().intersection(METHODS).forEach(function (methodName) {
            const method = new AwsApiGatewayMethod({
                name: `${methodName}_${resourceName}`,
                serviceName: service.name,
                resourceName: resourceName,
                httpVerb: (<any>HttpVerbs)[methodName.toUpperCase()],
                authorizationType: AuthorizationTypes.NONE
            });
            const amzItegration = pathItem[methodName]['x-amazon-apigateway-integration'];
            const integration = new AwsApiGatewayIntegration({
                name: `${methodName}_${resourceName}`,
                serviceName: service.name,
                resourceName: resourceName,
                type: (<any>IntegrationTypes)[amzItegration.type.toUpperCase()],
                passthroughBehavior: (<any>PassthroughBehaviors)[amzItegration.passthroughBehavior.toUpperCase()]
            });
            fs.appendFileSync(apitf, '\n' + sectionComment(methodName.toUpperCase()));
            fs.appendFileSync(apitf, method.toTerraformString());
            fs.appendFileSync(apitf, '\n' + integration.toTerraformString());
            for (const selectionPattern of Object.keys(amzItegration.responses)) {
                const response = amzItegration.responses[selectionPattern];
                const integrationResponse = new AwsApiGatewayIntegrationResponse({
                    name: `${methodName}_${resourceName}`,
                    resourceName: resourceName,
                    serviceName: service.name,
                    statusCode: response.statusCode,
                    selectionPattern: selectionPattern === 'default' ? void 0 : selectionPattern
                });
                fs.appendFileSync(apitf, '\n' + integrationResponse.toTerraformString());
            }
            for (const statusCode of Object.keys(pathItem[methodName].responses)) {
                const methodResponse = new AwsApiGatewayMethodResponse({
                    name: `${methodName}_${resourceName}`,
                    resourceName: resourceName,
                    serviceName: service.name,
                    statusCode: statusCode
                });
                fs.appendFileSync(apitf, '\n' + methodResponse.toTerraformString());
            }
        });
    });
}

function createResourceFromPath(pathName: string, serviceName: string, createdResources: string[]): string {
    const pathSegments = _.split(pathName, '/');

    let parentName = pathSegments.slice(0, -1).join('/').replace(/\//g, '_').replace(/\{|\}/g, '-').substr(1);
    if (parentName && !_(createdResources).includes(parentName)) {
        return createResourceFromPath(pathSegments.slice(0, -1).join('/'), serviceName, createdResources);
    }

    const resourceName = pathName.replace(/\//g, '_').replace(/\{|\}/g, '-').substr(1);
    const resource = new AwsApiGatewayResource({
        name: resourceName,
        serviceName: serviceName,
        parentName: parentName,
        pathPart: pathSegments.slice(-1)[0]
    });

    createdResources.push(resourceName);
    return `\n${sectionComment(pathName)}${resource.toTerraformString()}`;
}

function sectionComment(sectionName: string) {
    return `#\n# ${sectionName}\n#\n`;
}

function swaggerDocIsValid(swaggerDoc: SwaggerDocument, callback?: Function): boolean {
    const cb = callback;

    const hasAtLeastOnePathAndMethod = _(swaggerDoc.paths)
        .pickBy((val: Object, key: string) => /^\/.*$/g.test(key))
        .find((val: Object) => METHODS.some(m => _(val).has(m)));

    if (!hasAtLeastOnePathAndMethod) {
        cb && cb(null, new Error('Insufficient paths or methods.  To create an API Gateway at least one path and one method is required.'));
        return false;
    }

    return true;
}
