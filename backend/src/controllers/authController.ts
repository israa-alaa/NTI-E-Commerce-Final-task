import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET as string;

// 1. Register User
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // التأكد إن الإيميل مش موجود قبل كده
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists!' });
    }

    // pass hashing
    const hashedPassword = await bcrypt.hash(password, 10);


    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    res.status(201).json({ message: 'User registered successfully', userId: user._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// 2. Login User
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // check pass
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN as string }
    );

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};