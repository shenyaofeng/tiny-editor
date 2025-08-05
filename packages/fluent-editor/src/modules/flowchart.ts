import type { Root } from 'parchment'
import type { BlockEmbed as TypeBlockEmbed } from 'quill/blots/block'
import LogicFlow from '@logicflow/core'
import { Control, DndPanel, Menu, SelectionSelect } from '@logicflow/extension'
import Quill from 'quill'
import './flowChart.scss'
import '@logicflow/core/lib/style/index.css'
import '@logicflow/extension/lib/style/index.css'

const BlockEmbed = Quill.import('blots/embed') as typeof TypeBlockEmbed
// 定义 flowchart-placeholder blot
class FlowchartBlot extends BlockEmbed {
  static blotName = 'flowchart'
  static tagName = 'div'
  static className = 'ql-flow-chart'
  private flowChart: LogicFlow | null = null
  private data: any

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
    const dataStr = JSON.parse(domNode.getAttribute('data-flow-chart'))
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
            self.flowChart.updateText(node.id, '')
          },
        },
      ],
      edgeMenu: [
        {
          text: '删除文本',
          callback(node: any) {
            self.flowChart.updateText(node.id, '')
          },
        },
      ],
    });
    (this.flowChart.extension.dndPanel as any).setPatternItems([
      {
        label: '选区',
        icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAASVJREFUOE+1VFEOgjAMpQvcA/9IGGeQo+hJjCdRb6JngCX8yT0gVN5CyUQJzCA/28r62tfXjoKNPwJekiRxGIYx9m3b1lVV1WJbOrs+2FvANE0vQRDkRFT3tnNZlnet9Qm2pTMzx0qpc1EU1zdApdRDjD5VQDKu75jhpoBZlh2YuQZVn+xwd+prM9zys4Ba61zU9AWf+v6nhlOlfLL8qjLSBoiPKEOfPiS4+P4sSg/I6AxjzM5lZAEhfdM0d4zcGrrDWD5nAdfWEDQxakSEuc8B2K+2d4noBtpeKoPmHIM+0NUYcxwBERURJRLK0HXdXs7yKkVRZAVkZjwoyOyIVUo2NvZAY/wB5WH7VtvFGq4Rwr3jAFqaHyr7Agp9rNPO+LkP55J4AUBcASTXtDeAAAAAAElFTkSuQmCC',
        callback: () => {
          (this.flowChart.extension.selectionSelect as any).openSelectionSelect()
          this.flowChart.once('selection:selected', () => {
            (this.flowChart.extension.selectionSelect as any).closeSelectionSelect()
          })
        },
      },
      {
        type: 'rect',
        text: '矩形',
        label: '矩形',
        icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAHNJREFUOE9jZKAyYKSyeQxgAzU0NBRYWFgUKDX8ypUrB8AG6ujo7P///z/ZBjIyMoL0Hrhy5Yoj3ECoQCM5rtTR0akH6ncYNRAcqKNhSFwiGk02kLxM9axH7cLBgbj4xK3qz58/D27cuPGANgUspa5D1g8A3buIFT4kLMIAAAAASUVORK5CYII=',
      },
      {
        type: 'circle',
        text: '圆形',
        label: '圆形',
        icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAVZJREFUOE+tlFGugjAQRTvAQvCPhLIGdSXiStSV4FuJsAbahD9dSEPtNS0pvOLrS+CHUKZn7kxvh9jGD23MY6tAzvmBMbZnjOF90Fq/bPKWiH6EEG1ITBDIOb+Y4KvW+k5EAHXYTET5OI57s1bjvxDitoT+AnLOHwaUE9F5TUVRFHmapg/ApJQ7HzoDlmXZoLxlUKg0D9pKKc8uZgLaniHrcU3ZEgxolmVPf88EtOpQwpQtxgFoEeKEEMdPn92msiyfSZLc+r6/x4BcDA7QOKB2bfJL1kqp3TAMzh5RXLRKa93MgKFeRNEYY1VV1QAaC33E+QrRizbkrW9wCzyFetjAuO5HrMLlYc5sA+nfDL1MErLazNjLE/tLJZyBNgWNjc3+ldrk6jmocf8J3kL2JEk6TBql1AvrVvU1eji4Mq3aCw7KjjAGsPmG8bt/ja/QnY01/OYT+w3u97wVMeIzNwAAAABJRU5ErkJggg==',
      },
      {
        type: 'ellipse',
        text: '椭圆',
        label: '椭圆',
        icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAVxJREFUOE+tlFGOgyAQhgHxHGvfTMA72JPUnmTrSepN7J5BSHxrDwKZOgYMVrfibk2MROCbYeb/oeTDD/0wj0QB8zzPOOeZUuq2lcAq0AFOhJDSvRMHAB7Dv5u1tu77HsezZwGUUn4PKy64iRBSG2MefiMGStO0BICvAVxRShulVB0SZ0ApZQsAGaX0vHU8hCdJ0mJgrfXZQycgZoZRtdaHrTr5eQ8NMw2BQAg5bmX2GszV+26MOWBpRmBRFBUAnJRSx9jswnVYKqw3JjMChRBX/Ia12AN25cpw/wh0nSWvHYuFhgl5IErhuqchYTAhxJ0xVndd14xAX9i/NEVKieJvZ03xx0bZWGuPaw5YO/5b2QTNKWOFzTkfmxmqY+aUwMOXwTENY+wHveu16S8JlBiltEKLvrVe6ADO+XQ5IHRwQ4bzbrzw8MJ6v0kEs8K5f11fsfpbWxd1we4J8ARGasMVX8rnOgAAAABJRU5ErkJggg==',
      },
      {
        type: 'diamond',
        text: '菱形',
        label: '菱形',
        icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAjNJREFUOE+t1E2rElEYB/BnbkKCY9FnaHzBOSfaBIEiI1SroE2gGCqKuyAQIXAUTVoFLWx8QXCTXohA0KRNcGklhaC48cyIRNFCUsSP4MzUSF6uqTNyaZbnPM+PM3P+81Dwnx/qGI9lWR9FUSZCyJlRvSGIELoJAF0AoCiKco9Gox96qC7IcZxpuVx2E4nE3dVqBcVi8QshxHNpECH03u/3+zOZzNrIZrPQbrdPCSHhQ+jBE2KMX3k8nueVSmWrNxqNwmAweEEIye9D94Isyz612WylRqMBVqt1q282m0E4HIb5fB4mhJz+i+6ACKGHFovlY71eB4fDsffN+v0+xGIxbc9NCPl6sWgLxBhjVVW7giBc9/l8uglptVqQy+W+K4rikSRpvik+BxmGuWY2m7upVOpWMBg0itt6XxAEqNVqZ39O+WAHxBjf0PLG8zwbCASOAkulElSr1c+iKN7bAbUFl8t1++TkpFsul2mv16uLdjodSKfTP1erlXsymfzaC2qLGONHNE1/0G6YYZi96HA4hEgkAoqieCVJ0v6i82dvbBBCz+x2+xvtpmma3kIXiwWEQiGYTqdRSZLeGsZmU4AQes1xXLJYLG71xONx6PV6L0VRzB4d7E0hxrgZCAQe8zy/Xsrn89BsNt+Jovjk0AfWHQ4Mw1zVopRMJu/IsgyFQqH3dzjIlwK1JqfTaTeZTOvxJcuyezwef9O7fsN5qDUjhO6rqnpFFMVPRgE9CjRCLu7/BivoyhX8YXObAAAAAElFTkSuQmCC',
      },
    ])

    let timer = null
    let content = ''
    let id = ''
    this.flowChart.render(this.data)
    this.flowChart.on('node:dbclick', (data) => {
      id = data.data.id
      timer = setInterval(() => {
        const textInputElement = document.querySelector('.lf-text-input')
        if (textInputElement) {
          content = textInputElement.textContent || ''
        }
      }, 100)
    })
    this.flowChart.on('edge:dbclick', (data) => {
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
      this.flowChart.updateText(id, content)
      content = ''
      id = ''
    })

    this.flowChart.on('graph:updated', () => {
      this.data = this.flowChart.getGraphData()
      this.domNode.setAttribute('data-flow-chart', JSON.stringify(this.data))
      this.scroll.update([], {})
    })
  }
}

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
