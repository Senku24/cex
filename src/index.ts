import express from "express";
import dotenv from "dotenv";
dotenv.config();
import z from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma";
import { signupSchema } from "./schemas/auth";
import { loginSchema } from "./schemas/auth";
const app = express();
app.use(express.json());

// app.get("/test", async (req, res) => {
//   const stocks = await prisma.stock.findMany();

//   res.json(stocks);
// });

// Types --------------------------------------------------

type OrderSide = "BUY" | "SELL";
type OrderType = "LIMIT" | "MARKET";

interface User {
  id: number;
  username: string;
  password: string;
}

interface Stock {
  id: number;
  title: string;
  symbol: string;
}

interface Order {
  id: number;
  userId: number;
  side: OrderSide;
  type: OrderType;
  symbol: string;
  price?: number;
  qty: number;
  filledQty: number;
  status: string;
}

interface Fill {
  id: number;
  userId: number;
  orderId: number;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  qty: number;
  price: number;
}

interface Balance {
  available: number;
  locked: number;
}

interface UserBalances {
  [asset: string]: Balance;
}

interface OrderBookSide {
  [price: number]: Order[];
}

interface OrderBook {
  bids: OrderBookSide;
  asks: OrderBookSide;
}

// --------------------------------------------------
// In-memory state
// --------------------------------------------------

const USERS: User[] = [];

const STOCKS: Stock[] = [
  { id: 1, title: "AXIS BANK", symbol: "AXIS" },
  { id: 2, title: "HDFC BANK", symbol: "HDFC" },
  { id: 3, title: "TATA Steel", symbol: "TATA" },
];

const ORDERS: Order[] = [];

const FILLS: Fill[] = [];

const BALANCES: Record<number, UserBalances> = {};
// {
//   1: {
//      INR: { available: 10000, locked: 2000 },
//      AXIS: { available: 20, locked: 5 }
//   }
// }

const ORDERBOOK: Record<string, OrderBook> = {
  AXIS: {
    bids: {},
    asks: {},
  },
  HDFC: {
    bids: {},
    asks: {},
  },
  TATA: {
    bids: {},
    asks: {},
  },
};

// --------------------------------------------------
// Auth
// --------------------------------------------------

app.post("/signup", async (req, res) => {
//   const { username, password } = req.body;

const result = signupSchema.safeParse(req.body);

if (!result.success) {
  return res.status(400).json({ error: result.error.issues });
}

const { username, password } = result.data; 
const userExists = await prisma.user.findUnique({ where: { username } });
if (userExists) {
  return res.status(400).json({ error: "Username already taken" });
}

// Hash the password
const hashedPassword = bcrypt.hashSync(password, 10);

// Create the user in the database
const user = await prisma.$transaction(async (tx) => {
  const newUser = await tx.user.create({
    data: {
      username,
      password: hashedPassword,
    },
  });
  await tx.balance.create({
    data: {
      userId: newUser.id,
      asset: "INR",
      available: 0,
      locked: 0,
    },
  });

  return newUser;
});

const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "1h" });

res.status(201).json({ token, userId: user.id, username: user.username });

});

app.post("/login", async (req, res) => {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ error: result.error.issues });
  }

  const { username, password } = result.data;

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return res.status(400).json({ error: "Invalid username or password" });
  }

  const passwordMatch = bcrypt.compareSync(password, user.password);
  if (!passwordMatch) {
    return res.status(400).json({ error: "Invalid username or password" });
  }
//change it after adding auth middleware
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "1h" });

  return res.status(200).json({
    token,
    userId: user.id,
    username: user.username,
  });
});

// --------------------------------------------------
// Orders
// --------------------------------------------------

app.post("/order", (req, res) => {
  // body:
  // {
  //   userId,
  //   side: "BUY" | "SELL",
  //   type: "LIMIT" | "MARKET",
  //   symbol,
  //   price?,
  //   qty
  // }

  // 1. validate input + stock exists

  // 2. check + lock balance
  // INR for BUY
  // stock for SELL

  // 3. run matching engine against opposite side
  // of ORDERBOOK

  // 4. write fills to FILLS
  // update filledQty + status on ORDERS

  // 5. if leftover qty and LIMIT,
  // rest on book

  // if MARKET,
  // cancel remainder

  // 6. settle balances on each fill
  // (move locked -> other asset's available)
});

app.delete("/order/:orderId", (req, res) => {
  // 1. find order

  // 2. check ownership

  // 3. remove from ORDERBOOK price level

  // 4. unlock remaining reserved balance

  // 5. mark status = CANCELLED
});

app.get("/orders", (req, res) => {
  // query:
  // ?status=OPEN
  // (or all)

  // return current user's orders
});

// --------------------------------------------------
// Market Data
// --------------------------------------------------

app.get("/orderbook/:symbol", (req, res) => {
  // return aggregated depth

  // totalQty per price level

  // don't expose individual userIds
});

app.get("/fills/:symbol", (req, res) => {
  // recent trades for this stock

  // the "tape"
});

app.get("/stocks", (req, res) => {
  res.json(STOCKS);
});

// --------------------------------------------------
// User Data
// --------------------------------------------------

app.get("/balance", (req, res) => {
  // return BALANCES[userId]

  // for authenticated user
});

// --------------------------------------------------

app.listen(3000, () => {
  console.log("CEX running on :3000");
});