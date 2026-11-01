-- Drop the table if it already exists so the database can be rebuilt cleanly
DROP TABLE IF EXISTS book;

-- Create the book table
CREATE TABLE book (
  id     INTEGER PRIMARY KEY,
  title  TEXT,
  author TEXT,
  price  INTEGER,
  pages  INTEGER
);

-- Insert 10 starting rows
-- NOTE: These are sample rows. Review and replace with faculty-provided data if required.
INSERT INTO book (title, author, price, pages) VALUES
  ('The Pragmatic Programmer',                           'David Thomas',       799,  352),
  ('Clean Architecture',                                 'Robert C. Martin',   699,  432),
  ('You Don''t Know JS',                                 'Kyle Simpson',       499,  278),
  ('JavaScript: The Good Parts',                         'Douglas Crockford',  350,  172),
  ('Eloquent JavaScript',                                'Marijn Haverbeke',   549,  472),
  ('The Mythical Man-Month',                             'Frederick Brooks',   449,  322),
  ('Refactoring',                                        'Martin Fowler',      649,  448),
  ('Design Patterns',                                    'Erich Gamma',        799,  395),
  ('Introduction to Algorithms',                         'Thomas H. Cormen',   999, 1292),
  ('Structure and Interpretation of Computer Programs',  'Harold Abelson',     599,  657);
