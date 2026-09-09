# Home Karaoke

Run `node server.cjs` in this folder and open the local URL it prints. Internet access is needed for YouTube and icons. Use a local HTTP address, not a file URL, for YouTube embedding and microphone access.

1. Enter a song title, then use Find karaoke on YouTube. Choose an instrumental/karaoke video with on-screen lyrics and paste its video URL into the app.
2. Add songs to the queue. Click a queued song to play it; the next song starts when the current video ends, subject to browser autoplay settings.
3. Use the video's own lyrics, or find lyrics online and paste text into the separate lyrics editor. Import UTF-8 .txt or .lrc files. Timed LRC lines follow the embedded player's clock. A positive timing offset makes the lyrics advance earlier. Plain text scrolls manually.
4. Pair a Bluetooth microphone in Windows and check Settings > System > Sound > Input. Click Connect / test microphone and grant browser permission. The meter confirms input.

Some karaoke microphones use Bluetooth only to receive music and amplify your voice through their built-in speaker. Those devices might not appear as a computer microphone. Use their own voice controls. Computer voice monitoring is optional and starts off to prevent feedback; Bluetooth can introduce audible delay. The computer's default output device controls where playback is heard.

Queues and lyrics are saved locally in this browser. The app does not extract YouTube captions, remove vocals, download YouTube audio, automatically retrieve lyrics, or record performances. Online lyrics search opens another tab; it does not guarantee synchronized lyrics for a particular karaoke arrangement. Some videos block embedding; use Open on YouTube or choose another video.
