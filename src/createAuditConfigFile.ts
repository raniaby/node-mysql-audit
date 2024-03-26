import fs from 'node:fs/promises';
import path from 'node:path';


async function createAuditConfigFile(){
    try {
        const projectDir = process.cwd();
        const userProjectDir = path.resolve(projectDir, '../../'); // Assumes the user's project is two directories above
        const exceptions = {
          exceptions : ['auditlog'],
          DBCredentials: {
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'your-database-name',
          },
        }
        const jsonContent = JSON.stringify(exceptions, null, 2);
        const filePath = path.join(userProjectDir, 'auditConfig.json'); 
        await fs.writeFile(filePath, jsonContent, 'utf8');
    } catch (error) {
        console.error('Error creating audit config file:', error);
    }

  }

createAuditConfigFile();