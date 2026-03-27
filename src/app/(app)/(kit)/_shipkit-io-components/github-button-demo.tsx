"use client";

import { useEffect, useState } from "react";
import { GithubStarsButton } from "@/components/buttons/github-stars-button";
import { siteConfig } from "@/config/site-config";
import "./github-button.css";

export default function GithubButtonDemo() {
  const [stars, setStars] = useState(0);
  useEffect(() => {
    void new Promise((resolve) => setTimeout(resolve, 1000)).then(() => {
      setStars(1024);
    });
  }, []);
  return (
    <GithubStarsButton href={siteConfig.repo.url} starNumber={stars}>
      {`Star ${siteConfig.title} on GitHub`}
    </GithubStarsButton>
  );
}
