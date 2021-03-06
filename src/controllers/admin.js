/**=================================================================
 * ====   TITLE::     ADDING ADMIN FORGOT AND RESET PASSWORD    ====  
 * ====   AUTHOR:: jimoh19 <jemohkunle2007@gmail.com>           ====
 * ====   DATE::            30TH JUNE 2020                      ====
 * =================================================================
 */

const Admin = require('../models/admin');
const crypto = require('crypto');
const { CustomError } = require('../utils/CustomError');
const bcrypt = require('bcrypt');
const { sendForgotPasswordMail } = require('../EmailFactory/index');
const CustomResponse = require('../utils/response');

exports.adminRegister = async (request, response) => {
  // Adds a new admin to Auth-MicroApi DB 
  let user = await Admin.findOne({ email: request.body.email });
  if (user) {
    throw new CustomError('Email address already in use', 403);
  }
  user = new Admin(request.body);
  user = await user.save();

  // DON'T DELETE: Admin acc. verification
  // Send a confirmation link to email
  // const mailStatus = await createVerificationLink(user, request);
  // console.log('===MailStatus===');
  // console.log(mailStatus);
  let data = user.toJSON();

  return response.status(201).json(CustomResponse('Registration successful', data));
};

exports.adminGetKey = async (request, response) => {
  // New API KEY for admin
  let user = await Admin.findOne({ email: request.body.email });

  if (!user) {
    throw new CustomError('Authentication failed, email not found', 401);
  }

  if (!user.matchPasswords(request.body.password)) {
    throw new CustomError('Authentication failed, password is incorrect', 401);
  }

  let message = 'API_KEY should be set in authorization header as - Bearer <token> - for subsequent user requests';
  let data = { API_KEY: user.generateAPIKEY() };

  return response.status(200).json(CustomResponse(message, data));
};

exports.adminForgotPassword = async (request, response) => {
  const { email } = request.body;
  const buffer = crypto.randomBytes(32);
  const token = buffer.toString();
  const expirationTime = Date.now() + 3600000; // 1 hour
  const admin = await Admin.findOneAndUpdate(
    {
      email
    },
    {
      resetPasswordToken: token,
      resetPasswordExpire: expirationTime
    },
    {
      new: true
    }
  );

  if (!admin) {
    throw new CustomError(
      `Sorry an Account with Email: ${email} doesn't exist on this service`,
      404,
    );
  }

  const resetUrl = `http:\/\/${request.headers.host}\/api\/admin\/auth\/reset-password\/${token}`;
  sendForgotPasswordMail(admin.email, admin.username, resetUrl);

  return response.status(200).json(CustomResponse(`A password reset link has been sent to ${admin.email}`));
};

exports.adminResetPassword = async (request, response) => {
  const { token } = request.params;
  const { password } = request.body;
  const admin = await Admin.findOneAndUpdate(
    {
      resetPasswordToken: token,
      resetPasswordExpire: {
        $gt: Date.now()
      }
    },
    {
      password,
      resetPasswordToken: null,
      resetPasswordExpire: null
    },
    {
      new: true
    }
  );
  if (!admin) {
    throw new CustomError(
      'Password reset token is invalid or has expired.',
      422,
    );
  }

  return response.status(200).json(CustomResponse('Password updated successfully. You may login'));
};