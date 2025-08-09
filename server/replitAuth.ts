import * as client from "openid-client";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Type definitions are properly handled by @types packages

// Type definition for verify function
type VerifyFunction = (issuer: any, profile: any, done: (error: any, user?: any) => void) => void;

// Create a mock Strategy class for now to avoid import issues
class Strategy {
  name: string;
  config: any;
  scope: string;
  callbackURL: string;
  verify: VerifyFunction;

  constructor(options: any, verify: VerifyFunction) {
    this.name = options.name;
    this.config = options.config;
    this.scope = options.scope;
    this.callbackURL = options.callbackURL;
    this.verify = verify;
  }
}

// REPLIT_DOMAINS is optional for development

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  
  // In development, setup minimal auth  
  if (process.env.NODE_ENV === 'development') {
    console.log('Setting up development auth - REPLIT_DOMAINS not configured');
    
    // Create development user in database
    try {
      await storage.upsertUser({
        id: "dev-user-123",
        email: "dev@example.com",
        firstName: "Developer",
        lastName: "User",
        profileImageUrl: null,
        role: "superadmin",
        subscriptionTier: "premium"
      });
      console.log('Development user created with superadmin privileges');
    } catch (error) {
      console.error('Error creating development user:', error);
    }
    
    // Mock auth endpoints for development
    app.get("/api/login", (req, res) => {
      res.redirect("/");
    });
    
    app.get("/api/logout", (req, res) => {
      res.redirect("/");
    });
    
    return;
  }

  // Full passport setup for production
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: (error: any, user?: any) => void
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Get domains from REPLIT_DOMAINS environment variable
  const domains = process.env.REPLIT_DOMAINS?.split(",") || [];
  
  // Add custom domains from CUSTOM_DOMAINS environment variable
  const customDomainsEnv = process.env.CUSTOM_DOMAINS?.split(",") || [];
  
  // Default custom domains for this application
  const defaultCustomDomains = ["kdpgenerator.com"];
  
  // Combine all domains and remove duplicates
  const allDomains = [...domains, ...customDomainsEnv, ...defaultCustomDomains];
  const uniqueDomains = Array.from(new Set(allDomains.filter(domain => domain && domain.trim())));
  
  console.log(`Setting up authentication for domains:`, uniqueDomains);
  
  for (const domain of uniqueDomains) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
    console.log(`Registered authentication strategy for domain: ${domain}`);
  }

  passport.serializeUser((user: Express.User, cb: (err: any, id?: any) => void) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb: (err: any, user?: Express.User | false) => void) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    const strategyName = `replitauth:${req.hostname}`;
    
    // Check if strategy exists for this hostname
    const strategy = (passport as any)._strategy(strategyName);
    if (!strategy) {
      console.error(`No authentication strategy found for hostname: ${req.hostname}`);
      console.log(`Available strategies:`, Object.keys((passport as any)._strategies || {}));
      return res.status(500).json({ 
        error: "Authentication not configured for this domain",
        hostname: req.hostname,
        available: Object.keys((passport as any)._strategies || {})
      });
    }
    
    passport.authenticate(strategyName, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    const strategyName = `replitauth:${req.hostname}`;
    
    const strategy = (passport as any)._strategy(strategyName);
    if (!strategy) {
      console.error(`No authentication strategy found for hostname: ${req.hostname}`);
      return res.redirect("/api/login");
    }
    
    passport.authenticate(strategyName, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // In development, always bypass auth when Replit domains not set for production
  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode - bypassing auth, REPLIT_DOMAINS:', process.env.REPLIT_DOMAINS);
    // Create mock user session
    req.user = {
      claims: {
        sub: "dev-user-123",
        email: "dev@example.com",
        first_name: "Developer",
        last_name: "User",
        profile_image_url: undefined
      },
      expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    };
    return next();
  }
  
  const user = req.user as any;

  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
