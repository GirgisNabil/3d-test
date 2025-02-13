import React, {
  memo,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { TalkingHead } from "./talking-head/module";

const TalkingHeadComponent = () => {
  const avatarRef = useRef(null);
  const headRef = useRef(null);

  useEffect(() => {
    const loadAvatar = async () => {
      try {
        if (!headRef.current) {
          headRef.current = new TalkingHead(avatarRef.current, {
            ttsEndpoint:
              "https://eu-texttospeech.googleapis.com/v1beta1/text:synthesize",
            ttsApikey: "AIzaSyDx_n462POu9r44YfTlzyM5QQ4xs_gaa9I", // <- Change this
            lipsyncModules: ["en", "fi"],
            cameraView: "head",
            modelPixelRatio: 2,
            cameraDistance: 1.5,
            cameraX: -0.1,
            cameraY: 0.4,
            cameraRotateEnabled: false,
          });
          console.log("loaded");

          await headRef?.current?.showAvatar({
            url: "/models/faris-model.glb",
            body: "M",
            avatarMood: "happy",
            ttsLang: "en-GB",
            ttsVoice: "en-US-Wavenet-B",
            lipsyncLang: "en",
          });
        }
      } catch (error) {
        // console.error(error); // From G
      }
    };

    loadAvatar();
  }, []); // Empty dependency array ensures this runs only once

  return (
    <div
      style={{ width: "500px", height: "500px" }}
      className="w-full rounded-lg md:rounded-2xl h-full  mx-auto relative z-0 bg-gray-600 text-white    pointer-events-none overflow-hidden"
    >
      <div id="stars"></div>
      <div id="stars2"></div>
      <div id="stars3"></div>

      <div
        style={{ width: "500px", height: "500px" }}
        id="avatar"
        ref={avatarRef}
        className="block w-full relative z-50 h-full"
      ></div>
    </div>
  );
};

export default memo(TalkingHeadComponent);
