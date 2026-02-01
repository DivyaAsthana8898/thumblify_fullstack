// import { Request, Response } from 'express';
// import User from '../models/User.js';
// import bcrypt from 'bcrypt';

// // Controllers For User Registration
// export const registerUser = async (req: Request, res: Response) => {
//     try {
//         const { name, email, password } = req.body;

//         // find user by email
//         const user = await User.findOne({ email });
//         if (user) {
//             return res.status(400).json({ message: 'User already exists' });
//         }

//         // Encrypt the password
//         const salt = await bcrypt.genSalt(10);
//         const hashedPassword = await bcrypt.hash(password, salt);

//         const newUser = new User({ name, email, password: hashedPassword });
//         await newUser.save();

//         // setting user data in session
//         req.session.isLoggedIn = true;
//         req.session.userId = newUser._id;

//         return res.json({
//             message: 'Account created successfully',
//             user: {
//                 _id: newUser._id,
//                 name: newUser.name,
//                 email: newUser.email,
//             },
//         });
//     } catch (error: any) {
//         console.log(error);
//         res.status(500).json({ message: error.message });
//     }
// };

// // Controllers For User Login
// export const loginUser = async (req: Request, res: Response) => {
//     try {
//         const { email, password } = req.body;

//         // find user by email
//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(400).json({ message: 'Invalid email or password' });
//         }
//         const isPasswordCorrect = await bcrypt.compare(password, user.password);
//         if (!isPasswordCorrect) {
//             return res.status(400).json({ message: 'Invalid email or password' });
//         }

//         // setting user data in session
//         req.session.isLoggedIn = true;
//         req.session.userId = user._id;

//         return res.json({
//             message: 'Login successful',
//             user: {
//                 _id: user._id,
//                 name: user.name,
//                 email: user.email,
//             },
//         });
//     } catch (error: any) {
//         console.log(error);
//         res.status(500).json({ message: error.message });
//     }
// };

// // Controllers For User Logout
// export const logoutUser = async (req: Request, res: Response) => {
//     req.session.destroy((error: any) => {
//         if (error) {
//             console.log(error);
//             return res.status(500).json({ message: error.message });
//         }
//     });
//     return res.json({ message: 'Logout successful' });
// };

// // Controllers For User Verify
// export const verifyUser = async (req: Request, res: Response) => {
//     try {
//         const { userId } = req.session;

//         const user = await User.findById(userId).select('-password');

//         if (!user) {
//             return res.status(400).json({ message: 'Invalid user' });
//         }

//         return res.json({ user });
//     } catch (error: any) {
//         console.log(error);
//         res.status(500).json({ message: error.message });
//     }
// };
import { Request, Response } from 'express';
import User from '../models/User.js';
import bcrypt from 'bcrypt';

/* =========================
   REGISTER USER
========================= */
export const registerUser = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        // check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
        });

        await newUser.save();

        // store session
        req.session.isLoggedIn = true;
        req.session.userId = newUser._id.toString();

        return res.json({
            message: 'Account created successfully',
            user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
            },
        });
    } catch (error: any) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
};

/* =========================
   LOGIN USER
========================= */
export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // store session
        req.session.isLoggedIn = true;
        req.session.userId = user._id.toString();

        return res.json({
            message: 'Login successful',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error: any) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
};

/* =========================
   LOGOUT USER
========================= */
export const logoutUser = async (req: Request, res: Response) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: 'Logout failed' });
            }

            res.clearCookie('connect.sid'); // IMPORTANT
            return res.json({ message: 'Logout successful' });
        });
    } catch (error: any) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
};

/* =========================
   VERIFY USER ( )
========================= */
export const verifyUser = async (req: Request, res: Response) => {
    try {
        //  : handle unauthenticated users safely
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const user = await User.findById(req.session.userId).select('-password');

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        return res.json({ user });
    } catch (error: any) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
};

