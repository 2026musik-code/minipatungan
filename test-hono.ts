import { getRequestListener } from '@hono/node-server';
import { Hono } from 'hono';

const app = new Hono();
app.get('/api/hello', (c) => c.text('hello'));

const listener = getRequestListener(app.fetch);
console.log(typeof listener);
