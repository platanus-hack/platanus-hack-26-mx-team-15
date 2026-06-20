import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import {config} from "dotenv"
import { loadRoutes } from './loaders/routesLoader.js';

const app = express();

config();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('API funcionando');
});

await loadRoutes(app);

app.listen(process.env.PORT || 3000, () => {
    console.log('Servidor corriendo en:' + process.env.PORT);
});