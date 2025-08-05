import type { Root } from 'parchment'
import type { BlockEmbed as TypeBlockEmbed } from 'quill/blots/block'
import type FluentEditor from '../../../core/fluent-editor'
import LogicFlow from '@logicflow/core'
import { Control, DndPanel, Menu, SelectionSelect } from '@logicflow/extension'
import Quill from 'quill'
import { createControlPanel } from '../modules/control-panel'
import '../style/flowchart.scss'

const BlockEmbed = Quill.import('blots/embed') as typeof TypeBlockEmbed

// 定义 flowchart-placeholder blot
class FlowchartBlot extends BlockEmbed {
  static blotName = 'flowchart'
  static tagName = 'div'
  static className = 'ql-flow-chart'
  flowChart: LogicFlow | null = null
  data: any

  constructor(scroll: Root, domNode: HTMLElement) {
    super(scroll, domNode)
    this.domNode.classList.add('ql-flow-chart-container')
    this.domNode.style.height = '500px'
    this.domNode.style.border = '1px solid #e8e8e8'
    this.domNode.style.margin = '10px 0'
    this.data = FlowchartBlot.value(this.domNode)
    this.initLogicFlow()
  }

  static value(domNode: HTMLElement): any {
    const dataStr = JSON.parse(domNode.getAttribute('data-flow-chart') || '{}')
    return dataStr.root ? dataStr.root : dataStr
  }

  static create(value: any): HTMLElement {
    const node = super.create() as HTMLElement
    if (value) {
      node.setAttribute('data-flow-chart', JSON.stringify(value))
    }
    return node
  }

  private initLogicFlow(): void {
    if (this.domNode.isConnected) {
      this.insertLogicFlowInstance()
    }
    else {
      const observer = new MutationObserver(() => {
        if (this.domNode.isConnected) {
          this.insertLogicFlowInstance()
          observer.disconnect()
        }
      })
      observer.observe(document.body, { childList: true, subtree: true })
    }
  }

  private insertLogicFlowInstance(): void {
    this.domNode.style.width = '100%'
    this.domNode.style.height = '100%'
    this.flowChart = new LogicFlow({
      container: this.domNode,
      stopScrollGraph: true,
      stopZoomGraph: true,
      allowResize: true,
      allowRotate: true,
      editable: true,
      height: 500,
      grid: {
        type: 'dot',
        size: 20,
      },
      plugins: [DndPanel, SelectionSelect, Control, Menu],
    })
    const self = this
    this.flowChart.addMenuConfig({
      nodeMenu: [
        {
          text: '删除文本',
          callback(node: any) {
            self.flowChart?.updateText(node.id, '')
          },
        },
      ],
      edgeMenu: [
        {
          text: '删除文本',
          callback(node: any) {
            self.flowChart?.updateText(node.id, '')
          },
        },
      ],
    })
    const quill = this.scroll as unknown as FluentEditor
    createControlPanel(this, quill)
    let timer: any = null
    let content = ''
    let id = ''
    this.flowChart.render(this.data)
    this.flowChart.on('node:dbclick', (data: any) => {
      id = data.data.id
      timer = setInterval(() => {
        const textInputElement = document.querySelector('.lf-text-input')
        if (textInputElement) {
          content = textInputElement.textContent || ''
        }
      }, 100)
    })
    this.flowChart.on('edge:dbclick', (data: any) => {
      id = data.data.id
      timer = setInterval(() => {
        const textInputElement = document.querySelector('.lf-text-input')
        if (textInputElement) {
          content = textInputElement.textContent || ''
        }
      }, 100)
    })

    this.flowChart.on('blank:mousedown', () => {
      timer && clearInterval(timer)
      this.flowChart?.updateText(id, content)
      content = ''
      id = ''
    })

    this.flowChart.on('graph:updated', () => {
      if (this.flowChart) {
        this.data = this.flowChart.getGraphData()
        this.domNode.setAttribute('data-flow-chart', JSON.stringify(this.data))
        this.scroll.update([], {})
      }
    })
  }
}

export default FlowchartBlot
