import express from "express";
import prisma from "../config/database.js";
import {
  authenticate,
  AuthRequest,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// GET ALL INVOICES
// ==========================================

router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        userId: req.user!.userId,
      },
      include: {
        customer: true,
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      invoices,
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch invoices",
    });
  }
});

// ==========================================
// GET SINGLE INVOICE
// ==========================================

router.get("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const invoiceId = String(req.params.id);

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId: req.user!.userId,
      },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error("Error fetching invoice:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch invoice",
    });
  }
});

// ==========================================
// CREATE INVOICE
// ==========================================

router.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const {
      invoiceNumber,
      customerId,
      issueDate,
      dueDate,
      tax = 0,
      discount = 0,
      notes,
      items,
    } = req.body;

    // ------------------------------
    // Basic validation
    // ------------------------------

    if (
      !invoiceNumber ||
      !customerId ||
      !items ||
      !Array.isArray(items)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invoice number, customer and items are required",
      });
    }

    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Invoice must contain at least one item",
      });
    }

    // ------------------------------
    // Verify customer belongs to user
    // ------------------------------

    const customer = await prisma.customer.findFirst({
      where: {
        id: String(customerId),
        userId: req.user!.userId,
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // ------------------------------
    // Calculate item amounts
    // ------------------------------

    const calculatedItems = items.map((item: any) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);

      if (
        !item.description ||
        !Number.isFinite(quantity) ||
        !Number.isFinite(unitPrice) ||
        quantity <= 0 ||
        unitPrice < 0
      ) {
        throw new Error("Invalid invoice item");
      }

      const amount = quantity * unitPrice;

      return {
        description: item.description,
        quantity,
        unitPrice,
        amount,
      };
    });

    // ------------------------------
    // Calculate subtotal
    // ------------------------------

    const subtotal = calculatedItems.reduce(
      (sum: number, item: any) =>
        sum + item.amount,
      0
    );

    // ------------------------------
    // Convert tax & discount
    // from percentage to amount
    // ------------------------------

    const taxPercentage = Number(tax);
    const discountPercentage = Number(discount);

    if (
      !Number.isFinite(taxPercentage) ||
      !Number.isFinite(discountPercentage) ||
      taxPercentage < 0 ||
      discountPercentage < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid tax or discount",
      });
    }

    // Example:
    // subtotal = 400
    // tax = 18
    // taxAmount = 400 * 18 / 100 = 72

    const taxAmount =
      subtotal * (taxPercentage / 100);

    // Amount after tax
    // 400 + 72 = 472

    const amountAfterTax =
      subtotal + taxAmount;

    // Example:
    // 472 * 10 / 100 = 47.20

    const discountAmount =
      amountAfterTax *
      (discountPercentage / 100);

    // Final total
    // 472 - 47.20 = 424.80

    const total =
      amountAfterTax - discountAmount;

    if (total < 0) {
      return res.status(400).json({
        success: false,
        message:
          "Invoice total cannot be negative",
      });
    }

    // ------------------------------
    // Create invoice
    // ------------------------------

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,

        issueDate: issueDate
          ? new Date(issueDate)
          : new Date(),

        dueDate: dueDate
          ? new Date(dueDate)
          : null,

        subtotal,

        // Store actual calculated amount
        tax: taxAmount,

        // Store actual calculated amount
        discount: discountAmount,

        total,

        notes: notes || null,

        userId: req.user!.userId,

        customerId: String(customerId),

        items: {
          create: calculatedItems,
        },
      },

      include: {
        customer: true,
        items: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      invoice,
    });
  } catch (error) {
    console.error(
      "Error creating invoice:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to create invoice",
    });
  }
});

// ==========================================
// UPDATE INVOICE
// ==========================================

router.put("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const invoiceId = String(req.params.id);

    const existingInvoice =
      await prisma.invoice.findFirst({
        where: {
          id: invoiceId,
          userId: req.user!.userId,
        },
      });

    if (!existingInvoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const {
      customerId,
      issueDate,
      dueDate,
      tax = 0,
      discount = 0,
      notes,
      items,
      status,
    } = req.body;

    // ------------------------------
    // Verify customer
    // ------------------------------

    if (customerId) {
      const customer =
        await prisma.customer.findFirst({
          where: {
            id: String(customerId),
            userId: req.user!.userId,
          },
        });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }
    }

    // ------------------------------
    // Recalculate items
    // ------------------------------

    let calculatedItems: {
      description: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    }[] = [];

    if (Array.isArray(items)) {
      if (items.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "Invoice must contain at least one item",
        });
      }

      calculatedItems = items.map(
        (item: any) => {
          const quantity = Number(
            item.quantity
          );

          const unitPrice = Number(
            item.unitPrice
          );

          if (
            !item.description ||
            !Number.isFinite(quantity) ||
            !Number.isFinite(unitPrice) ||
            quantity <= 0 ||
            unitPrice < 0
          ) {
            throw new Error(
              "Invalid invoice item"
            );
          }

          return {
            description: item.description,
            quantity,
            unitPrice,
            amount:
              quantity * unitPrice,
          };
        }
      );
    }

    // ------------------------------
    // Calculate subtotal
    // ------------------------------

    const subtotal =
      calculatedItems.length
        ? calculatedItems.reduce(
            (sum, item) =>
              sum + item.amount,
            0
          )
        : Number(
            existingInvoice.subtotal
          );

    // ------------------------------
    // Calculate tax & discount
    // as percentages
    // ------------------------------

    const taxPercentage = Number(tax);
    const discountPercentage =
      Number(discount);

    if (
      !Number.isFinite(taxPercentage) ||
      !Number.isFinite(
        discountPercentage
      ) ||
      taxPercentage < 0 ||
      discountPercentage < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid tax or discount",
      });
    }

    // Tax percentage

    const taxAmount =
      subtotal *
      (taxPercentage / 100);

    // Amount after tax

    const amountAfterTax =
      subtotal + taxAmount;

    // Discount percentage
    // calculated AFTER tax

    const discountAmount =
      amountAfterTax *
      (discountPercentage / 100);

    // Final total

    const total =
      amountAfterTax -
      discountAmount;

    if (total < 0) {
      return res.status(400).json({
        success: false,
        message:
          "Invoice total cannot be negative",
      });
    }

    // ------------------------------
    // Update invoice
    // ------------------------------

    const invoice =
      await prisma.$transaction(
        async (tx) => {
          if (Array.isArray(items)) {
            await tx.invoiceItem.deleteMany(
              {
                where: {
                  invoiceId,
                },
              }
            );
          }

          return tx.invoice.update({
            where: {
              id: invoiceId,
            },

            data: {
              customerId: customerId
                ? String(customerId)
                : undefined,

              issueDate: issueDate
                ? new Date(issueDate)
                : undefined,

              dueDate: dueDate
                ? new Date(dueDate)
                : undefined,

              subtotal,

              tax: taxAmount,

              discount: discountAmount,

              total,

              notes:
                notes !== undefined
                  ? notes
                  : undefined,

              status:
                status || undefined,

              ...(Array.isArray(items)
                ? {
                    items: {
                      create:
                        calculatedItems,
                    },
                  }
                : {}),
            },

            include: {
              customer: true,
              items: true,
            },
          });
        }
      );

    res.json({
      success: true,
      message:
        "Invoice updated successfully",
      invoice,
    });
  } catch (error) {
    console.error(
      "Error updating invoice:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to update invoice",
    });
  }
});

// ==========================================
// DELETE INVOICE
// ==========================================

router.delete(
  "/:id",
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const invoiceId =
        String(req.params.id);

      const existingInvoice =
        await prisma.invoice.findFirst({
          where: {
            id: invoiceId,
            userId: req.user!.userId,
          },
        });

      if (!existingInvoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      await prisma.invoice.delete({
        where: {
          id: invoiceId,
        },
      });

      res.json({
        success: true,
        message:
          "Invoice deleted successfully",
      });
    } catch (error) {
      console.error(
        "Error deleting invoice:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to delete invoice",
      });
    }
  }
);

export default router;