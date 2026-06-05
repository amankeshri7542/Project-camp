import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.models.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
    sendEmail,
    emailVerificationMailgenContent,
    forgotPasswordMailgenContent,
} from '../utils/mail.js';


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, 'Something went wrong while generating access token');
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { email, username, password, fullName } = req.body;

    if ([email, username, password, fullName].some((field) => !field?.trim())) {
        throw new ApiError(400, 'Email, username, password and full name are required');
    }

    // Check if user already exists by email OR username
    const existingUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existingUser) {
        throw new ApiError(409, 'User with email or username already exists');
    }

    // Create the new user
    const user = await User.create({
        email,
        username,
        password,
        fullName,
        isEmailVerified: false,
    });

    // Generate temporary token for email verification
    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemoraryToken();

    // Save hashed token + expiry to DB (not the raw token — never store raw)
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiration = tokenExpiry;
    await user.save({ validateBeforeSave: false });

    // Send verification email with the raw (unhashed) token in the URL
    await sendEmail({
        email: user.email,
        subject: 'Please verify your email',
        mailgenContent: emailVerificationMailgenContent(
            user.username,
            `${req.protocol}://${req.get('host')}/api/v1/users/verify-email/${unHashedToken}`
        ),
    });

    // Fetch user without sensitive fields to send in response
    const createdUser = await User.findById(user._id).select(
        '-password -refreshToken -emailVerificationToken -emailVerificationExpiration'
    );

    if (!createdUser) {
        throw new ApiError(500, 'Something went wrong while registering the user');
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            { user: createdUser },
            'User registered successfully and verification email has been sent on your email'
        )
    );
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email) {
        throw new ApiError(400, 'Email is required');
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, 'User does not exist');
    }

    const isPasswordValid = await user.isPasswordValid(password);

    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid credentials');
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select(
        '-password -refreshToken -emailVerificationToken -emailVerificationExpiration'
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    };

    return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                'User logged in successfully'
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        { $set: { refreshToken: undefined } },
        { new: true }
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    };

    return res
        .status(200)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(new ApiResponse(200, {}, 'User logged out'));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, req.user, 'Current user fetched successfully')
    );
});

const verifyEmail = asyncHandler(async (req, res) => {
    const { verificationToken } = req.params;

    if (!verificationToken) {
        throw new ApiError(400, 'Email verification token is missing');
    }

    const hashedToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpiration: { $gt: Date.now() },
    });

    if (!user) {
        throw new ApiError(489, 'Token is invalid or expired');
    }

    user.emailVerificationToken = undefined;
    user.emailVerificationExpiration = undefined;
    user.isEmailVerified = true;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, { isEmailVerified: true }, 'Email is verified')
    );
});

const resendEmailVerification = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(404, 'User does not exist');
    }

    if (user.isEmailVerified) {
        throw new ApiError(409, 'Email is already verified');
    }

    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemoraryToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiration = tokenExpiry;
    await user.save({ validateBeforeSave: false });

    await sendEmail({
        email: user.email,
        subject: 'Please verify your email',
        mailgenContent: emailVerificationMailgenContent(
            user.username,
            `${req.protocol}://${req.get('host')}/api/v1/users/verify-email/${unHashedToken}`
        ),
    });

    return res.status(200).json(
        new ApiResponse(200, {}, 'Mail has been sent to your email id')
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, 'Unauthorized request');
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, 'Invalid refresh token');
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, 'Refresh token is expired');
        }

        const options = { httpOnly: true, secure: process.env.NODE_ENV === "production" };

        const { accessToken, refreshToken: newRefreshToken } =
            await generateAccessAndRefreshTokens(user._id);

        return res
            .status(200)
            .cookie('accessToken', accessToken, options)
            .cookie('refreshToken', newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    'Access token refreshed'
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || 'Invalid refresh token');
    }
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, 'User does not exist');
    }

    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemoraryToken();

    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordExpiration = tokenExpiry;
    await user.save({ validateBeforeSave: false });

    await sendEmail({
        email: user.email,
        subject: 'Password reset request',
        mailgenContent: forgotPasswordMailgenContent(
            user.username,
            `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`
        ),
    });

    return res.status(200).json(
        new ApiResponse(200, {}, 'Password reset mail has been sent on your email')
    );
});

const resetForgotPassword = asyncHandler(async (req, res) => {
    const { resetToken } = req.params;
    const { newPassword } = req.body;

    const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    const user = await User.findOne({
        forgotPasswordToken: hashedToken,
        forgotPasswordExpiration: { $gt: Date.now() },
    });

    if (!user) {
        throw new ApiError(489, 'Token is invalid or expired');
    }

    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiration = undefined;
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, {}, 'Password reset successfully')
    );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);

    const isPasswordValid = await user.isPasswordValid(oldPassword);

    if (!isPasswordValid) {
        throw new ApiError(400, 'Invalid old password');
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, {}, 'Password changed successfully')
    );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    verifyEmail,
    resendEmailVerification,
    refreshAccessToken,
    forgotPasswordRequest,
    resetForgotPassword,
    changeCurrentPassword,
    generateAccessAndRefreshTokens,
};
