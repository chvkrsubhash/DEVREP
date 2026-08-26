import { createApp } from '../server/src/app';

const app = createApp();

export default function handler(req: any, res: any) {
  return app(req, res);
}
