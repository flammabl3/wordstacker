"use client";
import MatterScene from "../../../../components/matter-scene";
import { use } from "react";

export default function WordStackPage({ params }) {
  const { word } = use(params);

  return <MatterScene word={word} />;
}
