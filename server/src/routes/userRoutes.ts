import express from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import prisma from "../config/database.js";
import { Role } from "../generated/prisma/enums.js";
import {
  authenticate,
  requireAdmin,
  AuthRequest,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Strict rate limit for registration: 5 per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many accounts created from this IP, please try again later",
  },
});

// GET /api/users (admin only)
router.get(
  "/",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const users = await prisma.user.findMany({
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      res.json({
        success: true,
        users,
      });
    } catch (error) {
      console.error("Error fetching users:", error);

      res.status(500).json({
        success: false,
        message: "Failed to fetch users",
      });
    }
  }
);

// PUT /api/users/:id (admin only) - edit name, email, role, password
router.put(
  "/:id",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const id = String(req.params.id);
      const { name, email, role, password } = req.body;

      const existing = await prisma.user.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const data: {
        name?: string;
        email?: string;
        role?: Role;
        password?: string;
      } = {};

      if (name !== undefined && name !== "") data.name = name;
      if (email !== undefined && email !== "") data.email = email;

      if (role !== undefined) {
        if (role !== "ADMIN" && role !== "USER") {
          return res.status(400).json({
            success: false,
            message: "Role must be ADMIN or USER",
          });
        }
        data.role = role as Role;
      }

      if (password !== undefined && password !== "") {
        if (password.length < 6) {
          return res.status(400).json({
            success: false,
            message: "Password must be at least 6 characters",
          });
        }
        data.password = await bcrypt.hash(password, 12);
      }

      // Prevent admin from changing their own role to USER (lockout protection)
      if (
        req.user!.userId === id &&
        role !== undefined &&
        role !== "ADMIN"
      ) {
        return res.status(400).json({
          success: false,
          message: "You cannot demote your own account",
        });
      }

      const user = await prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      console.error("Error updating user:", error);

      res.status(500).json({
        success: false,
        message: "Failed to update user",
      });
    }
  }
);

// DELETE /api/users/:id (admin only) - cascade deletes their data
router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const id = String(req.params.id);

      if (req.user!.userId === id) {
        return res.status(400).json({
          success: false,
          message: "You cannot delete your own account",
        });
      }

      const existing = await prisma.user.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      await prisma.user.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "User deleted",
      });
    } catch (error) {
      console.error("Error deleting user:", error);

      res.status(500).json({
        success: false,
        message: "Failed to delete user",
      });
    }
  }
);

// POST /api/users/register
router.post("/register", registerLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Check whether user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      user,
    });
  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create account",
    });
  }
});

export default router;
