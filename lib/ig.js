// Core Instagram public-data fetcher
// Uses Instagram's public web GraphQL — no auth needed for public profiles

const IG_BASE = "https://www.instagram.com";
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "X-IG-App-ID": "936619743392459",
  Accept: "application/json",
};

export async function getProfile(username) {
  const res = await fetch(
    `${IG_BASE}/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
    { headers: HEADERS, next: { revalidate: 300 } }
  );
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`IG responded ${res.status} — ${err.slice(0, 200)}`);
  }
  const json = await res.json();
  const u = json?.data?.user;
  if (!u) throw new Error("Profile not found or private");
  return normalizeUser(u);
}

export async function getPosts(username, count = 12) {
  // GraphQL query hash for user posts timeline
  const q = "003056d32c2554def87228bc3fd9668a";
  const res = await fetch(
    `${IG_BASE}/graphql/query/?query_hash=${q}&variables=` +
      encodeURIComponent(
        JSON.stringify({ username, first: count })
      ),
    { headers: HEADERS, next: { revalidate: 300 } }
  );
  if (!res.ok) throw new Error(`Posts fetch failed: ${res.status}`);
  const json = await res.json();
  const edges = json?.data?.user?.edge_owner_to_timeline_media?.edges || [];
  return edges.map((e) => normalizePost(e.node));
}

export async function searchUsers(query) {
  const res = await fetch(
    `${IG_BASE}/web/search/topsearch/?query=${encodeURIComponent(query)}`,
    { headers: HEADERS, next: { revalidate: 60 } }
  );
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const json = await res.json();
  return (json?.users || []).map((u) => ({
    username: u.user?.username,
    fullName: u.user?.full_name,
    isPrivate: u.user?.is_private,
    isVerified: u.user?.is_verified,
    profilePic: u.user?.profile_pic_url,
    followerCount: u.user?.follower_count,
  }));
}

function normalizeUser(u) {
  return {
    username: u.username,
    fullName: u.full_name,
    biography: u.biography,
    externalUrl: u.external_url,
    followers: u.edge_followed_by?.count,
    following: u.edge_follow?.count,
    postsCount: u.edge_owner_to_timeline_media?.count,
    isPrivate: u.is_private,
    isVerified: u.is_verified,
    isBusiness: u.is_business_account,
    businessCategory: u.business_category_name || u.category_name,
    profilePicHD: u.profile_pic_url_hd,
    profilePic: u.profile_pic_url,
    userId: u.id,
    fbId: u.fb_id,
    joinedRecently: u.is_joined_recently,
    hasClips: u.has_clips,
    highlightReelCount: u.highlight_reel_count,
    igtvCount: u.edge_felix_video_timeline?.count,
    relatedProfiles: (u.edge_related_profiles?.edges || []).map((e) => ({
      username: e.node?.username,
      fullName: e.node?.full_name,
      profilePic: e.node?.profile_pic_url,
      isVerified: e.node?.is_verified,
    })),
    latestPosts: (u.edge_owner_to_timeline_media?.edges || []).map((e) =>
      normalizePost(e.node)
    ),
  };
}

function normalizePost(n) {
  return {
    id: n.id,
    shortcode: n.shortcode,
    type: n.__typename,
    displayUrl: n.display_url,
    thumbnail: n.thumbnail_src,
    isVideo: n.is_video,
    videoUrl: n.video_url || null,
    videoViewCount: n.video_view_count || null,
    likes: n.edge_liked_by?.count ?? n.edge_media_preview_like?.count,
    comments: n.edge_media_to_comment?.count,
    caption:
      n.edge_media_to_caption?.edges?.[0]?.node?.text?.slice(0, 300) || "",
    timestamp: n.taken_at_timestamp,
    location: n.location?.name || null,
    dimensions: n.dimensions,
  };
}
