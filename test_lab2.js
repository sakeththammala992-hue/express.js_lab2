/**
 * test_lab2.js — Automated test for Lab 2
 * Starts the server inline (reuses same DB), runs all checks, prints results.
 * Delete this file before final submission.
 */

const http = require("http");

const BASE = "http://localhost:3000";
let passed = 0;
let failed = 0;

function request(method, path, body) {
    return new Promise((resolve, reject) => {
        const opts = {
            hostname: "localhost",
            port: 3000,
            path,
            method,
            headers: { "Content-Type": "application/json" }
        };
        const req = http.request(opts, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                let json = null;
                try { json = JSON.parse(data); } catch (_) { json = data; }
                resolve({ status: res.statusCode, body: json });
            });
        });
        req.on("error", reject);
        if (body !== undefined) req.write(JSON.stringify(body));
        req.end();
    });
}

function check(name, actual, expected) {
    if (actual === expected) {
        console.log(`  PASS  [${actual}] ${name}`);
        passed++;
    } else {
        console.log(`  FAIL  [${actual} != ${expected}] ${name}`);
        failed++;
    }
}

async function runTests() {
    console.log("\n=== Lab 2 — Automated Tests ===\n");

    // Test 1: GET /books/ returns 200 and 10 books
    let r = await request("GET", "/books/");
    check("GET /books/ → 200", r.status, 200);
    check("GET /books/ → 10 books", Array.isArray(r.body) && r.body.length, 10);

    // Test 2: GET /books/ without trailing slash also works
    r = await request("GET", "/books");
    check("GET /books (no slash) → 200", r.status, 200);

    // Test 3: GET /books/1/ returns 200 with a book
    r = await request("GET", "/books/1/");
    check("GET /books/1/ → 200", r.status, 200);
    check("GET /books/1/ → has id=1", r.body && r.body.id, 1);

    // Test 4: GET non-existent id returns 404
    r = await request("GET", "/books/9999/");
    check("GET /books/9999/ → 404", r.status, 404);

    // Test 5: POST with valid body returns 201 with an id
    r = await request("POST", "/books/", {
        title: "Test Book",
        author: "Test Author",
        price: 100,
        pages: 50
    });
    check("POST /books/ valid → 201", r.status, 201);
    const newId = r.body && r.body.id;
    check("POST /books/ → returns id", typeof newId, "number");

    // Test 6: New book appears in GET /books/
    r = await request("GET", `/books/${newId}/`);
    check(`GET /books/${newId}/ after POST → 200`, r.status, 200);
    check(`GET /books/${newId}/ → title matches`, r.body && r.body.title, "Test Book");

    // Test 7: POST with missing field returns 400
    r = await request("POST", "/books/", { title: "No Author" });
    check("POST missing field → 400", r.status, 400);

    // Test 8: POST with malformed JSON returns 400
    // Send raw malformed JSON manually
    const malformedResult = await new Promise((resolve) => {
        const opts = {
            hostname: "localhost", port: 3000, path: "/books/", method: "POST",
            headers: { "Content-Type": "application/json" }
        };
        const req = http.request(opts, (res) => {
            let d = "";
            res.on("data", (c) => (d += c));
            res.on("end", () => resolve({ status: res.statusCode }));
        });
        req.on("error", () => resolve({ status: 0 }));
        req.write("{bad json");
        req.end();
    });
    check("POST malformed JSON → 400", malformedResult.status, 400);

    // Test 9: PUT with valid body returns 200
    r = await request("PUT", `/books/${newId}/`, {
        title: "Updated Title",
        author: "Updated Author",
        price: 200,
        pages: 100
    });
    check(`PUT /books/${newId}/ valid → 200`, r.status, 200);

    // Verify change is visible
    r = await request("GET", `/books/${newId}/`);
    check(`GET /books/${newId}/ after PUT → title updated`, r.body && r.body.title, "Updated Title");

    // Test 10: PUT on non-existent id returns 404
    r = await request("PUT", "/books/9999/", {
        title: "X", author: "X", price: 1, pages: 1
    });
    check("PUT /books/9999/ → 404", r.status, 404);

    // Test 11: DELETE returns 200 and book is gone
    r = await request("DELETE", `/books/${newId}/`);
    check(`DELETE /books/${newId}/ → 200`, r.status, 200);
    r = await request("GET", `/books/${newId}/`);
    check(`GET /books/${newId}/ after DELETE → 404`, r.status, 404);

    // Test 12: DELETE non-existent id returns 404
    r = await request("DELETE", "/books/9999/");
    check("DELETE /books/9999/ → 404", r.status, 404);

    // Test 13: Non-numeric bookId returns 400
    r = await request("GET", "/books/abc/");
    check("GET /books/abc/ → 400", r.status, 400);

    // Test 14: Negative bookId returns 400
    r = await request("GET", "/books/-1/");
    check("GET /books/-1/ → 400", r.status, 400);

    // Test 15: Unknown route returns 404
    r = await request("GET", "/unknown-route");
    check("Unknown route → 404", r.status, 404);

    // Test 16: SQL injection attempt using a non-numeric string (space-free)
    // "1;DROP" is not a positive integer, so our isValidId() check returns 400
    // The ? placeholder also ensures user input never reaches the SQL engine directly
    r = await request("GET", "/books/1;DROP/");
    check("SQL injection attempt on bookId → 400 (blocked by validation)", r.status, 400);

    console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
    process.exit(failed > 0 ? 1 : 0);
}

// Give server a moment then run
setTimeout(runTests, 500);
