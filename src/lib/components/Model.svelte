<script lang="ts">
  import { onMount } from 'svelte';
  import { T, useTask } from '@threlte/core';
  import * as THREE from 'three';

  const BOX_SIZE = 1.5;
  const H = BOX_SIZE / 2;

  const corners: [number, number, number][] = [
    [-H, -H, -H], [ H, -H, -H], [ H,  H, -H], [-H,  H, -H],
    [-H, -H,  H], [ H, -H,  H], [ H,  H,  H], [-H,  H,  H],
  ];

  const edgeIndices: [number, number][] = [
    [0,1],[1,2],[2,3],[3,0],
    [4,5],[5,6],[6,7],[7,4],
    [0,4],[1,5],[2,6],[3,7],
  ];

  // --- Cube edges ---
  const allPositions: number[] = [];
  const allPhases: number[] = [];

  edgeIndices.forEach(([a, b]) => {
    const phase = Math.random() * Math.PI * 2;
    allPositions.push(...corners[a], ...corners[b]);
    allPhases.push(phase, phase);
  });

  const edgeGeo = new THREE.BufferGeometry();

  edgeGeo.setAttribute(
    'position',
    new THREE.BufferAttribute(
      new Float32Array(allPositions),
      3
    )
  );

  edgeGeo.setAttribute(
    'phase',
    new THREE.BufferAttribute(
      new Float32Array(allPhases),
      1
    )
  );

  const edgeMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      color: {
        value: new THREE.Color(
          168 / 255,
          168 / 255,
          232 / 255
        )
      }
    },

    vertexShader: `
      attribute float phase;
      uniform float time;
      varying float vAlpha;

      void main() {
        float pulse = sin(time * 1.2 + phase);

        vAlpha = smoothstep(-0.2, 0.8, pulse);

        gl_Position =
          projectionMatrix *
          modelViewMatrix *
          vec4(position, 1.0);
      }
    `,

    fragmentShader: `
      uniform vec3 color;
      varying float vAlpha;

      void main() {
        gl_FragColor = vec4(color, vAlpha);
      }
    `,

    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });


  // --- Inner face grid with light-driven glow ---
  const GRID_DIVISIONS = 4;
  const SEGMENTS_PER_LINE = 16;

  const faces = [
    {
      o: [-H, -H, -H],
      u: [BOX_SIZE, 0, 0],
      v: [0, BOX_SIZE, 0]
    },
    {
      o: [-H, -H, H],
      u: [BOX_SIZE, 0, 0],
      v: [0, BOX_SIZE, 0]
    },
    {
      o: [-H, -H, -H],
      u: [0, 0, BOX_SIZE],
      v: [0, BOX_SIZE, 0]
    },
    {
      o: [H, -H, -H],
      u: [0, 0, BOX_SIZE],
      v: [0, BOX_SIZE, 0]
    },
    {
      o: [-H, -H, -H],
      u: [BOX_SIZE, 0, 0],
      v: [0, 0, BOX_SIZE]
    },
    {
      o: [-H, H, -H],
      u: [BOX_SIZE, 0, 0],
      v: [0, 0, BOX_SIZE]
    },
  ];

  type GridLine = {
    start: THREE.Vector3;
    end: THREE.Vector3;
    phase: number;
  };

  const gridLines: GridLine[] = [];

  faces.forEach(({ o, u, v }) => {
    for (let i = 1; i < GRID_DIVISIONS; i++) {
      const t = i / GRID_DIVISIONS;

      gridLines.push({
        start: new THREE.Vector3(
          o[0] + v[0] * t,
          o[1] + v[1] * t,
          o[2] + v[2] * t
        ),

        end: new THREE.Vector3(
          o[0] + u[0] + v[0] * t,
          o[1] + u[1] + v[1] * t,
          o[2] + u[2] + v[2] * t
        ),

        phase: Math.random() * Math.PI * 2
      });

      gridLines.push({
        start: new THREE.Vector3(
          o[0] + u[0] * t,
          o[1] + u[1] * t,
          o[2] + u[2] * t
        ),

        end: new THREE.Vector3(
          o[0] + u[0] * t + v[0],
          o[1] + u[1] * t + v[1],
          o[2] + u[2] * t + v[2]
        ),

        phase: Math.random() * Math.PI * 2
      });
    }
  });

  const TOTAL_GRID_VERTS =
    gridLines.length * SEGMENTS_PER_LINE * 2;

  const gridPos =
    new Float32Array(TOTAL_GRID_VERTS * 3);

  const gridT =
    new Float32Array(TOTAL_GRID_VERTS);

  const gridPhase =
    new Float32Array(TOTAL_GRID_VERTS);

  const gridCenter =
    new Float32Array(TOTAL_GRID_VERTS * 3);

  let vi = 0;

  gridLines.forEach(({ start, end, phase }) => {
    const mid = start
      .clone()
      .add(end)
      .multiplyScalar(0.5);

    for (let s = 0; s < SEGMENTS_PER_LINE; s++) {
      const t0 = s / SEGMENTS_PER_LINE;
      const t1 = (s + 1) / SEGMENTS_PER_LINE;

      const p0 = start.clone().lerp(end, t0);
      const p1 = start.clone().lerp(end, t1);

      gridPos[vi * 3] = p0.x;
      gridPos[vi * 3 + 1] = p0.y;
      gridPos[vi * 3 + 2] = p0.z;

      gridT[vi] = t0;
      gridPhase[vi] = phase;

      gridCenter[vi * 3] = mid.x;
      gridCenter[vi * 3 + 1] = mid.y;
      gridCenter[vi * 3 + 2] = mid.z;

      vi++;

      gridPos[vi * 3] = p1.x;
      gridPos[vi * 3 + 1] = p1.y;
      gridPos[vi * 3 + 2] = p1.z;

      gridT[vi] = t1;
      gridPhase[vi] = phase;

      gridCenter[vi * 3] = mid.x;
      gridCenter[vi * 3 + 1] = mid.y;
      gridCenter[vi * 3 + 2] = mid.z;

      vi++;
    }
  });

  const gridGeo = new THREE.BufferGeometry();

  gridGeo.setAttribute(
    'position',
    new THREE.BufferAttribute(gridPos, 3)
  );

  gridGeo.setAttribute(
    'lineT',
    new THREE.BufferAttribute(gridT, 1)
  );

  gridGeo.setAttribute(
    'linePhase',
    new THREE.BufferAttribute(gridPhase, 1)
  );

  gridGeo.setAttribute(
    'lineCenter',
    new THREE.BufferAttribute(gridCenter, 3)
  );


  const gridMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },

      lightPos: {
        value: new THREE.Vector3(2, 2, 2)
      },

      color: {
        value: new THREE.Color(
          168 / 255,
          168 / 255,
          232 / 255
        )
      }
    },

    vertexShader: `
      attribute float lineT;
      attribute float linePhase;
      attribute vec3 lineCenter;

      uniform float time;
      uniform vec3 lightPos;

      varying float vAlpha;

      void main() {
        float dist = length(lightPos - lineCenter);

        float lightInfluence =
          1.0 - smoothstep(0.0, 3.0, dist);

        float pulse =
          sin(time * 1.2 + linePhase);

        float pulsed =
          smoothstep(-0.5, 1.0, pulse);

        float speed =
          0.5 + 0.3 * sin(linePhase);

        float progress =
          fract(
            time * speed * 0.25 +
            linePhase * 0.5
          );

        float bandWidth = 0.4;

        float swept =
          smoothstep(
            progress - bandWidth,
            progress,
            lineT
          )
          *
          (
            1.0 -
            smoothstep(
              progress,
              progress + 0.08,
              lineT
            )
          );

        float base =
          pulsed * 0.3;

        float sweep =
          swept * 0.8;

        float light =
          lightInfluence * 0.5;

        vAlpha =
          clamp(
            base + sweep + light,
            0.0,
            1.0
          );

        gl_Position =
          projectionMatrix *
          modelViewMatrix *
          vec4(position, 1.0);
      }
    `,

    fragmentShader: `
      uniform vec3 color;
      varying float vAlpha;

      void main() {
        gl_FragColor =
          vec4(color, vAlpha);
      }
    `,

    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });


  // --- Particles along edges ---
  const PARTICLES_PER_EDGE = 20;
  const TOTAL_PARTICLES =
    edgeIndices.length * PARTICLES_PER_EDGE;

  const pPositions =
    new Float32Array(TOTAL_PARTICLES * 3);

  const pPhases =
    new Float32Array(TOTAL_PARTICLES);

  const pEdgePhases =
    new Float32Array(TOTAL_PARTICLES);

  let idx = 0;

  edgeIndices.forEach(([a, b], edgeIdx) => {
    const edgePhase =
      allPhases[edgeIdx * 2];

    const start =
      new THREE.Vector3(...corners[a]);

    const end =
      new THREE.Vector3(...corners[b]);

    for (
      let i = 0;
      i < PARTICLES_PER_EDGE;
      i++
    ) {
      const t = Math.random();

      const pos =
        start.clone().lerp(end, t);

      pPositions[idx * 3] = pos.x;
      pPositions[idx * 3 + 1] = pos.y;
      pPositions[idx * 3 + 2] = pos.z;

      pPhases[idx] =
        Math.random() * Math.PI * 2;

      pEdgePhases[idx] =
        edgePhase;

      idx++;
    }
  });

  const particleGeo =
    new THREE.BufferGeometry();

  particleGeo.setAttribute(
    'position',
    new THREE.BufferAttribute(
      pPositions,
      3
    )
  );

  particleGeo.setAttribute(
    'phase',
    new THREE.BufferAttribute(
      pPhases,
      1
    )
  );

  particleGeo.setAttribute(
    'edgePhase',
    new THREE.BufferAttribute(
      pEdgePhases,
      1
    )
  );

  const particleMaterial =
    new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },

        color: {
          value: new THREE.Color(
            168 / 255,
            168 / 255,
            232 / 255
          )
        }
      },

      vertexShader: `
        attribute float phase;
        attribute float edgePhase;

        uniform float time;

        varying float vAlpha;

        void main() {
          float edgePulse =
            smoothstep(
              -0.2,
              0.8,
              sin(
                time * 1.2 +
                edgePhase
              )
            );

          float flicker =
            0.3 +
            0.7 *
            abs(
              sin(
                time * 2.0 +
                phase
              )
            );

          vAlpha =
            edgePulse *
            flicker;

          vec3 pos =
            position;

          pos.x +=
            sin(phase * 3.7) *
            0.04;

          pos.y +=
            cos(phase * 2.3) *
            0.04;

          pos.z +=
            sin(phase * 5.1) *
            0.04;

          vec4 mvPosition =
            modelViewMatrix *
            vec4(pos, 1.0);

          gl_PointSize =
            (
              2.0 +
              1.0 *
              abs(
                sin(
                  time * 1.5 +
                  phase
                )
              )
            )
            *
            (
              200.0 /
              -mvPosition.z
            );

          gl_Position =
            projectionMatrix *
            mvPosition;
        }
      `,

      fragmentShader: `
        uniform vec3 color;
        varying float vAlpha;

        void main() {
          vec2 uv =
            gl_PointCoord -
            vec2(0.5);

          float dist =
            length(uv);

          if (dist > 0.5)
            discard;

          float glow =
            1.0 -
            smoothstep(
              0.0,
              0.5,
              dist
            );

          gl_FragColor =
            vec4(
              color,
              vAlpha * glow
            );
        }
      `,

      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });


  // --- Inner mini cube ---
  const MINI_SIZE = 0.6;
  const MH = MINI_SIZE / 2;

  const miniCorners: [number, number, number][] = [
    [-MH, -MH, -MH],
    [ MH, -MH, -MH],
    [ MH,  MH, -MH],
    [-MH,  MH, -MH],
    [-MH, -MH,  MH],
    [ MH, -MH,  MH],
    [ MH,  MH,  MH],
    [-MH,  MH,  MH],
  ];

  const miniAllPositions: number[] = [];
  const miniAllPhases: number[] = [];

  edgeIndices.forEach(([a, b]) => {
    const phase =
      Math.random() * Math.PI * 2;

    miniAllPositions.push(
      ...miniCorners[a],
      ...miniCorners[b]
    );

    miniAllPhases.push(
      phase,
      phase
    );
  });

  const miniEdgeGeo =
    new THREE.BufferGeometry();

  miniEdgeGeo.setAttribute(
    'position',
    new THREE.BufferAttribute(
      new Float32Array(
        miniAllPositions
      ),
      3
    )
  );

  miniEdgeGeo.setAttribute(
    'phase',
    new THREE.BufferAttribute(
      new Float32Array(
        miniAllPhases
      ),
      1
    )
  );

  const miniEdgeMaterial =
    new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },

        color: {
          value: new THREE.Color(
            0.0,
            1.0,
            0.4
          )
        }
      },

      vertexShader: `
        attribute float phase;
        uniform float time;

        varying float vAlpha;

        void main() {
          float pulse =
            sin(
              time * 1.6 +
              phase
            );

          vAlpha =
            smoothstep(
              -0.2,
              0.8,
              pulse
            );

          gl_Position =
            projectionMatrix *
            modelViewMatrix *
            vec4(
              position,
              1.0
            );
        }
      `,

      fragmentShader: `
        uniform vec3 color;
        varying float vAlpha;

        void main() {
          gl_FragColor =
            vec4(
              color,
              vAlpha
            );
        }
      `,

      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });


  // --- Mini cube inner grid ---
  const MINI_GRID_DIVISIONS = 3;
  const MINI_SEGMENTS_PER_LINE = 16;

  const miniFaces = [
    {
      o: [-MH, -MH, -MH],
      u: [MINI_SIZE, 0, 0],
      v: [0, MINI_SIZE, 0]
    },
    {
      o: [-MH, -MH, MH],
      u: [MINI_SIZE, 0, 0],
      v: [0, MINI_SIZE, 0]
    },
    {
      o: [-MH, -MH, -MH],
      u: [0, 0, MINI_SIZE],
      v: [0, MINI_SIZE, 0]
    },
    {
      o: [MH, -MH, -MH],
      u: [0, 0, MINI_SIZE],
      v: [0, MINI_SIZE, 0]
    },
    {
      o: [-MH, -MH, -MH],
      u: [MINI_SIZE, 0, 0],
      v: [0, 0, MINI_SIZE]
    },
    {
      o: [-MH, MH, -MH],
      u: [MINI_SIZE, 0, 0],
      v: [0, 0, MINI_SIZE]
    },
  ];

  const miniGridLines: GridLine[] = [];

  miniFaces.forEach(({ o, u, v }) => {
    for (
      let i = 1;
      i < MINI_GRID_DIVISIONS;
      i++
    ) {
      const t =
        i / MINI_GRID_DIVISIONS;

      miniGridLines.push({
        start: new THREE.Vector3(
          o[0] + v[0] * t,
          o[1] + v[1] * t,
          o[2] + v[2] * t
        ),

        end: new THREE.Vector3(
          o[0] + u[0] + v[0] * t,
          o[1] + u[1] + v[1] * t,
          o[2] + u[2] + v[2] * t
        ),

        phase:
          Math.random() *
          Math.PI *
          2
      });

      miniGridLines.push({
        start: new THREE.Vector3(
          o[0] + u[0] * t,
          o[1] + u[1] * t,
          o[2] + u[2] * t
        ),

        end: new THREE.Vector3(
          o[0] +
            u[0] * t +
            v[0],
          o[1] +
            u[1] * t +
            v[1],
          o[2] +
            u[2] * t +
            v[2]
        ),

        phase:
          Math.random() *
          Math.PI *
          2
      });
    }
  });

  const MINI_TOTAL_VERTS =
    miniGridLines.length *
    MINI_SEGMENTS_PER_LINE *
    2;

  const miniGridPos =
    new Float32Array(
      MINI_TOTAL_VERTS * 3
    );

  const miniGridT =
    new Float32Array(
      MINI_TOTAL_VERTS
    );

  const miniGridPhase =
    new Float32Array(
      MINI_TOTAL_VERTS
    );

  const miniGridCenter =
    new Float32Array(
      MINI_TOTAL_VERTS * 3
    );

  let mvi = 0;

  miniGridLines.forEach(
    ({ start, end, phase }) => {
      const mid =
        start
          .clone()
          .add(end)
          .multiplyScalar(0.5);

      for (
        let s = 0;
        s < MINI_SEGMENTS_PER_LINE;
        s++
      ) {
        const t0 =
          s /
          MINI_SEGMENTS_PER_LINE;

        const t1 =
          (s + 1) /
          MINI_SEGMENTS_PER_LINE;

        const p0 =
          start.clone().lerp(
            end,
            t0
          );

        const p1 =
          start.clone().lerp(
            end,
            t1
          );

        miniGridPos[mvi * 3] =
          p0.x;

        miniGridPos[mvi * 3 + 1] =
          p0.y;

        miniGridPos[mvi * 3 + 2] =
          p0.z;

        miniGridT[mvi] =
          t0;

        miniGridPhase[mvi] =
          phase;

        miniGridCenter[mvi * 3] =
          mid.x;

        miniGridCenter[mvi * 3 + 1] =
          mid.y;

        miniGridCenter[mvi * 3 + 2] =
          mid.z;

        mvi++;

        miniGridPos[mvi * 3] =
          p1.x;

        miniGridPos[mvi * 3 + 1] =
          p1.y;

        miniGridPos[mvi * 3 + 2] =
          p1.z;

        miniGridT[mvi] =
          t1;

        miniGridPhase[mvi] =
          phase;

        miniGridCenter[mvi * 3] =
          mid.x;

        miniGridCenter[mvi * 3 + 1] =
          mid.y;

        miniGridCenter[mvi * 3 + 2] =
          mid.z;

        mvi++;
      }
    }
  );

  const miniGridGeo =
    new THREE.BufferGeometry();

  miniGridGeo.setAttribute(
    'position',
    new THREE.BufferAttribute(
      miniGridPos,
      3
    )
  );

  miniGridGeo.setAttribute(
    'lineT',
    new THREE.BufferAttribute(
      miniGridT,
      1
    )
  );

  miniGridGeo.setAttribute(
    'linePhase',
    new THREE.BufferAttribute(
      miniGridPhase,
      1
    )
  );

  miniGridGeo.setAttribute(
    'lineCenter',
    new THREE.BufferAttribute(
      miniGridCenter,
      3
    )
  );

  const miniGridMaterial =
    new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },

        lightPos: {
          value:
            new THREE.Vector3(
              2,
              2,
              2
            )
        },

        color: {
          value:
            new THREE.Color(
              0.0,
              1.0,
              0.4
            )
        }
      },

      vertexShader: `
        attribute float lineT;
        attribute float linePhase;
        attribute vec3 lineCenter;

        uniform float time;
        uniform vec3 lightPos;

        varying float vAlpha;

        void main() {
          float dist =
            length(
              lightPos -
              lineCenter
            );

          float lightInfluence =
            1.0 -
            smoothstep(
              0.0,
              2.0,
              dist
            );

          float pulse =
            sin(
              time * 1.6 +
              linePhase
            );

          float pulsed =
            smoothstep(
              -0.5,
              1.0,
              pulse
            );

          float speed =
            0.6 +
            0.3 *
            sin(linePhase);

          float progress =
            fract(
              time *
              speed *
              0.3 +
              linePhase *
              0.5
            );

          float bandWidth =
            0.4;

          float swept =
            smoothstep(
              progress -
                bandWidth,
              progress,
              lineT
            )
            *
            (
              1.0 -
              smoothstep(
                progress,
                progress + 0.08,
                lineT
              )
            );

          float base =
            pulsed * 0.3;

          float sweep =
            swept * 0.8;

          float light =
            lightInfluence * 0.5;

          vAlpha =
            clamp(
              base +
              sweep +
              light,
              0.0,
              1.0
            );

          gl_Position =
            projectionMatrix *
            modelViewMatrix *
            vec4(
              position,
              1.0
            );
        }
      `,

      fragmentShader: `
        uniform vec3 color;
        varying float vAlpha;

        void main() {
          gl_FragColor =
            vec4(
              color,
              vAlpha
            );
        }
      `,

      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });


  // --- Mini cube particles ---
  const MINI_PARTICLES_PER_EDGE = 15;

  const MINI_TOTAL_PARTICLES =
    edgeIndices.length *
    MINI_PARTICLES_PER_EDGE;

  const mpPositions =
    new Float32Array(
      MINI_TOTAL_PARTICLES * 3
    );

  const mpPhases =
    new Float32Array(
      MINI_TOTAL_PARTICLES
    );

  const mpEdgePhases =
    new Float32Array(
      MINI_TOTAL_PARTICLES
    );

  let midx = 0;

  edgeIndices.forEach(
    ([a, b], edgeIdx) => {
      const edgePhase =
        miniAllPhases[
          edgeIdx * 2
        ];

      const start =
        new THREE.Vector3(
          ...miniCorners[a]
        );

      const end =
        new THREE.Vector3(
          ...miniCorners[b]
        );

      for (
        let i = 0;
        i < MINI_PARTICLES_PER_EDGE;
        i++
      ) {
        const t =
          Math.random();

        const pos =
          start
            .clone()
            .lerp(end, t);

        mpPositions[midx * 3] =
          pos.x;

        mpPositions[midx * 3 + 1] =
          pos.y;

        mpPositions[midx * 3 + 2] =
          pos.z;

        mpPhases[midx] =
          Math.random() *
          Math.PI *
          2;

        mpEdgePhases[midx] =
          edgePhase;

        midx++;
      }
    }
  );

  const miniParticleGeo =
    new THREE.BufferGeometry();

  miniParticleGeo.setAttribute(
    'position',
    new THREE.BufferAttribute(
      mpPositions,
      3
    )
  );

  miniParticleGeo.setAttribute(
    'phase',
    new THREE.BufferAttribute(
      mpPhases,
      1
    )
  );

  miniParticleGeo.setAttribute(
    'edgePhase',
    new THREE.BufferAttribute(
      mpEdgePhases,
      1
    )
  );

  const miniParticleMaterial =
    new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },

        color: {
          value:
            new THREE.Color(
              0.0,
              1.0,
              0.4
            )
        }
      },

      vertexShader: `
        attribute float phase;
        attribute float edgePhase;

        uniform float time;

        varying float vAlpha;

        void main() {
          float edgePulse =
            smoothstep(
              -0.2,
              0.8,
              sin(
                time * 1.6 +
                edgePhase
              )
            );

          float flicker =
            0.3 +
            0.7 *
            abs(
              sin(
                time * 2.5 +
                phase
              )
            );

          vAlpha =
            edgePulse *
            flicker;

          vec3 pos =
            position;

          pos.x +=
            sin(phase * 3.7) *
            0.02;

          pos.y +=
            cos(phase * 2.3) *
            0.02;

          pos.z +=
            sin(phase * 5.1) *
            0.02;

          vec4 mvPosition =
            modelViewMatrix *
            vec4(pos, 1.0);

          gl_PointSize =
            (
              1.5 +
              0.5 *
              abs(
                sin(
                  time * 1.5 +
                  phase
                )
              )
            )
            *
            (
              200.0 /
              -mvPosition.z
            );

          gl_Position =
            projectionMatrix *
            mvPosition;
        }
      `,

      fragmentShader: `
        uniform vec3 color;
        varying float vAlpha;

        void main() {
          vec2 uv =
            gl_PointCoord -
            vec2(0.5);

          float dist =
            length(uv);

          if (dist > 0.5)
            discard;

          float glow =
            1.0 -
            smoothstep(
              0.0,
              0.5,
              dist
            );

          gl_FragColor =
            vec4(
              color,
              vAlpha * glow
            );
        }
      `,

      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });


  // --- Mouse interaction + animation ---
  const lightPos =
    new THREE.Vector3();

  let cubeRef =
    $state<THREE.Group | undefined>(undefined);

  let time = 0;

  // Mouse position
  let mouseX = 0;
  let mouseY = 0;

  // Target rotation caused by mouse
  let targetRotationX = 0;
  let targetRotationY = 0;

  // Maximum mouse influence
  const MAX_ROTATION_X = 0.25;
  const MAX_ROTATION_Y = 0.45;

  function handleMouseMove(
    event: MouseEvent
  ) {
    mouseX =
      (event.clientX /
        window.innerWidth) *
        2 -
      1;

    mouseY =
      (event.clientY /
        window.innerHeight) *
        2 -
      1;

    targetRotationY =
      mouseX *
      MAX_ROTATION_Y;

    targetRotationX =
      -mouseY *
      MAX_ROTATION_X;
  }

  function handleMouseLeave() {
    targetRotationX = 0;
    targetRotationY = 0;
  }

  onMount(() => {
    window.addEventListener(
      'mousemove',
      handleMouseMove
    );

    window.addEventListener(
      'mouseleave',
      handleMouseLeave
    );

    return () => {
      window.removeEventListener(
        'mousemove',
        handleMouseMove
      );

      window.removeEventListener(
        'mouseleave',
        handleMouseLeave
      );
    };
  });


  // --- Animation loop ---
  useTask((delta) => {
    time += delta;

    // Orbiting light
    lightPos.set(
      Math.sin(time * 0.7) * 2.5,
      Math.sin(time * 0.4) * 1.5,
      Math.cos(time * 0.7) * 2.5
    );

    if (cubeRef) {
      // Subtle autonomous rotation
      const idleY =
        time * 0.35;

      const idleX =
        Math.sin(
          time * 0.25
        ) * 0.12;

      // Combine idle rotation
      // with mouse influence
      const desiredY =
        idleY +
        targetRotationY;

      const desiredX =
        idleX +
        targetRotationX;

      // Smoothly interpolate
      // toward desired rotation
      cubeRef.rotation.y +=
        (
          desiredY -
          cubeRef.rotation.y
        ) *
        delta *
        4;

      cubeRef.rotation.x +=
        (
          desiredX -
          cubeRef.rotation.x
        ) *
        delta *
        4;

      const localLight =
        lightPos.clone();

      cubeRef.worldToLocal(
        localLight
      );

      gridMaterial.uniforms.lightPos.value.copy(
        localLight
      );

      miniGridMaterial.uniforms.lightPos.value.copy(
        localLight
      );
    }

    // Shader animation
    edgeMaterial.uniforms.time.value =
      time;

    particleMaterial.uniforms.time.value =
      time;

    gridMaterial.uniforms.time.value =
      time;

    miniEdgeMaterial.uniforms.time.value =
      time;

    miniGridMaterial.uniforms.time.value =
      time;

    miniParticleMaterial.uniforms.time.value =
      time;
  });
</script>


<T.PerspectiveCamera
  makeDefault
  position={[0, 0, 1]}
  fov={40}
/>


<T.AmbientLight
  intensity={0.1}
/>


<T.Group bind:ref={cubeRef}>

  <!-- Outer cube -->
  <T.LineSegments
    geometry={gridGeo}
    material={gridMaterial}
  />

  <T.LineSegments
    geometry={edgeGeo}
    material={edgeMaterial}
  />

  <T.Points
    geometry={particleGeo}
    material={particleMaterial}
  />


  <!-- Inner mini cube -->
  <!-- <T.LineSegments
    geometry={miniEdgeGeo}
    material={miniEdgeMaterial}
  />

  <T.LineSegments
    geometry={miniGridGeo}
    material={miniGridMaterial}
  />

  <T.Points
    geometry={miniParticleGeo}
    material={miniParticleMaterial}
  /> -->

</T.Group>