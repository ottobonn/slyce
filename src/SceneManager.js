import * as THREE from 'three';
import {EffectComposer, RenderPass} from 'postprocessing';
import OrbitControls from 'three-orbitcontrols';
import {OBJLoader} from 'three-obj-mtl-loader';

class SceneManager {
  constructor({canvas}) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    const context = canvas.getContext('webgl2');
    const renderer = new THREE.WebGLRenderer({
      canvas,
      context,
      antialias: true,
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.soft = true;

    const composer = new EffectComposer(renderer);

    const passes = [
      new RenderPass(scene, camera),
    ];

    passes[passes.length - 1].renderToScreen = true;
    passes.map(composer.addPass.bind(composer));

    this.composer = composer;
    this.clock = new THREE.Clock();
    this.canvas = canvas;
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    const coneAngle = Math.PI / 2;

    controls.minPolarAngle = Math.PI / 2 - coneAngle;
    controls.maxPolarAngle = Math.PI / 2 + coneAngle;

    controls.maxDistance = 500;
    controls.zoomSpeed = 0.3;
    controls.enablePan = false;
    this.controls = controls;

    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.4);
    directionalLight.position.set(30, 30, 50);
    directionalLight.castShadow = true;
    directionalLight.shadowCameraVisible = true;

    directionalLight.shadow.camera.left = -250;
    directionalLight.shadow.camera.right = 250;
    directionalLight.shadow.camera.top = 250;
    directionalLight.shadow.camera.bottom = -250;

    directionalLight.shadow.camera.near = 20;
    directionalLight.shadow.camera.far = 200;

    scene.add(directionalLight);

    const light = new THREE.PointLight(0xffffff, 0.1);
    camera.add(light);
    scene.add(camera);

    // Zoom to fit
    this.camera.position.z = 10; // (Math.max(boardWidth, boardHeight) / 2) / Math.tan(THREE.Math.degToRad(this.camera.fov / 2));

    this.go();
  }

  async go() {
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      wireframe: true,
      color: 'red',
    });

    // TODO on model uploaded...
    const rawModel = await this.load();

    const modelGeometry = new THREE.Geometry();
    rawModel.children.forEach(child => {
      modelGeometry.merge(new THREE.Geometry().fromBufferGeometry(child.geometry));
    });

    const slicedBSPs = [];

    const slicerGeometries = this.createSlicers();
    // const combinedGeometry = new THREE.Geometry();
    // slicerGeometries.forEach(slicerGeometry => combinedGeometry.merge(slicerGeometry));

    console.log(slicerGeometries)

    // const slicerMesh = new THREE.Mesh(combinedGeometry, wireframeMaterial);
    // this.scene.add(slicerMesh);

    // const slicerBSP = new window.ThreeBSP(slicerMesh.geometry);
    const slicerBSPs = slicerGeometries.map(slicerGeometry => new window.ThreeBSP(slicerGeometry));
    slicerBSPs.forEach(slicerBSP => {
      const modelBSP = new window.ThreeBSP(modelGeometry);
      const slicedBSP = modelBSP.intersect(slicerBSP);
      slicedBSPs.push(slicedBSP);
      const mesh = slicedBSP.toMesh(wireframeMaterial);
      this.scene.add(mesh);
      console.log(mesh)
    });
  }

  async load() {
    const loader = new OBJLoader();
    const model = await new Promise(resolve => loader.load('/assets/monkey.obj', resolve));
    return model;
  }

  createSlicers() {
    const minT = -1; // TODO find model bounds
    const maxT = 3;
    const sliceThickness = 0.01;
    const numSlices = 5;

    const stackOrigin = new THREE.Vector3(0, 0, 0);
    const stackDirection = new THREE.Vector3(0, 1, 0).normalize();

    const slicerGeometries = [];

    for (let i = 0; i < numSlices; i++) {
      const t = (i / (numSlices - 1)) * (maxT - minT) + minT;
      const displacement = new THREE.Vector3().copy(stackDirection).multiplyScalar(t);
      const slicerCenter = new THREE.Vector3().copy(stackOrigin).add(displacement);
      const geometry = new THREE.BoxGeometry(10, sliceThickness, 10);
      // const geometry = new THREE.PlaneGeometry(10, 10, 1, 1);
      // geometry.rotateX(90);
      geometry.translate(slicerCenter.x, slicerCenter.y, slicerCenter.z);
      slicerGeometries.push(geometry);
    }

    return slicerGeometries;
  }

  animate(params) {
    this.controls.update();

    const {width, height} = params;
    if (width !== this.lastWidth || height !== this.lastHeight) {
      this.composer.setSize(width, height);
      this.renderer.setSize(width, height);

      this.camera.aspect = width / height;

      this.camera.updateProjectionMatrix();
      this.lastWidth = width;
      this.lastHeight = height;
    }

    this.composer.render(this.scene, this.camera);
  }
}

export {SceneManager};
