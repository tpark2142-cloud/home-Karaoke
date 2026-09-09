# Home Karaoke

Run `node server.cjs` in this folder and open the local URL it prints. Internet access is needed for YouTube and icons. Use a local HTTP address, not a file URL, for YouTube embedding and microphone access.

1. Enter a song title, then use Find karaoke on YouTube. Choose an instrumental/karaoke video with on-screen lyrics and paste its video URL into the app.
2. Add songs to the queue. Click a queued song to play it; the next song starts when the current video ends, subject to browser autoplay settings.
   Pasting a YouTube link automatically fills an empty song title from YouTube's video metadata. Titles you type yourself are preserved. Adding a song waits for a pending title lookup (up to eight seconds); if metadata is unavailable, a manually entered title or the video ID is used. This does not require a YouTube Data API key and does not perform song-title searches.
3. Adding or selecting a song without saved lyrics searches LRCLIB automatically using the video title with common karaoke labels removed. A unique title/artist match loads into the lyrics panel; ambiguous results require choosing the matching song. The lyrics search field accepts a corrected song title and artist. Some songs are not available, especially when the video title differs from the catalogue. Existing and manually edited lyrics are preserved. You can also paste lyrics or import UTF-8 .txt/.lrc files. Timed LRC lines follow the embedded player's clock, but karaoke intros and arrangements may differ from the source recording. A positive timing offset makes the lyrics advance earlier. Plain text scrolls manually.
4. Pair a Bluetooth microphone in Windows and check Settings > System > Sound > Input. Click Connect / test microphone and grant browser permission. The meter confirms input.

Some karaoke microphones use Bluetooth only to receive music and amplify your voice through their built-in speaker. Those devices might not appear as a computer microphone. Use their own voice controls. Computer voice monitoring is optional and starts off to prevent feedback; Bluetooth can introduce audible delay. The computer's default output device controls where playback is heard.

Queues and lyrics are saved locally in this browser. Automatic lyrics use LRCLIB's public search API (https://lrclib.net/docs), not captions extracted from YouTube. The song query is sent to LRCLIB; the loaded record is linked beside the lyrics. The app does not remove vocals or download YouTube audio. The separate Find lyrics online link opens a web search in another tab. Some videos block embedding; use Open on YouTube or choose another video.

## Audio-only recording

Click Record and allow microphone access. The recorder uses the input selected in the Microphone section, without requesting a camera. For a BONAOK Q37 playing through its built-in speaker, select your laptop/phone microphone to record the singing and music in the room. Keep computer voice monitoring off. This does not capture the embedded YouTube audio directly. The voice volume slider controls monitoring, not recording gain.

Click Stop, listen to the take, and use Download audio. The format is selected from the browser's supported audio formats (typically WebM/Opus or M4A). Multiple takes remain available until you leave or reload the page; they are not uploaded or saved to browser storage. Download wanted takes first. A recording stops after 30 minutes or when total session recordings reach approximately 100 MB. Download and delete old takes to release memory. Keep the page open and the device awake while recording; mobile operating systems may interrupt capture in the background.
