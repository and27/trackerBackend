import sqlite3 from "sqlite3";
import { open } from "sqlite";

let db: any = null;

async function openDb() {
  if (db) {
    return db;
  }

  try {
    db = await open({
      filename: "./mydatabase.db",
      driver: sqlite3.Database,
    });

    // Habilitar foreign keys, por defecto esta desactivado en sqlite
    await db.exec("PRAGMA foreign_keys = ON;");

    // Crear tablas si no existen (con claves foráneas)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL
      )
    `);

    //insert users data
    await db.exec(`
      INSERT INTO users (id) VALUES ('user1')
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        date TEXT NOT NULL,
        categoryId INTEGER,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        paymentMethodId INTEGER,
        userId TEXT NOT NULL,
        FOREIGN KEY (categoryId) REFERENCES categories(id),
        FOREIGN KEY (paymentMethodId) REFERENCES paymentMethods(id),
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        userId TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS paymentMethods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        userId TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);

    console.log("Base de datos abierta y tablas creadas (si no existían).");
    return db;
  } catch (error) {
    console.error("Error al abrir o crear la base de datos:", error);
    throw error; // Re-lanza el error para que se maneje en el nivel superior
  }
}

export default openDb;
