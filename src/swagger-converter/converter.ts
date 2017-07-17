// Node
import * as fs from 'fs';
import * as path from 'path';

// Vendor
import { compile } from 'handlebars';
import * as _ from 'lodash';

// Project
import {
    SwaggerDocument, PathsObject
} from '../swagger-converter';
import * as Swaggearth from '../swagger-converter';

const METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch'];

const MAIN_TEMPLATE = `\
terraform {
  required_version = ">= 0.9.3"
}

variable "service" { type = "map" }

provider "aws" {
  region = "\${var.service["region"]}"
}
`;

export function swaggerToTerraform(swaggerDoc: SwaggerDocument, callback?: Function): void {
    const cb = callback || function () { };

    if (!swaggerDocIsValid(swaggerDoc, cb)) {
        return;
    }

    const serviceModuleFolder = path.join(process.cwd(), 'service-module');
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
    const restApi = new Swaggearth.AwsApiGatewayRestApi(service).toTerraformString();
    fs.writeFileSync(apitf, restApi, 'utf8');

    if (_(swaggerDoc.paths).has('/')) {
        fs.appendFileSync(apitf, '\n' + sectionComment('/'));

        const orderedMethods = _(swaggerDoc.paths['/']).toPairs().sortBy(0).fromPairs().value();
        _(orderedMethods).forEach(function (value: any, methodName: string, context: any) {
            const path = {
                method: methodName.toLowerCase(),
                name: 'root'
            };
            const method = new Swaggearth.AwsApiGatewayMethod({
                name: `${path.method}_root`,
                serviceName: service.name,
                httpVerb: (<any>Swaggearth.HttpVerbs)[methodName.toUpperCase()],
                authorizationType: Swaggearth.AuthorizationTypes.NONE
            });
            const integration = new Swaggearth.AwsApiGatewayIntegration({
                name: `${path.method}_root`,
                serviceName: service.name,
                type: Swaggearth.IntegrationTypes.MOCK
            });
            fs.appendFileSync(apitf, '\n' + sectionComment(methodName.toUpperCase()));
            fs.appendFileSync(apitf, method.toTerraformString());
            fs.appendFileSync(apitf, '\n' + integration.toTerraformString());
        });
    }

    const orderedPaths = _(swaggerDoc.paths).omit('/').toPairs().sortBy(0).fromPairs().value();
    _(orderedPaths).forEach(function (path: any, pathName: string, pathsObject: PathsObject) {
    });
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
