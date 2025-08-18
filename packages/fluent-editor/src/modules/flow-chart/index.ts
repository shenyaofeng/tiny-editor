import type Quill from 'quill'
import './formats/flow-chart-blot'
import '@logicflow/core/lib/style/index.css'
import '@logicflow/extension/lib/style/index.css'

export class FlowChartModule {
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
    this.quill.on('selection-change', (range: any, oldRange: any, source: string) => {
      if (!range) return
      const leaf = this.quill.getLeaf(range.index)[0] as any
      if (source === 'user') {
        const dndpanel = document.querySelector('.lf-dndpanel') as HTMLElement | null
        const control = document.querySelector('.ql-flow-chart-control') as HTMLElement | null
        if (leaf?.flowChart) {
          dndpanel.style.display = 'block'
          control.style.display = 'flex'
          this.quill.blur()
        }
        else {
          if (dndpanel) {
            dndpanel.style.display = 'none'
          }
          if (control) {
            control.style.display = 'none'
          }
        }
      }
    })
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
