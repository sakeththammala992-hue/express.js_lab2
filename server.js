const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON request bodies sent by the client
app.use(express.json());

// Database connection — assigned once the DB file is opened at startup
let db;

// --- Helper: check that bookId is a positive whole number ---
// Express gives us the URL parameter as a string, so we convert and validate it
function isValidId(value) {
    const number = Number(value);
    return Number.isInteger(number) && number > 0;
}

// --- Helper: check that POST / PUT body contains all four required fields ---
function isValidBody(body) {
    if (!body) return false;
    const { title, author, price, pages } = body;
    return (
        typeof title === "string" && title.trim() !== "" &&
        typeof author === "string" && author.trim() !== "" &&
        Number.isInteger(price) && price >= 0 &&
        Number.isInteger(pages) && pages > 0
    );
}

// GET /books/ — Return all books in the database
app.get(["/books", "/books/"], async (request, response) => {
    try {
        const allBooks = await db.all("SELECT * FROM book");
        response.status(200).json(allBooks);
    } catch (error) {
        console.error("Database error in GET /books/:", error);
        response.status(500).json({ error: "Internal server error. Could not retrieve books." });
    }
});

// GET /books/:bookId/ — Return a single book by its id
app.get(["/books/:bookId", "/books/:bookId/"], async (request, response) => {
    const { bookId } = request.params;

    if (!isValidId(bookId)) {
        return response.status(400).json({ error: "bookId must be a positive whole number." });
    }

    try {
        const book = await db.get("SELECT * FROM book WHERE id = ?", [bookId]);
        if (!book) {
            return response.status(404).json({ error: `No book found with id ${bookId}.` });
        }
        response.status(200).json(book);
    } catch (error) {
        console.error(`Database error in GET /books/${bookId}/`, error);
        response.status(500).json({ error: "Internal server error. Could not retrieve the book." });
    }
});

// POST /books/ — Add a new book using data from the JSON request body
app.post(["/books", "/books/"], async (request, response) => {
    if (!isValidBody(request.body)) {
        return response.status(400).json({
            error: "Body must include title (string), author (string), price (integer >= 0), and pages (integer > 0)."
        });
    }

    const { title, author, price, pages } = request.body;

    try {
        const result = await db.run(
            "INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?)",
            [title, author, price, pages]
        );
        response.status(201).json({ id: result.lastID });
    } catch (error) {
        console.error("Database error in POST /books/:", error);
        response.status(500).json({ error: "Internal server error. Could not add the book." });
    }
});

// PUT /books/:bookId/ — Replace all four fields of an existing book
app.put(["/books/:bookId", "/books/:bookId/"], async (request, response) => {
    const { bookId } = request.params;

    if (!isValidId(bookId)) {
        return response.status(400).json({ error: "bookId must be a positive whole number." });
    }

    if (!isValidBody(request.body)) {
        return response.status(400).json({
            error: "Body must include title (string), author (string), price (integer >= 0), and pages (integer > 0)."
        });
    }

    const { title, author, price, pages } = request.body;

    try {
        const result = await db.run(
            "UPDATE book SET title = ?, author = ?, price = ?, pages = ? WHERE id = ?",
            [title, author, price, pages, bookId]
        );

        if (result.changes === 0) {
            return response.status(404).json({ error: `No book found with id ${bookId}.` });
        }

        response.status(200).json({ message: `Book ${bookId} updated successfully.` });
    } catch (error) {
        console.error(`Database error in PUT /books/${bookId}/`, error);
        response.status(500).json({ error: "Internal server error. Could not update the book." });
    }
});

// DELETE /books/:bookId/ — Remove a book from the database by its id
app.delete(["/books/:bookId", "/books/:bookId/"], async (request, response) => {
    const { bookId } = request.params;

    if (!isValidId(bookId)) {
        return response.status(400).json({ error: "bookId must be a positive whole number." });
    }

    try {
        const result = await db.run("DELETE FROM book WHERE id = ?", [bookId]);

        if (result.changes === 0) {
            return response.status(404).json({ error: `No book found with id ${bookId}.` });
        }

        response.status(200).json({ message: `Book ${bookId} deleted successfully.` });
    } catch (error) {
        console.error(`Database error in DELETE /books/${bookId}/`, error);
        response.status(500).json({ error: "Internal server error. Could not delete the book." });
    }
});

// Handle unknown routes — 404 Not Found
app.use((request, response) => {
    response.status(404).json({ error: "404 - Route not found." });
});

// Handle errors from middleware (e.g. malformed JSON sent to express.json())
app.use((error, request, response, next) => {
    if (error.type === "entity.parse.failed") {
        return response.status(400).json({ error: "Malformed JSON in request body." });
    }
    console.error("Unexpected middleware error:", error);
    response.status(500).json({ error: "Internal server error." });
});

// Open the SQLite database file and then start listening for requests
async function startServer() {
    try {
        db = await open({
            filename: "./books.db",
            driver: sqlite3.Database
        });
        console.log("Database connected successfully.");

        app.listen(PORT, () => {
            console.log(`Express server is running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to open the database:", error);
        process.exit(1);
    }
}

startServer();
