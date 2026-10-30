"use client";

import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { BoxGeometry, CylinderGeometry, type Group, Matrix4, MeshBasicMaterial } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { site } from "@/content/site";
import { BlueprintMesh } from "../blueprint/BlueprintMesh";
import { Grid } from "../blueprint/Grid";
import { ink } from "../blueprint/ink";
import { CRUISE, HIGHWAY, loopX } from "../models/highwayLayout";
import { journeyProgress } from "../progress";
import { inView } from "../stages/inView";

const { x: hx, z: hz, length: L, roadY, lane, median, shoulder } = HIGHWAY;
// Half-width of the paved road: median, carriageway and shoulder.
const PAVED = median + 2 * lane + shoulder;

// The road as a slab, its edges the drawing's outer lines.
const road = new BoxGeometry(L, 0.08, PAVED * 2).translate(hx, roadY - 0.04, hz);

// Guard rails: the median's and each outer edge's; continuous beams.
const RAIL_Z = [hz, hz + PAVED - 0.4, hz - (PAVED - 0.4)];
const rails = mergeGeometries(RAIL_Z.map((z) => new BoxGeometry(L, 0.32, 0.08).translate(hx, roadY + 0.75, z)))!;

// Posts every 4 m along each rail and lamp poles every 50 m on the median: laid out once, then the whole set slides
// back by the distance driven, wrapped at 100 m (a multiple of both pitches), so it loops seamlessly.
const POST_PITCH = 4;
const POLE_PITCH = 50;
const LOOP = 100;
const POLE_HEIGHT = 11;
const from = hx - L / 2;
const post = new BoxGeometry(0.16, 0.9, 0.16).translate(0, 0.45, 0);
const postMatrices = RAIL_Z.flatMap((z) =>
  Array.from({ length: L / POST_PITCH }, (_, i) => new Matrix4().makeTranslation(from + i * POST_PITCH, roadY, z)),
);
// Median poles with two arms, one over each carriageway, and their lamp heads. 24-sided: no facet lines.
const pole = mergeGeometries([
  new CylinderGeometry(0.12, 0.2, POLE_HEIGHT, 24).translate(0, POLE_HEIGHT / 2, 0),
  new BoxGeometry(0.12, 0.12, 7).translate(0, POLE_HEIGHT, 0),
  ...[-1, 1].map((s) => new BoxGeometry(0.5, 0.18, 1.0).translate(0, POLE_HEIGHT - 0.12, s * 3.3)),
])!;
const poleMatrices = Array.from({ length: L / POLE_PITCH }, (_, i) => new Matrix4().makeTranslation(from + i * POLE_PITCH, roadY, hz));

// The sign: on the truck's verge, ahead, turned toward the travelling camera so it reads.
const SIGN = { x0: hx + 40, z: hz + PAVED + 3, width: 7.4, height: 2.2, y: 5.4 };
const sign = mergeGeometries([
  ...[-1, 1].map((s) =>
    new CylinderGeometry(0.1, 0.1, SIGN.y + SIGN.height, 24).translate(s * (SIGN.width / 2 - 0.6), (SIGN.y + SIGN.height) / 2, -0.1),
  ),
  new BoxGeometry(SIGN.width, SIGN.height, 0.08).translate(0, SIGN.y, 0),
])!;
// The sign's lettering, in the stroke's ink.
const signText = new MeshBasicMaterial({ transparent: true });

// BR-101 at night, as a drawing: the APG truck stands in its lane while the posts, poles and the sign loop past.
export function Highway({ reducedMotion }: { reducedMotion: boolean }) {
  const group = useRef<Group>(null);
  const props = useRef<Group>(null);
  const signRef = useRef<Group>(null);
  // The sign's text (troika: a font fetch and a worker) mounts only once the road is near, not on page load.
  const [near, setNear] = useState(false);

  useFrame(({ clock }) => {
    if (!near && journeyProgress.value > 0.3) setNear(true);
    // Only while its stage is on screen (Stages hides the rest).
    if (!inView(group.current!)) return;
    const scroll = reducedMotion ? 0 : CRUISE * clock.elapsedTime;
    props.current!.position.x = -(scroll % LOOP);
    signRef.current!.position.x = loopX(SIGN.x0, scroll);
    signText.color.copy(ink.stroke.value);
    signText.opacity = ink.primary.value;
  });

  return (
    <group ref={group}>
      <BlueprintMesh geometry={road} />
      <BlueprintMesh geometry={rails} />
      <group ref={props}>
        <BlueprintMesh geometry={post} matrices={postMatrices} weight="secondary" />
        <BlueprintMesh geometry={pole} matrices={poleMatrices} />
      </group>
      <group ref={signRef} position={[SIGN.x0, roadY, SIGN.z]} rotation-y={-0.75}>
        <BlueprintMesh geometry={sign} />
        {near && (
          <Text
            font="/3d/fonts/archivo-bold.ttf"
            fontSize={0.95}
            anchorX="center"
            anchorY="middle"
            position={[0, SIGN.y, 0.06]}
            material={signText}
          >
            {site.journeyScene.highwaySign}
          </Text>
        )}
      </group>
      <Grid y={roadY - 0.1} />
    </group>
  );
}
