import type Quill from 'quill'
import contractIcon from './icons/contractIcon.png'
import expandIcon from './icons/expandIcon.png'
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
      const data = this.quill.getLeaf(range.index) as any
      if (source === 'user') {
        document.querySelectorAll('.ql-flow-chart-control').forEach((el) => {
          (el as HTMLElement).style.display = 'none'
        })
        document.querySelectorAll('.lf-dndpanel').forEach((el) => {
          (el as HTMLElement).style.display = 'none'
        })
        document.querySelectorAll('.ql-flow-chart-control-panelStatus').forEach((el) => {
          (el as HTMLElement).style.backgroundImage = `url(${contractIcon})`
        })
        if (leaf?.flowChart) {
          let currentNode = leaf.domNode
          let flowChartContainer = null
          while (currentNode && !flowChartContainer) {
            if (currentNode.querySelector('.lf-dndpanel')
              && currentNode.querySelector('.ql-flow-chart-control')) {
              flowChartContainer = currentNode
            }
            else {
              currentNode = currentNode.parentNode
            }
          }

          if (flowChartContainer) {
            const leftUpControl = flowChartContainer.querySelector('.lf-dndpanel') as HTMLElement | null
            const control = flowChartContainer.querySelector('.ql-flow-chart-control') as HTMLElement | null
            const panelStatusIcon = flowChartContainer.querySelector('.ql-flow-chart-control-panelStatus') as HTMLElement | null

            if (data[1] == 0 || data[1] == 1) {
              if (leftUpControl) leftUpControl.style.display = 'block'
              if (control) control.style.display = 'flex'
            }
            else {
              if (leftUpControl) leftUpControl.style.display = 'block'
              if (control) control.style.display = 'flex'
              this.quill.blur()
            }

            if (panelStatusIcon) {
              panelStatusIcon.style.backgroundImage = `url(${expandIcon})`
            }
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
