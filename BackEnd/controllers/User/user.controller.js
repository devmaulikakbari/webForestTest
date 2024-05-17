const userService = require("../../service/DB/user.service");
const utils = require("../../service/utils");
const message = require("../../service/message");
const httpStatus = require("http-status");
const otpService = require("../../service/DB/otp.service");
const templateService = require("../../service/DB/template.service");
const axios = require("axios");
const moment = require("moment");
const {
  getFavourite,
  createFavourite,
  favouriteUpdate,
} = require("../../service/DB/favourite.service");
const { sendErrorResponse } = require("../../service/utils");
const { sendSuccessResponse } = require("../../service/utils");

exports.signUp = async (req, res) => {
  try {
    const { userName, password, email } = req.body; /* destructuring payload */

    const ifAlreadyExist = await userService.getUser({ email });
    if (ifAlreadyExist) {
      return sendErrorResponse(
        res,
        httpStatus.CONFLICT,
        message.USER_ALREADY_EXISTS,
        message.USER_ALREADY_EXISTS
      );
    }

    const createUser = { user_name: userName, password, email };
    const data = await userService.createUserData(createUser);

    const userData = await userService.getUser({ _id: data._id });
    const encryptedPassword = utils.encryptedData(userData.password);
    await userService.updatePassword(
      { password: encryptedPassword },
      { _id: userData._id }
    );

    return sendSuccessResponse(res, httpStatus.CREATED, message.SUCCESS_SIGNUP);
  } catch (err) {
    return sendErrorResponse(
      res,
      httpStatus.INTERNAL_SERVER_ERROR,
      err.message,
      message.SIGNUP_ERROR
    );
  }
};

exports.login = async (req, res) => {
  try {
    const { password, email } = req.body;

    const userData = await userService.getUser({ email });
    if (!userData) {
      return sendErrorResponse(
        res,
        httpStatus.UNAUTHORIZED,
        message.USER_NOT_FOUND,
        message.USER_NOT_FOUND
      );
    }

    const decryptPassword = utils.decryptPassword(userData.password);
    if (decryptPassword !== password) {
      return sendErrorResponse(
        res,
        httpStatus.UNAUTHORIZED,
        message.INVALID,
        message.INVALID
      );
    }

    const otp = utils.generateOTP();
    const expireTime = moment().add(1, "hour").format("YYYY-MM-DD h:mm:ss");

    await otpService.createOtp({ otp, expireTime, otp_status: "send" });

    const emailData = await templateService.emailTemplate({
      template_name: "otp generation",
    });
    let templateBody = await emailData.body;

    if (templateBody) {
      templateBody = templateBody.replace(/{otp}/g, otp);
      await utils.sendMail(userData.email, "loginOTP", templateBody);
    }

    const token = utils.generateTokenId();
    await userService.createLoginData(userData, token);

    return sendSuccessResponse(res, httpStatus.OK, message.SEND_OTP, { token });
  } catch (err) {
    return sendErrorResponse(
      res,
      httpStatus.INTERNAL_SERVER_ERROR,
      err.message,
      message.LOGIN_ERROR
    );
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { otp, token } = req.body;

    const tokenData = await userService.getUser({ login_token: token });
    if (!tokenData) {
      return sendErrorResponse(
        res,
        httpStatus.UNAUTHORIZED,
        message.INVALID_TOKEN,
        message.INVALID_TOKEN
      );
    }

    const userData = await userService.getUser({
      login_token: tokenData.login_token,
    });
    if (!userData) {
      return sendErrorResponse(
        res,
        httpStatus.UNAUTHORIZED,
        message.USER_NOT_FOUND,
        message.USER_NOT_FOUND
      );
    }

    const existingOTP = await otpService.getOTP({ otp, otp_status: "send" });
    if (!existingOTP) {
      return sendErrorResponse(
        res,
        httpStatus.CONFLICT,
        message.ALREADY_VERIFIED_OTP,
        message.ALREADY_VERIFIED_OTP
      );
    }

    await otpService.updateOTP({ otp_status: "verify" }, { otp });

    const createToken = utils.createToken(userData, process.env.JWT_SECRET);
    return sendSuccessResponse(res, httpStatus.OK, message.SUCCESS, {
      createToken,
    });
  } catch (err) {
    return sendErrorResponse(
      res,
      httpStatus.INTERNAL_SERVER_ERROR,
      err.message,
      message.LOGIN_ERROR
    );
  }
};

exports.getUserRepository = async (req, res) => {
  try {
    const { user } = req;
    const { username: userName } = req.params;
    const limit = parseInt(req.query.limit, 10) || 1000;
    const offset = parseInt(req.query.offset, 10) || 0;

    const userData = await userService.getUser({ email: user.email });
    if (!userData) {
      return sendErrorResponse(
        res,
        httpStatus.UNAUTHORIZED,
        message.USER_NOT_FOUND,
        message.USER_NOT_FOUND
      );
    }

    const getFavoriteData = await getFavourite({
      userId: userData._id,
      islike: true,
    });
    const headers = {
      Authorization: `token ${process.env.GIT_TOKEN}`,
      "Content-Type": "application/json",
      accept: "application/vnd.github+json",
    };
    const { data: repoData } = await axios.get(
      `https://api.github.com/users/${userName}/repos`,
      { headers }
    );

    const repositoriesData = repoData.map((repo) => ({
      id: repo?.id,
      avatar_url: repo?.owner.avatar_url,
      watchers_count: repo?.watchers_count,
      full_name: repo?.full_name,
      description: repo?.description,
      watchers: repo?.watchers,
      islike: getFavoriteData.some((fav) => fav.repo_id === repo?.id),
    }));

    const sortedRepositories = repositoriesData.sort(
      (a, b) => b.watchers - a.watchers
    );
    const totalRecord = sortedRepositories.slice(
      offset * limit,
      (offset + 1) * limit
    );

    return sendSuccessResponse(
      res,
      httpStatus.OK,
      message.USER_REPO_DATA_SUCCESS,
      {
        offset: offset + 1,
        totalOffsets: Math.ceil(repositoriesData.length / limit),
        itemsLimit: limit,
        total: repositoriesData.length,
        totalRecord,
      }
    );
  } catch (err) {
    return sendErrorResponse(
      res,
      httpStatus.INTERNAL_SERVER_ERROR,
      err.message,
      message.INTERNAL_SERVER_ERROR
    );
  }
};

exports.addAndRemoveFavourite = async (req, res) => {
  try {
    const { user } = req;
    const { repoId } = req.body;

    const userData = await userService.getUser({ email: user.email });
    if (!userData) {
      return sendErrorResponse(
        res,
        httpStatus.UNAUTHORIZED,
        message.USER_NOT_FOUND,
        message.USER_NOT_FOUND
      );
    }

    const getFavoriteData = await getFavourite({
      userId: userData._id,
      repo_id: repoId,
    });
    let isLike = false;

    if (!getFavoriteData.length) {
      isLike = true;
      await createFavourite({
        userId: userData._id,
        repo_id: repoId,
        islike: true,
      });
    } else {
      isLike = !getFavoriteData[0].islike;
      await favouriteUpdate(
        { islike: isLike },
        { userId: userData._id, repo_id: repoId }
      );
    }

    return sendSuccessResponse(
      res,
      httpStatus.OK,
      isLike ? "Add to favourite" : "Remove from favourite"
    );
  } catch (err) {
    return sendErrorResponse(
      res,
      httpStatus.INTERNAL_SERVER_ERROR,
      err.message,
      message.INTERNAL_SERVER_ERROR
    );
  }
};

exports.getallFavorite = async (req, res) => {
  try {
    const { user } = req;

    const userData = await userService.getUser({ email: user?.email });
    if (!userData) {
      return sendErrorResponse(
        res,
        httpStatus.UNAUTHORIZED,
        message.USER_NOT_FOUND,
        message.USER_NOT_FOUND
      );
    }

    const getFavoriteData = await getFavourite({
      userId: userData?._id,
      islike: true,
    });
    return sendSuccessResponse(
      res,
      httpStatus.OK,
      message.FETCH_FEV_LIST_SUCCESS,
      { favRepos: getFavoriteData }
    );
  } catch (err) {
    return sendErrorResponse(
      res,
      httpStatus.INTERNAL_SERVER_ERROR,
      err.message,
      message.INTERNAL_SERVER_ERROR
    );
  }
};
