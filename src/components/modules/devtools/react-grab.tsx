import Script from "next/script";
import { reactGrabConfig } from "@/config/react-grab-config";

export function ReactGrab() {
  console.log(reactGrabConfig);
  if (process.env.NODE_ENV !== "development") return null;
  if (!reactGrabConfig.enabled || !reactGrabConfig.provider) return null;

  return (
    <>
      <Script
        id="react-grab-core"
        src="https://unpkg.com/react-grab/dist/index.global.js"
        crossOrigin="anonymous"
        strategy="beforeInteractive"
      />
      <Script
        id={`react-grab-provider-${reactGrabConfig.provider.id}`}
        src={reactGrabConfig.provider.clientScriptUrl}
        crossOrigin="anonymous"
        strategy="beforeInteractive"
      />
    </>
  );
}
