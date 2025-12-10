import { betterAuth } from "better-auth";
import { Pool } from "pg";

// Create PostgreSQL connection pool for Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export const auth = betterAuth({
  database: {
    provider: "pg",
    connection: pool
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      // TODO: Send password reset email
      console.log(`Password reset for ${user.email}: ${url}`);
    },
    sendVerificationEmail: async ({ user, url }) => {
      // TODO: Send verification email
      console.log(`Verification email for ${user.email}: ${url}`);
    }
  },
  user: {
    additionalFields: {
      walletAddress: {
        type: "string",
        required: true,
        defaultValue: () => {
          // Generate wallet address
          return '0x' + Array.from({ length: 40 }, () =>
            '0123456789abcdef'[Math.floor(Math.random() * 16)]
          ).join('');
        }
      },
      walletSeedPhrase: {
        type: "string",
        required: true,
        defaultValue: () => {
          // Generate 12-word seed phrase
          const wordList = [
            'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
            'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid'
          ];
          const seedPhrase = [];
          for (let i = 0; i < 12; i++) {
            seedPhrase.push(wordList[Math.floor(Math.random() * wordList.length)]);
          }
          return seedPhrase.join(' ');
        }
      },
      accountType: {
        type: "string",
        required: false,
        defaultValue: "free"
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "creator"
      }
    }
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24 // Update every 24 hours
  }
});

export type Session = typeof auth.$Infer.Session;
