// Node
import * as fs from 'fs';
import * as path from 'path';

export function swaggerToTerraform(): void {
    const apitf = path.join(process.cwd(), 'api.tf');

    fs.writeFileSync(apitf, '');
}
