import express, { Request, Response } from "express";
import openDb from "../db";
import { PaymentMethod } from "../types/paymentMethods";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const db = await openDb();
    const paymentMethods: PaymentMethod[] = await db.all(
      "SELECT * FROM paymentMethods"
    );
    res.json(paymentMethods);
  } catch (error) {
    console.error("Error al obtener los métodos de pago:", error);
    res.status(500).json({ error: "Error al obtener los métodos de pago" });
  }
});

export default router;
