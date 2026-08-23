import express from "express";
import prisma from "../config/database.js";
import {
  authenticate,
  AuthRequest,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Dashboard statistics
router.get(
  "/stats",
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;

      const [customerCount, invoiceCount, revenue] =
        await Promise.all([
          prisma.customer.count({
            where: {
              userId,
            },
          }),

          prisma.invoice.count({
            where: {
              userId,
            },
          }),

          prisma.invoice.aggregate({
            where: {
              userId,
            },
            _sum: {
              total: true,
            },
          }),
        ]);

      res.json({
        success: true,
        stats: {
          customers: customerCount,
          invoices: invoiceCount,
          revenue: Number(revenue._sum.total ?? 0),
        },
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);

      res.status(500).json({
        success: false,
        message: "Failed to fetch dashboard statistics",
      });
    }
  }
);

// Recent invoices
router.get(
  "/recent-invoices",
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;

      const invoices = await prisma.invoice.findMany({
        where: {
          userId,
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 5,

        include: {
          customer: true,
        },
      });

      res.json({
        success: true,
        invoices,
      });
    } catch (error) {
      console.error("Error fetching recent invoices:", error);

      res.status(500).json({
        success: false,
        message: "Failed to fetch recent invoices",
      });
    }
  }
);

export default router;