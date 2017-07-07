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
    const mainRender = renderMain();
    fs.writeFileSync(mainModuleTf, mainRender);

    const apitf = path.join(serviceModuleFolder, 'api.tf');
    const restApiRender = renderRestApi(swaggerDoc.info.title);
    fs.writeFileSync(apitf, restApiRender);
}

function renderRestApi(name: string, description: string = ''): string {
    const data = {
        service: {
            name: name,
            description: description
        }
    };

    return njk.render('aws-api-gateway-rest-api.tf.njk', data);
}

function renderMain(): string {
    return njk.render('main.tf.njk');
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
