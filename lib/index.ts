#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';

import * as program from 'commander';

import { swaggerToTerraform } from './swagger-converter';

export namespace TerraSwag {
    const version = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')).version;
    const cwd = process.cwd();

    process.title = `Terraswag ${version}`;

    program
        .version(version, '-v, --version')
        .usage('[options] <swagger-file>')
        .option('-t, --terraform-dir [tfDir]', 'Project\'s terraform configuration directory [Default: \'terraform\']')
        .action(parseSwaggerFile);

    program
        .command('parse <swagger-file>')
        .description('creates a terraform module for the API in the terraform folder')
        .option('-t, --terraform-dir [tfDir]', 'Project\'s terraform configuration directory [Default: \'terraform\']')
        .action(parseSwaggerFile);

    function parseSwaggerFile(swaggerFile: string, options: any) {
        const tfDir = path.join(cwd, options.terraformDir || 'terraform');
        const swaggerFilename = path.join(cwd, swaggerFile);
        console.log(`Will parse the swagger file '${swaggerFilename}' as a terraform module in the '${tfDir}' directory.`);
        const succeeded = swaggerToTerraform(JSON.parse(fs.readFileSync(swaggerFile, 'utf8')), (r: any, err: any) => console.error(err));
        if (succeeded) {
            console.log('success');
        }
    }

    program.parse(process.argv);
}
