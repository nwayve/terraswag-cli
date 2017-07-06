// Node
import * as fs from 'fs';
import * as path from 'path';

// Testing
import * as chai from 'chai';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { SinonSandbox } from 'sinon';
import * as sinonChai from 'sinon-chai';
chai.should();
chai.use(sinonChai);

// Vendor
import * as del from 'del';
import * as uuid from 'uuid';

// Project
import {
    swaggerToTerraform,
    SwaggerDocument
} from '../src/swagger-converter';

describe('swaggerToTerraform', function () {
    // folders
    const outDir = path.join(__dirname, 'temp');
    const serviceModuleFolder: string = path.join(outDir, 'service-module');

    // files
    const apiTfFile = path.join(serviceModuleFolder, 'api.tf');
    const mainTfFile = path.join(serviceModuleFolder, 'main.tf');
    const uid = uuid.v4();

    let sandbox: SinonSandbox;

    let swaggerDoc: SwaggerDocument;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();

        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir);
        }

        process.chdir(outDir);

        swaggerDoc = {
            swagger: '2.0',
            info: {
                title: uid,
                version: '2017-06-26T18:48:48Z'
            },
            paths: {
                '/': { 'get': {} }
            }
        };
    });

    afterEach(function () {
        process.chdir(__dirname);
        return del(outDir, { force: true });
    });

    describe('/service-module/api.tf', function () {
        it('should create an api.tf file in the /service-module folder', function () {
            // Arrange

            // Act
            swaggerToTerraform(swaggerDoc);

            // Assert
            fs.existsSync(apiTfFile).should.be.true;
        });

        it('should overwrite the api.tf file in the /service-module folder if it already exists', function () {
            // Arrange
            fs.mkdirSync(serviceModuleFolder);
            fs.writeFileSync(apiTfFile, uid);

            // Act
            swaggerToTerraform(swaggerDoc);
            const result = fs.readFileSync(apiTfFile, 'utf8');

            // Assert
            result.should.not.equal(uid);
        });

        it('should create minimal api.tf file from minimimal swagger document', function () {
            // Arrange
            const target =
`resource "aws_api_gateway_rest_api" "${swaggerDoc.info.title}" {
  name        = "\${var.service["name"]}"
  description = "\${var.service["description"]}"
}\n`;

            // Act
            swaggerToTerraform(swaggerDoc);
            const result = fs.readFileSync(apiTfFile, 'utf8');

            // Assert
            result.should.equal(target);
        });
    });

    describe('/service-module/main.tf', function () {
        it('should create a main.tf file in the /service-module folder', function () {
            // Arrange

            // Act
            swaggerToTerraform(swaggerDoc);

            // Assert
            fs.existsSync(mainTfFile).should.be.true;
        });

        it('should overwrite the main.tf file in the /service-module folder if it already exists', function () {
            // Arrange
            fs.mkdirSync(serviceModuleFolder);
            fs.writeFileSync(mainTfFile, uid);

            // Act
            swaggerToTerraform(swaggerDoc);
            const result = fs.readFileSync(mainTfFile, 'utf8');

            // Assert
            result.should.not.equal(uid);
        });
    });

    describe('Validation', function () {
        it('should call the callback function with an Error if the SwaggerDocument does not have at least one path', function () {
            // Arrange
            swaggerDoc.paths = {};
            const callback = sandbox.spy();

            // Act
            swaggerToTerraform(swaggerDoc, callback);

            // Assert
            callback.should.have.been.calledOnce;
            callback.should.have.been.calledWithMatch(null, Error);
            fs.existsSync(apiTfFile).should.be.false;
        });

        it('should call the callback function with an Error if the SwaggerDocument does not have at least one method', function () {
            // Arrange
            swaggerDoc.paths = {
                '/': {}
            };
            const callback = sandbox.spy();

            // Act
            swaggerToTerraform(swaggerDoc, callback);

            // Assert
            callback.should.have.been.calledOnce;
            callback.should.have.been.calledWithMatch(null, Error);
            fs.existsSync(apiTfFile).should.be.false;
        });
    });
});
