import Quill from 'quill'
import FlowchartBlot from './formats/flow-chart-blot'
import '@logicflow/core/lib/style/index.css'
import '@logicflow/extension/lib/style/index.css'

Quill.register(FlowchartBlot)

export class FlowchartModule {
  quill: Quill
  toolbar: any

  constructor(quill: Quill, options: any) {
    this.quill = quill
    this.toolbar = quill.getModule('toolbar')
    const domNode = document.querySelector('.ql-flow-chart')

    if (domNode) {
      domNode.addEventListener('click', () => {
        this.insertFlowChartEditor()
      })
    }
  }

  private insertFlowChartEditor(): void {
    const range = this.quill.getSelection()
    if (range) {
      const defaultData = {
        nodes: [
          { id: 'node1', type: 'rect', x: 100, y: 150, text: '开始' },
          { id: 'node2', type: 'rect', x: 300, y: 150, text: '结束' },
        ],
        edges: [
          { id: 'edge1', sourceNodeId: 'node1', targetNodeId: 'node2', type: 'polyline' },
        ],
      }
      this.quill.insertEmbed(range.index, 'flowchart', defaultData, 'user')
      this.quill.setSelection(range.index + 1, 0)
    }
  }
}

export default FlowchartModule
