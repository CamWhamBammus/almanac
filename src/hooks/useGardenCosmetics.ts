"use client";

import { useEffect, useState } from "react";
import {
  AMBIENCE_LABELS,
  GROUND_LABELS,
  SKY_LABELS,
  STARTER_AMBIENCE,
  STARTER_GROUND,
  STARTER_SKY,
  type AmbienceId,
  type GroundId,
  type SkyId,
} from "@/lib/progression";

const KEYS = {
  ground: "almanac:garden-ground",
  sky: "almanac:garden-sky",
  ambience: "almanac:garden-ambience",
} as const;

export interface GardenCosmetics {
  ground: GroundId;
  sky: SkyId;
  ambience: AmbienceId;
}

function read<T extends string>(key: string, valid: Record<string, unknown>, fallback: T): T {
  const stored = window.localStorage.getItem(key);
  return stored && stored in valid ? (stored as T) : fallback;
}

/**
 * The garden's chosen look. Same read-on-mount pattern as useTheme — the
 * server can't see localStorage, so the first render uses the starters and
 * a mount effect corrects it.
 */
export function useGardenCosmetics() {
  const [cosmetics, setCosmetics] = useState<GardenCosmetics>({
    ground: STARTER_GROUND,
    sky: STARTER_SKY,
    ambience: STARTER_AMBIENCE,
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCosmetics({
      ground: read<GroundId>(KEYS.ground, GROUND_LABELS, STARTER_GROUND),
      sky: read<SkyId>(KEYS.sky, SKY_LABELS, STARTER_SKY),
      ambience: read<AmbienceId>(KEYS.ambience, AMBIENCE_LABELS, STARTER_AMBIENCE),
    });
  }, []);

  function setGround(ground: GroundId) {
    setCosmetics((c) => ({ ...c, ground }));
    window.localStorage.setItem(KEYS.ground, ground);
  }

  function setSky(sky: SkyId) {
    setCosmetics((c) => ({ ...c, sky }));
    window.localStorage.setItem(KEYS.sky, sky);
  }

  function setAmbience(ambience: AmbienceId) {
    setCosmetics((c) => ({ ...c, ambience }));
    window.localStorage.setItem(KEYS.ambience, ambience);
  }

  return { ...cosmetics, setGround, setSky, setAmbience };
}
