import { useEffect, useState } from "react";
export default function MyMusic({
  userName,
  spotifyToken,
  spotifySession,
  spotifyConnected,
  onBack,
}) {
  const [playlists, setPlaylists] = useState([]);

  // ============================================================
  // LOAD MOODSYNC PLAYLISTS

  // ============================================================
  const loadPlaylists = () => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("moodsync_playlists") || "[]"
      );
      if (Array.isArray(saved)) {
        setPlaylists(saved);
      } else {
        setPlaylists([]);
      }
    } catch (error) {
      console.error("Failed to load MoodSync playlists:", error);
      setPlaylists([]);
    }
  };
  useEffect(() => {
    loadPlaylists();
    // Listen for playlists created inside the app
    const handlePlaylistCreated = () => {
      loadPlaylists();
    };
    window.addEventListener(
      "moodsync:playlist-created",
      handlePlaylistCreated
    );
    // Listen for localStorage changes
    const handleStorage = (event) => {
      if (event.key === "moodsync_playlists") {
        loadPlaylists();
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        "moodsync:playlist-created",
        handlePlaylistCreated
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // ============================================================
  // SPOTIFY STATUS

  // ============================================================

  // A Spotify connection requires both the access token and backend session ID.
  const isSpotifyConnected = Boolean(spotifyConnected && spotifyToken && spotifySession);

  const handleSpotifyConnect = () => {
    // Clear stale credentials before starting a fresh Spotify authorization.
    try {
      localStorage.removeItem("spotify_access_token");
      localStorage.removeItem("spotify_session");
    } catch (error) {
      console.error("Could not clear old Spotify session:", error);
    }
    // Spotify's backend login route redirects to the Spotify authorization page.
    window.location.assign(
      "https://moodsync-ai-gnuv.onrender.com/spotify/login"
    );
  };

  // ============================================================
  // OPEN SPOTIFY PLAYLIST

  // ============================================================

  const openSpotifyPlaylist = (url) => {
    if (!url) {
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // ============================================================
  // FORMAT DATE

  // ============================================================

  const formatDate = (date) => {
    if (!date) {
      return "Recently created";
    }
    try {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Recently created";
    }
  };

  // ============================================================
  // MOOD ICON

  // ============================================================

  const getMoodIcon = (mood) => {
    const value = (mood || "").toLowerCase().trim();
    if (value === "happy") return "😊";
    if (value === "sad") return "😔";
    if (value === "angry") return "😠";
    if (value === "fear") return "😨";
    if (value === "surprise") return "😮";
    if (value === "disgust") return "😣";
    if (value === "tired") return "😴";
    if (value === "stressed") return "😮‍💨";
    if (value === "relaxed") return "😌";
    if (value === "neutral") return "😐";
    return "🎵";
  };

  // ============================================================
  // MOOD NAME

  // ============================================================

  const getMoodName = (mood) => {
    if (!mood) {
      return "Mood";
    }
    return mood.charAt(0).toUpperCase() + mood.slice(1);
  };

  // ============================================================
  // SOURCE ICON

  // ============================================================

  const getSourceIcon = (source) => {
    const value = (source || "").toLowerCase();
    if (
      value.includes("camera") ||
      value.includes("detection")
    ) {
      return "📷";
    }
    if (value.includes("voice")) {
      return "🎙️";
    }
    if (value.includes("chat")) {
      return "💬";
    }
    return "🧠";
  };

  // ============================================================
  // SOURCE NAME

  // ============================================================

  const getSourceName = (source) => {
    if (!source) {
      return "MoodSync";
    }
    const value = source.toLowerCase();
    if (
      value.includes("camera") ||
      value.includes("detection")
    ) {
      return "Camera Detection";
    }
    if (value.includes("voice")) {
      return "Voice";
    }
    if (value.includes("chat")) {
      return "Conversation";
    }
    return "MoodSync";
  };

  // ============================================================
  // REMOVE DUPLICATES

  // ============================================================

  const uniquePlaylists = playlists.filter(
    (playlist, index, array) => {
      const identifier =
        playlist.id ||
        playlist.spotifyUrl ||
        `${playlist.name}-${playlist.createdAt}`;

      return (
        index ===
        array.findIndex((item) => {
          const itemIdentifier =
            item.id ||
            item.spotifyUrl ||
            `${item.name}-${item.createdAt}`;
          return itemIdentifier === identifier;
        })
      );
    }
  );

  // ============================================================
  // UI

  // ============================================================

  return (
    <div className="min-h-screen bg-[#F5EFE6]">
      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}
      <div className="
        w-full
        max-w-6xl
        mx-auto
        px-5
        sm:px-7
        lg:px-8
        py-8
        lg:py-10
      ">
        {/* ======================================================
            HEADER
        ====================================================== */}
        <div className="
          flex
          items-center
          justify-between
          gap-5
          mb-8
        ">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="
                w-11
                h-11
                shrink-0
                rounded-xl
                bg-white
                border
                border-[#E8DED3]
                shadow-sm
                flex
                items-center
                justify-center
                text-[#4B3425]
                text-xl
                hover:shadow-md
                hover:-translate-x-1
                transition-all
                duration-200
              "
              title="Back to Dashboard"
            >
              ←
            </button>
            <div>
              <div className="
                flex
                items-center
                gap-3
              ">
                <h1 className="
                  text-3xl
                  sm:text-4xl
                  lg:text-5xl
                  font-bold
                  text-[#4B3425]
                  tracking-tight
                ">
                  My Music
                </h1>
                <span className="
                  text-3xl
                  sm:text-4xl
                ">
                  🎵
                </span>
              </div>
              <p className="
                text-gray-500
                mt-1
                text-sm
                sm:text-base
              ">
                Your personalized MoodSync music space.
              </p>
            </div>
          </div>
        </div>
        {/* ======================================================
            SPOTIFY STATUS
        ====================================================== */}
        <div className="
          bg-white
          rounded-2xl
          border
          border-[#E8DED3]
          shadow-sm
          px-5
          sm:px-6
          py-5
          mb-10
        ">
          <div className="
            flex
            flex-col
            sm:flex-row
            sm:items-center
            sm:justify-between
            gap-4
          ">
            <div className="
              flex
              items-center
              gap-4
            ">
              <div className="
                w-12
                h-12
                rounded-xl
                bg-[#F5EFE6]
                flex
                items-center
                justify-center
                text-2xl
                shrink-0
              ">
                🎧
              </div>
              <div>
                <h2 className="
                  text-lg
                  font-bold
                  text-[#4B3425]
                ">
                  Spotify
                </h2>
                <p className="
                  text-sm
                  text-gray-500
                  mt-0.5
                ">
                  {isSpotifyConnected
                    ? "Your Spotify account is connected and ready."
                    : "Connect Spotify to create MoodSync playlists."
                  }
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
              <div
                className={
                  "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold " +
                  (isSpotifyConnected
                    ? "bg-green-50 text-green-700"
                    : "bg-orange-50 text-orange-700")
                }
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                <span>{isSpotifyConnected ? "Connected" : "Not Connected"}</span>
              </div>
              <button
                type="button"
                onClick={handleSpotifyConnect}
                className="rounded-xl bg-[#1DB954] hover:bg-[#169c46] text-white px-5 py-2.5 font-semibold text-sm transition-colors"
              >
                {isSpotifyConnected ? "Reconnect Spotify" : "Connect Spotify"}
              </button>
            </div>
          </div>
        </div>
        {/* ======================================================
            PLAYLIST SECTION HEADER
        ====================================================== */}
        <div className="mb-5">
          <div className="
            flex
            items-center
            gap-3
          ">
            <h2 className="
              text-2xl
              sm:text-3xl
              font-bold
              text-[#4B3425]
            ">
              Your Mood Playlists
            </h2>
            {uniquePlaylists.length > 0 && (
              <span className="
                inline-flex
                items-center
                justify-center
                min-w-7
                h-7
                px-2
                rounded-full
                bg-[#E8DED3]
                text-[#4B3425]
                text-xs
                font-bold
              ">
                {uniquePlaylists.length}
              </span>
            )}
          </div>
          <p className="
            text-gray-500
            mt-1
            text-sm
            sm:text-base
          ">
            Playlists created by MoodSync for your moods.
          </p>
        </div>
        {/* ======================================================
            EMPTY STATE
        ====================================================== */}
        {uniquePlaylists.length === 0 && (
          <div className="
            bg-white
            rounded-3xl
            border
            border-[#E8DED3]
            shadow-sm
            px-6
            py-14
            text-center
          ">
            <div className="
              w-20
              h-20
              mx-auto
              rounded-2xl
              bg-[#F5EFE6]
              flex
              items-center
              justify-center
              text-4xl
            ">
              🎵
            </div>
            <h3 className="
              text-2xl
              font-bold
              text-[#4B3425]
              mt-6
            ">
              No MoodSync playlists yet
            </h3>
            <p className="
              max-w-xl
              mx-auto
              text-gray-500
              mt-3
              leading-6
              text-sm
              sm:text-base
            ">
              Talk to MoodSync through chat or voice,
              or use optional mood detection through the
              camera. When you ask for music, your playlist
              will appear here.
            </p>
            <div className="
              mt-6
              inline-flex
              flex-wrap
              items-center
              justify-center
              gap-2
              px-5
              py-3
              rounded-xl
              bg-[#F8F3EC]
              text-[#4B3425]
              font-medium
              text-sm
            ">
              💬 Talk
              <span className="text-gray-400">→</span>
              🧠 Mood
              <span className="text-gray-400">→</span>
              🎵 Playlist
            </div>
          </div>
        )}
        {/* ======================================================
            PLAYLIST CARDS
        ====================================================== */}
        {uniquePlaylists.length > 0 && (
          <div className="
            grid
            grid-cols-1
            md:grid-cols-2
            gap-6
          ">
            {uniquePlaylists.map(
              (playlist, index) => {
                const moodIcon =
                  getMoodIcon(playlist.mood);
                const moodName =
                  getMoodName(playlist.mood);
                const source =
                  playlist.source ||
                  playlist.createdFrom ||
                  playlist.method ||
                  "";

                return (
                  <div
                    key={
                      playlist.id ||
                      playlist.spotifyUrl ||
                      `${playlist.name}-${index}`
                    }
                    className="
                      group
                      bg-white
                      rounded-3xl
                      border
                      border-[#E8DED3]
                      shadow-sm
                      hover:shadow-xl
                      hover:-translate-y-1
                      transition-all
                      duration-300
                      overflow-hidden
                    "
                  >
                    {/* CARD TOP */}
                    <div className="p-6">
                      <div className="
                        flex
                        items-start
                        justify-between
                        gap-4
                      ">
                        <div className="
                          w-16
                          h-16
                          rounded-2xl
                          bg-[#F5EFE6]
                          flex
                          items-center
                          justify-center
                          text-4xl
                          shadow-sm
                          group-hover:scale-105
                          transition
                        ">
                          {moodIcon}
                        </div>
                      <span className="
                          text-xs
                          font-medium
                          text-gray-400
                          whitespace-nowrap
                        ">
                          {formatDate(playlist.createdAt)}
                        </span>
                    </div>
                      {/* TITLE */}
                      <h3 className="
                        text-xl
                        font-bold
                        text-[#4B3425]
                        mt-5
                        leading-7
                        line-clamp-2
                      ">
                        {playlist.name ||
                          `${moodName} Mood Playlist`
                        } 🎵
                      </h3>
                      {/* MOOD BADGE */}
                      <div className="
                        mt-3
                        inline-flex
                        items-center
                        gap-2
                        px-3
                        py-1.5
                        rounded-full
                        bg-[#F8F3EC]
                        text-[#6B4E3D]
                        text-xs
                        font-semibold
                      ">
                        <span>
                          {moodIcon}
                        </span>
                        <span>
                          {moodName} mood
                        </span>
                      </div>
                      {/* DETAILS */}
                      <div className="
                        mt-6
                        pt-5
                        border-t
                        border-[#F0E8DF]
                        space-y-4
                      ">
                        <div className="
                          flex
                          items-center
                          justify-between
                          text-sm
                        ">
                          <span className="text-gray-500">
                            🎵 Songs
                          </span>
                          <span className="
                            font-semibold
                            text-[#4B3425]
                          ">
                            {playlist.songs ?? 0}
                          </span>
                        </div>
                        <div className="
                          flex
                          items-center
                          justify-between
                          text-sm
                          gap-3
                        ">
                          <span className="text-gray-500">
                            Created through
                          </span>
                          <span className="
                            text-[#4B3425]
                            font-medium
                            text-right
                          ">
                            {getSourceIcon(source)}{" "}
                            {getSourceName(source)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* OPEN SPOTIFY */}
                    <div className="
                      px-6
                      pb-6
                    ">
                      <button
                        onClick={() =>
                          openSpotifyPlaylist(
                            playlist.spotifyUrl
                          )
                        }
                        disabled={
                          !playlist.spotifyUrl
                        }
                        className="
                          w-full
                          bg-[#4B3425]
                          hover:bg-[#362419]
                          disabled:bg-gray-300
                          disabled:cursor-not-allowed
                          text-white
                          py-3.5
                          rounded-xl
                          font-semibold
                          text-sm
                          transition-all
                          duration-200
                          flex
                          items-center
                          justify-center
                          gap-2
                          shadow-sm
                          hover:shadow-md
                        "
                      >
                        {playlist.spotifyUrl ? (
                          <>
                            Open in Spotify
                            <span>↗</span>
                          </>
                        ) : (
                          "Spotify Link Unavailable"
                        )}
                      </button>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
        {/* ======================================================
            HOW IT WORKS
        ====================================================== */}
        <div className="
          mt-10
          bg-[#4B3425]
          text-white
          rounded-3xl
          p-6
          sm:p-8
          shadow-lg
        ">
          <div className="
            flex
            items-center
            gap-3
          ">
            <span className="text-2xl">
              ✨
            </span>
            <h2 className="
              text-xl
              sm:text-2xl
              font-bold
            ">
              How MoodSync Music Works
            </h2>
          </div>
          <div className="
            grid
            grid-cols-1
            md:grid-cols-3
            gap-4
            mt-6
          ">
            <MusicStep
              number="01"
              icon="💬"
              title="Talk to MoodSync"
              text="Share how you're feeling through chat or voice."
            />
            <MusicStep
              number="02"
              icon="🧠"
              title="Understand Your Mood"
              text="MoodSync understands your conversation or optional camera-based mood detection."
            />
            <MusicStep
              number="03"
              icon="🎵"
              title="Create Your Playlist"
              text="Ask for music when you're ready and MoodSync creates a Spotify playlist matching your mood."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MUSIC STEP

// ============================================================

function MusicStep({
  number,
  icon,
  title,
  text,
}) {

  return (
    <div className="
      bg-white/10
      rounded-2xl
      p-5
      border
      border-white/10
      hover:bg-white/[0.14]
      transition
    ">
      <div className="
        flex
        items-center
        justify-between
      ">
        <span className="
          text-xs
          font-bold
          text-white/50
        ">
          {number}
        </span>
        <span className="text-2xl">
          {icon}
        </span>
      </div>
      <h3 className="
        font-semibold
        text-lg
        mt-4
      ">
        {title}
      </h3>
      <p className="
        text-sm
        text-white/70
        mt-2
        leading-6
      ">
        {text}
      </p>
    </div>
  );
}
