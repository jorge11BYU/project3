import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = 3000;

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set views folder and view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Optional: serve static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, "public")));

// --- Landing page ---
app.get("/", (req, res) => {
  res.render("landingpage", { title: "My Landing Page" });
});

app.get("/landingpage", (req, res) => {
  res.render("landingpage");
});

// --- Login page ---
app.get("/login", (req, res) => {
  res.render("login");
});

// --- Units ---
app.get("/units", (req, res) => {
  res.render("units_list");
});

app.get("/units/:id", (req, res) => {
  const unitId = req.params.id;
  res.render("unit_detail", { unitId });
});

// --- Maintenance ---
app.get("/maintenance", (req, res) => {
  res.render("maintenance_list");
});

app.get("/maintenance/new", (req, res) => {
  res.render("maintenance_new");
});

app.get("/maintenance/:id", (req, res) => {
  const maintenanceId = req.params.id;
  res.render("maintenance_detail", { maintenanceId });
});

// --- Expenses ---
app.get("/expenses", (req, res) => {
  res.render("expenses_month");
});

app.get("/expenses/new", (req, res) => {
  res.render("expense_new");
});

// --- Message Board ---
app.get("/board", (req, res) => {
  res.render("board");
});

app.get("/board/thread/:id", (req, res) => {
  const threadId = req.params.id;
  res.render("thread_detail", { threadId });
});

// --- Calendar ---
app.get("/calendar", (req, res) => {
  res.render("calendar");
});

// --- Account/Profile ---
app.get("/profile", (req, res) => {
  res.render("profile");
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
