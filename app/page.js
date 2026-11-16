'use client';

import { useState, useEffect, useCallback } from "react";
import "./globals.css";

const fmt = (n) => {
  if (n == null) return "-";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toString();
};

const timeAgo = (ts) => {
  if (!ts) return "";
  const d = Math.floor((Date.now() - ts * 1000) / 86400000);
  if (d === 0) return "today";
  if (d === 1) return "1d ago";
  if (d < 30) return d + "d ago";
  return Math.floor(d / 30) + "mo ago";
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Debounced live search
  useEffect(() => {
    if (!query.trim() || query.includes(" ") === false && query.length < 2) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const j = await r.json();
        if (j.ok) {
          setSearchResults(j.data);
          setShowSearch(true);
        }
      } catch {}
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const stalk = useCallback(async (username) => {
    const u = username.replace(/^@/, "").trim();
    if (!u) return;
    setLoading(true);
    setError(null);
    setProfile(null);
    setPosts([]);
    setShowSearch(false);
    setQuery(u);
    setActiveTab("overview");
    try {
      const [pRes, postRes] = await Promise.all([
        fetch(`/api/profile?u=${encodeURIComponent(u)}`),
        fetch(`/api/posts?u=${encodeURIComponent(u)}&n=12`),
      ]);
      const pJson = await pRes.json();
      const postJson = await postRes.json();
      if (!pJson.ok) throw new Error(pJson.error || "Profile not found");
      setProfile(pJson.data);
      if (postJson.ok) setPosts(postJson.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleKey = (e) => {
    if (e.key === "Enter") stalk(query);
  };

  return (
    <>
      <header className="header">
        <div className="logo">
          IG<span>STALK</span>
        </div>
        <div className="header-badge">PUBLIC DATA ONLY</div>
      </header>

      <div className="hero">
        <h1>Profile Intelligence</h1>
        <p>Locate any public Instagram profile. Full data, zero login.</p>
        <div className="search-box">
          <input
            placeholder="@username"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            spellCheck={false}
            autoComplete="off"
          />
          <button className="btn" onClick={() => stalk(query)} disabled={loading}>
            {loading ? "..." : "Stalk"}
          </button>
        </div>
      </div>

      {showSearch && searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.slice(0, 6).map((r) => (
            <div key={r.username} className="search-item" onClick={() => stalk(r.username)}>
              <img src={r.profilePic} alt={r.username} />
              <div>
                <div className="search-item-name">
                  {r.username} {r.isVerified && "✔️"}
                </div>
                <div className="search-item-sub">
                  {r.fullName} · {fmt(r.followerCount)} followers
                  {r.isPrivate ? " · 🔒" : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <div className="error-box">{error}</div>}

      {loading && !profile && (
        <div className="empty-state">
          <div className="spinner" />
          <p style={{ marginTop: 12 }}>Locating profile...</p>
        </div>
      )}

      {!profile && !loading && !error && (
        <div className="empty-state">
          <p style={{ fontSize: 40, marginBottom: 8 }}>👤</p>
          <p>Enter a username to pull full public profile data.</p>
        </div>
      )}

      {profile && (
        <div className="container">
          <div className="grid">
            {/* LEFT — identity card */}
            <div>
              <div className="card">
                <div className="profile-head">
                  <div className="avatar-ring">
                    <img src={profile.profilePicHD || profile.profilePic} alt={profile.username} />
                  </div>
                  <div>
                    <div className="profile-name">
                      {profile.fullName || profile.username}
                      {profile.isVerified && <span title="Verified">✔️</span>}
                    </div>
                    <div className="profile-username">@{profile.username}</div>
                    <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {profile.isPrivate ? (
                        <span className="badge badge-red">PRIVATE</span>
                      ) : (
                        <span className="badge badge-blue">PUBLIC</span>
                      )}
                      {profile.isBusiness && (
                        <span className="badge badge-gray">
                          {profile.businessCategory || "BUSINESS"}
                        </span>
                      )}
                      {profile.isVerified && (
                        <span className="badge badge-blue">VERIFIED</span>
                      )}
                    </div>
                  </div>
                </div>

                {profile.biography && <div className="profile-bio">{profile.biography}</div>}

                {profile.externalUrl && (
                  <a
                    className="profile-link"
                    href={profile.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    🔗 {profile.externalUrl.replace(/^https?:\/\//, "")}
                  </a>
                )}

                <div className="stats">
                  <div className="stat">
                    <div className="stat-val">{fmt(profile.postsCount)}</div>
                    <div className="stat-label">Posts</div>
                  </div>
                  <div className="stat">
                    <div className="stat-val">{fmt(profile.followers)}</div>
                    <div className="stat-label">Followers</div>
                  </div>
                  <div className="stat">
                    <div className="stat-val">{fmt(profile.following)}</div>
                    <div className="stat-label">Following</div>
                  </div>
                </div>
              </div>

              {/* Related profiles */}
              {profile.relatedProfiles?.length > 0 && (
                <div className="card" style={{ marginTop: 20 }}>
                  <div className="card-title">Similar Accounts</div>
                  <div className="related-grid">
                    {profile.relatedProfiles.map((r) => (
                      <div
                        key={r.username}
                        className="related-item"
                        style={{ cursor: "pointer" }}
                        onClick={() => stalk(r.username)}
                      >
                        <img src={r.profilePic} alt={r.username} />
                        <div>@{r.username}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT — data panel */}
            <div className="card">
              <div className="tabs">
                {["overview", "posts", "raw"].map((t) => (
                  <button
                    key={t}
                    className={`tab ${activeTab === t ? "active" : ""}`}
                    onClick={() => setActiveTab(t)}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              {activeTab === "overview" && (
                <div>
                  <div className="card-title">Account Details</div>
                  {[
                    ["User ID", profile.userId],
                    ["Facebook ID", profile.fbId],
                    ["Account Type", profile.isBusiness ? "Business" : "Personal"],
                    ["Business Category", profile.businessCategory],
                    ["Joined Recently", profile.joinedRecently ? "Yes ⚠️" : "No"],
                    ["Has Reels", profile.hasClips ? "Yes" : "No"],
                    ["IGTV Videos", profile.igtvCount],
                    ["Highlights", profile.highlightReelCount],
                    ["Private", profile.isPrivate ? "Yes 🔒" : "No"],
                    ["Verified", profile.isVerified ? "Yes ✔️" : "No"],
                  ]
                    .filter(([, v]) => v !== undefined && v !== null && v !== "")
                    .map(([k, v]) => (
                      <div className="detail-row" key={k}>
                        <span className="detail-key">{k}</span>
                        <span className="detail-val">{String(v)}</span>
                      </div>
                    ))}
                </div>
              )}

              {activeTab === "posts" && (
                <div>
                  <div className="card-title">
                    Latest {posts.length || profile.latestPosts?.length || 0} Posts
                  </div>
                  {(posts.length ? posts : profile.latestPosts || []).length === 0 ? (
                    <p style={{ color: "var(--muted)", fontSize: 13 }}>
                      {profile.isPrivate
                        ? "Private account — posts hidden."
                        : "No recent posts."}
                    </p>
                  ) : (
                    <div className="posts-grid">
                      {(posts.length ? posts : profile.latestPosts).map((p) => (
                        <a
                          key={p.id}
                          href={`https://instagram.com/p/${p.shortcode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="post-thumb"
                        >
                          <img src={p.thumbnail || p.displayUrl} alt="" loading="lazy" />
                          {p.isVideo && <span className="post-type-icon">▶️</span>}
                          <div className="post-overlay">
                            <span>❤️ {fmt(p.likes)}</span>
                            <span>💬 {fmt(p.comments)}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "raw" && (
                <div>
                  <div className="card-title">Raw JSON</div>
                  <pre
                    style={{
                      background: "#f6f8fa",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      padding: 16,
                      fontSize: 12,
                      overflow: "auto",
                      maxHeight: 500,
                      margin: 0,
                    }}
                  >
                    {JSON.stringify(profile, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        IGSTALK · reads public Instagram data only · no login · no data stored
      </footer>
    </>
  );
}
