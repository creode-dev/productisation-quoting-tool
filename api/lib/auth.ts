import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface User {
  email: string;
  name?: string;
  picture?: string;
}

export function generateToken(user: User): string {
  return jwt.sign(
    { email: user.email, name: user.name, picture: user.picture },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
    };
  } catch (error) {
    return null;
  }
}

export function getCurrentUser(req: { headers: { cookie?: string } }): User | null {
  try {
    const cookies = parse(req.headers.cookie || '');
    const token = cookies['auth-token'];
    
    if (!token) {
      return null;
    }
    
    return verifyToken(token);
  } catch (error) {
    return null;
  }
}

export function getAuthCookie(token: string): string {
  return `auth-token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 7}`;
}

export function getClearAuthCookie(): string {
  return 'auth-token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0';
}

