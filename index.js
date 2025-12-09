import 'dotenv/config';
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import db from "./db.js";

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Middleware Setup ---
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// --- Session ---
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

function checkAuth(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
}

// ==================================================================
// ROUTES
// ==================================================================

// --- LOGIN ---
app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await db('users').where({ username }).first();
    if (user && user.password_hash === password) {
      req.session.user = user;
      res.redirect("/");
    } else {
      res.render("login", { error: "Invalid credentials" });
    }
  } catch (err) {
    console.error(err);
    res.render("login", { error: "Database error" });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// --- DASHBOARD ---
app.get("/", checkAuth, async (req, res) => {
  try {
    const maintenance = await db('maintenance_requests')
      .join('properties', 'maintenance_requests.property_id', 'properties.property_id')
      .where('status', 'Pending')
      .select('maintenance_requests.description', 'maintenance_requests.status', 'properties.nickname')
      .orderBy('date_reported', 'desc')
      .limit(3);

    const events = await db('calendar_events')
      .where('start_time', '>=', new Date())
      .orderBy('start_time', 'asc')
      .limit(5);

    const messages = await db('messages')
      .join('users', 'messages.user_id', 'users.user_id')
      .select('messages.*', 'users.username')
      .orderBy('created_time', 'desc')
      .limit(3);

    const expenses = await db('expenses')
      .orderBy('expense_date', 'desc')
      .limit(5);

    res.render("landingpage", { user: req.session.user, maintenance, events, messages, expenses });
  } catch (err) {
    console.error(err);
    res.render("landingpage", { user: req.session.user, maintenance: [], events: [], messages: [], expenses: [] });
  }
});

app.get("/landingpage", checkAuth, (req, res) => {
  res.redirect("/");
});

// --- UNITS (Properties don't have dates, so logic is same) ---
app.get("/units", checkAuth, async (req, res) => {
  try {
    const search = req.query.search;
    let query = db('properties').select('*').orderBy('property_id');

    if (search) {
      query.where(builder => {
        builder.where('nickname', 'ilike', `%${search}%`)
          .orWhere('city', 'ilike', `%${search}%`)
          .orWhere('state', 'ilike', `%${search}%`);
      });
    }

    const properties = await query;
    res.render("units_list", { properties, searchTerm: search });
  } catch (err) {
    console.error(err);
    res.send("Error loading properties");
  }
});

app.get("/units/:id", checkAuth, async (req, res) => {
  const unit = await db('properties').where({ property_id: req.params.id }).first();
  res.render("unit_detail", { unit });
});

app.get("/units/edit/:id", checkAuth, async (req, res) => {
  const unit = await db('properties').where({ property_id: req.params.id }).first();
  res.render("unit_edit", { unit });
});

app.post("/units/edit/:id", checkAuth, async (req, res) => {
  await db('properties').where({ property_id: req.params.id }).update({
    nickname: req.body.nickname,
    property_type: req.body.property_type,
    street: req.body.street,
    city: req.body.city,
    state: req.body.state,
    zip: req.body.zip
  });
  res.redirect(`/units/${req.params.id}`);
});

app.post("/units/add", checkAuth, async (req, res) => {
  await db('properties').insert({
    user_id: req.session.user.user_id,
    nickname: req.body.nickname,
    city: req.body.city,
    state: req.body.state,
    property_type: 'Condo'
  });
  res.redirect("/units");
});

app.post("/units/delete/:id", checkAuth, async (req, res) => {
  await db('properties').where({ property_id: req.params.id }).del();
  res.redirect("/units");
});

// --- MAINTENANCE (Updated for Date Search) ---
app.get("/maintenance", checkAuth, async (req, res) => {
  const search = req.query.search;
  let query = db('maintenance_requests')
    .join('properties', 'maintenance_requests.property_id', 'properties.property_id')
    .select('maintenance_requests.*', 'properties.nickname')
    .orderBy('date_reported', 'desc');

  if (search) {
    query.where(builder => {
      builder.where('maintenance_requests.description', 'ilike', `%${search}%`)
        .orWhere('properties.nickname', 'ilike', `%${search}%`)
        .orWhere('maintenance_requests.status', 'ilike', `%${search}%`)
        // Allow searching "December", "2025", "Monday", etc.
        .orWhereRaw("TO_CHAR(date_reported, 'FMDay, FMMonth DD, YYYY') ILIKE ?", [`%${search}%`]);
    });
  }

  const requests = await query;
  res.render("maintenance_list", { requests, searchTerm: search });
});

app.get("/maintenance/new", checkAuth, async (req, res) => {
  const properties = await db('properties').select('property_id', 'nickname');
  res.render("maintenance_new", { properties });
});

app.get("/maintenance/:id", checkAuth, async (req, res) => {
  const request = await db('maintenance_requests')
    .join('properties', 'maintenance_requests.property_id', 'properties.property_id')
    .where({ request_id: req.params.id })
    .select('maintenance_requests.*', 'properties.nickname')
    .first();
  res.render("maintenance_detail", { request });
});

app.post("/maintenance/add", checkAuth, async (req, res) => {
  await db('maintenance_requests').insert({
    property_id: req.body.property_id,
    description: req.body.description,
    status: 'Pending',
    date_reported: new Date(),
  });
  res.redirect("/maintenance");
});

app.post("/maintenance/complete/:id", checkAuth, async (req, res) => {
  await db('maintenance_requests')
    .where({ request_id: req.params.id })
    .update({ status: 'Completed', date_completed: new Date() });
  res.redirect("/maintenance");
});

// --- EXPENSES (Updated for Date Search) ---
app.get("/expenses", checkAuth, async (req, res) => {
  const search = req.query.search;
  let query = db('expenses')
    .join('properties', 'expenses.property_id', 'properties.property_id')
    .select('expenses.*', 'properties.nickname')
    .orderBy('expense_date', 'desc');

  if (search) {
    query.where(builder => {
      builder.where('expenses.vendor', 'ilike', `%${search}%`)
        .orWhere('expenses.expense_category', 'ilike', `%${search}%`)
        .orWhere('properties.nickname', 'ilike', `%${search}%`)
        // Date Search
        .orWhereRaw("TO_CHAR(expense_date, 'FMDay, FMMonth DD, YYYY') ILIKE ?", [`%${search}%`]);
    });
  }

  const expenses = await query;
  res.render("expenses_month", { expenses, searchTerm: search });
});

app.get("/expenses/new", checkAuth, async (req, res) => {
  const properties = await db('properties').select('property_id', 'nickname');
  res.render("expense_new", { properties });
});

app.post("/expenses/add", checkAuth, async (req, res) => {
  await db('expenses').insert({
    property_id: req.body.property_id,
    expense_category: req.body.expense_category,
    amount: req.body.amount,
    expense_date: req.body.expense_date,
    vendor: req.body.vendor
  });
  res.redirect("/expenses");
});

// --- MESSAGE BOARD (Updated for Date Search) ---
app.get("/board", checkAuth, async (req, res) => {
  const search = req.query.search;
  let query = db('messages')
    .join('users', 'messages.user_id', 'users.user_id')
    .select('messages.*', 'users.username')
    .orderBy('created_time', 'desc');

  if (search) {
    query.where(builder => {
      builder.where('messages.message', 'ilike', `%${search}%`)
        .orWhere('users.username', 'ilike', `%${search}%`)
        // Date Search (Timestamp requires casting)
        .orWhereRaw("TO_CHAR(created_time, 'FMDay, FMMonth DD, YYYY') ILIKE ?", [`%${search}%`]);
    });
  }

  const messages = await query;
  res.render("board", { messages, user: req.session.user, searchTerm: search });
});

app.get("/board/thread/:id", checkAuth, async (req, res) => {
  const message = await db('messages')
    .join('users', 'messages.user_id', 'users.user_id')
    .where({ message_id: req.params.id })
    .select('messages.*', 'users.username')
    .first();
  res.render("thread_detail", { message });
});

app.post("/board/add", checkAuth, async (req, res) => {
  await db('messages').insert({
    user_id: req.session.user.user_id,
    message: req.body.message,
    created_time: new Date()
  });
  res.redirect("/board");
});

// --- CALENDAR (Updated for Date Search) ---
app.get("/calendar", checkAuth, async (req, res) => {
  const search = req.query.search;
  let query = db('calendar_events').select('*').orderBy('start_time');

  if (search) {
    query.where(builder => {
      builder.where('event_title', 'ilike', `%${search}%`)
        // Date Search on Start Time
        .orWhereRaw("TO_CHAR(start_time, 'FMDay, FMMonth DD, YYYY') ILIKE ?", [`%${search}%`]);
    });
  }

  const events = await query;
  res.render("calendar", { events, searchTerm: search });
});

app.get("/profile", checkAuth, (req, res) => {
  res.render("profile", { user: req.session.user });
});

app.listen(port, () => {
  console.log(`Condo Manager running on http://localhost:${port}`);
});