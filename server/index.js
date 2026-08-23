import express from 'express';
import dotenv from "dotenv";
import connectDb from './config/connectDb.js';
import cors from "cors";
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.route.js';
import userRouter from './routes/user.route.js';
import interviewRouter from './routes/interview.route.js';
import paymentRouter from './routes/payment.route.js';
import adminRouter from './routes/admin.route.js';

dotenv.config();

const app = express();

// Use FRONTEND_URL env var so the same server works locally AND on Render.
// FRONTEND_URL is already defined in .env — just update it to your Vercel URL.
app.use(cors({

  origin: process.env.FRONTEND_URL,
  credentials: true
}));


app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  next();
});

app.use("/api/auth",      authRouter);
app.use("/api/user",      userRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/payment",   paymentRouter);
app.use("/api/admin",     adminRouter);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectDb();
});
