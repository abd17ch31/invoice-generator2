import express from "express";
import prisma from "../config/database.js";
import {
  authenticate,
  AuthRequest,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/customers
router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        userId: req.user!.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      customers,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
    });
  }
});

// GET /api/customers/:id
router.get("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const customerId = String(req.params.id);

    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        userId: req.user!.userId,
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error("Error fetching customer:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch customer",
    });
  }
});

// POST /api/customers
router.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, email, phone, address } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required",
      });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        userId: req.user!.userId,
      },
    });

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer,
    });
  } catch (error) {
    console.error("Error creating customer:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create customer",
    });
  }
});

// PUT /api/customers/:id
router.put("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const customerId = String(req.params.id);
    const { name, email, phone, address } = req.body;

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        userId: req.user!.userId,
      },
    });

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required",
      });
    }

    const customer = await prisma.customer.update({
      where: {
        id: customerId,
      },
      data: {
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
      },
    });

    res.json({
      success: true,
      message: "Customer updated successfully",
      customer,
    });
  } catch (error) {
    console.error("Error updating customer:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update customer",
    });
  }
});

// DELETE /api/customers/:id
router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const customerId = String(req.params.id);

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        userId: req.user!.userId,
      },
    });

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    await prisma.customer.delete({
      where: {
        id: customerId,
      },
    });

    res.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting customer:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete customer",
    });
  }
});

export default router;