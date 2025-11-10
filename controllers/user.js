import User from "../models/user.js";
import Blog from "../models/blog.js";
import { errorHandler } from "../helpers/dbErrorHandler.js";
import fs from "fs";
import formidable from "formidable";
import _ from "lodash";

export const read = (req, res) => {
    req.profile.hashed_password = undefined;
    return res.json(req.profile);
};

export const publicProfile = (req, res) => {
    let username = req.params.username;
    let user;
    let blogs;

    User.findOne({ username }).exec((err, userFromDB) => {
        if (err || !userFromDB) {
            return res.status(400).json({
                error: 'User not found'
            });
        }
        user = userFromDB;
        let userId = user._id;
        Blog.find({ postedBy: userId })
            .populate('categories', '-_id name slug')
            .populate('tags', '-_id name slug')
            .populate('postedBy', '_id name')
            .limit(10)
            .select('-_id title slug excerpt categories tags postedBy createdAt updatedAt')
            .exec((err, data) => {
                if (err) {
                    return res.status(400).json({
                        error: errorHandler(err)
                    });
                }
                user.photo = undefined;
                user.hashed_password = undefined;
                res.json({
                    user,
                    blogs: data
                });
            });
    });
};

export const update = (req, res) => {
    let form = new formidable.IncomingForm();
    form.keepExtension = true;
    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({
                error: 'Photo could not be uploaded'
            });
        }


        let user = req.profile;
          let existingRole = user.role;
          let existingEmail = user.email;
        user = _.merge(user, fields);


        user.role = existingRole;
        user.email = existingEmail;

        const {password} = fields;
        function validatePassword(password) {
            const lowercaseRegex = /[a-z]/;
            const uppercaseRegex = /[A-Z]/;
            const numericRegex = /[0-9]/;
            const specialCharRegex = /[!@#$%^&*]/;
          
            if (
              password.length >= 8 &&
              lowercaseRegex.test(password) &&
              uppercaseRegex.test(password) &&
              numericRegex.test(password) &&
              specialCharRegex.test(password)
            ) {
              return true;
            } else {
              return false;
            }
          }
 

        if (password && (!validatePassword(password)) ) {
            return res.status(400).json({
                error: 'Password should contain at least 1 lowercase, 1 uppercase, 1 numeric, 1 special character and must be 8 characters or longer.'
            });
        }


        if (files.photo) {
            if (files.photo.size > 10000000) {
                return res.status(400).json({
                    error: 'Image should be less than 1mb'
                });
            }
            user.photo.data = fs.readFileSync(files.photo.filepath);
            user.photo.contentType = files.photo.type;
        }

        user.save((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: 'Username is Taken'
                });
            }
            user.hashed_password = undefined;
            user.salt = undefined;
            user.photo = undefined;
            res.json(user);
        });
    });
};





export const photo = (req, res) => {
    const username = req.params.username;
    User.findOne({ username }).exec((err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: 'User not found'
            });
        }
        if (user.photo.data) {
            res.set('Content-Type', user.photo.contentType);
            return res.send(user.photo.data);
        }
    });
};