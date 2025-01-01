import express, { Request, Response, NextFunction } from "express";
import cors from "cors";

import transactionsRoutes from "./routes/transactions";
import categoriesRoutes from "./routes/categories";
import paymentMethodsRoutes from "./routes/paymentMethods";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/transactions", transactionsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/payment-methods", paymentMethodsRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("¡El servidor backend está funcionando! (Ruta de prueba)");
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Algo salió mal!" });
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
