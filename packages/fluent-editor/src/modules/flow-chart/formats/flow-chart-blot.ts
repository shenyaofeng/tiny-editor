import type { Root } from 'parchment'
import type { BlockEmbed as TypeBlockEmbed } from 'quill/blots/block'
import type FluentEditor from '../../../core/fluent-editor'
import type { FlowChartOptions } from '../options'
import LogicFlow from '@logicflow/core'
import { DndPanel, SelectionSelect, Snapshot } from '@logicflow/extension'
import Quill from 'quill'
import circleIcon from '../icons/circleIcon.png'
import contractIcon from '../icons/contractIcon.png'
import diamondIcon from '../icons/diamondIcon.png'
import ellipseIcon from '../icons/ellipseIcon.png'
import expandIcon from '../icons/expandIcon.png'
import rectangleIcon from '../icons/rectangleIcon.png'
import selectRegionIcon from '../icons/selectRegionIcon.png'
import { FlowChartModule } from '../index'
import { initContextMenu } from '../modules/context-menu'
import { createControlPanel } from '../modules/control-panel'
import { FlowChartResizeAction } from '../modules/custom-resize-action'
import '../style/flow-chart.scss'

const BlockEmbed = Quill.import('blots/embed') as typeof TypeBlockEmbed
export function fcBlot(q) {
  console.warn(q)
  const quill = q
  return class FlowChartPlaceholderBlot extends BlockEmbed {
    static blotName = 'flow-chart-placeholder'
    static tagName = 'div'
    static className = 'ql-flow-chart'
    // static quill: Quill | null = null
    flowChart: LogicFlow | null = null
    data: any
    contextMenu: HTMLElement | null = null
    currentElement: any = null
    width: number = 100
    height: number = 500
    parentObserver: MutationObserver | null = null
    nextPObserver: MutationObserver | null = null
    flowChartOptions: Partial<FlowChartOptions> | null = null

    constructor(scroll: Root, domNode: HTMLElement) {
      super(scroll, domNode)
      const data = FlowChartPlaceholderBlot.value(domNode)
      this.width = data.width || 100
      this.height = data.height || 500
      this.domNode.style.width = `${this.width}${data.width ? 'px' : '%'}`
      this.domNode.style.height = `${this.height}px`
      this.domNode.style.maxWidth = '100%'
      this.domNode.style.border = '1px solid #e8e8e8'
      this.domNode.setAttribute('contenteditable', 'false')
      this.data = FlowChartPlaceholderBlot.value(this.domNode)
      // this.quill = FlowChartModule.currentQuill as FluentEditor
      // console.warn('this', FlowChartPlaceholderBlot.quill)
      this.initFlowChart()
    }

    static value(domNode: HTMLElement): any {
      const dataStr = JSON.parse(domNode.getAttribute('data-flow-chart'))
      const value = dataStr.root ? dataStr.root : dataStr
      if (domNode.hasAttribute('width')) {
        value.width = Number.parseInt(domNode.getAttribute('width'), 10)
      }
      if (domNode.hasAttribute('height')) {
        value.height = Number.parseInt(domNode.getAttribute('height'), 10)
      }

      return dataStr.root ? dataStr.root : dataStr
    }

    static create(value: any): HTMLElement {
      const node = super.create() as HTMLElement
      if (value) {
        node.setAttribute('data-flow-chart', JSON.stringify(value))
      }
      if (value.width) {
        node.setAttribute('width', String(value.width))
        node.style.width = `${value.width}%`
      }
      if (value.height) {
        node.setAttribute('height', String(value.height))
        node.style.height = `${value.height}px`
      }
      node.setAttribute('contenteditable', 'false')
      return node
    }

    initFlowChart(): void {
      if (this.domNode.isConnected) {
        this.insertFlowChartEditor()
      }
      else {
        const observer = new MutationObserver(() => {
          if (this.domNode.isConnected) {
            this.insertFlowChartEditor()
            observer.disconnect()
          }
        })
        observer.observe(document.body, { childList: true, subtree: true })
      }
    }

    insertFlowChartEditor(): void {
      this.domNode.style.width = `${this.width}${this.data.width ? 'px' : '%'}`
      this.domNode.style.height = `${this.height}px`
      this.updateAlignmentStyle()
      this.observeParentAlignment()
      const gridConfig = this.getGridConfig()
      const backgroundConfig = this.getBackgroundConfig()
      const allowResize = this.flowChartOptions && typeof this.flowChartOptions === 'object' && this.flowChartOptions.resize === true
      this.flowChart = new LogicFlow({
        container: this.domNode,
        stopScrollGraph: true,
        stopZoomGraph: true,
        allowResize: true,
        allowRotate: true,
        editable: true,
        preventDefaultDoubleClick: true,
        preventDefault: true,
        grid: gridConfig,
        background: backgroundConfig,
        plugins: [DndPanel, SelectionSelect, Snapshot],
      })
      this.flowChart.setPatternItems([
        {
          icon: selectRegionIcon,
          callback: () => {
            this.flowChart.openSelectionSelect()
            this.flowChart.once('selection:selected', () => {
              this.flowChart.closeSelectionSelect()
            })
          },
        },
        {
          type: 'rect',
          text: '矩形',
          icon: rectangleIcon,
        },
        {
          type: 'circle',
          text: '圆形',
          icon: circleIcon,
        },
        {
          type: 'ellipse',
          text: '椭圆',
          icon: ellipseIcon,
        },
        {
          type: 'diamond',
          text: '菱形',
          icon: diamondIcon,
        },
      ])
      new FlowChartResizeAction(this)
      createControlPanel(this, quill) // 创建控制面板
      initContextMenu(this, quill) // 初始化右键菜单
      this.observeOwnParentChange()
      this.observeNextPElement()
      this.addMouseHoverEvents()
      this.flowChart.render(this.data)
      this.flowChart.on('graph:updated', () => {
        this.data = this.flowChart.getGraphData()
        this.domNode.setAttribute('data-flow-chart', JSON.stringify(this.data))
      })
      this.flowChart.on('history:change', () => {
        this.data = this.flowChart.getGraphData()
        this.domNode.setAttribute('data-flow-chart', JSON.stringify(this.data))
      })
      this.flowChart.on('node:dbclick', this.handleNodeDblClick.bind(this))
      this.flowChart.on('edge:dbclick', this.handleNodeDblClick.bind(this))
      this.domNode.addEventListener('click', (e) => {
        if (quill) {
          console.warn(quill)
          const flowChartBlot = Quill.find(this.domNode)
          const index = quill.getIndex(flowChartBlot as FlowChartPlaceholderBlot)
          if (index && typeof index === 'number') {
            quill.setSelection(index + 1, 0)
          }
        }
      })
    }

    getGridConfig(): any {
      const defaultGrid = {
        type: 'dot',
        size: 20,
      }
      if (!this.flowChartOptions || typeof this.flowChartOptions !== 'object') {
        return defaultGrid
      }
      if ('grid' in this.flowChartOptions) {
        const grid = this.flowChartOptions.grid
        if (grid === false) {
          return null
        }
        if (typeof grid === 'object') {
          const gridConfig: any = {
            type: grid.type || defaultGrid.type,
            size: grid.size || defaultGrid.size,
          }
          if (grid.visible !== undefined) {
            gridConfig.visible = grid.visible
          }
          if (grid.config) {
            if (grid.config.color) {
              gridConfig.color = grid.config.color
            }
            if (grid.config.thickness) {
              gridConfig.lineWidth = grid.config.thickness
            }
          }
          return gridConfig
        }
      }
      return defaultGrid
    }

    getBackgroundConfig(): false | object {
      if (!this.flowChartOptions || typeof this.flowChartOptions !== 'object') {
        return false
      }
      if ('background' in this.flowChartOptions) {
        const background = this.flowChartOptions.background
        if (background === false) {
          return false
        }
        if (typeof background === 'object') {
          const backgroundConfig: any = {}
          if (background.color) {
            backgroundConfig.backgroundColor = background.color
          }
          if (background.image) {
            backgroundConfig.backgroundImage = background.image
          }
          if (background.repeat) {
            backgroundConfig.backgroundRepeat = background.repeat
          }
          if (background.position) {
            backgroundConfig.backgroundPosition = background.position
          }
          if (background.size) {
            backgroundConfig.backgroundSize = background.size
          }
          if (background.opacity) {
            backgroundConfig.opacity = background.opacity
          }
          return backgroundConfig
        }
      }
      return false
    }

    addMouseHoverEvents(): void {
      this.domNode.addEventListener('mouseenter', () => {
        this.showControlPanel()
      })

      this.domNode.addEventListener('mouseleave', () => {
        this.hideControlPanel()
      })
    }

    getControlElements(): { leftUpControl: HTMLElement | null, control: HTMLElement | null, panelStatusIcon: HTMLElement | null } {
      const leftUpControl = this.domNode.querySelector('.lf-dndpanel') as HTMLElement | null
      const control = this.domNode.querySelector('.ql-flow-chart-control') as HTMLElement | null
      const panelStatusIcon = this.domNode.querySelector('.ql-flow-chart-control-panel-status') as HTMLElement | null
      return { leftUpControl, control, panelStatusIcon }
    }

    showControlPanel(): void {
      const { leftUpControl, control, panelStatusIcon } = this.getControlElements()
      if (!leftUpControl || !control) return

      leftUpControl.style.display = 'block'
      control.style.display = 'flex'
      if (panelStatusIcon) {
        panelStatusIcon.style.backgroundImage = `url(${expandIcon})`
      }
    }

    hideControlPanel(): void {
      const { leftUpControl, control, panelStatusIcon } = this.getControlElements()
      if (!leftUpControl || !control) return

      leftUpControl.style.display = 'none'
      control.style.display = 'none'
      if (panelStatusIcon) {
        panelStatusIcon.style.backgroundImage = `url(${contractIcon})`
      }
    }

    observeOwnParentChange(): void {
      let currentParent = this.domNode.parentElement
      const observer = new MutationObserver(() => {
        if (this.domNode.parentElement !== currentParent) {
          currentParent = this.domNode.parentElement
          this.observeParentAlignment()
        }
      })

      observer.observe(document.body, {
        attributes: false,
        childList: true,
        subtree: true,
      })
    }

    observeParentAlignment(): void {
      if (this.parentObserver) {
        this.parentObserver.disconnect()
      }

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            this.updateAlignmentStyle()
          }
        })
      })

      this.parentObserver = observer

      const parent = this.domNode.parentElement
      if (parent) {
        observer.observe(parent, {
          attributes: true,
          attributeFilter: ['class'],
        })
        this.updateAlignmentStyle()
      }
    }

    updateAlignmentStyle(): void {
      const parent = this.domNode.parentElement
      if (!parent) return

      this.domNode.style.margin = ''
      this.domNode.style.display = 'block'

      if (parent.classList.contains('ql-align-center')) {
        this.domNode.style.margin = '0 auto'
      }
      else if (parent.classList.contains('ql-align-right')) {
        this.domNode.style.marginLeft = 'auto'
        this.domNode.style.marginRight = '0'
      }
      else {
        this.domNode.style.marginLeft = '0'
        this.domNode.style.marginRight = 'auto'
      }
    }

    observeNextPElement(): void {
      if (this.nextPObserver) {
        this.nextPObserver.disconnect()
      }

      const parentElement = this.domNode.parentElement
      if (!parentElement) {
        return
      }

      const trackedParentElement = parentElement

      const parentElementId = parentElement.getAttribute('id') || `flow-chart-parent-${Date.now()}`
      parentElement.setAttribute('id', parentElementId)

      const observer = new MutationObserver(() => {
        if (!document.contains(trackedParentElement)) {
          const elementById = document.getElementById(parentElementId)
          if (!elementById) {
            this.remove()
            observer.disconnect()
          }
        }
      })

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      })

      this.nextPObserver = observer
    }

    // 处理节点双击事件
    handleNodeDblClick(event: any) {
      const { data, position, e } = event
      if (data && data.id) {
        this.createEditInput(data, position, e)
      }
    }

    // 创建编辑输入框
    createEditInput(nodeData: any, position: any, e: any) {
      const input = document.createElement('textarea')
      input.className = 'ql-flow-chart-edit-input'
      input.value = nodeData.text?.value || ''
      const autoResize = () => {
        input.style.height = 'auto'
        input.style.height = `${input.scrollHeight}px`
      }
      Object.assign(input.style, {
        position: 'absolute',
        boxSizing: 'border-box',
        width: '100px',
        height: '35px',
        padding: '5px',
        lineHeight: '1.2',
        whiteSpace: 'pre',
        textAlign: 'center',
        background: '#fff',
        border: '1px solid #edefed',
        borderRadius: '3px',
        outline: 'none',
        transform: 'translate(-50%, -50%)',
        resize: 'none',
        zIndex: '1000',
        left: `${e.pageX}px`,
        top: `${e.pageY}px`,
        overflow: 'hidden',
      })
      document.body.appendChild(input)
      autoResize()
      input.addEventListener('input', autoResize)
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          this.flowChart.updateText(nodeData.id, input.value)
          autoResize()
        }
      })
      input.focus()

      this.flowChart.on('blank:mousedown', () => {
        this.flowChart.updateText(nodeData.id, input.value)
        input.remove()
      })

      this.flowChart.on('node:click', () => {
        this.flowChart.updateText(nodeData.id, input.value)
        input.remove()
      })

      this.flowChart.on('edge:click', () => {
        this.flowChart.updateText(nodeData.id, input.value)
        input.remove()
      })
    }

    updateText(nodeId: string, text: string) {
      this.flowChart.updateNode(nodeId, {
        text: { value: text },
      })
    }

    destroyFlowChart() {
      if (this.flowChart) {
        this.flowChart.destroy()
        this.flowChart = null
      }
      const editInputs = document.querySelectorAll('.ql-flow-chart-edit-input')
      editInputs.forEach(input => input.remove())
      if (this.nextPObserver) {
        this.nextPObserver.disconnect()
        this.nextPObserver = null
      }
    }

    remove() {
      this.destroyFlowChart()
      super.remove()
    }
  }
}

// Quill.register(FlowChartPlaceholderBlot)

// export default FlowChartPlaceholderBlot
