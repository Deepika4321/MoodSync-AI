import Chatbot from "./Chatbot";
import Webcam from "react-webcam";
import { useEffect, useRef, useState } from "react";

export default function WebcamPage() {

    const webcamRef = useRef(null);

    const [capturedImage, setCapturedImage] = useState(null);
    const [emotionData, setEmotionData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [playlistLoading, setPlaylistLoading] = useState(false);
    const [playlistCreated, setPlaylistCreated] = useState(null);
    const [textMessage, setTextMessage] = useState("");

    // -----------------------------------------
    // LOCAL CARD CHAT STATE
    // IMPORTANT:
    // These messages belong ONLY to the Text/Voice
    // cards. They are NOT sent to the floating Chatbot.
    // -----------------------------------------
    const [cardMessages, setCardMessages] = useState([
        {
            sender: "bot",
            text: "Hi! 👋 Tell me how you're feeling and I'll understand your mood."
        }
    ]);

    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    // -----------------------------------------
    // CARD 1 PLAYLIST STATE
    // -----------------------------------------
    const [cardConversationMood, setCardConversationMood] = useState("");
    const [cardWaitingForSongCount, setCardWaitingForSongCount] =
        useState(false);
    const [cardPlaylistCreated, setCardPlaylistCreated] = useState(null);
    const [cardSongCount, setCardSongCount] = useState(5);
    const cardSendingRef = useRef(false);

    // -----------------------------------------
    // SPOTIFY OAUTH SESSION INITIALIZER
    // -----------------------------------------
    useEffect(() => {
        try {
            const hash = window.location.hash;

            if (!hash) return;

            const params = new URLSearchParams(
                hash.replace(/^#/, "")
            );

            const accessToken =
                params.get("spotify_access_token");

            const spotifySession =
                params.get("spotify_session");

            if (accessToken) {
                localStorage.setItem(
                    "spotify_access_token",
                    accessToken
                );
            }

            if (spotifySession) {
                localStorage.setItem(
                    "spotify_session",
                    spotifySession
                );
            }

            // Remove OAuth values from the visible URL
            // after saving them locally.
            if (accessToken || spotifySession) {
                window.history.replaceState(
                    null,
                    document.title,
                    window.location.pathname +
                        window.location.search
                );
            }

        } catch (err) {
            console.error(
                "Spotify OAuth initialization error:",
                err
            );
        }
    }, []);


    // -----------------------------------------
    // NUMBER OF SONGS
    // -----------------------------------------

    // Default = 5
    // Allowed range = 1 to 20
    const [songCount, setSongCount] = useState(5);


    // -----------------------------------------
    // SPOTIFY TOKEN / SESSION HELPERS
    // -----------------------------------------

    const refreshSpotifyToken = async () => {

        try {

            // Get the Spotify session saved during OAuth
            let spotifySession =
                localStorage.getItem("spotify_session");


            // Recover session from OAuth hash if needed
            if (!spotifySession) {

                const hash = window.location.hash;

                if (hash) {

                    const params = new URLSearchParams(
                        hash.replace(/^#/, "")
                    );

                    spotifySession =
                        params.get("spotify_session");

                    if (spotifySession) {

                        localStorage.setItem(
                            "spotify_session",
                            spotifySession
                        );
                    }
                }
            }


            // If there is no session, Spotify really is
            // not connected.
            if (!spotifySession) {

                throw new Error(
                    "Spotify session is missing. Please connect Spotify again."
                );
            }


            // Ask backend for a fresh Spotify access token
            const response = await fetch(
                "https://moodsync-ai-gnuv.onrender.com/spotify/refresh",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",

                        "X-Spotify-Session":
                            spotifySession,
                    },

                    body: JSON.stringify({
                        session_id: spotifySession,
                    }),

                    credentials: "include",
                }
            );


            let data = null;

            try {
                data = await response.json();
            } catch {}


            console.log(
                "Spotify refresh response:",
                data
            );


            if (
                !response.ok ||
                !data?.access_token
            ) {

                localStorage.removeItem(
                    "spotify_access_token"
                );

                throw new Error(
                    data?.error ||
                    "Spotify session expired. Please connect Spotify again."
                );
            }


            // Save new access token
            localStorage.setItem(
                "spotify_access_token",
                data.access_token
            );


            // Some backend versions return a new
            // session ID.
            if (data?.session_id) {

                localStorage.setItem(
                    "spotify_session",
                    data.session_id
                );
            }


            return data.access_token;


        } catch (err) {

            console.error(
                "Spotify token refresh error:",
                err
            );

            localStorage.removeItem(
                "spotify_access_token"
            );

            throw new Error(
                err?.message ||
                "Spotify session expired. Please connect Spotify again."
            );
        }
    };


    // -----------------------------------------
    // SPOTIFY REQUEST HELPER
    // -----------------------------------------

    const spotifyFetch = async (
        url,
        options = {}
    ) => {

        let accessToken =
            localStorage.getItem(
                "spotify_access_token"
            );


        // -----------------------------------------
        // IMPORTANT FIX
        // -----------------------------------------
        // If access token is missing, don't immediately
        // say Spotify is disconnected.
        //
        // First try to refresh the token using the
        // stored Spotify session.
        // -----------------------------------------

        if (!accessToken) {

            try {

                accessToken =
                    await refreshSpotifyToken();

            } catch (err) {

                throw new Error(
                    err?.message ||
                    "Spotify is not connected. Please connect Spotify first."
                );
            }
        }


        // -----------------------------------------
        // MAKE SPOTIFY REQUEST
        // -----------------------------------------

        const makeRequest = (token) => {

            const headers = {

                ...(options.headers || {}),

                Authorization:
                    `Bearer ${token}`,
            };


            return fetch(
                url,
                {
                    ...options,
                    headers,
                }
            );
        };


        let response =
            await makeRequest(
                accessToken
            );


        // -----------------------------------------
        // ACCESS TOKEN EXPIRED
        // -----------------------------------------

        if (response.status === 401) {

            console.log(
                "Spotify access token expired. Refreshing token..."
            );


            accessToken =
                await refreshSpotifyToken();


            // Retry original request
            response =
                await makeRequest(
                    accessToken
                );
        }


        return response;
    };


    // -----------------------------------------
    // CAMERA SETTINGS
    // -----------------------------------------

    const videoConstraints = {

        width: 640,

        height: 480,

        facingMode: "user",
    };


    // -----------------------------------------
    // EMOTION EMOJIS
    // -----------------------------------------

    const emotionEmoji = {

        happy: "😊",

        sad: "😢",

        angry: "😡",

        fear: "😨",

        surprise: "😲",

        disgust: "🤢",

        neutral: "😐",
    };


    // -----------------------------------------
    // CREATE SPOTIFY MOOD PLAYLIST
    // -----------------------------------------

    const createMoodPlaylist = async (
        requestedSongCount = songCount,
        requestedMood = ""
    ) => {

        // Keep a popup handle so the browser allows opening Spotify after
        // the asynchronous API requests finish. Opening a new tab only at
        // the end of this function is often blocked by popup protection.
        let spotifyWindow = null;

        // IMPORTANT: The caller decides which mood source to use.
        // Facial Scan passes emotionData?.emotion explicitly.
        // Text/Voice passes cardConversationMood explicitly.
        // This prevents an old voice mood (e.g. energetic) from
        // overriding a fresh facial result (e.g. sad).
        const moodFromCard =
            String(
                requestedMood ||
                ""
            )
                .toLowerCase()
                .trim();

        if (!moodFromCard) {
            alert(
                "Tell me how you're feeling first, then ask me to create your playlist."
            );
            return;
        }

        const selectedSongCount = Math.min(
            20,
            Math.max(
                1,
                Number(requestedSongCount) || 1
            )
        );

        // Open a tab synchronously from the user's playlist button click.
        // The playlist URL is not known until Spotify's async requests finish.
        // Only open a tab when a Spotify token/session exists, avoiding a
        // stray blank tab when Spotify has not been authorized on this browser.
        const hasSpotifyAuth = Boolean(
            localStorage.getItem("spotify_session") ||
            localStorage.getItem("spotify_access_token")
        );

        if (hasSpotifyAuth) {
            try {
                spotifyWindow = window.open("about:blank", "_blank");

                if (spotifyWindow) {
                    // Prevent the opened tab from accessing this app's window.
                    spotifyWindow.opener = null;
                    spotifyWindow.document.title = "MoodSync - Creating playlist";
                    spotifyWindow.document.body.innerHTML = `
                        <main style="font-family:Arial,sans-serif;padding:40px;color:#4B3425;text-align:center">
                            <h2>🎵 Creating your MoodSync playlist...</h2>
                            <p>Spotify will open automatically when your playlist is ready.</p>
                        </main>
                    `;
                }
            } catch (popupError) {
                console.warn("Could not prepare Spotify tab:", popupError);
                spotifyWindow = null;
            }
        }

        setPlaylistLoading(true);
        setPlaylistCreated(null);
        setCardPlaylistCreated(null);

        try {

            const mood = moodFromCard;

            const moodQueries = {

                happy:
                    "happy upbeat feel good",

                sad:
                    "sad emotional healing",

                angry:
                    "angry powerful rock",

                fear:
                    "calm relaxing peaceful",

                surprise:
                    "energetic upbeat exciting",

                energetic:
                    "energetic upbeat high energy",

                disgust:
                    "chill alternative",

                tired:
                    "calm relaxing acoustic",

                stressed:
                    "calm relaxing stress relief",

                relaxed:
                    "chill peaceful relaxing",

                neutral:
                    "chill lo-fi",

            };

            const searchQuery =
                moodQueries[mood] ||
                "chill music";

            const allTracks = [];

            const firstLimit =
                Math.min(
                    selectedSongCount,
                    10
                );

            const firstSearchParams =
                new URLSearchParams({

                    q:
                        searchQuery,

                    type:
                        "track",

                    limit:
                        String(
                            firstLimit
                        ),

                    offset:
                        "0",
                });

            const firstSearchResponse =
                await spotifyFetch(

                    `https://api.spotify.com/v1/search?${firstSearchParams.toString()}`,

                    {
                        method:
                            "GET",
                    }
                );

            let firstSearchData = null;

            try {
                firstSearchData =
                    await firstSearchResponse.json();
            } catch {}

            if (
                !firstSearchResponse.ok
            ) {

                console.error(
                    "Spotify first search error:",
                    firstSearchData
                );

                throw new Error(
                    firstSearchData?.error?.message ||
                    `Spotify search failed (${firstSearchResponse.status}).`
                );
            }

            allTracks.push(
                ...(
                    firstSearchData
                        ?.tracks
                        ?.items || []
                )
            );

            if (selectedSongCount > 10) {

                const secondSearchParams =
                    new URLSearchParams({

                        q:
                            searchQuery,

                        type:
                            "track",

                        limit:
                            String(
                                selectedSongCount - 10
                            ),

                        offset:
                            "10",
                    });

                const secondSearchResponse =
                    await spotifyFetch(

                        `https://api.spotify.com/v1/search?${secondSearchParams.toString()}`,

                        {
                            method:
                                "GET",
                        }
                    );

                let secondSearchData = null;

                try {
                    secondSearchData =
                        await secondSearchResponse.json();
                } catch {}

                if (
                    !secondSearchResponse.ok
                ) {

                    console.error(
                        "Spotify second search error:",
                        secondSearchData
                    );

                    throw new Error(
                        secondSearchData?.error?.message ||
                        `Spotify search failed (${secondSearchResponse.status}).`
                    );
                }

                allTracks.push(
                    ...(
                        secondSearchData
                            ?.tracks
                            ?.items || []
                    )
                );
            }

            const trackUris =
                allTracks
                    .filter(
                        (track) =>
                            track?.uri
                    )
                    .slice(
                        0,
                        selectedSongCount
                    )
                    .map(
                        (track) =>
                            track.uri
                    );

            if (
                trackUris.length === 0
            ) {
                throw new Error(
                    `No songs were found for the ${mood} mood.`
                );
            }

            const playlistResponse =
                await spotifyFetch(

                    "https://api.spotify.com/v1/me/playlists",

                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({

                                name:
                                    `MoodSync AI - ${mood} Mood 🎵`,

                                description:
                                    `A personalized ${mood} mood playlist created by MoodSync AI.`,

                                public:
                                    false,
                            }),
                    }
                );

            let playlistData = null;

            try {
                playlistData =
                    await playlistResponse.json();
            } catch {}

            if (
                !playlistResponse.ok
            ) {

                console.error(
                    "Spotify playlist creation error:",
                    playlistData
                );

                if (
                    playlistResponse.status === 403
                ) {
                    throw new Error(
                        "Spotify denied playlist creation. Please reconnect Spotify and grant playlist modification permission."
                    );
                }

                throw new Error(
                    playlistData?.error?.message ||
                    `Unable to create Spotify playlist (${playlistResponse.status}).`
                );
            }

            const playlist =
                playlistData;

            const itemsResponse =
                await spotifyFetch(

                    `https://api.spotify.com/v1/playlists/${playlist.id}/items`,

                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                uris:
                                    trackUris,
                            }),
                    }
                );

            let itemsData = null;

            try {
                itemsData =
                    await itemsResponse.json();
            } catch {}

            if (
                !itemsResponse.ok
            ) {

                console.error(
                    "Spotify add-items error:",
                    itemsData
                );

                throw new Error(
                    itemsData?.error?.message ||
                    `Unable to add songs to the playlist (${itemsResponse.status}).`
                );
            }

            setPlaylistCreated(
                playlist
            );

            setCardPlaylistCreated(
                playlist
            );

            try {

                const existingPlaylists = JSON.parse(
                    localStorage.getItem("moodsync_playlists") || "[]"
                );

                const myMusicPlaylist = {
                    id: playlist.id,
                    name: playlist.name,
                    mood: mood,
                    songCount: trackUris.length,
                    spotifyUrl:
                        playlist?.external_urls?.spotify || "",
                    createdAt: new Date().toISOString()
                };

                localStorage.setItem(
                    "moodsync_playlists",
                    JSON.stringify([
                        myMusicPlaylist,
                        ...(Array.isArray(existingPlaylists)
                            ? existingPlaylists
                            : [])
                    ])
                );

                window.dispatchEvent(
                    new CustomEvent("moodsync:playlist-created")
                );

            } catch (storageError) {

                console.error(
                    "Failed to save playlist for My Music:",
                    storageError
                );
            }

            setCardWaitingForSongCount(false);

            setCardMessages((previous) => [
                ...previous,
                {
                    sender: "bot",
                    text:
                        `Done! 🎵 I created your ${mood} mood playlist with ${trackUris.length} songs. You can open it in Spotify below.`
                }
            ]);

            alert(
                `Playlist created successfully! 🎵\n\n` +
                `${playlist.name}\n` +
                `${trackUris.length} songs added.`
            );

            if (playlist?.external_urls?.spotify) {
                if (spotifyWindow && !spotifyWindow.closed) {
                    // Reuse the tab opened directly from the user's click.
                    // This avoids most browser popup-blocker issues after awaits.
                    spotifyWindow.location.replace(
                        playlist.external_urls.spotify
                    );
                    spotifyWindow.focus();
                } else {
                    // Popup blocking is browser-dependent. The existing
                    // on-page "Open in Spotify" button remains as a fallback.
                    setCardMessages((previous) => [
                        ...previous,
                        {
                            sender: "bot",
                            text: "Your playlist is ready. If Spotify did not open automatically, use the Open Playlist in Spotify button below."
                        }
                    ]);
                }
            }

        } catch (err) {
            if (spotifyWindow && !spotifyWindow.closed) {
                try {
                    spotifyWindow.close();
                } catch (closeError) {
                    console.warn("Could not close temporary Spotify tab:", closeError);
                }
            }

            console.error(
                "Spotify Playlist Error:",
                err
            );

            setCardMessages((previous) => [
                ...previous,
                {
                    sender: "bot",
                    text:
                        `I couldn't create the playlist yet. ${err?.message || "Please try again."}`
                }
            ]);

            alert(
                err?.message ||
                "Something went wrong while creating the playlist."
            );

        } finally {

            setPlaylistLoading(
                false
            );
        }
    };


    // -----------------------------------------
    // CAPTURE + DETECT EMOTION
    // -----------------------------------------

    const captureImage = async () => {

        // Prevent multiple clicks
        if (loading) return;


        // -----------------------------------------
        // GET EXACT FRAME FROM WEBCAM
        // -----------------------------------------

        const imageSrc =
            webcamRef
                .current
                ?.getScreenshot();


        if (!imageSrc) {

            setError(
                "Camera is not ready. Please wait for the camera and try again."
            );


            setEmotionData(null);

            return;
        }


        // -----------------------------------------
        // SHOW EXACT CLICKED FRAME
        // -----------------------------------------

        setCapturedImage(
            imageSrc
        );


        // Remove previous result/error
        setEmotionData(null);

        setError("");

        setPlaylistCreated(null);
        setCardPlaylistCreated(null);
        setCardWaitingForSongCount(false);


        // Start loading
        setLoading(true);


        try {

            console.log(
                "Sending captured image to backend..."
            );


            // -----------------------------------------
            // SEND IMAGE TO FASTAPI
            // -----------------------------------------

            const response =
                await fetch(

                    "https://moodsync-ai-gnuv.onrender.com/detect-emotion",

                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json",
                        },


                        body:
                            JSON.stringify({

                                image:
                                    imageSrc,
                            }),
                    }
                );


            // -----------------------------------------
            // READ RESPONSE SAFELY
            // -----------------------------------------

            let data;


            try {

                data =
                    await response.json();

            } catch (jsonError) {

                throw new Error(

                    `Backend returned an invalid response (${response.status}).`
                );
            }


            console.log(
                "================================="
            );


            console.log(
                "EMOTION API RESPONSE"
            );


            console.log(
                data
            );


            console.log(
                "================================="
            );


            // -----------------------------------------
            // HANDLE HTTP ERRORS
            // -----------------------------------------

            if (!response.ok) {

                // FastAPI validation error - 422
                if (
                    response.status === 422
                ) {

                    let detail = "";


                    if (
                        Array.isArray(
                            data?.detail
                        )
                    ) {

                        detail =
                            data.detail

                                .map(
                                    (item) =>
                                        item.msg
                                )

                                .join(
                                    ", "
                                );

                    } else if (
                        data?.detail
                    ) {

                        detail =
                            String(
                                data.detail
                            );
                    }


                    throw new Error(

                        detail ||

                        "Invalid image request sent to the backend (422)."
                    );
                }


                // Other server errors
                throw new Error(

                    data?.error ||

                    data?.detail ||

                    `Server error (${response.status}).`
                );
            }


            // -----------------------------------------
            // BACKEND DETECTION FAILED
            // -----------------------------------------

            if (
                data?.success === false
            ) {

                throw new Error(

                    data?.error ||

                    "Face/emotion could not be detected."
                );
            }


            // -----------------------------------------
            // CHECK EMOTION
            // -----------------------------------------

            if (!data?.emotion) {

                throw new Error(
                    "The AI model did not return an emotion."
                );
            }


            // -----------------------------------------
            // CHECK EMOTION SCORES
            // -----------------------------------------

            if (
                !data?.emotions ||
                typeof data.emotions !== "object"
            ) {

                throw new Error(
                    "Emotion scores were not returned by the AI model."
                );
            }


            // -----------------------------------------
            // SUCCESS
            // -----------------------------------------

            console.log(
                "Detected Emotion:",
                data.emotion
            );


            console.log(
                "Confidence:",
                data.confidence
            );


            console.log(
                "All Emotions:",
                data.emotions
            );


            setEmotionData(
                data
            );


        } catch (err) {

            console.error(
                "Emotion Detection Error:",
                err
            );


            setEmotionData(
                null
            );


            setError(

                err?.message ||

                "Unable to detect emotion. Please try again."
            );


        } finally {

            setLoading(
                false
            );
        }
    };


    // -----------------------------------------
    // SORT EMOTIONS
    // -----------------------------------------

    const sortedEmotions =
        emotionData?.emotions

            ? Object.entries(
                emotionData.emotions
            ).sort(

                (a, b) =>
                    Number(b[1]) -
                    Number(a[1])
            )

            : [];


    // -----------------------------------------
    // LOCAL TEXT / VOICE CHAT HELPERS
    // -----------------------------------------
    // IMPORTANT:
    // Card 1 and Card 3 use their OWN conversation.
    // They do NOT dispatch events to the floating Chatbot.
    // The floating Chatbot below remains completely separate.
    // -----------------------------------------

    // -----------------------------------------
    // LOCAL TEXT / VOICE CHAT
    // -----------------------------------------

    // Pick the most natural voice available in the browser.
    // Prefer Indian English, then good English fallback voices.
    const getBestMoodSyncVoice = () => {
        if (!("speechSynthesis" in window)) return null;

        const voices = window.speechSynthesis.getVoices();
        if (!voices.length) return null;

        // Prefer newer / natural-sounding voices first.
        const naturalIndian = voices.find((voice) =>
            /en[-_]IN/i.test(voice.lang) &&
            /natural|online|neerja|heera/i.test(voice.name)
        );

        if (naturalIndian) return naturalIndian;

        const preferredIndian = voices.find((voice) =>
            /en[-_]IN/i.test(voice.lang) &&
            /heera|neerja|rishi/i.test(voice.name)
        );

        if (preferredIndian) return preferredIndian;

        const naturalEnglish = voices.find((voice) =>
            /en[-_]US|en[-_]GB/i.test(voice.lang) &&
            /natural|online|zira|aria|jenny|samantha|google/i.test(voice.name)
        );

        if (naturalEnglish) return naturalEnglish;

        return voices.find((voice) =>
            /en[-_]IN|en[-_]US|en[-_]GB/i.test(voice.lang)
        ) || voices[0];
    };

    const speakMoodSync = (text) => {
        if (!("speechSynthesis" in window) || !text) return;

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        const voice = getBestMoodSyncVoice();

        if (voice) {
            utterance.voice = voice;
            utterance.lang = voice.lang || "en-IN";
        } else {
            utterance.lang = "en-IN";
        }

        // Slightly slower and warmer than the previous setting.
        utterance.rate = 0.88;
        utterance.pitch = 1.02;
        utterance.volume = 1;

        window.speechSynthesis.speak(utterance);
    };

    const sendCardMessage = async (
        userMessage,
        speakReply = false
    ) => {

        const text =
            String(userMessage || "").trim();

        if (
            !text ||
            cardSendingRef.current ||
            playlistLoading
        ) {
            return;
        }

        // If a playlist is waiting for the user's song count,
        // numbers can still be typed as an alternative to + / −.
        if (cardWaitingForSongCount) {

            const countMatch =
                text.match(
                    /^(?:give\s+me\s+)?(\d{1,2})(?:\s*(?:songs?|gane|gaane))?$/i
                );

            setCardMessages((previous) => [
                ...previous,
                {
                    sender: "user",
                    text
                }
            ]);

            setTextMessage("");

            if (!countMatch) {

                setCardMessages((previous) => [
                    ...previous,
                    {
                        sender: "bot",
                        text:
                            "Please choose the number of songs using + or − below. 🎵"
                    }
                ]);

                return;
            }

            const selectedCount =
                Number(countMatch[1]);

            if (
                selectedCount < 1 ||
                selectedCount > 20
            ) {

                setCardMessages((previous) => [
                    ...previous,
                    {
                        sender: "bot",
                        text:
                            "Please choose between 1 and 20 songs. 🎵"
                    }
                ]);

                return;
            }

            setCardSongCount(selectedCount);

            const mood =
                cardConversationMood ||
                emotionData?.emotion ||
                "neutral";

            setSongCount(selectedCount);

            setCardMessages((previous) => [
                ...previous,
                {
                    sender: "bot",
                    text:
                        `Perfect! 🎵 Creating a ${mood} mood playlist with ${selectedCount} songs...`
                }
            ]);

            await createMoodPlaylist(
                selectedCount,
                mood
            );

            return;
        }

        cardSendingRef.current = true;

        setCardMessages((previous) => [
            ...previous,
            {
                sender: "user",
                text
            }
        ]);

        setTextMessage("");

        try {

            const response =
                await fetch(
                    "https://moodsync-ai-gnuv.onrender.com/chat",
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                message:
                                    text,

                                emotion:
                                    cardConversationMood ||
                                    emotionData?.emotion ||
                                    ""
                            })
                    }
                );

            if (!response.ok) {

                throw new Error(
                    `Chat server error: ${response.status}`
                );
            }

            const data =
                await response.json();

            console.log(
                "Card chatbot response:",
                data
            );

            const reply =
                data?.success && data?.reply
                    ? data.reply
                    : "Sorry, I couldn't generate a response right now. 😕";

            // -------------------------------------------------
            // IMPORTANT:
            // Explicit mood words from the USER have priority
            // over a generic backend "neutral" response.
            // -------------------------------------------------
            const lowerText =
                text.toLowerCase();

            const getRequestedChatMood = (message) => {

                const value =
                    String(message || "")
                        .toLowerCase();

                if (
                    value.includes("energetic") ||
                    value.includes("upbeat") ||
                    value.includes("high energy") ||
                    value.includes("full energy") ||
                    value.includes("high-energy")
                ) {
                    return "energetic";
                }

                if (
                    value.includes("happy") ||
                    value.includes("excited") ||
                    value.includes("joy") ||
                    value.includes("cheerful")
                ) {
                    return "happy";
                }

                if (
                    value.includes("sad") ||
                    value.includes("low") ||
                    value.includes("down") ||
                    value.includes("emotional")
                ) {
                    return "sad";
                }

                if (
                    value.includes("angry") ||
                    value.includes("mad") ||
                    value.includes("rage")
                ) {
                    return "angry";
                }

                if (
                    value.includes("scared") ||
                    value.includes("fear") ||
                    value.includes("afraid")
                ) {
                    return "fear";
                }

                if (
                    value.includes("surprise") ||
                    value.includes("surprised") ||
                    value.includes("surprising")
                ) {
                    return "surprise";
                }

                if (
                    value.includes("disgust") ||
                    value.includes("disgusted")
                ) {
                    return "disgust";
                }

                if (
                    value.includes("tired") ||
                    value.includes("sleepy")
                ) {
                    return "tired";
                }

                if (
                    value.includes("stressed") ||
                    value.includes("stress")
                ) {
                    return "stressed";
                }

                if (
                    value.includes("relaxed") ||
                    value.includes("calm")
                ) {
                    return "relaxed";
                }

                return "";
            };

            const explicitMood =
                getRequestedChatMood(
                    lowerText
                );

            const playlistRequestWords =
                lowerText.includes("playlist") ||
                lowerText.includes("songs") ||
                lowerText.includes("song") ||
                lowerText.includes("music") ||
                lowerText.includes("gaane") ||
                lowerText.includes("gane") ||
                lowerText.includes("tracks");

            const makeRequestWords =
                lowerText.includes("bana") ||
                lowerText.includes("banao") ||
                lowerText.includes("kar do") ||
                lowerText.includes("de do") ||
                lowerText.includes("make") ||
                lowerText.includes("create") ||
                lowerText.includes("give me") ||
                lowerText.includes("chahiye");

            const wantsPlaylist =
                lowerText.includes("playlist") ||
                (
                    playlistRequestWords &&
                    makeRequestWords
                );

            // Use the explicit user mood first.
            // Backend neutral must never overwrite "energetic".
            let playlistMood =
                explicitMood ||
                String(
                    data?.emotion ||
                    data?.mood ||
                    ""
                )
                    .toLowerCase()
                    .trim();

            if (
                !playlistMood ||
                !(
                    emotionEmoji[playlistMood] ||
                    playlistMood === "energetic" ||
                    playlistMood === "tired" ||
                    playlistMood === "stressed" ||
                    playlistMood === "relaxed"
                )
            ) {
                playlistMood =
                    cardConversationMood ||
                    emotionData?.emotion ||
                    "neutral";
            }

            if (wantsPlaylist) {

                setCardConversationMood(
                    playlistMood
                );

                setCardWaitingForSongCount(
                    true
                );

                setCardPlaylistCreated(
                    null
                );

                setCardSongCount(
                    5
                );

                if (
                    !String(reply)
                        .toLowerCase()
                        .includes("how many songs")
                ) {
                    setCardMessages((previous) => [
                        ...previous,
                        {
                            sender: "bot",
                            text:
                                `Sure! 🎵 I'll make a ${playlistMood} mood playlist for you. Choose how many songs you want below.`
                        }
                    ]);
                }
            }

            // Keep the chatbot reply visible in the chatbox.
            setCardMessages((previous) => [
                ...previous,
                {
                    sender: "bot",
                    text: reply
                }
            ]);

            // -------------------------------------------------
            // VOICE OUTPUT
            // Keep the original voice behavior that was working
            // before the voice-selection changes.
            // Emojis are removed ONLY from spoken audio.
            // -------------------------------------------------
            if (
                speakReply &&
                "speechSynthesis" in window
            ) {

                window.speechSynthesis.cancel();

                // For playlist requests, do NOT read a long list of
                // song suggestions aloud. Keep the voice short and
                // conversational; the full reply remains visible in chat.
                const voiceText =
                    wantsPlaylist
                        ? `Sure! I'll make a ${playlistMood} playlist for you. Choose how many songs you'd like.`
                        : reply;

                const spokenReply =
                    voiceText
                        .replace(
                            /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F\u200D]/gu,
                            ""
                        )
                        .replace(
                            /[*_~`#]/g,
                            ""
                        )
                        .replace(
                            /[•●▪️]/g,
                            ""
                        )
                        .replace(
                            /\s+([,.!?])/g,
                            "$1"
                        )
                        .replace(
                            /\s+/g,
                            " "
                        )
                        .trim();

                if (spokenReply) {
                    speakMoodSync(spokenReply);
                }
            }

        } catch (err) {

            console.error(
                "Card chatbot error:",
                err
            );

            setCardMessages((previous) => [
                ...previous,
                {
                    sender: "bot",
                    text:
                        "Sorry, I'm having trouble connecting right now. Please try again. 😕"
                }
            ]);

        } finally {

            cardSendingRef.current =
                false;
        }
    };
    const sendTextToMoodSync = () => {
        sendCardMessage(textMessage, false);
    };

    // -----------------------------------------
    // VOICE RECOGNITION FOR CARD 3
    // -----------------------------------------
    useEffect(() => {
        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn(
                "Speech Recognition is not supported in this browser."
            );
            return;
        }

        const recognition =
            new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-IN";

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event) => {
            const transcript =
                event.results[0][0]
                    .transcript
                    .trim();

            setIsListening(false);

            if (transcript) {
                sendCardMessage(
                    transcript,
                    true
                );
            }
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onerror = (event) => {
            console.error(
                "Speech recognition error:",
                event.error
            );
            setIsListening(false);
        };

        recognitionRef.current =
            recognition;

        return () => {
            try {
                recognition.stop();
            } catch {}

            if ("speechSynthesis" in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, [emotionData?.emotion]);

    const startMoodSyncVoice = () => {
        const recognition =
            recognitionRef.current;

        if (!recognition) {
            alert(
                "Voice recognition is not supported in this browser."
            );
            return;
        }

        if (isListening) {
            try {
                recognition.stop();
            } catch {}
            return;
        }

        try {
            recognition.start();
        } catch (err) {
            console.error(
                "Unable to start voice recognition:",
                err
            );
        }
    };

    // -----------------------------------------
    // UI
    return (
        <div className="min-h-screen bg-[#F5EFE6] px-4 py-8 md:px-8">
            <div className="mx-auto w-full max-w-6xl">

                {/* HEADER */}
                <div className="flex items-center justify-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-[#4B3425] text-center">
                        😊 Detect Your Mood
                    </h1>
                </div>

                <p className="text-center text-gray-500 mb-8">
                    Choose any way to tell MoodSync how you feel.
                </p>

                {/* =====================================================
                    THREE INPUT OPTIONS
                    Text + Voice are connected to the existing
                    Chatbot component through browser events.
                    Camera uses the existing captureImage() logic.
                ====================================================== */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

                    {/* ================= TEXT CHAT ================= */}
                    <div className="bg-white rounded-3xl shadow-lg border border-[#E8DED1] p-5 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-[#4B3425]">
                                💬 Text Chat with MoodSync
                            </h2>
                            <span className="text-2xl">🤖</span>
                        </div>

                        <div className="flex-1 bg-[#F5EFE6] rounded-2xl p-4 min-h-[270px] flex flex-col">
                            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[270px]">
                                {cardMessages.map((chat, index) => (
                                    <div
                                        key={index}
                                        className={`rounded-2xl px-4 py-3 shadow-sm max-w-[92%] ${
                                            chat.sender === "user"
                                                ? "ml-auto bg-[#4B3425] text-white"
                                                : "bg-white text-gray-600"
                                        }`}
                                    >
                                        <p
                                            className={`text-sm font-semibold mb-1 ${
                                                chat.sender === "user"
                                                    ? "text-white"
                                                    : "text-[#4B3425]"
                                            }`}
                                        >
                                            {chat.sender === "user"
                                                ? "You"
                                                : "🤖 MoodSync"}
                                        </p>
                                        <p className="text-sm">
                                            {chat.text}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {cardPlaylistCreated && (
                                <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                                    <p className="text-green-700 font-semibold text-sm">
                                        ✅ Playlist created successfully!
                                    </p>

                                    <p className="text-gray-700 text-xs mt-1">
                                        {cardPlaylistCreated.name}
                                    </p>

                                    {cardPlaylistCreated?.external_urls?.spotify && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                window.open(
                                                    cardPlaylistCreated.external_urls.spotify,
                                                    "_blank"
                                                )
                                            }
                                            className="mt-3 bg-[#1DB954] hover:bg-[#1aa34a] text-white px-4 py-2 rounded-lg text-sm font-semibold"
                                        >
                                            🎧 Open in Spotify
                                        </button>
                                    )}
                                </div>
                            )}

                            {cardWaitingForSongCount && (
                                <div className="mt-4 bg-white border border-[#E8DED1] rounded-xl p-3">
                                    <div className="flex items-center justify-center gap-3">
                                        <span className="text-sm font-semibold text-[#4B3425]">
                                            🎵 Songs
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setCardSongCount(
                                                    Math.max(1, cardSongCount - 1)
                                                )
                                            }
                                            disabled={
                                                playlistLoading ||
                                                cardSongCount <= 1
                                            }
                                            className="w-9 h-9 rounded-lg bg-[#4B3425] hover:bg-[#3B291D] disabled:bg-gray-300 text-white text-xl font-bold"
                                        >
                                            −
                                        </button>

                                        <span className="min-w-[30px] text-center font-bold text-[#4B3425]">
                                            {cardSongCount}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setCardSongCount(
                                                    Math.min(20, cardSongCount + 1)
                                                )
                                            }
                                            disabled={
                                                playlistLoading ||
                                                cardSongCount >= 20
                                            }
                                            className="w-9 h-9 rounded-lg bg-[#4B3425] hover:bg-[#3B291D] disabled:bg-gray-300 text-white text-xl font-bold"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <p className="text-xs text-gray-500 text-center mt-2">
                                        Choose 1–20 songs
                                    </p>

                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const mood =
                                                cardConversationMood ||
                                                emotionData?.emotion ||
                                                "neutral";

                                            setSongCount(cardSongCount);

                                            setCardMessages((previous) => [
                                                ...previous,
                                                {
                                                    sender: "bot",
                                                    text:
                                                        `Perfect! 🎵 Creating a ${mood} mood playlist with ${cardSongCount} songs...`
                                                }
                                            ]);

                                            await createMoodPlaylist(
                                                cardSongCount,
                                                mood
                                            );
                                        }}
                                        disabled={playlistLoading}
                                        className="mt-3 w-full bg-[#4B3425] hover:bg-[#3B291D] disabled:bg-gray-400 text-white py-2.5 rounded-lg text-sm font-semibold"
                                    >
                                        {playlistLoading
                                            ? "🎵 Creating Playlist..."
                                            : "🎵 Create My Mood Playlist"}
                                    </button>
                                </div>
                            )}

                            <div className="mt-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={textMessage}
                                        placeholder={
                                            cardWaitingForSongCount
                                                ? "How many songs? (1–20)"
                                                : "Tell me how you're feeling..."
                                        }
                                        className="min-w-0 flex-1 bg-white border border-[#DDD1C3] rounded-xl px-3 py-3 text-sm outline-none"
                                        onChange={(e) =>
                                            setTextMessage(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                sendTextToMoodSync();
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={sendTextToMoodSync}
                                        className="w-12 rounded-xl bg-[#4B3425] hover:bg-[#3B291D] text-white transition"
                                        title="Send message to MoodSync"
                                    >
                                        ➤
                                    </button>
                                </div>
                            </div>
                        </div>

                        <p className="mt-3 text-xs text-center text-[#8B7A6A]">
                            💬 Your conversation stays inside this card.
                        </p>
                    </div>

                    {/* ================= CAMERA ================= */}
                    <div className="bg-white rounded-3xl shadow-lg border border-[#E8DED1] p-5 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-[#4B3425]">
                                📷 Facial Scan
                            </h2>
                            <span className="text-2xl">😊</span>
                        </div>

                        <div className="flex-1 bg-[#F5EFE6] rounded-2xl p-3 flex items-center justify-center min-h-[270px]">
                            <Webcam
                                ref={webcamRef}
                                audio={false}
                                screenshotFormat="image/jpeg"
                                videoConstraints={videoConstraints}
                                className="w-full h-[270px] object-cover rounded-2xl"
                            />
                        </div>

                        {capturedImage && (
                            <p className="text-xs text-gray-500 text-center mt-2">
                                ✓ Frame captured for AI analysis
                            </p>
                        )}

                        <button
                            type="button"
                            onClick={captureImage}
                            disabled={loading}
                            className="mt-4 w-full bg-[#4B3425] hover:bg-[#3B291D] disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition"
                        >
                            {loading ? "🧠 Detecting..." : "📸 Start Scan"}
                        </button>
                    </div>

                    {/* ================= VOICE ================= */}
                    <div className="bg-white rounded-3xl shadow-lg border border-[#E8DED1] p-5 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-[#4B3425]">
                                🎙️ Voice Assistant
                            </h2>
                            <span className="text-2xl">🎧</span>
                        </div>

                        <div
                            className="flex-1 bg-[#F5EFE6] rounded-2xl min-h-[270px] flex flex-col items-center justify-center px-5 cursor-pointer"
                            onClick={startMoodSyncVoice}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    startMoodSyncVoice();
                                }
                            }}
                            title="Talk to MoodSync"
                        >
                            <div className="w-28 h-28 rounded-full bg-[#EADBCB] flex items-center justify-center shadow-sm">
                                <span className="text-6xl">🎙️</span>
                            </div>

                            <div className="flex items-end justify-center gap-1 mt-7 h-10">
                                <span className="w-1 h-3 bg-[#B9A99A] rounded-full"></span>
                                <span className="w-1 h-6 bg-[#B9A99A] rounded-full"></span>
                                <span className="w-1 h-10 bg-[#B9A99A] rounded-full"></span>
                                <span className="w-1 h-5 bg-[#B9A99A] rounded-full"></span>
                                <span className="w-1 h-8 bg-[#B9A99A] rounded-full"></span>
                                <span className="w-1 h-4 bg-[#B9A99A] rounded-full"></span>
                                <span className="w-1 h-9 bg-[#B9A99A] rounded-full"></span>
                                <span className="w-1 h-5 bg-[#B9A99A] rounded-full"></span>
                                <span className="w-1 h-3 bg-[#B9A99A] rounded-full"></span>
                            </div>

                            <p className="text-sm text-gray-500 text-center mt-5">
                                {isListening
                                    ? "🎙️ Listening... speak naturally."
                                    : "Speak naturally and MoodSync will understand how you're feeling."}
                            </p>
                            <p className="text-xs text-[#8B7A6A] text-center mt-2">
                                {isListening
                                    ? "Click again to stop."
                                    : 'Click here or use "Talk to MoodSync" to start.'}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={startMoodSyncVoice}
                            className="mt-4 w-full bg-[#4B3425] hover:bg-[#3B291D] text-white py-3 rounded-xl font-semibold transition"
                        >
                            {isListening
                                ? "⏹️ Stop Listening"
                                : "🎙️ Talk to MoodSync"}
                        </button>

                        {cardWaitingForSongCount && (
                            <div className="mt-4 bg-white border border-[#E8DED1] rounded-xl p-3">
                                <div className="flex items-center justify-center gap-3">
                                    <span className="text-sm font-semibold text-[#4B3425]">
                                        🎵 Songs
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCardSongCount(
                                                Math.max(1, cardSongCount - 1)
                                            )
                                        }
                                        disabled={
                                            playlistLoading ||
                                            cardSongCount <= 1
                                        }
                                        className="w-9 h-9 rounded-lg bg-[#4B3425] hover:bg-[#3B291D] disabled:bg-gray-300 text-white text-xl font-bold"
                                    >
                                        −
                                    </button>

                                    <span className="min-w-[30px] text-center font-bold text-[#4B3425]">
                                        {cardSongCount}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCardSongCount(
                                                Math.min(20, cardSongCount + 1)
                                            )
                                        }
                                        disabled={
                                            playlistLoading ||
                                            cardSongCount >= 20
                                        }
                                        className="w-9 h-9 rounded-lg bg-[#4B3425] hover:bg-[#3B291D] disabled:bg-gray-300 text-white text-xl font-bold"
                                    >
                                        +
                                    </button>
                                </div>

                                <p className="text-xs text-gray-500 text-center mt-2">
                                    Choose 1–20 songs
                                </p>

                                <button
                                    type="button"
                                    onClick={async () => {
                                        const mood =
                                            cardConversationMood ||
                                            emotionData?.emotion ||
                                            "neutral";

                                        setSongCount(cardSongCount);

                                        setCardMessages((previous) => [
                                            ...previous,
                                            {
                                                sender: "bot",
                                                text:
                                                    `Perfect! 🎵 Creating a ${mood} mood playlist with ${cardSongCount} songs...`
                                            }
                                        ]);

                                        await createMoodPlaylist(
                                            cardSongCount,
                                            mood
                                        );
                                    }}
                                    disabled={playlistLoading}
                                    className="mt-3 w-full bg-[#4B3425] hover:bg-[#3B291D] disabled:bg-gray-400 text-white py-2.5 rounded-lg text-sm font-semibold"
                                >
                                    {playlistLoading
                                        ? "🎵 Creating Playlist..."
                                        : "🎵 Create My Mood Playlist"}
                                </button>
                            </div>
                        )}

                        {cardPlaylistCreated && (
                            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                                <p className="text-green-700 font-semibold text-sm">
                                    ✅ Spotify playlist created successfully!
                                </p>

                                <p className="text-gray-700 text-sm mt-1 font-medium">
                                    {cardPlaylistCreated.name}
                                </p>

                                {cardPlaylistCreated?.external_urls?.spotify && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            window.open(
                                                cardPlaylistCreated.external_urls.spotify,
                                                "_blank"
                                            )
                                        }
                                        className="mt-3 bg-[#1DB954] hover:bg-[#1aa34a] text-white px-4 py-2 rounded-lg text-sm font-semibold"
                                    >
                                        🎧 Open Playlist in Spotify
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* =====================================================
                    LOADING
                ====================================================== */}
                {loading && (
                    <div className="mt-6 bg-white px-6 py-4 rounded-2xl shadow-lg text-center max-w-xl mx-auto">
                        <p className="font-semibold text-[#4B3425]">
                            🧠 Detecting your emotion...
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                            Please wait
                        </p>
                    </div>
                )}

                {/* ERROR */}
                {error && !loading && (
                    <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl max-w-xl mx-auto text-center">
                        <p className="font-semibold">❌ {error}</p>
                    </div>
                )}

                {/* =====================================================
                    MOOD RESULT
                ====================================================== */}
                {emotionData && !loading && !error && (
                    <div className="mt-8 bg-white rounded-3xl shadow-xl p-6 md:p-8 max-w-3xl mx-auto">

                        <div className="text-center">
                            <p className="text-sm text-gray-500 uppercase tracking-wide">
                                Your detected mood
                            </p>

                            <div className="text-6xl mt-3">
                                {emotionEmoji[
                                    String(emotionData.emotion).toLowerCase()
                                ] || "🙂"}
                            </div>

                            <h2 className="text-3xl font-bold text-[#4B3425] capitalize mt-2">
                                {emotionData.emotion}
                            </h2>

                            {emotionData.confidence !== undefined && (
                                <p className="text-gray-600 mt-2">
                                    Confidence:{" "}
                                    <b>
                                        {Number(emotionData.confidence).toFixed(2)}%
                                    </b>
                                </p>
                            )}
                        </div>

                        {/* EMOTION ANALYSIS */}
                        <div className="mt-8">
                            <h3 className="text-xl font-bold text-[#4B3425] mb-5">
                                Emotion Analysis
                            </h3>

                            {sortedEmotions.map(([name, value]) => {
                                const numericValue = Number(value) || 0;

                                return (
                                    <div key={name} className="mb-4">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="capitalize font-medium">
                                                {emotionEmoji[name.toLowerCase()] || "🙂"}{" "}
                                                {name}
                                            </span>

                                            <span className="font-semibold">
                                                {numericValue.toFixed(2)}%
                                            </span>
                                        </div>

                                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className="bg-[#4B3425] h-2.5 rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${Math.min(
                                                        100,
                                                        Math.max(0, numericValue)
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-6 bg-[#F5EFE6] rounded-xl px-5 py-3 text-center">
                            <p className="text-gray-700">
                                ✅ Emotion analysis completed successfully
                            </p>
                        </div>

                        {/* SONG COUNT */}
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                            <span className="font-semibold text-gray-700">
                                🎵 Songs in playlist
                            </span>

                            <div className="flex items-center gap-3 bg-[#F5EFE6] rounded-xl px-3 py-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setSongCount(Math.max(1, songCount - 1))
                                    }
                                    disabled={
                                        playlistLoading || songCount <= 1
                                    }
                                    className="w-9 h-9 rounded-lg bg-[#4B3425] hover:bg-[#3B291D] disabled:bg-gray-300 text-white text-xl font-bold"
                                >
                                    −
                                </button>

                                <span className="min-w-[30px] text-center font-bold text-[#4B3425]">
                                    {songCount}
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setSongCount(Math.min(20, songCount + 1))
                                    }
                                    disabled={
                                        playlistLoading || songCount >= 20
                                    }
                                    className="w-9 h-9 rounded-lg bg-[#4B3425] hover:bg-[#3B291D] disabled:bg-gray-300 text-white text-xl font-bold"
                                >
                                    +
                                </button>
                            </div>

                            <span className="text-sm text-gray-500">
                                Choose 1–20 songs
                            </span>
                        </div>

                        {/* SPOTIFY PLAYLIST BUTTON
                            Existing createMoodPlaylist() is untouched. */}
                        <button
                            type="button"
                            onClick={() =>
                                createMoodPlaylist(
                                    songCount,
                                    emotionData?.emotion
                                )
                            }
                            disabled={playlistLoading}
                            className="mt-6 w-full bg-[#4B3425] hover:bg-[#3B291D] disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-4 rounded-xl text-lg font-semibold transition"
                        >
                            {playlistLoading
                                ? "🎵 Creating Playlist..."
                                : "🎵 Create My Mood Playlist"}
                        </button>

                        {/* PLAYLIST CREATED */}
                        {playlistCreated && (
                            <div className="mt-5 bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                                <p className="text-green-700 font-semibold">
                                    ✅ Spotify playlist created successfully!
                                </p>

                                <p className="mt-2 text-gray-700 font-medium">
                                    {playlistCreated.name}
                                </p>

                                {playlistCreated?.external_urls?.spotify && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            window.open(
                                                playlistCreated.external_urls.spotify,
                                                "_blank"
                                            )
                                        }
                                        className="mt-4 bg-[#1DB954] hover:bg-[#1aa34a] text-white px-6 py-3 rounded-xl font-semibold"
                                    >
                                        🎧 Open Playlist in Spotify
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* =====================================================
                    HOW IT WORKS
                ====================================================== */}
                <div className="mt-10 bg-[#4B3425] rounded-3xl p-6 md:p-8 text-white">
                    <h2 className="text-2xl font-bold mb-6">
                        ✨ How MoodSync Works
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white/10 rounded-2xl p-5">
                            <p className="text-sm opacity-60">01</p>
                            <h3 className="font-bold text-lg mt-3">
                                💬 Tell MoodSync
                            </h3>
                            <p className="text-sm opacity-80 mt-2">
                                Share how you're feeling through text or voice.
                            </p>
                        </div>

                        <div className="bg-white/10 rounded-2xl p-5">
                            <p className="text-sm opacity-60">02</p>
                            <h3 className="font-bold text-lg mt-3">
                                🧠 Understand Your Mood
                            </h3>
                            <p className="text-sm opacity-80 mt-2">
                                MoodSync understands your conversation or camera-based mood.
                            </p>
                        </div>

                        <div className="bg-white/10 rounded-2xl p-5">
                            <p className="text-sm opacity-60">03</p>
                            <h3 className="font-bold text-lg mt-3">
                                🎵 Create Your Playlist
                            </h3>
                            <p className="text-sm opacity-80 mt-2">
                                MoodSync creates a Spotify playlist matching your mood.
                            </p>
                        </div>
                    </div>
                </div>

                {/* =====================================================
                    EXISTING CHATBOT
                    DO NOT REMOVE.
                    Spotify/chat logic stays inside Chatbot.
                ====================================================== */}
                {/* Existing Chatbot is intentionally kept unchanged.
                    Its Spotify/chat logic remains inside Chatbot. */}
                <Chatbot emotionData={emotionData} />

            </div>
        </div>
    );
}