// 需要实际创建Quill实例时
import type Quill from 'quill'

import type { FlowChartOptions } from './options'
import Quills from 'quill'
import { fcBlot } from './formats/flow-chart-blot'

import '@logicflow/core/lib/style/index.css'
import '@logicflow/extension/lib/style/index.css'

export class FlowChartModule {
  quill: Quill
  toolbar: any
  options: FlowChartOptions
  currentQuill: Quill | null = null
  static currentOptions: FlowChartOptions = {}

  constructor(quill: Quill, options: any) {
    // FlowChartPlaceholderBlot.quill = quill
    // Quills.register(FlowChartPlaceholderBlot)
    const MyFlowChartBlot = fcBlot(quill)
    Quills.register(MyFlowChartBlot)
    console.warn(quill)
    this.quill = quill
    this.options = options
    // this.currentQuill = quill
    this.toolbar = quill.getModule('toolbar')
    const toolbarContainer = this.toolbar?.container
      || document.querySelector('.ql-toolbar')
    if (toolbarContainer) {
      toolbarContainer.addEventListener('click', (event) => {
        const target = event.target as HTMLElement
        const flowChartButton = target.closest('.ql-flow-chart')
        if (flowChartButton) {
          event.preventDefault()
          this.insertFlowChartEditor()
        }
      })
    }
  }

  public insertFlowChartEditor(): void {
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
      this.quill.insertText(range.index, '\n', 'user')
      this.quill.insertEmbed(range.index + 1, 'flow-chart-placeholder', defaultData, 'user')
      this.quill.insertText(range.index + 2, '\n', 'user')
    }
  }
}
