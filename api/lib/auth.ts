import jwt from 'jsonwebtoken';

// Manual cookie parser to avoid ES module issues
function parseCookie(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieString) return cookies;
  
  cookieString.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name) {
      cookies[name] = decodeURIComponent(rest.join('='));
    }
  });
  
  return cookies;
}

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
    if (!req.headers?.cookie) {
      return null;
    }
    
    const cookies = parseCookie(req.headers.cookie);
    const token = cookies['auth-token'];
    
    if (!token) {
      return null;
    }
    
    if (!JWT_SECRET || JWT_SECRET === 'your-secret-key-change-in-production') {
      console.error('JWT_SECRET is not set or using default value');
      return null;
    }
    
    return verifyToken(token);
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

export function getAuthCookie(token: string): string {
  const isProduction = process.env.VERCEL_ENV === 'production';
  const secureFlag = isProduction ? '; Secure' : '';
  return `auth-token=${token}; HttpOnly${secureFlag}; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 7}`;
}

export function getClearAuthCookie(): string {
  const isProduction = process.env.VERCEL_ENV === 'production';
  const secureFlag = isProduction ? '; Secure' : '';
  return `auth-token=; HttpOnly${secureFlag}; SameSite=Lax; Path=/; Max-Age=0`;
}

