# bug-guacamole-noaudio

This repro demonstrates a bug where around 15% of the time, the webapp fails to receive the [audio instruction](https://guacamole.apache.org/doc/gug/protocol-reference.html#audio-instruction) when starting a RDP connection.

1. Obtain a Windows PC or VM to initiate an RDP connection to and update [user-mapping.xml](./guacamole_home/user-mapping.xml) with the connection details
   1. I am using the `windows-server-2025` image from Google Cloud (specifically `windows-server-2025-dc-v20250612`), but have also been able to repro it on Windows 10. I don't believe the issue is related to Windows version. I have not tested other RDP server implementations
2. `docker compose up`
3. Either...
   1. Manually visit http://localhost:8080/guacamole, log in with the credentials in [user-mapping.xml](./guacamole_home/user-mapping.xml), and repeatedly try to:
      1. Play some audio
      2. If audio is heard, refresh your browser to re-initiate the connection
      3. If audio is not heard, this is the bug
   2. Have Node.js installed and run `npm install && npx playwright install chromium && npx playwright test --headed` to automate the manual steps
      1. The automation monitors the `guacamole/websocket-tunnel` WebSocket for a message where the `audio` instruction is received, refreshes until it is not received, then waits for 1m for inspection. It logs progress to the console

It make take 25-50 attempts to reproduce.

**Actual:** sometimes, audio playback does not work.

**Expected:** audio playback always works.

## Notes

I'm not able to reproduce on 1.5.5 (100 attempts), but I recall being able to sometimes reproduce on 1.5.4.

I did some debugging. guacd [raw_encoder_send_audio](https://github.com/apache/guacamole-server/blob/f3f5b9d76649ccc24f551cb166c81078f4b5e236/src/libguac/raw_encoder.c#L34) appears to run when there is no audio. But when I log input read from the `java.net.Socket` in [ReaderGuacamoleReader](https://github.com/apache/guacamole-client/blob/82762fade3a17f4d90d780f2a7a1e4c41da6d095/guacamole-common/src/main/java/org/apache/guacamole/io/ReaderGuacamoleReader.java#L120), I'm not seeing the audio instruction, which would explain why the browser client's WebSocket doesn't receive it either.