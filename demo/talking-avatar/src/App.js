import { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, Html } from "@react-three/drei";
import { Model } from "./Explorer";
import { ConvaiClient } from "convai-web-sdk";
import { SETTINGS } from "./constants";
import ChatBox from "./Chatbox";

const convaiClient = new ConvaiClient({
  apiKey: SETTINGS["CONVAI-API-KEY"],
  characterId: SETTINGS["CHARACTER-ID"],
  enableAudio: true, // use false for text only.
});

export default function App() {
  const [userText, setUserText] = useState(
    "Press & Hold Backtick key (`) to Talk!"
  );
  const finalizedUserText = useRef();
  const [npcText, setNpcText] = useState("");
  const npcTextRef = useRef();

  const [isTalking, setIsTalking] = useState(false);

  convaiClient.setResponseCallback((response) => {
    console.log("APP set response callback");
    if (response.hasUserQuery()) {
      var transcript = response.getUserQuery();
      console.log("I said: ", transcript);
      var isFinal = transcript.getIsFinal();
      if (isFinal) {
        finalizedUserText.current += transcript.getTextData();
        transcript = "";
      }
      if (transcript) {
        setUserText(finalizedUserText.current + transcript.getTextData());
      } else {
        setUserText(finalizedUserText.current);
      }
    }
    if (response.hasAudioResponse()) {
      var audioResponse = response?.getAudioResponse();
      npcTextRef.current += audioResponse.getTextData();
      console.log("AI said: ", audioResponse.getTextData());
      setNpcText(npcTextRef.current);
    }
  });

  convaiClient.onAudioPlay(() => {
    setIsTalking(true);
  });

  convaiClient.onAudioStop(() => {
    convaiClient.resetSession();
    setIsTalking(false);
  });

  const [keyPressed, setKeyPressed] = useState(false);

  function handleBacktickbarPress(event) {
    if (event.key === "`" && !keyPressed) {
      convaiClient.resetSession();
      setKeyPressed(true);
      finalizedUserText.current = "";
      npcTextRef.current = "";
      setUserText("");
      setNpcText("");
      convaiClient.startAudioChunk();
    }
  }

  function handleBacktickbarRelease(event) {
    if (event.key === "`" && keyPressed) {
      setKeyPressed(false);
      console.log("Released");
      convaiClient.endAudioChunk();
      convaiClient.resetSession();
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleBacktickbarPress);
    window.addEventListener("keyup", handleBacktickbarRelease);
    return () => {
      window.removeEventListener("keydown", handleBacktickbarPress);
      window.removeEventListener("keyup", handleBacktickbarRelease);
    };
  }, [keyPressed]);

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <ChatBox />
      <Canvas
        style={{ display: "flex" }}
        shadows
        camera={{ position: [0, 0, 15], fov: 30 }}
      >
        <Environment
          files="/snowy_forest_path_01_4k.hdr"
          ground={{ height: 5, radius: 30, scale: 20 }}
        />
        <Model
          position={[0, 0, 3]}
          scale={1.8}
          animationName={isTalking ? "talk" : "idle"}
        />
        <Html position={[-1.5, -0.75, 3]}>
          {userText && (
            <div
              style={{
                width: "100%",
                height: "100%",
                overflow: "auto",
                borderRadius: "10px",
                background: "rgba(115, 117, 109, 0.5)",
                padding: "10px",
                textAlign: "center",
              }}
            >
              <p style={{ maxHeight: "300px", width: "300px" }}>{userText}</p>
            </div>
          )}
        </Html>
        <Html position={[1, 3, 3]}>
          {npcText && (
            <div
              style={{
                width: "100%",
                height: "100%",
                overflow: "auto",
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.7)",
                padding: "10px",
                textAlign: "center",
              }}
            >
              <p style={{ maxHeight: "300px", width: "300px" }}>{npcText}</p>
            </div>
          )}
        </Html>
        <OrbitControls
          enableZoom={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2.25}
        />
      </Canvas>
    </div>
  );
}
