// Type declarations for passport and related modules
declare module 'passport' {
  import type { Request } from 'express';
  
  interface Authenticator {
    use(strategy: any): this;
    use(name: string, strategy: any): this;
    authenticate(strategy: string, options?: any): any;
    serializeUser<TUser>(fn: (user: TUser, done: (err: any, id?: any) => void) => void): void;
    deserializeUser<TUser>(fn: (id: any, done: (err: any, user?: TUser | false) => void) => void): void;
    initialize(): any;
    session(): any;
    _strategy(name: string): any;
    _strategies: { [key: string]: any };
  }

  const passport: Authenticator;
  export = passport;
}

declare module 'express-session' {
  export interface SessionOptions {
    secret: string | string[];
    store?: any;
    resave?: boolean;
    saveUninitialized?: boolean;
    cookie?: {
      httpOnly?: boolean;
      secure?: boolean;
      maxAge?: number;
    };
  }
  
  function session(options: SessionOptions): any;
  export = session;
}

declare module 'connect-pg-simple' {
  function connectPg(session: any): any;
  export = connectPg;
}

// Extend Express Request interface
declare namespace Express {
  interface User {
    claims?: {
      sub: string;
      email: string;
      first_name: string;
      last_name: string;
      profile_image_url?: string;
    };
    expires_at?: number;
    refresh_token?: string;
    access_token?: string;
  }

  interface Request {
    user?: User;
    logout(callback: (err: any) => void): void;
    isAuthenticated(): boolean;
  }
}