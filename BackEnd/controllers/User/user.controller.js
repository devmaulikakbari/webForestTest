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

exports.signUp = async (req, res) => {
  try {
    const createUser = {
      user_name: req.body.userName,
      password: req.body.password,
      email: req.body.email,
    };

    const ifAlreadyExist = await userService.getUser({
      email: createUser.email,
    });

    if (ifAlreadyExist) {
      const response = {
        responseCode: 409,
        message: message.USER_ALREADY_EXISTS,
      };
      return res.status(httpStatus.CONFLICT).json(response);
    }

    const data = await userService.createUserData(createUser);

    const userData = await userService.getUser({
      _id: data._id,
    });

    const encryptedPassword = await utils.encryptedData(userData.password);
    await userService.updatePassword(
      { password: encryptedPassword },
      {
        _id: userData._id,
      }
    );

    const response = {
      responseCode: httpStatus.OK,
      message: message.SUCCESSSIGNUP,
    };

    res.status(200).send(response);
  } catch (err) {
    const errorMsg = err.errors ? err.errors[0].message : err.message;
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      msg: errorMsg,
      error: message.SIGNUPERROR,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { password, email } = req.body;

    const userData = await userService.getUser({ email });

    if (!userData) {
      const response = {
        responseCode: 401,
        message: message.USERNOTFOUND,
      };
      return res.status(httpStatus.UNAUTHORIZED).json(response);
    }
    const decryptPassword = utils.decryptPassword(userData.password);
    if (decryptPassword !== password) {
      const response = {
        responseCode: 401,
        message: message.INVALID,
      };
      return res.status(httpStatus.UNAUTHORIZED).json(response);
    }

    const otp = utils.generateOTP();
    const expireTime = moment().add(1, "hour").format("YYYY-MM-DD h:mm:ss");

    await otpService.createOtp({
      otp: otp,
      expireTime: expireTime,
      otp_status: "send",
    });

    const emailData = await templateService.emailTemplate({
      template_name: "otp generation",
    });
    let templateBody = await emailData.body;

    const object = {
      otp: otp,
    };

    for (const key in object) {
      templateBody = templateBody
        ? templateBody.replace(new RegExp(`{${key}}`, "g"), `${object[key]}`)
        : null;
    }

    if (templateBody) {
      await utils.sendMail(userData.email, "loginOTP", templateBody);
    }

    const token = utils.generateTokenId();
    await userService.createLoginData(userData, token);

    const response = {
      token,
      otp,
      responseCode: httpStatus.OK,
      message: message.SEND_OTP,
    };

    res.status(200).send(response);
  } catch (err) {
    const errorMsg = err.errors ? err.errors[0].message : err.message;
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      msg: errorMsg,
      error: message.LOGINERROR,
    });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { otp, token } = req.body;

    const tokenData = await userService.getUser({
      login_token: token,
    });

    if (!tokenData) {
      const response = {
        responseCode: 401,
        message: message.INVALIDTOKEN,
      };
      return res.status(httpStatus.UNAUTHORIZED).json(response);
    }

    const userData = await userService.getUser({
      login_token: tokenData.login_token,
    });

    const existingOTP = await otpService.getOTP({
      otp: otp,
      otp_status: "send",
    });
    if (!existingOTP) {
      const response = {
        responseCode: 409,
        message: message.ALREADY_VERIFIED_OTP,
      };
      return res.status(httpStatus.CONFLICT).json(response);
    }

    // if (moment().isAfter(moment(existingOTP.expireTime))) {
    //   await otpService.updateOTP(
    //     {
    //       otp_status: "expire",
    //     },
    //     {
    //       otp: otp,
    //     }
    //   );
    //   return res.status(403).json({ message: message.OTP_EXPIRE });
    // }

    await otpService.updateOTP(
      {
        otp_status: "verify",
      },
      {
        otp: otp,
      }
    );

    const createToken = utils.createToken(userData, process.env.JWT_SECRET);
    const response = {
      createToken,
      responseCode: httpStatus.OK,
      message: message.SUCCESS,
    };

    res.status(200).json(response);
  } catch (err) {
    const errorMsg = err.errors ? err.errors[0].message : err.message;
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      msg: errorMsg,
      message: message.LOGINERROR,
    });
  }
};

exports.getUserRepository = async (req, res) => {
  try {
    const user = req.user;
    const userName = req.params.username;
    const limit = parseInt(req.query.per_offset) || 10;
    const offset = parseInt(req.query.offset) || 0;


    const apiUrl = "https://api.github.com";

     const token = process.env.GIT_TOKEN;
      const headers = {
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
      accept: "application/vnd.github+json",
    };
    const userData = await userService.getUser({
      email: user.email,
    });
    const getFavoriteData = await getFavourite({
      userId: userData._id,
      islike: true,
    });

    const response = await axios.get(`${apiUrl}/users/${userName}/repos`, {
      headers,
    });

    const repositoriesData = response.data.map((repo) => {
      const isLike = !!getFavoriteData.find(
        (ele) => Number(ele.repo_id) === Number(repo.id)
      );
      return {
        id: repo.id,
        avatar_url: repo.owner.avatar_url,
        watchers_count: repo.watchers_count,
        full_name: repo.full_name,
        description: repo.description,
        watchers: repo.watchers,
        islike: isLike,
      };
    });

    const sortedRepositories = repositoriesData.sort(
      (a, b) => b.watchers - a.watchers
    );

    const startIndex = offset * limit;
    const endIndex = startIndex + limit;
    const totalRecord = sortedRepositories.slice(startIndex, endIndex);
    const totalItems = repositoriesData.length;
    const totalOffsets = Math.ceil(totalItems / limit);

    const responseData = {
      offset: offset + 1,
      totalOffsets,
      itemsLimit: limit,
      total: totalItems,
      totalRecord,
      message: message.USER_REPO_DATA_SUCCESS,
    };

    res.status(httpStatus.OK).send(responseData);
  } catch (err) {
    const errorMsg = err.response ? err.response.data.message : err.message;
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      msg: errorMsg,
      message: "INTERNAL_SERVER_ERROR",
    });
  }
};

exports.addAndRemoveFavourite = async (req, res) => {
  try {
    const user = req.user;
    const { repoId } = req.body;
    let isLike = false;
    const userData = await userService.getUser({
      email: user.email,
    });
    const getFavoriteData = await getFavourite({
      userId: userData._id,
      repo_id: repoId,
    });

    if (!getFavoriteData || !getFavoriteData.length) {
      isLike = true;
      await createFavourite({
        userId: userData._id,
        repo_id: repoId,
        islike: true,
      });
    } else {
      const fav = getFavoriteData?.[0]?.islike;
      isLike = !fav;
      await favouriteUpdate(
        { islike: !fav },
        { userId: userData._id, repo_id: repoId }
      );
    }

    res.status(httpStatus.OK).send({
      message: `${isLike ? "Add to favourite" : "Remove from favourite"}`,
    });
  } catch (err) {
    const errorMsg = err.response ? err.response.data.message : err.message;
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      msg: errorMsg,
      message: "INTERNAL_SERVER_ERROR",
    });
  }
};

exports.getallFavorite = async (req, res) => {
  try {
    const user = req.user;
    const userData = await userService.getUser({
      email: user.email,
    });
    const getFavoriteData = await getFavourite({
      userId: userData._id,
      islike: true,
    });

    res.status(httpStatus.OK).send({
      message: message.FETCH_FEV_LIST_SUCCESS,
      favRepos: getFavoriteData,
    });
  } catch (err) {
    const errorMsg = err.response ? err.response.data.message : err.message;
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      msg: errorMsg,
      message: "INTERNAL_SERVER_ERROR",
    });
  }
};
