import { useState } from "react";
import WebcamPage from "./WebcamPage";

export default function Dashboard({
  userName,
  onLogout,

  // These come from App.jsx
  currentPage: controlledPage,
  onNavigate,

  // Existing Spotify connection data
  spotifyToken,
  spotifySession,
  spotifyConnected,
}) {
  // ============================================================
  // LOCAL STATE
  // ============================================================

  const [openCamera, setOpenCamera] = useState(false);
  const [localPage, setLocalPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // App.jsx controls page if available.
  // Otherwise Dashboard controls it itself.
  const activePage = controlledPage ?? localPage;

  // ============================================================
  // OPEN CAMERA
  // ============================================================

  if (openCamera) {
    return (
      <WebcamPage />
    );
  }

  // ============================================================
  // NAVIGATION
  // ============================================================

  const handleNavigation = (page) => {
    setLocalPage(page);

    if (onNavigate) {
      onNavigate(page);
    }
  };

  // ============================================================
  // SIDEBAR ITEM
  // ============================================================

  const SidebarItem = ({
    icon,
    label,
    page,
    onClick,
  }) => {
    const active = activePage === page;

    return (
      <button
        onClick={
          onClick ||
          (() => handleNavigation(page))
        }
        title={!sidebarOpen ? label : ""}
        className={`
          group
          w-full
          flex
          items-center
          ${
            sidebarOpen
              ? "gap-4 px-4"
              : "justify-center px-2"
          }
          py-3
          rounded-xl
          transition-all
          duration-300
          ${
            active
              ? "bg-white/15 text-white shadow-sm"
              : "text-white/80 hover:bg-white/10 hover:text-white"
          }
        `}
      >
        <span
          className={`
            text-xl
            transition-transform
            duration-300
            ${
              active
                ? "scale-110"
                : "group-hover:scale-110"
            }
          `}
        >
          {icon}
        </span>

        {sidebarOpen && (
          <span className="text-[15px] font-medium whitespace-nowrap">
            {label}
          </span>
        )}
      </button>
    );
  };

  // ============================================================
  // DASHBOARD PAGE
  // ============================================================

  const renderDashboard = () => {
    return (
      <>
        {/* TOP BAR */}
        <div className="flex items-center gap-5 mb-8">

          <button
            onClick={() =>
              setSidebarOpen(!sidebarOpen)
            }
            className="
              w-11 h-11
              rounded-xl
              bg-white
              shadow-sm
              flex
              items-center
              justify-center
              text-[#4B3425]
              hover:shadow-md
              hover:scale-105
              transition
            "
            title="Toggle navigation"
          >
            ☰
          </button>

          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#4B3425]">
              Welcome, {userName} 👋
            </h1>
          </div>

        </div>

        {/* QUICK ACTION TEXT */}

        <div className="mb-8">
          <p className="text-gray-500 text-lg">
            What would you like to do today?
          </p>
        </div>

        {/* CARDS */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">

          {/* DETECT MOOD */}

          <div
            onClick={() => setOpenCamera(true)}
            className="
              group
              bg-white
              rounded-3xl
              shadow-md
              p-8
              cursor-pointer
              border
              border-transparent
              hover:border-[#D9C7B7]
              hover:shadow-xl
              hover:-translate-y-1
              transition-all
              duration-300
            "
          >

            <div
              className="
                w-14 h-14
                rounded-2xl
                bg-[#F5EFE6]
                flex
                items-center
                justify-center
                text-3xl
                mb-6
                group-hover:scale-110
                transition
              "
            >
              😊
            </div>

            <h2 className="text-2xl font-bold text-[#4B3425]">
              Detect Mood
            </h2>

            <p className="mt-3 text-gray-500 leading-6">
              Start your camera and let MoodSync understand your current mood.
            </p>

            <div className="mt-6 text-[#4B3425] font-semibold">
              Start detection →
            </div>

          </div>


          {/* MY MUSIC */}

          <div
            onClick={() =>
              handleNavigation("music")
            }
            className="
              group
              bg-white
              rounded-3xl
              shadow-md
              p-8
              cursor-pointer
              border
              border-transparent
              hover:border-[#D9C7B7]
              hover:shadow-xl
              hover:-translate-y-1
              transition-all
              duration-300
            "
          >

            <div
              className="
                w-14 h-14
                rounded-2xl
                bg-[#F5EFE6]
                flex
                items-center
                justify-center
                text-3xl
                mb-6
                group-hover:scale-110
                transition
              "
            >
              🎵
            </div>

            <h2 className="text-2xl font-bold text-[#4B3425]">
              My Music
            </h2>

            <p className="mt-3 text-gray-500 leading-6">
              Explore playlists created around your conversations and mood.
            </p>

            <div className="mt-6 text-[#4B3425] font-semibold">
              Explore music →
            </div>

          </div>


          {/* HISTORY */}

          <div
            onClick={() =>
              handleNavigation("history")
            }
            className="
              group
              bg-white
              rounded-3xl
              shadow-md
              p-8
              cursor-pointer
              border
              border-transparent
              hover:border-[#D9C7B7]
              hover:shadow-xl
              hover:-translate-y-1
              transition-all
              duration-300
            "
          >

            <div
              className="
                w-14 h-14
                rounded-2xl
                bg-[#F5EFE6]
                flex
                items-center
                justify-center
                text-3xl
                mb-6
                group-hover:scale-110
                transition
              "
            >
              📜
            </div>

            <h2 className="text-2xl font-bold text-[#4B3425]">
              Mood History
            </h2>

            <p className="mt-3 text-gray-500 leading-6">
              Look back at your previous moods and discover your patterns.
            </p>

            <div className="mt-6 text-[#4B3425] font-semibold">
              View history →
            </div>

          </div>


          {/* PROFILE */}

          <div
            onClick={() =>
              handleNavigation("profile")
            }
            className="
              group
              bg-white
              rounded-3xl
              shadow-md
              p-8
              cursor-pointer
              border
              border-transparent
              hover:border-[#D9C7B7]
              hover:shadow-xl
              hover:-translate-y-1
              transition-all
              duration-300
            "
          >

            <div
              className="
                w-14 h-14
                rounded-2xl
                bg-[#F5EFE6]
                flex
                items-center
                justify-center
                text-3xl
                mb-6
                group-hover:scale-110
                transition
              "
            >
              👤
            </div>

            <h2 className="text-2xl font-bold text-[#4B3425]">
              Profile
            </h2>

            <p className="mt-3 text-gray-500 leading-6">
              View your MoodSync profile and account information.
            </p>

            <div className="mt-6 text-[#4B3425] font-semibold">
              View profile →
            </div>

          </div>

        </div>
      </>
    );
  };


  // ============================================================
  // MY MUSIC PAGE
  // ============================================================

  const renderMusic = () => {

    const connected =
      spotifyConnected ||
      !!spotifyToken ||
      !!spotifySession;

    return (
      <>
        <PageHeader
          title="🎵 My Music"
          subtitle="Your mood-based music and playlists."
          onBack={() =>
            handleNavigation("dashboard")
          }
        />


        {/* ======================================================
            SPOTIFY STATUS
        ====================================================== */}

        <div className="
          mt-8
          bg-white
          rounded-3xl
          shadow-md
          p-6
          border
          border-[#E8DED3]
        ">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

            <div className="flex items-center gap-4">

              <div className="
                w-14 h-14
                rounded-2xl
                bg-[#F5EFE6]
                flex
                items-center
                justify-center
                text-3xl
              ">
                🎧
              </div>

              <div>

                <h2 className="text-xl font-bold text-[#4B3425]">
                  Spotify
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  {connected
                    ? "Spotify is connected to MoodSync."
                    : "Connect Spotify to create and open your mood playlists."
                  }
                </p>

              </div>

            </div>


            <div
              className={`
                px-4
                py-2
                rounded-full
                text-sm
                font-semibold
                ${
                  connected
                    ? "bg-green-50 text-green-700"
                    : "bg-orange-50 text-orange-700"
                }
              `}
            >
              {connected
                ? "● Connected"
                : "● Not Connected"}
            </div>

          </div>

        </div>


        {/* ======================================================
            MAIN MUSIC SECTION
        ====================================================== */}

        <div className="
          grid
          grid-cols-1
          lg:grid-cols-2
          gap-7
          mt-7
        ">


          {/* MOOD PLAYLIST */}

          <div className="
            bg-white
            rounded-3xl
            shadow-md
            p-8
            border
            border-transparent
            hover:border-[#D9C7B7]
            hover:shadow-xl
            transition
          ">

            <div className="
              w-16 h-16
              rounded-2xl
              bg-[#F5EFE6]
              flex
              items-center
              justify-center
              text-4xl
              mb-6
            ">
              🎶
            </div>


            <h2 className="text-2xl font-bold text-[#4B3425]">
              Mood Playlists
            </h2>


            <p className="mt-3 text-gray-500 leading-6">
              MoodSync can create a personalized playlist
              after understanding how you're feeling through
              conversation, voice, or mood detection.
            </p>


            <div className="
              mt-7
              rounded-2xl
              bg-[#F8F3EC]
              border
              border-[#E9DED1]
              p-5
            ">

              <p className="text-sm text-gray-500">
                Your playlists created by MoodSync will appear here.
              </p>

              <p className="
                mt-2
                font-semibold
                text-[#4B3425]
              ">
                🎵 Talk to MoodSync and ask for music when you're ready.
              </p>

            </div>

          </div>


          {/* SPOTIFY LIBRARY */}

          <div className="
            bg-white
            rounded-3xl
            shadow-md
            p-8
            border
            border-transparent
            hover:border-[#D9C7B7]
            hover:shadow-xl
            transition
          ">

            <div className="
              w-16 h-16
              rounded-2xl
              bg-[#F5EFE6]
              flex
              items-center
              justify-center
              text-4xl
              mb-6
            ">
              🎧
            </div>


            <h2 className="text-2xl font-bold text-[#4B3425]">
              Your Spotify Music
            </h2>


            <p className="mt-3 text-gray-500 leading-6">
              Playlists created through MoodSync will use
              your connected Spotify account.
            </p>


            {connected ? (

              <div className="
                mt-7
                rounded-2xl
                bg-green-50
                border
                border-green-100
                p-5
              ">

                <div className="flex items-center gap-3">

                  <div className="
                    w-10 h-10
                    rounded-full
                    bg-green-100
                    flex
                    items-center
                    justify-center
                  ">
                    ✓
                  </div>

                  <div>

                    <p className="
                      font-semibold
                      text-green-800
                    ">
                      Spotify Connected
                    </p>

                    <p className="
                      text-sm
                      text-green-700
                      mt-1
                    ">
                      Ready for MoodSync playlists.
                    </p>

                  </div>

                </div>

              </div>

            ) : (

              <div className="
                mt-7
                rounded-2xl
                bg-[#F8F3EC]
                border
                border-[#E9DED1]
                p-5
              ">

                <p className="
                  text-[#4B3425]
                  font-semibold
                ">
                  Spotify isn't connected yet.
                </p>

                <p className="
                  text-sm
                  text-gray-500
                  mt-2
                ">
                  Connect Spotify from the existing Spotify
                  flow before creating a playlist.
                </p>

              </div>

            )}

          </div>

        </div>


        {/* ======================================================
            HOW IT WORKS
        ====================================================== */}

        <div className="
          mt-7
          bg-[#4B3425]
          text-white
          rounded-3xl
          p-8
          shadow-lg
        ">

          <h2 className="text-2xl font-bold">
            ✨ How MoodSync Music Works
          </h2>


          <div className="
            grid
            grid-cols-1
            md:grid-cols-3
            gap-6
            mt-7
          ">


            <MusicStep
              number="01"
              icon="💬"
              title="Tell MoodSync"
              text="Talk about how you're feeling through chat or voice."
            />


            <MusicStep
              number="02"
              icon="🧠"
              title="Understand Your Mood"
              text="MoodSync understands the emotional context of your conversation."
            />


            <MusicStep
              number="03"
              icon="🎵"
              title="Create Your Playlist"
              text="When you ask for music, MoodSync creates a playlist matching your mood."
            />

          </div>

        </div>

      </>
    );
  };


  // ============================================================
  // HISTORY
  // ============================================================

  const renderHistory = () => {
    return (
      <>
        <PageHeader
          title="📜 Mood History"
          subtitle="Keep track of your mood over time."
          onBack={() =>
            handleNavigation("dashboard")
          }
        />

        <div className="
          bg-white
          rounded-3xl
          shadow-md
          p-10
          mt-10
        ">

          <div className="
            w-20 h-20
            mx-auto
            rounded-full
            bg-[#F5EFE6]
            flex
            items-center
            justify-center
            text-4xl
          ">
            📊
          </div>

          <h2 className="
            text-2xl
            font-bold
            text-[#4B3425]
            text-center
            mt-6
          ">
            Your Mood Journey
          </h2>

          <p className="
            text-gray-500
            text-center
            mt-3
            max-w-xl
            mx-auto
            leading-6
          ">
            Your previous mood detections will appear here.
            We can later add mood trends, daily records,
            charts and statistics.
          </p>

          <div className="
            grid
            grid-cols-1
            md:grid-cols-3
            gap-5
            mt-8
          ">

            <StatCard
              icon="😊"
              title="Happy"
            />

            <StatCard
              icon="😐"
              title="Neutral"
            />

            <StatCard
              icon="😢"
              title="Sad"
            />

          </div>

        </div>
      </>
    );
  };


  // ============================================================
  // PROFILE
  // ============================================================

  const renderProfile = () => {
    return (
      <>
        <PageHeader
          title="👤 Profile"
          subtitle="Your MoodSync account information."
          onBack={() =>
            handleNavigation("dashboard")
          }
        />

        <div className="
          bg-white
          rounded-3xl
          shadow-md
          p-10
          mt-10
          max-w-3xl
        ">

          <div className="flex items-center gap-6">

            <div className="
              w-24 h-24
              rounded-full
              bg-[#F5EFE6]
              flex
              items-center
              justify-center
              text-5xl
            ">
              👤
            </div>

            <div>

              <h2 className="
                text-3xl
                font-bold
                text-[#4B3425]
              ">
                {userName}
              </h2>

              <p className="text-gray-500 mt-1">
                MoodSync User
              </p>

            </div>

          </div>

          <div className="mt-10">

            <ProfileRow
              title="Full Name"
              value={userName}
            />

            <ProfileRow
              title="Account"
              value="MoodSync AI User"
            />

            <ProfileRow
              title="Music Preference"
              value="Mood-based Music"
            />

          </div>

        </div>
      </>
    );
  };


  // ============================================================
  // SETTINGS
  // ============================================================

  const renderSettings = () => {
    return (
      <>
        <PageHeader
          title="⚙ Settings"
          subtitle="Manage your MoodSync preferences."
          onBack={() =>
            handleNavigation("dashboard")
          }
        />

        <div className="
          bg-white
          rounded-3xl
          shadow-md
          p-8
          mt-10
          max-w-3xl
        ">

          <SettingRow
            title="Camera Mood Detection"
            description="Use facial emotion detection as additional mood context."
          />

          <SettingRow
            title="Chat Assistant"
            description="Talk with MoodSync using text or voice."
          />

          <SettingRow
            title="Mood-based Music"
            description="Get music recommendations based on your mood."
          />

        </div>
      </>
    );
  };


  // ============================================================
  // PAGE SELECTOR
  // ============================================================

  const renderPage = () => {

    switch (activePage) {

      case "music":
        return renderMusic();

      case "history":
        return renderHistory();

      case "profile":
        return renderProfile();

      case "settings":
        return renderSettings();

      default:
        return renderDashboard();

    }

  };


  // ============================================================
  // MAIN UI
  // ============================================================

  return (

    <div className="min-h-screen flex bg-[#F5EFE6]">


      {/* ========================================================
          SIDEBAR
      ======================================================== */}

      <aside
        className={`
          fixed
          left-0
          top-0
          h-screen
          bg-[#4B3425]
          text-white
          p-5
          flex
          flex-col
          z-50
          shadow-2xl
          transition-all
          duration-300
          ease-in-out
          ${
            sidebarOpen
              ? "w-72"
              : "w-20"
          }
        `}
      >


        {/* LOGO */}

        <div
          className={`
            flex
            items-center
            ${
              sidebarOpen
                ? "justify-between"
                : "justify-center"
            }
            mb-8
          `}
        >

          {sidebarOpen && (

            <div>

              <h1 className="
                text-2xl
                font-bold
                whitespace-nowrap
              ">
                🧠 MoodSync AI
              </h1>

              <p className="
                text-xs
                text-white/60
                mt-1
              ">
                AI Powered Mood Detection
              </p>

            </div>

          )}

          {!sidebarOpen && (

            <span className="text-3xl">
              🧠
            </span>

          )}

        </div>


        {/* TOGGLE */}

        <button
          onClick={() =>
            setSidebarOpen(!sidebarOpen)
          }
          className="
            absolute
            -right-3
            top-8
            w-7
            h-7
            rounded-full
            bg-white
            text-[#4B3425]
            shadow-md
            flex
            items-center
            justify-center
            text-sm
            hover:scale-110
            transition
          "
          title="Toggle navigation"
        >
          {sidebarOpen ? "‹" : "›"}
        </button>


        {/* NAVIGATION */}

        <nav className="space-y-2">

          <SidebarItem
            icon="🏠"
            label="Dashboard"
            page="dashboard"
          />

          <SidebarItem
            icon="😊"
            label="Detect Mood"
            onClick={() =>
              setOpenCamera(true)
            }
          />

          <SidebarItem
            icon="🎵"
            label="My Music"
            page="music"
          />

          <SidebarItem
            icon="📜"
            label="Mood History"
            page="history"
          />

          <SidebarItem
            icon="👤"
            label="Profile"
            page="profile"
          />

          <SidebarItem
            icon="⚙"
            label="Settings"
            page="settings"
          />

        </nav>


        {/* BOTTOM */}

        <div className="mt-auto">

          <button
            onClick={onLogout}
            title={
              !sidebarOpen
                ? "Logout"
                : ""
            }
            className={`
              w-full
              bg-red-500
              hover:bg-red-600
              text-white
              py-3
              rounded-xl
              flex
              items-center
              justify-center
              ${
                sidebarOpen
                  ? "gap-2"
                  : ""
              }
              transition
            `}
          >

            <span>
              ↪
            </span>

            {sidebarOpen && (

              <span>
                Logout
              </span>

            )}

          </button>

        </div>

      </aside>


      {/* ========================================================
          MAIN CONTENT
      ======================================================== */}

      <main
        className={`
          min-h-screen
          w-full
          transition-all
          duration-300
          ${
            sidebarOpen
              ? "ml-72"
              : "ml-20"
          }
        `}
      >

        <div className="
          p-7
          md:p-10
          max-w-[1500px]
          mx-auto
        ">

          {renderPage()}

        </div>

      </main>

    </div>
  );
}


// ============================================================
// PAGE HEADER
// ============================================================

function PageHeader({
  title,
  subtitle,
  onBack,
}) {

  return (

    <div className="
      flex
      items-center
      justify-between
      gap-5
    ">

      <div>

        <h1 className="
          text-4xl
          md:text-5xl
          font-bold
          text-[#4B3425]
        ">
          {title}
        </h1>

        <p className="
          text-gray-500
          mt-2
          text-lg
        ">
          {subtitle}
        </p>

      </div>


      <button
        onClick={onBack}
        className="
          bg-white
          text-[#4B3425]
          px-5
          py-3
          rounded-xl
          shadow-sm
          hover:shadow-md
          hover:-translate-x-1
          transition
          whitespace-nowrap
        "
      >
        ← Dashboard
      </button>

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


// ============================================================
// HISTORY STAT CARD
// ============================================================

function StatCard({
  icon,
  title,
}) {

  return (

    <div className="
      bg-[#F5EFE6]
      rounded-2xl
      p-6
      text-center
    ">

      <div className="text-3xl">
        {icon}
      </div>

      <p className="
        font-semibold
        mt-3
        text-[#4B3425]
      ">
        {title}
      </p>

      <p className="
        text-gray-500
        text-sm
        mt-1
      ">
        No records yet
      </p>

    </div>

  );
}


// ============================================================
// PROFILE ROW
// ============================================================

function ProfileRow({
  title,
  value,
}) {

  return (

    <div className="
      py-5
      border-b
      border-gray-200
    ">

      <p className="
        text-sm
        text-gray-500
      ">
        {title}
      </p>

      <p className="
        text-lg
        font-semibold
        text-[#4B3425]
        mt-1
      ">
        {value}
      </p>

    </div>

  );
}


// ============================================================
// SETTINGS ROW
// ============================================================

function SettingRow({
  title,
  description,
}) {

  return (

    <div className="
      flex
      items-center
      justify-between
      py-6
      border-b
      border-gray-200
      last:border-b-0
    ">

      <div className="pr-6">

        <h3 className="
          font-semibold
          text-lg
          text-[#4B3425]
        ">
          {title}
        </h3>

        <p className="
          text-sm
          text-gray-500
          mt-1
        ">
          {description}
        </p>

      </div>

      <span className="
        text-green-600
        font-semibold
        whitespace-nowrap
      ">
        Enabled
      </span>

    </div>

  );
}