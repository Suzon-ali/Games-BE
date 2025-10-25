import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../utils/catchAsync';
import { AuthServices } from './auth.service';
import sendResponse from '../../../utils/sendResponse';
import { serialize } from 'cookie';

const loginUser = catchAsync(async (req, res) => {
  const user = req.body;
  const result = await AuthServices.loginUserIntoDB(user);

  const { refreshToken, accessToken, userInfo } = result;

  // res.cookie('refreshToken', refreshToken, {
  //   secure: true,
  //   httpOnly: true,
  //   sameSite: 'none',
  //   //domain: 'games-client-jp6a.vercel.app',
  // });

  res.setHeader("Set-Cookie", [
    serialize("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      path: "/",
      domain: ".rolltoday.online",
      maxAge: 60 * 60 * 24,
    }),
    serialize("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      path: "/",
      domain: ".rolltoday.online",
      maxAge: 60 * 60 * 24 * 7,
    }),
  ]);

  sendResponse(res, {
    success: true,
    message: 'User logged in succesfully!',
    statusCode: StatusCodes.OK,
    data: {
      userInfo,
      accessToken,
      refreshToken,
    },
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const refreshToken =
    req.cookies.refreshToken || req.headers['x-refresh-token'];
  const result = await AuthServices.refreshToken(refreshToken);
  sendResponse(res, {
    success: true,
    message: 'AccessToken is created succesfully!',
    statusCode: StatusCodes.OK,
    data: result,
  });
});

const forgetPassword = catchAsync(async (req, res) => {
  const body = req?.body;
  const { email } = body;
  const result = await AuthServices.forgetPassword(email);

  sendResponse(res, {
    success: true,
    message: 'Reset password link has been sent to your email',
    statusCode: StatusCodes.OK,
    data: result,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const accessToken = req?.headers?.authorization;
  const payload = req?.body;
  const { password } = payload;

  const result = await AuthServices.resetePassword(
    accessToken as string,
    password,
  );

  sendResponse(res, {
    success: true,
    message: 'Password reset succesfull',
    statusCode: StatusCodes.OK,
    data: result,
  });
});

export const AuthContollers = {
  loginUser,
  refreshToken,
  forgetPassword,
  resetPassword,
};
