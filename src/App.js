import React, {Component} from 'react';
import * as THREE from 'three';

import threeBSP from 'three-js-csg';

import {Canvas} from './Canvas';
import './App.css';

window.THREE = THREE;
const ThreeBSP = threeBSP(THREE);
window.ThreeBSP = ThreeBSP;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      width: 1,
      height: 1,
    }
    this.boundUpdateDimensions = this.updateDimensions.bind(this);
  }
  render() {
    return (
      <Canvas
        width={this.state.width}
        height={this.state.height}
      />
    );
  }
  updateDimensions() {
    this.setState({width: window.innerWidth, height: window.innerHeight});
  }
  componentDidMount(){
    this.updateDimensions();
    window.addEventListener("resize", () => this.boundUpdateDimensions);
  }
  componentWillUnmount() {
    window.removeEventListener("resize", this.boundUpdateDimensions);
  }
}

export default App;
