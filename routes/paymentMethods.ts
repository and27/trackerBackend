import express, { Request, response, Response } from "express";
import openDb from "../db";
import { PaymentMethod, PaymentMethodCreate } from "../types/paymentMethods"; // Importa las interfaces

const router = express.Router();

router.post(
  "/",
  async (req: Request<{}, any, PaymentMethodCreate>, res: Response) => {
    try {
      const paymentMethodData: PaymentMethodCreate = req.body;

      if (!paymentMethodData.name || !paymentMethodData.userId) {
        return res
          .status(400)
          .json({ error: "Faltan campos obligatorios: name y userId" } as {
            error: string;
          }) as any;
      }

      const db = await openDb();
      const result = await db.run(
        "INSERT INTO payment_methods (name, userId) VALUES (?, ?)",
        [paymentMethodData.name, paymentMethodData.userId]
      );
    } catch (error) {
      console.error("Error al crear el método de pago:", error);
      res.status(500).json({ error: "Error al crear el método de pago" });
    }
  }
);

export default router;
