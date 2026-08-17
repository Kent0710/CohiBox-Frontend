<script lang="ts">
  import { Canvas, T } from '@threlte/core';
  import * as THREE from 'three';
  import Model from './Model.svelte';

  const background = new THREE.Color(0x050510);
</script>

<Canvas>
  <T.Scene {background}>
    <Model />
  </T.Scene>
</Canvas>