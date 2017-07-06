// Node
import * as fs from 'fs';
import * as path from 'path';

// Vendor
import * as _ from 'lodash';
import * as njk from 'nunjucks';
njk.configure(path.join(__dirname, 'templates'));

// Project
import { SwaggerDocument } from './models';

export function swaggerToTerraform(swaggerDoc: SwaggerDocument, callback?: Function): void {
    const cb = callback;
    const methods = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch'];
    const match = _(swaggerDoc.paths)
        .pickBy((val: Object, key: string) => /^\/.*$/g.test(key))
        .find((val: Object) => methods.some(m => _(val).has(m)));
    if (!match) {
        return cb && cb(null, new Error());
    }

    const restApi = renderRestApi(swaggerDoc.info.title);

    const apitf = path.join(process.cwd(), 'api.tf');
    fs.writeFileSync(apitf, restApi);
}

function renderRestApi(name: string, description: string = '') {
    const data = {
        service: {
            name: name,
            description: description
        }
    };
    return njk.render('aws-api-gateway-rest-api.tf.njk', data);
}
