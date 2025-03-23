import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
      files?: { [fieldname: string]: Express.Multer.File[] };
      fields?: {
        [key: string]: string | string[] | undefined;
      };
    }
  }
}