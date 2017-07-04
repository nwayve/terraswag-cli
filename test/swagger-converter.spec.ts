// Node
import * as fs from 'fs';
import * as path from 'path';

// Vendor
import * as chai from 'chai';
chai.should();
import * as del from 'del';

// Project
import { swaggerToTerraform } from '../src/swagger-converter';

describe('swaggerToTerraform', function () {
    const outDir = path.join(__dirname, 'temp');

    beforeEach(function () {
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir);
        }

        process.chdir(outDir);
    });

    afterEach(function () {
        process.chdir(__dirname);
        return del(outDir, { force: true });
    });

    it('should create an api.tf file in the current directory', function () {
        // Arrange
        const apiTerraformFile = outDir + '/api.tf';

        // Act
        swaggerToTerraform();

        // Assert
        fs.existsSync(apiTerraformFile).should.be.true;
    });
});
