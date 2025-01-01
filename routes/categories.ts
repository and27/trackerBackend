import express, { Request, Response } from "express";
import openDb from "../db";
import { Category, CategoryCreate } from "../types/categories";

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
      }
    >,
    res: Response
  ) => {
    try {
      const db = await openDb();
      const userId = req.query.userId;
      const categories: Category[] = await db.all(
        "SELECT * FROM categories WHERE userId = ?",
        [userId]
      );
      res.json(categories);
    } catch (error) {
      console.error("Error al obtener las categorías:", error);
      res.status(500).json({ error: "Error al obtener las categorías" });
    }
  }
);

router.post(
  "/",
  async (req: Request<{}, any, CategoryCreate>, res: Response) => {
    try {
      const categoryData: CategoryCreate = req.body;

      if (!categoryData.name || !categoryData.userId) {
        return res
          .status(400)
          .json({ error: "Faltan campos obligatorios: name y userId" } as {
            error: string;
          }) as any;
      }

      const db = await openDb();
      const result = await db.run(
        "INSERT INTO categories (name, userId) VALUES (?, ?)",
        [categoryData.name, categoryData.userId]
      );
      res.json({ id: result.lastID, name: categoryData.name });
    } catch (error) {
      console.error("Error al crear la categoría:", error);
      res.status(500).json({ error: "Error al crear la categoría" });
    }
  }
);

export default router;
