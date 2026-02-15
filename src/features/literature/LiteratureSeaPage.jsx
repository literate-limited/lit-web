import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { LuBookOpen, LuClock3, LuSearch } from "react-icons/lu";
import { ThemeContext } from "../../utils/themes/ThemeContext";
import Reader from "../../components/Reader";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const toAuthorName = (author) => {
  if (!author) return "";
  if (typeof author === "string") return author;
  if (typeof author === "object") {
    return author.name || author.fullName || author.author || author.title || "";
  }
  return "";
};

const formatAuthors = (authors = []) => {
  const names = Array.isArray(authors)
    ? authors.map((a) => toAuthorName(a)).filter(Boolean)
    : [];
  return names.join(", ");
};

const numberFormatter = new Intl.NumberFormat("en-US");

const LiteratureSeaPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const [books, setBooks] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [query, setQuery] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState("");

  const [activeBook, setActiveBook] = useState(null);
  const [bookText, setBookText] = useState("");
  const [textLoading, setTextLoading] = useState(false);
  const [textError, setTextError] = useState("");

  useEffect(() => {
    if (!API_URL) {
      setListError("VITE_API_URL is not set.");
      return;
    }

    const fetchBooks = async () => {
      setLoadingList(true);
      setListError("");
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const res = await axios.get(`${API_URL}/literaturesea/books`, { headers });
        setBooks(res.data?.books || []);
        setTotalCount(res.data?.total || (res.data?.books || []).length);
      } catch (err) {
        console.error("Failed to fetch LiteratureSea books", err);
        setListError("Could not load the LiteratureSea catalog.");
      } finally {
        setLoadingList(false);
      }
    };

    fetchBooks();
  }, []);

  const filteredBooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return books;
    return books.filter((book) => {
      const haystack = [
        book.title || "",
        formatAuthors(book.authors || []),
        (book.subjects || []).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [books, query]);

  const handleOpen = async (book) => {
    if (!API_URL) return;
    if (activeBook?.id === book.id && bookText) return;

    setActiveBook(book);
    setBookText("");
    setTextError("");
    setTextLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await axios.get(
        `${API_URL}/literaturesea/books/${book.id}?includeText=1`,
        { headers }
      );
      setActiveBook(res.data?.book || book);
      setBookText(res.data?.text || "");
    } catch (err) {
      console.error("Failed to load book", err);
      setTextError("Could not load this book. Try again.");
    } finally {
      setTextLoading(false);
    }
  };

  const accent = currentTheme?.buttonColor || "#0f172a";
  const surface = currentTheme?.headerBg || "#f4f5f7";
  const panel = currentTheme?.questionBox || "#ffffff";
  const textColor = currentTheme?.textColor || "#0f172a";
  const muted = currentTheme?.mainTextColor || "#475569";

  return (
    <div
      className="p-4 md:p-8"
      style={{ backgroundColor: currentTheme?.quizContainer || "#e5f0ff" }}
    >
      <div className="max-w-6xl mx-auto flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: surface, color: accent }}
            >
              <LuBookOpen size={22} />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.2em]" style={{ color: muted }}>
                LiteratureSea
              </p>
              <h1 className="text-2xl font-semibold" style={{ color: textColor }}>
                Explore the catalog
              </h1>
              <p className="text-sm" style={{ color: muted }}>
                {totalCount ? `${totalCount} books processed` : "Dive into the public domain cache"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div
            className="rounded-2xl shadow-md border"
            style={{ backgroundColor: surface, borderColor: currentTheme?.floatMenuBorder || "#cbd5e1" }}
          >
            <div className="p-4 border-b" style={{ borderColor: currentTheme?.floatMenuBorder || "#cbd5e1" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold" style={{ color: textColor }}>
                  Books
                </span>
                <span className="text-xs" style={{ color: muted }}>
                  {loadingList ? "Loading…" : `${filteredBooks.length} shown`}
                </span>
              </div>
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl border"
                style={{
                  backgroundColor: panel,
                  borderColor: currentTheme?.floatMenuBorder || "#cbd5e1",
                  color: textColor,
                }}
              >
                <LuSearch size={18} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by title or author"
                  className="w-full bg-transparent outline-none text-sm"
                />
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-3 space-y-2">
              {listError && (
                <div
                  className="text-sm px-3 py-2 rounded-lg border"
                  style={{ color: "#b91c1c", borderColor: "#fecdd3", backgroundColor: "#fef2f2" }}
                >
                  {listError}
                </div>
              )}
              {loadingList && <div className="text-sm" style={{ color: muted }}>Loading catalog…</div>}
              {!loadingList && !listError && filteredBooks.length === 0 && (
                <div className="text-sm" style={{ color: muted }}>
                  No books match that search.
                </div>
              )}
              {!loadingList &&
                filteredBooks.map((book) => {
                  const authors = formatAuthors(book.authors) || "Unknown author";
                  const minutes =
                    book.estimatedMinutes != null
                      ? `${numberFormatter.format(Math.round(book.estimatedMinutes))} min`
                      : null;
                  const words =
                    book.wordCount != null
                      ? `${numberFormatter.format(book.wordCount)} words`
                      : null;
                  const isActive = activeBook?.id === book.id;

                  return (
                    <button
                      key={book.id}
                      type="button"
                      onClick={() => handleOpen(book)}
                      className="w-full text-left rounded-xl border px-3 py-3 transition"
                      style={{
                        backgroundColor: isActive ? panel : "#ffffff",
                        borderColor: isActive
                          ? accent
                          : currentTheme?.floatMenuBorder || "#e2e8f0",
                        color: textColor,
                        boxShadow: isActive ? `0 6px 18px rgba(0,0,0,0.07)` : "none",
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold truncate">{book.title}</div>
                        {minutes && (
                          <span className="text-xs flex items-center gap-1" style={{ color: muted }}>
                            <LuClock3 size={14} />
                            {minutes}
                          </span>
                        )}
                      </div>
                      <div className="text-xs mt-1" style={{ color: muted }}>
                        {authors}
                      </div>
                      <div className="text-xs mt-1" style={{ color: muted }}>
                        {words}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div
              className="rounded-2xl shadow-md border p-4 md:p-6 h-full flex flex-col gap-3"
              style={{ backgroundColor: panel, borderColor: currentTheme?.floatMenuBorder || "#cbd5e1" }}
            >
              {!activeBook && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-2" style={{ color: muted }}>
                    <p className="text-lg font-semibold" style={{ color: textColor }}>
                      Choose a book to start reading
                    </p>
                    <p className="text-sm">Pick any title from the shelf on the left.</p>
                  </div>
                </div>
              )}

              {activeBook && (
                <>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs uppercase tracking-[0.24em]" style={{ color: muted }}>
                      Now Reading
                    </p>
                    <h2 className="text-xl font-semibold" style={{ color: textColor }}>
                      {activeBook.title}
                    </h2>
                    <p className="text-sm" style={{ color: muted }}>
                      {formatAuthors(activeBook.authors) || "Unknown author"}
                    </p>
                  </div>

                  {textError && (
                    <div
                      className="text-sm px-3 py-2 rounded-lg border"
                      style={{ color: "#b91c1c", borderColor: "#fecdd3", backgroundColor: "#fef2f2" }}
                    >
                      {textError}
                    </div>
                  )}

                  {textLoading && (
                    <div className="flex-1 flex items-center justify-center text-sm" style={{ color: muted }}>
                      Loading text…
                    </div>
                  )}

                  {!textLoading && !textError && bookText && (
                    <Reader
                      text={bookText}
                      onDone={() => {
                        setActiveBook(null);
                        setBookText("");
                      }}
                      doneLabel="Back to shelf"
                    />
                  )}

                  {!textLoading && !textError && !bookText && (
                    <div className="flex-1 flex items-center justify-center text-sm" style={{ color: muted }}>
                      This book has no text file available.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiteratureSeaPage;
