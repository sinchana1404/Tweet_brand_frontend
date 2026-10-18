
import { useState } from "react";
import "./App.css";

const API_URL = "https://tweet-brand-backend-node.vercel.app";

function App() {
  const [form, setForm] = useState({
    brandName: "",
    industry: "",
    objective: "",
    productDetails: "",
  });

  const [result, setResult] = useState(null);
  const [editedTweets, setEditedTweets] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [editing, setEditing] = useState(null);
  const [regenerating, setRegenerating] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setNotice("");
    setResult(null);
    setEditedTweets([]);
    setFavorites([]);
    setEditing(null);
    setRegenerating(null);

    try {
      const response = await fetch(
        `${API_URL}/api/tweets/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Tweet generation failed."
        );
      }

      if (
        !Array.isArray(data.tweets) ||
        data.tweets.length !== 10
      ) {
        throw new Error(
          "The response did not contain exactly 10 tweets."
        );
      }

      setResult(data);
      setEditedTweets(data.tweets);
      setNotice("Your campaign is ready.");
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to the backend. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Copied to clipboard.");
    } catch {
      setNotice(
        "Copy failed. Please select and copy the text manually."
      );
    }
  };

  const updateTweet = (index, value) => {
    setEditedTweets((previous) =>
      previous.map((tweet, i) =>
        i === index ? value : tweet
      )
    );
  };

  const saveEdit = (index) => {
    setEditing(null);
    setNotice(`Tweet ${index + 1} saved.`);
  };

  const toggleFavorite = (index) => {
    setFavorites((previous) =>
      previous.includes(index)
        ? previous.filter((item) => item !== index)
        : [...previous, index]
    );
  };

  const downloadTweets = (onlyFavorites = false) => {
    const selectedTweets = editedTweets
      .map((tweet, index) => ({ tweet, index }))
      .filter(({ index }) =>
        onlyFavorites ? favorites.includes(index) : true
      );

    if (selectedTweets.length === 0) {
      setNotice("Favorite at least one tweet first.");
      return;
    }

    const content = selectedTweets
      .map(
        ({ tweet, index }) =>
          `${index + 1}. ${tweet}`
      )
      .join("\n\n");

    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = onlyFavorites
      ? "brandvoice-favorite-tweets.txt"
      : "brandvoice-campaign-tweets.txt";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
    setNotice(
      onlyFavorites
        ? "Favorite tweets downloaded."
        : "All tweets downloaded."
    );
  };

  const regenerateTweet = async (index) => {
    if (!result || regenerating !== null) return;

    setRegenerating(index);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API_URL}/api/tweets/regenerate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            brandVoice: result.brandVoice,
            brandVoiceSummary: result.brandVoiceSummary,
            brandTone: result.brandTone,
            toneExplanation: result.toneExplanation,
            targetAudience: result.targetAudience,
            communicationStyle: result.communicationStyle,
            existingTweets: editedTweets,
            tweetIndex: index,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to regenerate this tweet."
        );
      }

      if (
        typeof data.tweet !== "string" ||
        !data.tweet.trim()
      ) {
        throw new Error(
          "The AI did not return a valid replacement tweet."
        );
      }

      setEditedTweets((previous) =>
        previous.map((tweet, i) =>
          i === index ? data.tweet.trim() : tweet
        )
      );

      setFavorites((previous) =>
        previous.filter((item) => item !== index)
      );

      setEditing(null);
      setNotice(`Tweet ${index + 1} regenerated successfully.`);
    } catch (err) {
      setError(
        err.message || "Unable to regenerate this tweet."
      );
    } finally {
      setRegenerating(null);
    }
  };

  return (
    <div className="app">
      <header className="navbar">
        <a className="logo" href="/" aria-label="BrandVoice home">
          Brand<span>Voice</span>
          <span className="logo-dot">.</span>
        </a>

        <div className="nav-right">
          <span className="nav-label">
            <span className="status-dot" />
            AI Tweet Studio
          </span>
        </div>
      </header>

      <main className="container">
        <section className="hero">
          <div className="eyebrow">
            <span className="sparkle">✳</span>
            YOUR BRAND, WITH A VOICE
          </div>

          <h1>
            Great brands don't just speak.
            <span> They connect.</span>
          </h1>

          <p>
            Turn your campaign ideas into a distinctive brand voice
            and ten thoughtful tweets, powered by AI.
          </p>

          <div className="hero-note">
            <span className="hero-line" />
            From brand identity to publish-ready ideas
          </div>
        </section>

        <section className="workspace">
          <div className="form-panel">
            <div className="section-heading">
              <span className="step">01</span>

              <div>
                <h2>Let's meet your brand</h2>
                <p>
                  Give us a little context. We'll take it from there.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <label htmlFor="brandName">
                Brand name <span>Optional</span>
              </label>

              <input
                id="brandName"
                name="brandName"
                value={form.brandName}
                onChange={handleChange}
                placeholder="e.g. Starbucks"
                maxLength={100}
              />

              <label htmlFor="industry">
                Industry <span>Optional</span>
              </label>

              <input
                id="industry"
                name="industry"
                value={form.industry}
                onChange={handleChange}
                placeholder="e.g. Food, technology, fashion"
                maxLength={150}
              />

              <label htmlFor="objective">
                Campaign objective <span className="required">*</span>
              </label>

              <select
                id="objective"
                name="objective"
                value={form.objective}
                onChange={handleChange}
                required
              >
                <option value="">What would you like to achieve?</option>
                <option value="Increase brand awareness">
                  Increase brand awareness
                </option>
                <option value="Promote a product">
                  Promote a product
                </option>
                <option value="Increase engagement">
                  Increase engagement
                </option>
                <option value="Drive website traffic">
                  Drive website traffic
                </option>
                <option value="Launch a campaign">
                  Launch a campaign
                </option>
              </select>

              <label htmlFor="productDetails">
                Tell us about your product
                <span className="required">*</span>
              </label>

              <textarea
                id="productDetails"
                name="productDetails"
                value={form.productDetails}
                onChange={handleChange}
                placeholder="What makes it special? Who is it for? Share any campaign details..."
                rows={5}
                maxLength={2000}
                required
              />

              <div className="input-footer">
                <span>Specific details lead to better ideas.</span>
                <span>{form.productDetails.length}/2000</span>
              </div>

              <button
                className="generate-button"
                type="submit"
                disabled={loading || regenerating !== null}
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    Building your campaign...
                  </>
                ) : (
                  <>
                    <span>✳</span>
                    Generate my tweets
                    <span className="button-arrow">↗</span>
                  </>
                )}
              </button>

              <p className="form-footnote">
                <span>✦</span> Your details shape every idea.
              </p>
            </form>
          </div>

          <aside className="tips-panel">
            <div className="tips-top">
              <span className="tips-icon">✳</span>
              <span className="tips-kicker">A LITTLE CREATIVE MAGIC</span>
            </div>

            <div className="tips-main">
              <p className="tips-overline">GOOD CONTENT STARTS HERE</p>
              <h3>
                Less guesswork.
                <br />
                <span>More connection.</span>
              </h3>

              <p className="tips-description">
                Great content sounds like your brand, speaks to your
                people, and gives them a reason to care.
              </p>
            </div>

            <div className="tips-list">
              <div className="tip-item">
                <span className="tip-check">✓</span>
                <div>
                  <strong>Know your voice</strong>
                  <p>Define your brand personality.</p>
                </div>
              </div>

              <div className="tip-item">
                <span className="tip-check">✓</span>
                <div>
                  <strong>Find your tone</strong>
                  <p>Match the moment and objective.</p>
                </div>
              </div>

              <div className="tip-item">
                <span className="tip-check">✓</span>
                <div>
                  <strong>Make every word count</strong>
                  <p>Explore ten distinct tweet ideas.</p>
                </div>
              </div>
            </div>

            <div className="tips-bottom">
              <span>BRAND FIRST. ALWAYS.</span>
              <span className="tips-star">✳</span>
            </div>
          </aside>
        </section>

        {error && (
          <div className="error-message" role="alert">
            <span className="message-icon">!</span>
            <div>
              <strong>Something went wrong</strong>
              <p>{error}</p>
            </div>
            <button
              className="dismiss-button"
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {notice && !error && (
          <div className="notice-message" role="status">
            <span>✓</span>
            {notice}
            <button
              className="dismiss-button"
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        {result && (
          <section className="results">
            <div className="results-intro">
              <div className="section-heading">
                <span className="step">02</span>

                <div>
                  <p className="section-overline">YOUR BRAND PLAYBOOK</p>
                  <h2>First, find your voice.</h2>
                  <p>
                    A clear creative direction for a campaign that feels
                    unmistakably yours.
                  </p>
                </div>
              </div>

              <span className="results-badge">
                <span className="status-dot" />
                Strategy generated
              </span>
            </div>

            <div className="strategy-grid">
              <article className="strategy-card voice-card">
                <div className="strategy-card-top">
                  <span className="card-icon">✳</span>
                  <span className="card-index">01 / IDENTITY</span>
                </div>

                <p className="card-eyebrow">THE FOUNDATION</p>
                <h3>Brand Voice Summary</h3>

                <p className="strategy-description">
                  {result.brandVoiceSummary ||
                    "Your brand's unique personality, expressed through consistent communication."}
                </p>

                <div className="trait-list">
                  {(result.brandVoice || []).map((voice, index) => (
                    <span className="trait" key={`${voice}-${index}`}>
                      {voice}
                    </span>
                  ))}
                </div>
              </article>

              <article className="strategy-card tone-card">
                <div className="strategy-card-top">
                  <span className="card-icon">↗</span>
                  <span className="card-index">02 / EXPRESSION</span>
                </div>

                <p className="card-eyebrow">THE CAMPAIGN MOOD</p>
                <h3>Campaign Tone</h3>

                <h4>
                  {result.brandTone || "A tone that fits your campaign"}
                </h4>

                <p className="strategy-description">
                  {result.toneExplanation ||
                    "A campaign-specific expression of your brand personality."}
                </p>
              </article>

              <article className="strategy-card audience-card">
                <div className="strategy-card-top">
                  <span className="card-icon">◎</span>
                  <span className="card-index">03 / CONNECTION</span>
                </div>

                <p className="card-eyebrow">WHO YOU SPEAK TO</p>
                <h3>Target Audience</h3>

                <p className="strategy-description">
                  {result.targetAudience}
                </p>
              </article>

              <article className="strategy-card communication-card">
                <div className="strategy-card-top">
                  <span className="card-icon">≋</span>
                  <span className="card-index">04 / DELIVERY</span>
                </div>

                <p className="card-eyebrow">HOW YOU SPEAK</p>
                <h3>Communication Style</h3>

                <p className="strategy-description">
                  {result.communicationStyle}
                </p>
              </article>
            </div>

            <section className="tweet-section">
              <div className="tweet-section-heading">
                <div>
                  <p className="section-overline">MADE FOR YOUR CAMPAIGN</p>
                  <h2>Your ideas, ready to take shape.</h2>
                  <p>
                    Ten starting points. Make them yours, one tweet at a
                    time.
                  </p>
                </div>

                <div className="tweet-toolbar">
                  <span className="tweet-total">
                    {editedTweets.length} IDEAS
                  </span>

                  <button
                    className="download-button"
                    type="button"
                    onClick={() => downloadTweets(false)}
                    disabled={regenerating !== null}
                  >
                    ↓ Download all
                  </button>
                </div>
              </div>

              <div className="tweet-grid">
                {editedTweets.map((tweet, index) => (
                  <article
                    className="tweet-card"
                    key={index}
                  >
                    <div className="tweet-top">
                      <span className="tweet-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <span className="tweet-label">
                        TWEET IDEA
                      </span>

                      <button
                        type="button"
                        className={`favorite-button ${
                          favorites.includes(index)
                            ? "is-favorite"
                            : ""
                        }`}
                        onClick={() => toggleFavorite(index)}
                        disabled={regenerating !== null}
                        aria-label={
                          favorites.includes(index)
                            ? "Remove from favorites"
                            : "Add to favorites"
                        }
                        title={
                          favorites.includes(index)
                            ? "Remove favorite"
                            : "Add favorite"
                        }
                      >
                        {favorites.includes(index) ? "♥" : "♡"}
                      </button>
                    </div>

                    {editing === index ? (
                      <textarea
                        className="tweet-editor"
                        value={tweet}
                        onChange={(event) =>
                          updateTweet(index, event.target.value)
                        }
                        rows={5}
                        aria-label={`Edit tweet ${index + 1}`}
                        autoFocus
                      />
                    ) : (
                      <p className="tweet-text">{tweet}</p>
                    )}

                    <div className="character-count">
                      <span>
                        {tweet.length} characters
                      </span>

                      {tweet.length > 280 && (
                        <span className="character-warning">
                          Over 280 characters
                        </span>
                      )}
                    </div>

                    <div className="tweet-actions">
                      {editing === index ? (
                        <>
                          <button
                            type="button"
                            className="action-button primary-action"
                            onClick={() => saveEdit(index)}
                          >
                            Save edit
                          </button>

                          <button
                            type="button"
                            className="action-button"
                            onClick={() => {
                              updateTweet(index, result.tweets[index]);
                              setEditing(null);
                              setNotice("Edit cancelled.");
                            }}
                          >
                            Reset
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="action-button"
                            onClick={() => setEditing(index)}
                            disabled={regenerating !== null}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="action-button"
                            onClick={() => copyText(tweet)}
                            disabled={regenerating !== null}
                          >
                            Copy ↗
                          </button>

                          <button
                            type="button"
                            className="action-button regenerate-button"
                            onClick={() => regenerateTweet(index)}
                            disabled={
                              regenerating !== null ||
                              loading
                            }
                          >
                            {regenerating === index ? (
                              <>
                                <span className="small-spinner" />
                                Regenerating
                              </>
                            ) : (
                              <>↻ Regenerate</>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              <div className="favorites-bar">
                <div className="favorites-copy">
                  <span className="favorites-heart">♡</span>
                  <div>
                    <strong>
                      Your shortlist
                    </strong>
                    <p>
                      {favorites.length === 0
                        ? "Save the ideas you love."
                        : `${favorites.length} tweet${
                            favorites.length === 1 ? "" : "s"
                          } saved to your favorites.`}
                    </p>
                  </div>
                </div>

                <button
                  className="download-button"
                  type="button"
                  onClick={() => downloadTweets(true)}
                  disabled={
                    favorites.length === 0 ||
                    regenerating !== null
                  }
                >
                  Download favorites ↓
                </button>
              </div>
            </section>
          </section>
        )}
      </main>

      <footer className="footer">
        <a className="footer-logo" href="/">
          Brand<span>Voice</span>.
        </a>
        <p>Thoughtful content starts here.</p>
        <span className="footer-tagline">
          MADE WITH INTENTION ✳
        </span>
      </footer>
    </div>
  );
}

export default App;
