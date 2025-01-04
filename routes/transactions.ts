import express, { Request, Response } from "express";
import openDb from "../db";
import { Transaction, TransactionCreate } from "../types/transactions";

const router = express.Router();

router.get(
  "/",
  async (
    req: Request<
      {},
      any,
      any,
      {
        userId: string;
        _sort?: string;
        _order?: string;
        _page?: string;
        _limit?: string;
        date_gte?: string;
        date_lte?: string;
      }
    >,
    res: Response
  ) => {
    try {
      const db = await openDb();
      const userId = req.query.userId;
      let query = `
      SELECT 
        transactions.*, 
        categories.name as categoryName, 
        paymentMethods.name as paymentMethodName 
      FROM transactions 
      LEFT JOIN categories ON transactions.categoryId = categories.id 
      LEFT JOIN paymentMethods ON transactions.paymentMethodId = paymentMethods.id 
      WHERE transactions.userId = ?
    `;
      const params = [userId];

      if (req.query._sort && req.query._order) {
        query += ` ORDER BY ${req.query._sort} ${req.query._order}`;
      }
      if (req.query._page && req.query._limit) {
        const offset = (Number(req.query._page) - 1) * Number(req.query._limit);
        query += ` LIMIT ${Number(req.query._limit)} OFFSET ${offset}`;
      }
      if (req.query.date_gte && req.query.date_lte) {
        query += ` AND date BETWEEN '<span class="math-inline">\{req\.query\.date\_gte\}' AND '</span>{req.query.date_lte}'`;
      }

      const transactions: Transaction[] = await db.all(query, params);
      res.json(transactions);
    } catch (error) {
      console.error("Error al obtener las transacciones:", error);
      res.status(500).json({ error: "Error al obtener las transacciones" });
    }
  }
);

router.get("/:id", async (req: Request<{ id: string }>, res: Response) => {
  try {
    const db = await openDb();
    const transaction: Transaction | undefined = await db.get(
      "SELECT * FROM transactions WHERE id = ?",
      [req.params.id]
    );

    if (transaction) {
      res.json(transaction);
    } else {
      res.status(404).json({ error: "Transacción no encontrada" });
    }
  } catch (error) {
    console.error("Error al obtener la transacción:", error);
    res.status(500).json({ error: "Error al obtener la transacción" });
  }
});

router.post(
  "/",
  async (
    req: Request<{}, any, TransactionCreate>,
    res: Response<Transaction | { error: string }>
  ) => {
    try {
      const transactionData: TransactionCreate = req.body;
      const currentUserId = req.body.userId; // Obtener el userId del body

      if (!transactionData) {
        return res
          .status(400)
          .json({ error: "El cuerpo de la petición está vacío" }) as any;
      }

      const requiredFields = [
        "description",
        "date",
        "amount",
        "type",
        "userId",
      ];

      for (const field of requiredFields) {
        if (!transactionData[field as keyof TransactionCreate]) {
          return res
            .status(400)
            .json({ error: `El campo ${field} es obligatorio` });
        }
      }

      if (
        typeof transactionData.description !== "string" ||
        transactionData.description.trim() === ""
      ) {
        return res.status(400).json({
          error: "La descripción debe ser una cadena de texto no vacía",
        });
      }

      if (isNaN(new Date(transactionData.date).getTime())) {
        return res.status(400).json({
          error: "La fecha no es válida. Use formato ISO 8601 (YYYY-MM-DD)",
        });
      }

      if (
        typeof transactionData.amount !== "number" ||
        transactionData.amount <= 0
      ) {
        return res
          .status(400)
          .json({ error: "El monto debe ser un número mayor que cero" });
      }

      const allowedTypes = ["income", "expense"];
      if (!allowedTypes.includes(transactionData.type)) {
        return res.status(400).json({
          error: `El tipo debe ser uno de los siguientes: ${allowedTypes.join(
            ", "
          )}`,
        });
      }

      if (
        typeof transactionData.userId !== "string" ||
        transactionData.userId.trim() === ""
      ) {
        return res.status(400).json({
          error: "El userId debe ser una cadena de texto no vacía",
        });
      }

      const db = await openDb();
      const result = await db.run(
        "INSERT INTO transactions (description, date, amount, type, userId, categoryId, paymentMethodId) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          transactionData.description,
          transactionData.date,
          transactionData.amount,
          transactionData.type,
          transactionData.userId,
          transactionData.categoryId,
          transactionData.paymentMethodId,
        ]
      );

      if (result.lastID) {
        const newTransaction: Transaction = {
          id: result.lastID as number,
          ...transactionData,
        };
        console.log("created");
        res.status(201).json(newTransaction);
      } else {
        console.error(
          "Error al insertar la transacción en la base de datos:",
          result
        );
        return res.status(500).json({
          error: "Error al crear la transacción en la base de datos",
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          "Error en el endpoint POST /transactions:",
          error.message
        );
        console.error(error.stack);
      }
      return res.status(500).json({
        error:
          "Error interno del servidor. Consulte los logs para más detalles.",
      });
    }
  }
);

router.put(
  "/:id",
  async (
    req: Request<{ id: string }, any, TransactionCreate>,
    res: Response
  ) => {
    try {
      const transactionData: TransactionCreate = req.body;

      if (
        !transactionData.description ||
        !transactionData.date ||
        !transactionData.amount ||
        !transactionData.type ||
        !transactionData.userId
      ) {
        return res
          .status(400)
          .json({ error: "Faltan campos obligatorios" }) as any;
      }

      const db = await openDb();
      const result = await db.run(
        "UPDATE transactions SET description = ?, date = ?, categoryId = ?, amount = ?, type = ?, paymentMethodId = ?, userId = ? WHERE id = ?",
        [
          transactionData.description,
          transactionData.date,
          transactionData.categoryId,
          transactionData.amount,
          transactionData.type,
          transactionData.paymentMethodId,
          transactionData.userId,
          req.params.id,
        ]
      );

      if (result.changes > 0) {
        res.json({ id: req.params.id, ...transactionData });
      } else {
        res.status(404).json({ error: "Transacción no encontrada" });
      }
    } catch (error) {
      console.error("Error al actualizar la transacción:", error);
      res.status(500).json({ error: "Error al actualizar la transacción" });
    }
  }
);

router.delete("/:id", async (req: Request<{ id: string }>, res: Response) => {
  try {
    const db = await openDb();
    const result = await db.run("DELETE FROM transactions WHERE id = ?", [
      req.params.id,
    ]);

    if (result.changes > 0) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: "Transacción no encontrada" });
    }
  } catch (error) {
    console.error("Error al eliminar la transacción:", error);
    res.status(500).json({ error: "Error al eliminar la transacción" });
  }
});

export default router;
