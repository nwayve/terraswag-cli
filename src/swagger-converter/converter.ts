// Node
import * as fs from 'fs';
import * as path from 'path';

// Vendor
import * as _ from 'lodash';
import * as njk from 'nunjucks';
njk.configure(path.join(__dirname, 'templates'));

// Project
import { SwaggerDocument, PathsObject } from './models';

const methods = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch'];

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
    const mainRender = njk.render('main.njk');
    fs.writeFileSync(mainModuleTf, mainRender, 'utf8');

    const apitf = path.join(serviceModuleFolder, 'api.tf');
    const service = {
        name: swaggerDoc.info.title,
        description: ''
    };
    fs.writeFileSync(apitf, njk.render('aws_api_gateway_rest_api.njk', { service: service }), 'utf8');

    if (_(swaggerDoc.paths).has('/')) {
        fs.appendFileSync(apitf, '\n' + sectionComment('/'));

        const orderedMethods = _(swaggerDoc.paths['/']).toPairs().sortBy(0).fromPairs().value();
        _(orderedMethods).forEach(function (value: any, methodName: string, context: any) {
            const path = {
                method: methodName.toLowerCase(),
                name: 'root'
            };
            fs.appendFileSync(apitf, '\n' + sectionComment(methodName.toUpperCase()));
            fs.appendFileSync(apitf, njk.render('aws_api_gateway_method.njk', { service: service, path: path }));
            fs.appendFileSync(apitf, '\n' + njk.render('aws_api_gateway_integration.njk', { service: service, path: path }));
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
        .find((val: Object) => methods.some(m => _(val).has(m)));

    if (!hasAtLeastOnePathAndMethod) {
        cb && cb(null, new Error('Insufficient paths or methods.  To create an API Gateway at least one path and one method is required.'));
        return false;
    }

    return true;
}
