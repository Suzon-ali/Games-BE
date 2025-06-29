/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: 'Api Not Found!',
    error: 'err',
  });
};

export default notFoundHandler;