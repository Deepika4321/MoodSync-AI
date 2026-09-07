import { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import MyMusic from "./components/MyMusic";

export default function App() {

  const [signup, setSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");

  // ============================================================
  // PAGE NAVIGATION
  // ============================================================

  const [currentPage, setCurrentPage] = useState("dashboard");


  // ============================================================
  // SPOTIFY
  // ============================================================

  const [spotifyToken, setSpotifyToken] = useState(
    localStorage.getItem("spotify_access_token") || ""
  );

  const [spotifySession, setSpotifySession] = useState(
    localStorage.getItem("spotify_session") || ""
  );

  const [spotifyConnected, setSpotifyConnected] = useState(
    !!(
      localStorage.getItem("spotify_access_token") &&
      localStorage.getItem("spotify_session")
    )
  );


  // ============================================================
  // READ SPOTIFY OAUTH CALLBACK
  // ============================================================

  useEffect(() => {

    const hash = window.location.hash;

    console.log("Current URL hash:", hash);

    if (!hash) {
      return;
    }

    try {

      const params = new URLSearchParams(
        hash.replace(/^#/, "")
      );

      const token = params.get(
        "spotify_access_token"
      );

      const session = params.get(
        "spotify_session"
      );


      // ========================================================
      // TOKEN + SESSION RECEIVED
      // ========================================================

      if (token && session) {

        console.log(
          "Spotify access token received."
        );

        console.log(
          "Spotify session received."
        );


        // ------------------------------------------------------
        // SAVE ACCESS TOKEN
        // ------------------------------------------------------

        localStorage.setItem(
          "spotify_access_token",
          token
        );


        // ------------------------------------------------------
        // SAVE BACKEND SPOTIFY SESSION
        // ------------------------------------------------------

        localStorage.setItem(
          "spotify_session",
          session
        );


        // ------------------------------------------------------
        // UPDATE REACT STATE
        // ------------------------------------------------------

        setSpotifyToken(token);

        setSpotifySession(session);

        setSpotifyConnected(true);

        console.log(
          "Spotify OAuth data saved successfully."
        );


        // ------------------------------------------------------
        // REMOVE TOKEN + SESSION FROM URL
        // ------------------------------------------------------

        window.history.replaceState(
          {},
          document.title,
          window.location.pathname +
          window.location.search
        );

      }


      // ========================================================
      // TOKEN EXISTS BUT SESSION MISSING
      // ========================================================

      else if (token && !session) {

        console.error(
          "Spotify access token received but session is missing."
        );

        alert(
          "Spotify connection incomplete. Please connect Spotify again."
        );

      }


      // ========================================================
      // SPOTIFY ERROR
      // ========================================================

      const urlParams = new URLSearchParams(
        window.location.search
      );

      const spotifyError =
        urlParams.get("spotify_error");

      if (spotifyError) {

        console.error(
          "Spotify OAuth error:",
          spotifyError
        );

        alert(
          "Spotify connection failed: " +
          spotifyError
        );

      }

    } catch (error) {

      console.error(
        "Spotify OAuth processing failed:",
        error
      );

    }

  }, []);


  // ============================================================
  // SIGNUP
  // ============================================================

  const handleSignup = async () => {

    console.log("Signup button clicked");

    setLoading(true);

    try {

      const res = await fetch(
        "http://127.0.0.1:8000/signup",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name: name,
            email: email,
            password: password,
          }),
        }
      );

      const data = await res.json();

      alert(
        data.message || "Account Created"
      );

    } catch (err) {

      console.error(
        "Signup error:",
        err
      );

      alert(
        "Server Error"
      );

    }

    setLoading(false);
  };


  // ============================================================
  // LOGIN
  // ============================================================

  const handleLogin = async () => {

    setLoading(true);

    try {

      const res = await fetch(
        "http://127.0.0.1:8000/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email,
            password: password,
          }),
        }
      );

      const data = await res.json();

      alert(
        data.message
      );

      if (
        data.message === "Login Successful"
      ) {

        // Keep user's actual full name exactly as returned by backend
        setUserName(
          data.name
        );

        // Start from Dashboard after login
        setCurrentPage("dashboard");

        setLoggedIn(true);

      }

    } catch (err) {

      console.error(
        "Login error:",
        err
      );

      alert(
        "Server Error"
      );

    }

    setLoading(false);
  };


  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {

    setLoggedIn(false);

    setUserName("");

    setEmail("");

    setPassword("");

    // Return to Dashboard state for next login
    setCurrentPage("dashboard");

  };


  // ============================================================
  // DASHBOARD
  // ============================================================

  if (loggedIn) {

  if (currentPage === "music") {
    return (
      <MyMusic
        userName={userName}
        spotifyToken={spotifyToken}
        spotifySession={spotifySession}
        spotifyConnected={spotifyConnected}
        onBack={() => setCurrentPage("dashboard")}
      />
    );
  }

  return (
    <Dashboard

      userName={userName}

      spotifyToken={spotifyToken}

      spotifySession={spotifySession}

      spotifyConnected={spotifyConnected}

      currentPage={currentPage}

      onNavigate={setCurrentPage}

      onLogout={handleLogout}

    />
  );
}


  // ============================================================
  // LOGIN / SIGNUP PAGE
  // ============================================================

  return (

    <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center p-4 md:p-8">

      <div className="w-full max-w-6xl bg-white rounded-[32px] md:rounded-[40px] shadow-2xl grid grid-cols-1 md:grid-cols-2 overflow-hidden">


        {/* =====================================================
            LEFT SIDE
        ===================================================== */}

        <div className="relative bg-[#EFE7DA] flex flex-col justify-center items-center px-8 py-10 md:px-12 md:py-12 overflow-hidden">


          {/* TOP LEFT DECORATION */}

          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full border border-[#D8C8B4] opacity-50" />

          <div className="absolute -top-12 -left-12 w-44 h-44 rounded-full bg-[#E5D2B7] opacity-35" />


          {/* BOTTOM RIGHT DECORATION */}

          <div className="absolute -bottom-32 -right-28 w-80 h-80 rounded-full border border-[#D8C8B4] opacity-50" />

          <div className="absolute -bottom-20 -right-20 w-48 h-48 rounded-full bg-[#E5D2B7] opacity-30" />


          {/* DOT PATTERN */}

          <div className="absolute top-8 right-10 grid grid-cols-4 gap-3 opacity-40">

            {Array.from({ length: 12 }).map((_, i) => (

              <span
                key={i}
                className="w-1 h-1 rounded-full bg-[#B98A5A]"
              />

            ))}

          </div>


          <div className="relative z-10 flex flex-col items-center w-full">


            {/* =================================================
                LOGO
            ================================================= */}

            <img
              src="/moodsync-logo.png"
              alt="MoodSync AI"
              className="w-32 h-32 md:w-36 md:h-36 object-contain mb-2"
            />


            {/* =================================================
                TITLE
            ================================================= */}

            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#4B3425] text-center">

              MoodSync AI

            </h1>


            {/* =================================================
                HEARTBEAT DIVIDER
            ================================================= */}

            <div className="mt-3 flex items-center justify-center gap-2">

              <span className="h-px w-16 bg-[#B79A78]" />

              <span className="text-[#A76D3F] text-xl font-bold">
                〽
              </span>

              <span className="h-px w-16 bg-[#B79A78]" />

            </div>


            {/* =================================================
                DESCRIPTION
            ================================================= */}

            <p className="mt-4 text-base md:text-lg text-[#6B5B50] text-center leading-7">

              AI Powered Mood Detection

              <br />

              &amp; Music Recommendation

            </p>


            {/* =================================================
                FEATURE CARDS
            ================================================= */}

            <div className="mt-6 flex items-center justify-center gap-2 md:gap-3 w-full">


              {/* DETECT MOOD */}

              <div className="flex flex-col items-center justify-center w-[100px] md:w-[110px] h-[62px] rounded-2xl bg-[#F9F4EC] border border-[#E6D9C9] shadow-sm hover:shadow-md transition">

                <span className="text-lg leading-none">
                  🧠
                </span>

                <span className="mt-1 text-[10px] md:text-[11px] font-semibold text-[#5F4A3B]">
                  Detect Mood
                </span>

              </div>


              {/* RECOMMEND MUSIC */}

              <div className="flex flex-col items-center justify-center w-[110px] md:w-[120px] h-[62px] rounded-2xl bg-[#F9F4EC] border border-[#E6D9C9] shadow-sm hover:shadow-md transition">

                <span className="text-lg leading-none">
                  🎵
                </span>

                <span className="mt-1 text-[10px] md:text-[11px] font-semibold text-[#5F4A3B]">
                  Recommend Music
                </span>

              </div>


              {/* FEEL BETTER */}

              <div className="flex flex-col items-center justify-center w-[100px] md:w-[110px] h-[62px] rounded-2xl bg-[#F9F4EC] border border-[#E6D9C9] shadow-sm hover:shadow-md transition">

                <span className="text-lg leading-none">
                  ❤️
                </span>

                <span className="mt-1 text-[10px] md:text-[11px] font-semibold text-[#5F4A3B]">
                  Feel Better
                </span>

              </div>


            </div>


            {/* =================================================
                QUOTE
            ================================================= */}

            <div className="mt-7 max-w-sm rounded-2xl bg-[#F8F2E9] border border-[#E6D9C9] px-6 py-4 shadow-sm text-center">

              <div className="text-2xl text-[#B77945] leading-none mb-1">
                “
              </div>

              <p className="text-sm text-[#6B5B50] leading-6 italic">

                Understand your mood.

                <br />

                Discover the music that heals.

              </p>

              <div className="text-2xl text-[#B77945] leading-none mt-1">
                ”
              </div>

            </div>


          </div>

        </div>


        {/* =====================================================
            RIGHT SIDE
        ===================================================== */}

        <div className="flex items-center justify-center p-8 md:p-12 lg:p-14 bg-white">

          <div className="w-full max-w-md">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="mb-7">

              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#4B3425]">

                {signup ? (

                  "Create Account"

                ) : (

                  <>
                    Good to see you
                    <span className="text-3xl"> 👋</span>
                  </>

                )}

              </h2>


              <p className="text-[#7A6B61] mt-2 leading-6">

                {signup

                  ? "Create your MoodSync account and begin your musical journey."

                  : "Sign in to continue your personalized mood journey."}

              </p>

            </div>


            {/* =================================================
                NAME
            ================================================= */}

            {signup && (

              <div className="relative">

                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A7A6D]">
                  👤
                </span>

                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-4 pl-12 rounded-xl border border-[#DED5CA] bg-[#FCFAF7] outline-none text-[#4B3425] placeholder-[#9A9189] focus:border-[#A77A4D] focus:ring-2 focus:ring-[#A77A4D]/10 transition"
                />

              </div>

            )}


            {/* =================================================
                EMAIL
            ================================================= */}

            <div className={`${signup ? "mt-4" : ""} relative`}>

              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6F6A63] text-lg">
                ✉
              </span>

              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 pl-12 rounded-xl border border-[#DED5CA] bg-[#EAF2FF] outline-none text-[#4B3425] placeholder-[#8A827A] focus:border-[#A77A4D] focus:ring-2 focus:ring-[#A77A4D]/10 transition"
              />

            </div>


            {/* =================================================
                PASSWORD
            ================================================= */}

            <div className="relative mt-4">

              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6F6A63] text-lg">
                🔒
              </span>

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 pl-12 pr-14 rounded-xl border border-[#DED5CA] bg-[#EAF2FF] outline-none text-[#4B3425] placeholder-[#8A827A] focus:border-[#A77A4D] focus:ring-2 focus:ring-[#A77A4D]/10 transition"
              />


              {/* SHOW / HIDE */}

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7A7A7A] hover:text-[#4B3425] transition text-lg"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >

                {showPassword
                  ? "◉"
                  : "◌"}

              </button>

            </div>


            {/* =================================================
                LOGIN / SIGNUP BUTTON
            ================================================= */}

            <button
              onClick={signup ? handleSignup : handleLogin}
              disabled={loading}
              className="mt-6 w-full bg-[#8B6B4A] hover:bg-[#73563A] disabled:opacity-60 disabled:cursor-not-allowed text-white p-4 rounded-xl font-semibold transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >

              <span className="text-lg">

                {signup
                  ? "✦"
                  : "⇥"}

              </span>


              <span>

                {loading

                  ? "Please Wait..."

                  : signup

                  ? "Create Account  →"

                  : "Sign In  →"}

              </span>

            </button>


            {/* =================================================
                OR
            ================================================= */}

            <div className="flex items-center gap-4 my-5">

              <div className="h-px flex-1 bg-[#E5DED6]" />

              <span className="text-xs uppercase tracking-wider text-[#9A9189]">
                OR
              </span>

              <div className="h-px flex-1 bg-[#E5DED6]" />

            </div>


            {/* =================================================
                GOOGLE
            ================================================= */}

            <button
              type="button"
              className="w-full border border-[#D8D0C7] bg-white p-4 rounded-xl hover:bg-[#FAF8F5] transition text-[#4B3425] font-medium flex items-center justify-center gap-3"
            >

              <span className="font-bold text-xl text-[#4285F4]">
                G
              </span>

              Continue with Google

            </button>


            {/* =================================================
                SWITCH LOGIN / SIGNUP
            ================================================= */}

            <p className="mt-6 text-center text-sm text-[#7A6B61]">

              {signup

                ? "Already have an account?"

                : "New to MoodSync?"}


              <button
                type="button"
                className="ml-2 text-[#8B6B4A] font-semibold hover:text-[#73563A] transition"
                onClick={() => setSignup(!signup)}
              >

                {signup

                  ? "Sign In →"

                  : "Create Account →"}

              </button>

            </p>


          </div>

        </div>


      </div>

    </div>

  );
}