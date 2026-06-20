import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const loadRoutes = async (app) => {
    const routesPath = path.join(__dirname, '../routes');

    const files = fs.readdirSync(routesPath);

    for (const file of files) {
        if (file.endsWith('.js')) {
            const route = await import(`../routes/${file}`);
            
            app.use(route.path, route.default);
        }
    }
};