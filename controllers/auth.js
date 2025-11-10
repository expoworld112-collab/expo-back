import User from "../models/user.js"
import Blog from "../models/blog.js"
import jwt from "jsonwebtoken"
import _ from "lodash"
import { expressjwt } from "express-jwt"
import "dotenv/config.js";
import { errorHandler } from "../helpers/dbErrorHandler.js"
import sgMail from "@sendgrid/mail"
import nodemailer from 'nodemailer';
import { API } from '../config.js';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    tls: { rejectUnauthorized: false },
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// export const preSignup = async (req, res) => {
//     try {
//         const { name, email, username, password } = req.body;

//         const existingUser = await User.findOne({ email: email.toLowerCase() });
//         if (existingUser) {
//             return res.status(400).json({ error: 'Email is taken' });
//         }

//         const token = jwt.sign(
//             { name, username, email, password },
//             process.env.JWT_ACCOUNT_ACTIVATION,
//             { expiresIn: '10m' }
//         );



//         const mailOptions = {
//             from: process.env.SMTP_USER,
//             to: email,
//             subject: 'Account activation link',
//             html: `
//                 <p>Please use the following link to activate your account:</p>
//                 <p>${process.env.MAIN_URL}/auth/account/activate/${token}</p>
//                 <hr />
//             `
//         };

//         await transporter.sendMail(mailOptions);

//         res.json({
//             message: `Email has been sent to ${email}. Follow the instructions to activate your account.`
//         });

//     } catch (err) {
//         console.log(err);
//         res.status(400).json({ error: errorHandler(err) });
//     }
// };
// export const preSignup = async (user) => {
//   try {
//     const res = await fetch(`${API}/pre-signup`, {
//       method: "POST",
//       headers: {
//         Accept: "application/json",
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(user),
//     });

//     const text = await res.text();
//     console.log("Pre-signup response:", res.status, text);

//     if (!res.ok) {
//       let message = "Request failed";
//       try {
//         const data = JSON.parse(text);
//         message = data.error || message;
//       } catch (e) {
//         message = text || message;
//       }
//       return { error: message };
//     }

//     return JSON.parse(text);
//   } catch (err) {
//     console.error("Network or parsing error:", err);
//     return { error: "Something went wrong. Please try again later." };
//   }
// };


// export const preSignup = async (user) => {
//   try {
//     const res = await fetch(`${API}/pre-signup`, {
//       method: "POST",
//       headers: {
//         Accept: "application/json",
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(user),
//     });

//     const text = await res.text();
//     console.log("Pre-signup response:", res.status, text);

//     if (!res.ok) {
//       let message = "Request failed";
//       try {
//         const data = JSON.parse(text);
//         message = data.error || message;
//       } catch (e) {
//         message = text || message;
//       }
//       return { error: message };
//     }

//     return JSON.parse(text);
//   } catch (err) {
//     console.error("Network or parsing error:", err);
//     return { error: "Something went wrong. Please try again later." };
//   }
// };
// backend preSignup
export const preSignup = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is taken' });
    }

    const token = jwt.sign(
      { name, username, email, password },
      process.env.JWT_ACCOUNT_ACTIVATION,
      { expiresIn: '10m' }
    );

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Account activation link',
      html: `<p>Click to activate: ${process.env.MAIN_URL}/auth/account/activate/${token}</p>`
    };

    await transporter.sendMail(mailOptions);

    res.json({
      message: `Email has been sent to ${email}. Follow the instructions to activate your account.`
    });

  } catch (err) {
    console.error('PreSignup Error:', err);
    res.status(400).json({ error: err.message });
  }
};



export const signup = async (req, res) => {
    const token = req.body.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION);

            if (decoded) {
                const { name, username, email, password } = jwt.decode(token);
                const usernameurl = username.toLowerCase();
                const profile = `${process.env.MAIN_URL}/profile/${usernameurl}`;
                const user = new User({ name, email, password, profile, username });
                await user.save();
                res.json({ message: 'Signup success! Please sign in' });
            }
            else { res.status(401).json({ error: 'Expired link. Signup again' }); }

        } catch (err) { res.status(401).json({ error: 'Expired link. Signup again' }); }
    } else { res.json({ message: 'Something went wrong. Try again' }); }
};



export const signin = async (req, res) => {
    const { password } = req.body;
    try {
        const user = await User.findOne({ email: req.body.email }).exec();

        if (!user) { return res.status(400).json({ error: 'User with that email does not exist. Please sign up.' }); }
        if (!user.authenticate(password)) { return res.status(400).json({ error: 'Email and password do not match.' }); }
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '100d' });
        res.cookie('token', token, { expiresIn: '1d' });
        const { _id, username, name, email, role } = user;
        res.json({ token, user: { _id, username, name, email, role } });
    } catch (err) { res.status(400).json({ error: errorHandler(err) }); }
};




export const signout = (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Signout success' });
};


export const requireSignin = expressjwt({
    secret: process.env.JWT_SECRET,
    algorithms: ["HS256"],
    userProperty: "auth",
});



export const authMiddleware = async (req, res, next) => {
    try {
        const authUserId = req.auth._id;
        const user = await User.findById({ _id: authUserId }).exec();

        if (!user) { return res.status(400).json({ error: 'User not found' }); }
        req.profile = user;
        next();
    } catch (err) { res.status(400).json({ error: errorHandler(err) }); }
};



export const adminMiddleware = async (req, res, next) => {
    try {
        const adminUserId = req.auth._id;
        const user = await User.findById({ _id: adminUserId }).exec();
        if (!user) { return res.status(400).json({ error: 'User not found' }); }
        if (user.role !== 1) { return res.status(400).json({ error: 'Admin resource. Access denied' }); }
        req.profile = user;
        next();
    } catch (err) { res.status(400).json({ error: errorHandler(err) }); }
};



export const canUpdateDeleteBlog = async (req, res, next) => {
    try {
        const slug = req.params.slug.toLowerCase();
        const data = await Blog.findOne({ slug }).exec();

        if (!data) { return res.status(400).json({ error: errorHandler(err) }); }
        const authorizedUser = data.postedBy._id.toString() === req.profile._id.toString();

        if (!authorizedUser) { return res.status(400).json({ error: 'You are not authorized' }); }
        next();
    } catch (err) { res.status(400).json({ error: errorHandler(err) }); }
};



export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'User with that email does not exist' });
        }

        const token = jwt.sign(
            { _id: user._id },
            process.env.JWT_RESET_PASSWORD,
            { expiresIn: '10m' }
        );

        const mailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Password reset link',
            html: `
                <p>Please use the following link to reset your password:</p>
                <p>${process.env.MAIN_URL}/auth/password/reset/${token}</p>
                <hr />
                <p>This email may contain sensitive information</p>
                <p>${process.env.MAIN_URL}</p>
            `
        };

        await user.updateOne({ resetPasswordLink: token });
        await transporter.sendMail(mailOptions);

        res.json({
            message: `Email has been sent to ${email}. Follow the instructions to reset your password. Link expires in 10 minutes.`
        });

    } catch (err) {
        console.log(err);
        res.status(400).json({ error: errorHandler(err) });
    }
};


export const resetPassword = async (req, res) => {
    const { resetPasswordLink, newPassword } = req.body;
    if (resetPasswordLink) {
        try {
            const decoded = jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD);
            if (decoded) {
                const user = await User.findOne({ resetPasswordLink });

                if (!user) { return res.status(401).json({ error: 'Something went wrong. Try later' }); }
                const updatedFields = { password: newPassword, resetPasswordLink: '' };
                user.set(updatedFields);
                await user.save();

                res.json({ message: 'Great! Now you can login with your new password' });
            } else { return res.status(401).json({ error: 'Expired link. Try again' }); }
        } catch (err) { res.status(400).json({ error: errorHandler(err) }); }
    }
};


