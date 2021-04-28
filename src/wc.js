import { createApp, h } from 'vue'
import wrapper from 'vue3-webcomponent-wrapper'
import CubeViewer from './components/CubeViewer.vue'
import './index.css'

const CubeViewerWC = wrapper(CubeViewer, createApp, h)
window.customElements.define('cube-viewer', CubeViewerWC)
