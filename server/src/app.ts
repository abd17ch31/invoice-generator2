import express from "express";
import cors from "cors";
import "dotenv/config";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";


const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://invoice-generator2-phi.vercel.app"
    ],
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "SaaS Invoice API is running",
  });
});

app.use("/api/users", userRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/customers", customerRoutes);

app.use("/api/invoices", invoiceRoutes);

app.use("/api/dashboard", dashboardRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});