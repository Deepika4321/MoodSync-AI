import { useState, useEffect, useRef } from "react";

export default function Chatbot({ emotionData }) {

    const [isOpen, setIsOpen] = useState(false);

    const [message, setMessage] = useState("");

    const [isListening, setIsListening] = useState(false);

    const [isSpeaking, setIsSpeaking] = useState(false);

    const recognitionRef = useRef(null);
    const isListeningRef = useRef(false);

    // =========================================================
    // CHAT MESSAGES
    // =========================================================

    const [messages, setMessages] = useState([
        {
            sender: "bot",
            text: "Hi! 👋 I'm MoodSync. Want a more personalized music recommendation?"
        }
    ]);

    // =========================================================
    // MOOD + PLAYLIST STATES
    // =========================================================

    const [detectedMood, setDetectedMood] = useState("");

    // Mood is NOT taken from the webcam automatically.
    // The chatbot first understands the conversation and only then
    // makes a playlist available.
    const [conversationMood, setConversationMood] = useState("");

    const [conversationTurns, setConversationTurns] = useState(0);

    const [waitingForPlaylistConfirmation, setWaitingForPlaylistConfirmation] = useState(false);

    const [showPlaylist, setShowPlaylist] = useState(false);

    const conversationTurnRef = useRef(0);
    const conversationMoodRef = useRef("");
    const waitingForPlaylistConfirmationRef = useRef(false);

    const [songCount, setSongCount] = useState(5);

    const [playlistLoading, setPlaylistLoading] = useState(false);

    const [playlistCreated, setPlaylistCreated] = useState(null);


    // =========================================================
    // EMOTION EMOJIS
    // =========================================================

    const emotionEmoji = {
        happy: "😊",
        sad: "😢",
        angry: "😡",
        fear: "😨",
        surprise: "😲",
        disgust: "🤢",
        neutral: "😐"
    };


    // =========================================================
    // MOOD DETECTION FROM TEXT / VOICE
    // =========================================================

    const detectMoodFromText = (text) => {

        const lowerText = String(text || "").toLowerCase();

        const moodKeywords = {

            happy: [
                "happy",
                "happier",
                "joy",
                "joyful",
                "excited",
                "exciting",
                "great",
                "good",
                "amazing",
                "awesome",
                "wonderful",
                "fantastic",
                "glad",
                "cheerful",
                "positive",
                "love",
                "loving",
                "fun",
                "celebrating",
                "celebrate",
                "😊",
                "😄",
                "😁",
                "🥳"
            ],

            sad: [
                "sad",
                "unhappy",
                "depressed",
                "cry",
                "crying",
                "lonely",
                "alone",
                "hurt",
                "heartbroken",
                "broken",
                "upset",
                "down",
                "low",
                "miserable",
                "hopeless",
                "terrible",
                "bad day",
                "miss",
                "missing",
                "tears",
                "😢",
                "😭",
                "💔"
            ],

            angry: [
                "angry",
                "mad",
                "furious",
                "annoyed",
                "annoying",
                "irritated",
                "irritating",
                "frustrated",
                "frustrating",
                "rage",
                "hate",
                "hated",
                "fed up",
                "pissed",
                "😡",
                "🤬"
            ],

            fear: [
                "scared",
                "afraid",
                "fear",
                "fearful",
                "terrified",
                "terrifying",
                "nervous",
                "anxious",
                "anxiety",
                "worried",
                "worry",
                "panic",
                "panicking",
                "unsafe",
                "😨",
                "😰",
                "😱"
            ],

            surprise: [
                "surprised",
                "surprise",
                "shocked",
                "shock",
                "unexpected",
                "unbelievable",
                "wow",
                "omg",
                "can't believe",
                "cannot believe",
                "😲",
                "😮",
                "😯"
            ],

            disgust: [
                "disgusted",
                "disgusting",
                "gross",
                "nasty",
                "sick",
                "revolting",
                "awful",
                "🤢",
                "🤮"
            ],

            neutral: [
                "okay",
                "fine",
                "normal",
                "calm",
                "nothing",
                "nothing much",
                "alright",
                "neutral",
                "just okay"
            ]
        };


        let bestMood = "";
        let bestScore = 0;


        Object.entries(moodKeywords).forEach(
            ([mood, keywords]) => {

                let score = 0;

                keywords.forEach((keyword) => {

                    if (lowerText.includes(keyword)) {
                        score++;
                    }

                });

                if (score > bestScore) {
                    bestScore = score;
                    bestMood = mood;
                }

            }
        );


        if (bestScore > 0) {
            return bestMood;
        }

        return "";
    };


    // =========================================================
    // UPDATE DETECTED MOOD
    // =========================================================

    const getBackendMood = (data) => {

        const backendMood =
            data?.emotion ||
            data?.mood ||
            data?.detected_emotion ||
            data?.detectedMood ||
            "";

        const normalizedMood =
            String(backendMood).toLowerCase().trim();

        const validMoods = [
            "happy",
            "sad",
            "angry",
            "fear",
            "surprise",
            "disgust"
        ];

        return validMoods.includes(normalizedMood)
            ? normalizedMood
            : "";
    };


    const isPositiveConfirmation = (text) => {

        const lowerText =
            String(text || "").toLowerCase().trim();

        const positiveWords = [
            "yes",
            "yeah",
            "yep",
            "sure",
            "okay",
            "ok",
            "please",
            "do it",
            "create it",
            "make it",
            "of course",
            "definitely",
            "haan",
            "ha",
            "kar do",
            "bana do"
        ];

        return positiveWords.some((word) =>
            lowerText === word ||
            lowerText.includes(`${word} `) ||
            lowerText.includes(` ${word}`)
        );
    };


    const isNegativeConfirmation = (text) => {

        const lowerText =
            String(text || "").toLowerCase().trim();

        const negativeWords = [
            "no",
            "nope",
            "not now",
            "maybe later",
            "later",
            "don't",
            "do not",
            "no thanks",
            "nah",
            "nahi",
            "not yet"
        ];

        return negativeWords.some((word) =>
            lowerText === word ||
            lowerText.includes(word)
        );
    };


    const isPlaylistRequest = (text) => {

        const lowerText =
            String(text || "").toLowerCase();

        const playlistWords = [
            "playlist",
            "spotify",
            "music",
            "songs",
            "song recommendation",
            "recommend music",
            "recommend songs",
            "play music"
        ];

        return playlistWords.some((word) =>
            lowerText.includes(word)
        );
    };


    // This is the ONLY place where a conversation can become
    // playlist-ready. A single message is never enough.
    const registerConversationMood = (userText, data) => {

        const nextTurn =
            conversationTurnRef.current + 1;

        conversationTurnRef.current =
            nextTurn;

        setConversationTurns(nextTurn);

        const textMood =
            detectMoodFromText(userText);

        const backendMood =
            getBackendMood(data);

        // Prefer what the user actually said in the conversation.
        // A webcam "neutral" result is intentionally ignored here.
        const newMood =
            textMood ||
            backendMood ||
            conversationMoodRef.current;

        if (newMood && newMood !== "neutral") {

            conversationMoodRef.current =
                newMood;

            setConversationMood(
                newMood
            );
        }

        return {
            turn: nextTurn,
            mood:
                newMood && newMood !== "neutral"
                    ? newMood
                    : conversationMoodRef.current,
            textMood,
            moodEvidence:
                Boolean(textMood || backendMood)
        };
    };


    const askForPlaylist = (mood) => {

        if (!mood) return;

        setWaitingForPlaylistConfirmation(
            true
        );

        waitingForPlaylistConfirmationRef.current =
            true;

        setMessages(
            (previous) => [
                ...previous,
                {
                    sender: "bot",
                    text:
                        `I think I'm starting to understand how you're feeling. You seem ${mood}. Would you like me to create a personalized Spotify playlist for you? 🎵`
                }
            ]
        );
    };


    const handlePlaylistConversation = (
        userText,
        conversationInfo
    ) => {

        const text =
            String(userText || "").trim();

        const mood =
            conversationInfo?.mood ||
            conversationMoodRef.current;

        // If we are waiting for the user's answer,
        // handle YES/NO before doing anything else.
        if (
            waitingForPlaylistConfirmationRef.current
        ) {

            if (isPositiveConfirmation(text)) {

                if (mood) {

                    setDetectedMood(mood);

                    setShowPlaylist(true);

                    setWaitingForPlaylistConfirmation(
                        false
                    );

                    waitingForPlaylistConfirmationRef.current =
                        false;

                    setMessages(
                        (previous) => [
                            ...previous,
                            {
                                sender: "bot",
                                text:
                                    `Absolutely! 💛 I'll prepare a ${mood} mood playlist for you. Choose the number of songs below.`
                            }
                        ]
                    );
                }

                return true;
            }

            if (isNegativeConfirmation(text)) {

                setWaitingForPlaylistConfirmation(
                    false
                );

                waitingForPlaylistConfirmationRef.current =
                    false;

                return false;
            }

            // User continued talking instead of answering yes/no.
            // Keep the conversation going and don't show the playlist.
            setWaitingForPlaylistConfirmation(
                false
            );

            waitingForPlaylistConfirmationRef.current =
                false;
        }

        // If the user explicitly asks for music, we still require
        // at least two conversation turns before showing the card.
        if (
            isPlaylistRequest(text) &&
            conversationInfo?.turn >= 2 &&
            mood
        ) {

            setDetectedMood(mood);

            setShowPlaylist(true);

            return true;
        }

        // Never show a playlist after only one message.
        if (
            conversationInfo?.turn >= 2 &&
            mood &&
            conversationInfo?.moodEvidence &&
            !showPlaylist &&
            !waitingForPlaylistConfirmationRef.current
        ) {

            askForPlaylist(mood);

            return true;
        }

        return false;
    };


    // IMPORTANT:
    // We intentionally do NOT copy emotionData?.emotion into
    // detectedMood here. The webcam may say "neutral" while the
    // user is actually describing sadness/anger/etc. in chat.
    // Camera-based detection remains useful for the camera flow,
    // but it must not control the chatbot playlist flow.


    // =========================================================
    // CREATE SPOTIFY MOOD PLAYLIST
    // =========================================================

    const createMoodPlaylist = async () => {

        if (!showPlaylist || !detectedMood) {

            alert(
                "Let's talk a little more first so I can understand your mood."
            );

            return;
        }


        const accessToken =
            localStorage.getItem(
                "spotify_access_token"
            );


        if (!accessToken) {

            alert(
                "Spotify is not connected. Please connect Spotify first."
            );

            return;
        }


        setPlaylistLoading(true);

        setPlaylistCreated(null);


        try {

            const mood =
                String(detectedMood)
                    .toLowerCase()
                    .trim();


            // =====================================================
            // MOOD SEARCH QUERIES
            // =====================================================

            const moodQueries = {

                happy:
                    "happy upbeat feel good",

                sad:
                    "sad emotional healing",

                angry:
                    "angry powerful rock",

                fear:
                    "calm relaxing anxiety",

                surprise:
                    "energetic exciting",

                disgust:
                    "calm peaceful",

                neutral:
                    "chill relaxing"


            };


            const searchQuery =
                moodQueries[mood] ||
                "chill relaxing";


            // =====================================================
            // SEARCH SPOTIFY SONGS
            // =====================================================

            const firstLimit =
                Math.min(songCount, 10);


            const firstSearchParams =
                new URLSearchParams({

                    q: searchQuery,

                    type: "track",

                    limit: String(firstLimit),

                    offset: "0"

                });


            const firstSearchResponse =
                await fetch(
                    `https://api.spotify.com/v1/search?${firstSearchParams.toString()}`,
                    {
                        method: "GET",

                        headers: {
                            Authorization:
                                `Bearer ${accessToken}`
                        }
                    }
                );


            let firstSearchData = null;


            try {

                firstSearchData =
                    await firstSearchResponse.json();

            } catch {}


            if (!firstSearchResponse.ok) {

                if (
                    firstSearchResponse.status === 401 ||
                    firstSearchResponse.status === 403
                ) {

                    throw new Error(
                        "Spotify session expired. Please reconnect Spotify."
                    );

                }


                throw new Error(
                    firstSearchData?.error?.message ||
                    `Spotify search failed (${firstSearchResponse.status}).`
                );

            }


            const allTracks = [];


            allTracks.push(
                ...(firstSearchData?.tracks?.items || [])
            );


            // =====================================================
            // SECOND SEARCH IF USER SELECTED MORE THAN 10 SONGS
            // =====================================================

            if (songCount > 10) {

                const secondSearchParams =
                    new URLSearchParams({

                        q: searchQuery,

                        type: "track",

                        limit: String(songCount - 10),

                        offset: "10"

                    });


                const secondSearchResponse =
                    await fetch(
                        `https://api.spotify.com/v1/search?${secondSearchParams.toString()}`,
                        {
                            method: "GET",

                            headers: {
                                Authorization:
                                    `Bearer ${accessToken}`
                            }
                        }
                    );


                let secondSearchData = null;


                try {

                    secondSearchData =
                        await secondSearchResponse.json();

                } catch {}


                if (!secondSearchResponse.ok) {

                    throw new Error(
                        secondSearchData?.error?.message ||
                        `Spotify search failed (${secondSearchResponse.status}).`
                    );

                }


                allTracks.push(
                    ...(secondSearchData?.tracks?.items || [])
                );

            }


            // =====================================================
            // GET TRACK URIS
            // =====================================================

            const trackUris =
                allTracks
                    .filter(
                        (track) => track?.uri
                    )
                    .slice(0, songCount)
                    .map(
                        (track) => track.uri
                    );


            if (trackUris.length === 0) {

                throw new Error(
                    `No songs were found for the ${mood} mood.`
                );

            }


            // =====================================================
            // CREATE PLAYLIST
            // =====================================================

            const playlistResponse =
                await fetch(
                    "https://api.spotify.com/v1/me/playlists",
                    {
                        method: "POST",

                        headers: {
                            Authorization:
                                `Bearer ${accessToken}`,

                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            name:
                                `MoodSync AI - ${mood} Mood 🎵`,

                            description:
                                `A personalized ${mood} mood playlist created by MoodSync AI.`,

                            public: false

                        })
                    }
                );


            let playlistData = null;


            try {

                playlistData =
                    await playlistResponse.json();

            } catch {}


            if (!playlistResponse.ok) {

                console.error(
                    "Spotify playlist creation error:",
                    playlistData
                );


                if (
                    playlistResponse.status === 401
                ) {

                    throw new Error(
                        "Spotify session expired. Please connect Spotify again."
                    );

                }


                if (
                    playlistResponse.status === 403
                ) {

                    throw new Error(
                        "Spotify denied playlist creation. Please reconnect Spotify and grant playlist permissions."
                    );

                }


                throw new Error(
                    playlistData?.error?.message ||
                    `Unable to create Spotify playlist (${playlistResponse.status}).`
                );

            }


            const playlist =
                playlistData;


            // =====================================================
            // ADD SONGS TO PLAYLIST
            // =====================================================

            const itemsResponse =
                await fetch(
                    `https://api.spotify.com/v1/playlists/${playlist.id}/items`,
                    {
                        method: "POST",

                        headers: {
                            Authorization:
                                `Bearer ${accessToken}`,

                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            uris: trackUris

                        })
                    }
                );


            let itemsData = null;


            try {

                itemsData =
                    await itemsResponse.json();

            } catch {}


            if (!itemsResponse.ok) {

                console.error(
                    "Spotify add-items error:",
                    itemsData
                );


                throw new Error(
                    itemsData?.error?.message ||
                    `Unable to add songs to the playlist (${itemsResponse.status}).`
                );

            }


            // =====================================================
            // SUCCESS
            // =====================================================

            setPlaylistCreated(
                playlist
            );


            alert(
                `Playlist created successfully! 🎵\n\n` +
                `${playlist.name}\n` +
                `${trackUris.length} songs added.`
            );


            if (
                playlist?.external_urls?.spotify
            ) {

                window.open(
                    playlist.external_urls.spotify,
                    "_blank"
                );

            }


        } catch (error) {

            console.error(
                "Spotify Playlist Error:",
                error
            );


            alert(
                error?.message ||
                "Something went wrong while creating the playlist."
            );


        } finally {

            setPlaylistLoading(false);

        }

    };


    // =========================================================
    // SPEECH RECOGNITION SETUP
    // =========================================================

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


        // =====================================================
        // VOICE START
        // =====================================================

        recognition.onstart = () => {

            console.log(
                "Voice recognition started."
            );


            setMessage("");

            isListeningRef.current = true;
            setIsListening(true);

        };


        // =====================================================
        // VOICE RESULT
        // =====================================================

        recognition.onresult = (event) => {

            const transcript =
                event.results[0][0]
                    .transcript
                    .trim();


            console.log(
                "Voice transcript:",
                transcript
            );


            setIsListening(false);


            // Automatically send voice message
            sendVoiceMessage(
                transcript
            );

        };


        // =====================================================
        // VOICE END
        // =====================================================

        recognition.onend = () => {

            console.log(
                "Voice recognition ended."
            );


            setIsListening(false);

        };


        // =====================================================
        // VOICE ERROR
        // =====================================================

        recognition.onerror = (event) => {

            console.error(
                "Speech recognition error:",
                event.error
            );

            isListeningRef.current = false;
            setIsListening(false);

            if (event.error === "not-allowed" ||
                event.error === "service-not-allowed") {
                alert(
                    "Microphone access is blocked. Please click the camera/microphone icon in Chrome's address bar, allow Microphone for localhost, then try again."
                );
            } else if (event.error === "no-speech") {
                console.log("No speech detected.");
            }
        };


        recognitionRef.current =
            recognition;


        return () => {

            try {

                recognition.stop();

            } catch {}

        };

    }, []);


    // =========================================================
    // TEXT TO SPEECH
    // =========================================================

    const speakReply = (text) => {

        if (
            !("speechSynthesis" in window)
        ) {

            console.warn(
                "Speech synthesis is not supported."
            );

            return;
        }


        window.speechSynthesis.cancel();


        const utterance =
            new SpeechSynthesisUtterance(
                text
            );


        utterance.lang = "en-IN";

        utterance.rate = 0.95;

        utterance.pitch = 1;


        utterance.onstart = () => {

            setIsSpeaking(true);

        };


        utterance.onend = () => {

            setIsSpeaking(false);

        };


        utterance.onerror = () => {

            setIsSpeaking(false);

        };


        window.speechSynthesis.speak(
            utterance
        );

    };


    // =========================================================
    // START / STOP VOICE
    // =========================================================

    const toggleVoice = () => {

        if (
            !recognitionRef.current
        ) {

            alert(
                "Voice input is not supported in this browser. Please use Google Chrome or Microsoft Edge."
            );

            return;
        }


        if (isListeningRef.current) {

            recognitionRef.current.stop();

            isListeningRef.current = false;
            setIsListening(false);

            return;

        }


        try {

            recognitionRef.current.start();

        } catch (error) {

            console.error(
                "Could not start microphone:",
                error
            );

        }

    };


    // =========================================================
    // SEND VOICE MESSAGE
    // =========================================================

    const sendVoiceMessage =
        async (voiceText) => {

            const userMessage =
                String(voiceText || "").trim();

            if (!userMessage) return;

            setMessage("");

            setMessages(
                (previous) => [
                    ...previous,
                    {
                        sender: "user",
                        text: `🎤 ${userMessage}`
                    }
                ]
            );

            // Handle playlist confirmation/request BEFORE sending
            // a new chat request when appropriate.
            const localConversationInfo = {
                turn:
                    conversationTurnRef.current + 1,
                mood:
                    conversationMoodRef.current,
                textMood:
                    detectMoodFromText(userMessage)
            };

            // Confirmation must use the already-known mood.
            if (
                waitingForPlaylistConfirmationRef.current
            ) {

                const handled =
                    handlePlaylistConversation(
                        userMessage,
                        localConversationInfo
                    );

                if (handled) {

                    return;
                }
            }

            try {

                // DO NOT use emotionData?.emotion here.
                // Webcam "neutral" must never overwrite the
                // mood understood from the conversation.
                const currentEmotion =
                    conversationMoodRef.current || "";

                console.log(
                    "Sending voice message to chatbot:",
                    {
                        message:
                            userMessage,
                        emotion:
                            currentEmotion || "unknown"
                    }
                );

                const response =
                    await fetch(
                        "https://moodsync-ai-gnuv.onrender.com/chat",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json"
                            },
                            body:
                                JSON.stringify({
                                    message:
                                        userMessage,
                                    emotion:
                                        currentEmotion
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
                    "Voice chatbot response:",
                    data
                );

                const conversationInfo =
                    registerConversationMood(
                        userMessage,
                        data
                    );

                if (
                    data.success &&
                    data.reply
                ) {

                    setMessages(
                        (previous) => [
                            ...previous,
                            {
                                sender: "bot",
                                text:
                                    data.reply
                            }
                        ]
                    );

                    speakReply(
                        data.reply
                    );

                } else {

                    setMessages(
                        (previous) => [
                            ...previous,
                            {
                                sender: "bot",
                                text:
                                    "Sorry, I couldn't generate a response right now. 😕"
                            }
                        ]
                    );
                }

                // Only after the conversation has enough context
                // do we ask about the playlist.
                handlePlaylistConversation(
                    userMessage,
                    conversationInfo
                );

            } catch (error) {

                console.error(
                    "Voice chatbot error:",
                    error
                );

                setMessages(
                    (previous) => [
                        ...previous,
                        {
                            sender: "bot",
                            text:
                                "Sorry, I'm having trouble connecting right now. Please try again. 😕"
                        }
                    ]
                );
            }
        };


    // =========================================================
    // SEND TEXT MESSAGE
    // =========================================================

    const sendMessage =
        async (externalText = null) => {

            const userMessage =
                String(
                    externalText !== null
                        ? externalText
                        : message
                ).trim();

            if (!userMessage) return;

            setMessages(
                (previous) => [
                    ...previous,
                    {
                        sender: "user",
                        text:
                            userMessage
                    }
                ]
            );

            setMessage("");

            // If MoodSync has already understood the user's mood
            // and is waiting for YES/NO, handle that answer first.
            if (
                waitingForPlaylistConfirmationRef.current
            ) {

                const conversationInfo = {
                    turn:
                        conversationTurnRef.current + 1,
                    mood:
                        conversationMoodRef.current,
                    textMood:
                        detectMoodFromText(
                            userMessage
                        )
                };

                const handled =
                    handlePlaylistConversation(
                        userMessage,
                        conversationInfo
                    );

                if (handled) {

                    return;
                }
            }

            try {

                // Webcam emotion is deliberately NOT used here.
                // Before the conversation has enough context, send
                // an empty emotion instead of forcing "neutral".
                const currentEmotion =
                    conversationMoodRef.current || "";

                console.log(
                    "Sending to chatbot:",
                    {
                        message:
                            userMessage,
                        emotion:
                            currentEmotion || "unknown"
                    }
                );

                const response =
                    await fetch(
                        "https://moodsync-ai-gnuv.onrender.com/chat",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json"
                            },
                            body:
                                JSON.stringify({
                                    message:
                                        userMessage,
                                    emotion:
                                        currentEmotion
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
                    "Chatbot response:",
                    data
                );

                const conversationInfo =
                    registerConversationMood(
                        userMessage,
                        data
                    );

                if (
                    data.success &&
                    data.reply
                ) {

                    setMessages(
                        (previous) => [
                            ...previous,
                            {
                                sender: "bot",
                                text:
                                    data.reply
                            }
                        ]
                    );

                } else {

                    setMessages(
                        (previous) => [
                            ...previous,
                            {
                                sender: "bot",
                                text:
                                    "Sorry, I couldn't generate a response right now. 😕"
                            }
                        ]
                    );
                }

                // This may ask "Would you like a playlist?"
                // but will NOT display the playlist itself.
                handlePlaylistConversation(
                    userMessage,
                    conversationInfo
                );

            } catch (error) {

                console.error(
                    "Chatbot error:",
                    error
                );

                setMessages(
                    (previous) => [
                        ...previous,
                        {
                            sender: "bot",
                            text:
                                "Sorry, I'm having trouble connecting right now. Please try again. 😕"
                        }
                    ]
                );
            }
        };



    // =========================================================
    // EXTERNAL MOODSYNC PAGE CONTROLS
    // =========================================================
    // WebcamPage uses these browser events to control this SAME
    // chatbot instance. This keeps all chat + Spotify logic here.
    useEffect(() => {
        const handleOpenChat = () => {
            setIsOpen(true);
        };

        const handleSendText = (event) => {
            const text =
                String(event?.detail?.text || "").trim();

            setIsOpen(true);

            if (text) {
                // Send immediately. Do not wait for React state to update.
                sendMessage(text);
            }
        };

        const handleStartVoice = () => {
            setIsOpen(true);

            if (!recognitionRef.current) {
                alert(
                    "Voice input is not supported in this browser. Please use Google Chrome or Microsoft Edge."
                );
                return;
            }

            if (isListeningRef.current) {
                return;
            }

            // Start synchronously inside the user's click event so
            // Chrome can show/remember the microphone permission.
            try {
                recognitionRef.current.start();
            } catch (error) {
                console.error(
                    "Could not start microphone from Voice card:",
                    error
                );
            }
        };

        window.addEventListener(
            "moodsync:open-chat",
            handleOpenChat
        );

        window.addEventListener(
            "moodsync:send-text",
            handleSendText
        );

        window.addEventListener(
            "moodsync:start-voice",
            handleStartVoice
        );

        return () => {
            window.removeEventListener(
                "moodsync:open-chat",
                handleOpenChat
            );

            window.removeEventListener(
                "moodsync:send-text",
                handleSendText
            );

            window.removeEventListener(
                "moodsync:start-voice",
                handleStartVoice
            );
        };
    }, []);

    // =========================================================
    // STOP AI SPEECH
    // =========================================================

    const stopSpeaking = () => {

        if (
            "speechSynthesis" in window
        ) {

            window.speechSynthesis.cancel();

        }


        setIsSpeaking(false);

    };


    // =========================================================
    // CLOSE CHAT
    // =========================================================

    const closeChat = () => {

        setIsOpen(false);


        // Stop microphone

        if (
            recognitionRef.current &&
            isListening
        ) {

            try {

                recognitionRef.current.stop();

            } catch {}

        }


        // Stop AI voice

        stopSpeaking();

    };


    // =========================================================
    // MOOD LABEL
    // =========================================================

    const moodLabel =
        detectedMood
            ? detectedMood.charAt(0).toUpperCase() +
              detectedMood.slice(1)
            : "";


    // =========================================================
    // UI
    // =========================================================

    return (

        <>

            {/* ================================================= */}
            {/* FLOATING CHAT BUTTON */}
            {/* ================================================= */}

            {!isOpen && (

                <button
                    onClick={() =>
                        setIsOpen(true)
                    }

                    className="
                        fixed
                        bottom-6
                        right-6
                        w-16
                        h-16
                        rounded-full
                        bg-[#4B3425]
                        hover:bg-[#3B291D]
                        text-white
                        text-3xl
                        shadow-2xl
                        flex
                        items-center
                        justify-center
                        z-50
                        transition
                        hover:scale-105
                    "

                    title="Open MoodSync"
                >

                    🤖

                </button>

            )}


            {/* ================================================= */}
            {/* CHAT WINDOW */}
            {/* ================================================= */}

            {isOpen && (

                <div
                    className="
                        fixed
                        bottom-4
                        right-4
                        sm:bottom-6
                        sm:right-6
                        w-[calc(100vw-2rem)]
                        sm:w-[360px]
                        max-w-[360px]
                        h-[80vh]
                        sm:h-[500px]
                        max-h-[650px]
                        bg-white
                        rounded-3xl
                        shadow-2xl
                        flex
                        flex-col
                        overflow-hidden
                        z-50
                    "
                >

                    {/* ================================================= */}
                    {/* HEADER */}
                    {/* ================================================= */}

                    <div
                        className="
                            bg-[#4B3425]
                            text-white
                            px-5
                            py-4
                            flex
                            justify-between
                            items-center
                        "
                    >

                        <div>

                            <h2
                                className="
                                    font-bold
                                    text-lg
                                "
                            >

                                🤖 MoodSync

                            </h2>


                            <p
                                className="
                                    text-sm
                                    opacity-80
                                "
                            >

                                Your mood assistant

                            </p>

                        </div>


                        <div
                            className="
                                flex
                                items-center
                                gap-2
                            "
                        >

                            {/* SPEAKING INDICATOR */}

                            {isSpeaking && (

                                <button
                                    onClick={
                                        stopSpeaking
                                    }

                                    className="
                                        text-sm
                                        bg-white/20
                                        hover:bg-white/30
                                        px-2
                                        py-1
                                        rounded-lg
                                    "

                                    title="Stop AI voice"
                                >

                                    🔊

                                </button>

                            )}


                            {/* CLOSE */}

                            <button
                                onClick={
                                    closeChat
                                }

                                className="
                                    text-2xl
                                    hover:opacity-70
                                "
                            >

                                ✕

                            </button>

                        </div>

                    </div>


                    {/* ================================================= */}
                    {/* MESSAGES */}
                    {/* ================================================= */}

                    <div
                        className="
                            flex-1
                            overflow-y-auto
                            p-4
                            space-y-3
                            bg-[#F5EFE6]
                        "
                    >

                        {messages.map(
                            (msg, index) => (

                                <div
                                    key={index}

                                    className={
                                        msg.sender === "user"
                                            ? "flex justify-end"
                                            : "flex justify-start"
                                    }
                                >

                                    <div
                                        className={
                                            msg.sender === "user"

                                                ? `
                                                    bg-[#4B3425]
                                                    text-white
                                                    px-4
                                                    py-3
                                                    rounded-2xl
                                                    rounded-br-md
                                                    max-w-[80%]
                                                    break-words
                                                `

                                                : `
                                                    bg-white
                                                    text-gray-800
                                                    px-4
                                                    py-3
                                                    rounded-2xl
                                                    rounded-bl-md
                                                    shadow-sm
                                                    max-w-[80%]
                                                    break-words
                                                `
                                        }
                                    >

                                        {msg.text}

                                    </div>

                                </div>

                            )
                        )}


                        {/* ================================================= */}
                        {/* MOOD UNDERSTOOD + PLAYLIST CARD */}
                        {/* ================================================= */}

                        {showPlaylist && detectedMood && (

                            <div
                                className="
                                    mt-4
                                    bg-white
                                    border
                                    border-[#E6D9C9]
                                    rounded-2xl
                                    shadow-sm
                                    p-4
                                "
                            >

                                {/* MOOD */}

                                <div
                                    className="
                                        text-center
                                    "
                                >

                                    <div
                                        className="
                                            text-3xl
                                            mb-1
                                        "
                                    >

                                        {
                                            emotionEmoji[
                                                detectedMood
                                            ] || "🎭"
                                        }

                                    </div>


                                    <p
                                        className="
                                            font-semibold
                                            text-[#4B3425]
                                        "
                                    >

                                        I think you're feeling{" "}

                                        <span
                                            className="
                                                font-bold
                                            "
                                        >
                                            {moodLabel}
                                        </span>

                                    </p>


                                    <p
                                        className="
                                            text-xs
                                            text-gray-500
                                            mt-1
                                        "
                                    >

                                        Want a playlist for your mood?

                                    </p>

                                </div>


                                {/* SONG COUNT */}

                                <div
                                    className="
                                        mt-4
                                        flex
                                        justify-center
                                        items-center
                                        gap-3
                                    "
                                >

                                    <button
                                        onClick={() =>
                                            setSongCount(
                                                (count) =>
                                                    Math.max(
                                                        1,
                                                        count - 1
                                                    )
                                            )
                                        }

                                        className="
                                            w-10
                                            h-10
                                            rounded-lg
                                            bg-[#4B3425]
                                            hover:bg-[#3B291D]
                                            text-white
                                            text-xl
                                            font-bold
                                        "
                                    >

                                        −

                                    </button>


                                    <div
                                        className="
                                            min-w-[60px]
                                            text-center
                                        "
                                    >

                                        <span
                                            className="
                                                text-lg
                                                font-bold
                                                text-[#4B3425]
                                            "
                                        >

                                            {songCount}

                                        </span>


                                        <span
                                            className="
                                                text-xs
                                                text-gray-500
                                                ml-1
                                            "
                                        >

                                            songs

                                        </span>

                                    </div>


                                    <button
                                        onClick={() =>
                                            setSongCount(
                                                (count) =>
                                                    Math.min(
                                                        20,
                                                        count + 1
                                                    )
                                            )
                                        }

                                        className="
                                            w-10
                                            h-10
                                            rounded-lg
                                            bg-[#4B3425]
                                            hover:bg-[#3B291D]
                                            text-white
                                            text-xl
                                            font-bold
                                        "
                                    >

                                        +

                                    </button>

                                </div>


                                {/* CREATE PLAYLIST BUTTON */}

                                <button
                                    onClick={
                                        createMoodPlaylist
                                    }

                                    disabled={
                                        playlistLoading
                                    }

                                    className="
                                        mt-4
                                        w-full
                                        bg-[#4B3425]
                                        hover:bg-[#3B291D]
                                        disabled:opacity-60
                                        disabled:cursor-not-allowed
                                        text-white
                                        py-3
                                        rounded-xl
                                        font-semibold
                                        transition
                                    "
                                >

                                    {playlistLoading

                                        ? "🎵 Creating Playlist..."

                                        : "🎵 Create My Mood Playlist"

                                    }

                                </button>


                                {/* PLAYLIST CREATED */}

                                {playlistCreated && (

                                    <div
                                        className="
                                            mt-4
                                            bg-green-50
                                            border
                                            border-green-200
                                            rounded-xl
                                            p-3
                                            text-center
                                        "
                                    >

                                        <p
                                            className="
                                                text-green-700
                                                font-semibold
                                                text-sm
                                            "
                                        >

                                            ✅ Playlist created!

                                        </p>


                                        <p
                                            className="
                                                text-gray-700
                                                text-xs
                                                mt-1
                                            "
                                        >

                                            {
                                                playlistCreated.name
                                            }

                                        </p>


                                        {playlistCreated
                                            ?.external_urls
                                            ?.spotify && (

                                            <button
                                                onClick={() =>
                                                    window.open(
                                                        playlistCreated
                                                            .external_urls
                                                            .spotify,
                                                        "_blank"
                                                    )
                                                }

                                                className="
                                                    mt-3
                                                    bg-[#1DB954]
                                                    hover:bg-[#1aa34a]
                                                    text-white
                                                    px-4
                                                    py-2
                                                    rounded-lg
                                                    text-sm
                                                    font-semibold
                                                "
                                            >

                                                Open in Spotify 🎵

                                            </button>

                                        )}

                                    </div>

                                )}

                            </div>

                        )}


                        {/* ================================================= */}
                        {/* LISTENING MESSAGE */}
                        {/* ================================================= */}

                        {isListening && (

                            <div
                                className="
                                    flex
                                    justify-start
                                "
                            >

                                <div
                                    className="
                                        bg-white
                                        text-gray-700
                                        px-4
                                        py-3
                                        rounded-2xl
                                        rounded-bl-md
                                        shadow-sm
                                        flex
                                        items-center
                                        gap-2
                                    "
                                >

                                    <span
                                        className="
                                            animate-pulse
                                        "
                                    >

                                        🎤

                                    </span>


                                    <span>

                                        Listening...

                                    </span>

                                </div>

                            </div>

                        )}


                        {/* ================================================= */}
                        {/* SPEAKING MESSAGE */}
                        {/* ================================================= */}

                        {isSpeaking && (

                            <div
                                className="
                                    flex
                                    justify-start
                                "
                            >

                                <div
                                    className="
                                        bg-white
                                        text-gray-700
                                        px-4
                                        py-2
                                        rounded-2xl
                                        rounded-bl-md
                                        shadow-sm
                                        text-xs
                                    "
                                >

                                    🔊 MoodSync is speaking...

                                </div>

                            </div>

                        )}

                    </div>


                    {/* ================================================= */}
                    {/* INPUT */}
                    {/* ================================================= */}

                    <div
                        className="
                            p-3
                            bg-white
                            border-t
                            flex
                            gap-2
                            items-center
                        "
                    >

                        {/* TEXT INPUT */}

                        <input
                            type="text"

                            value={
                                message
                            }

                            onChange={(e) =>
                                setMessage(
                                    e.target.value
                                )
                            }

                            onKeyDown={(e) => {

                                if (
                                    e.key === "Enter"
                                ) {

                                    sendMessage();

                                }

                            }}

                            placeholder="Tell me how you're feeling..."

                            className="
                                flex-1
                                min-w-0
                                border
                                border-gray-300
                                rounded-xl
                                px-4
                                py-3
                                outline-none
                                focus:border-[#4B3425]
                            "
                        />


                        {/* ================================================= */}
                        {/* MICROPHONE BUTTON */}
                        {/* ================================================= */}

                        <button
                            onClick={
                                toggleVoice
                            }

                            className={`
                                w-12
                                h-12
                                flex
                                items-center
                                justify-center
                                rounded-xl
                                text-xl
                                transition

                                ${
                                    isListening

                                        ? `
                                            bg-red-500
                                            hover:bg-red-600
                                            text-white
                                            animate-pulse
                                        `

                                        : `
                                            bg-[#E8D8C8]
                                            hover:bg-[#D9C5B2]
                                            text-[#4B3425]
                                        `
                                }
                            `}

                            title={
                                isListening
                                    ? "Stop listening"
                                    : "Talk to MoodSync"
                            }
                        >

                            {isListening
                                ? "⏹️"
                                : "🎤"
                            }

                        </button>


                        {/* ================================================= */}
                        {/* SEND BUTTON */}
                        {/* ================================================= */}

                        <button
                            onClick={
                                sendMessage
                            }

                            disabled={
                                !message.trim()
                            }

                            className="
                                w-12
                                h-12
                                bg-[#4B3425]
                                hover:bg-[#3B291D]
                                disabled:opacity-40
                                disabled:cursor-not-allowed
                                text-white
                                rounded-xl
                                text-xl
                                flex
                                items-center
                                justify-center
                                transition
                            "

                            title="Send message"
                        >

                            ➤

                        </button>

                    </div>


                    {/* ================================================= */}
                    {/* VOICE HELP TEXT */}
                    {/* ================================================= */}

                    <div
                        className="
                            text-center
                            text-[11px]
                            text-gray-400
                            bg-white
                            pb-2
                        "
                    >

                        🎤 Tap the microphone to talk to MoodSync

                    </div>

                </div>

            )}

        </>

    );

}