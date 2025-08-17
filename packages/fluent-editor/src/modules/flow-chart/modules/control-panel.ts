import type FluentEditor from '../../../core/fluent-editor'
import type FlowChartPlaceholderBlot from '../formats/flow-chart-blot'
import { CHANGE_LANGUAGE_EVENT } from '../../../config'
import { I18N } from '../../../modules/i18n'
import { registerFlowChartI18N } from '../i18n'
import bezierIcon from '../icons/bezierIcon.png'
import lineIcon from '../icons/lineIcon.png'
import polyLineIcon from '../icons/polyLineIcon.png'

class FlowChartControlPanelHandler {
  private texts: Record<string, string>
  private lang: string
  getText(key: keyof Record<string, string>): string {
    return this.texts[key]
  }

  constructor(private quill: FluentEditor, private blot: FlowChartPlaceholderBlot) {
    registerFlowChartI18N(I18N)
    this.lang = 'en-US'
    this.texts = this.resolveTexts()
    this.quill.emitter.on(CHANGE_LANGUAGE_EVENT, (lang: string) => {
      this.lang = lang
      this.texts = this.resolveTexts()
      this.updateControlPanelTexts()
    })
  }

  resolveTexts() {
    return {
      exportTitle: I18N.parserText('flowChart.controlPanel.exportTitle', this.lang),
      importTitle: I18N.parserText('flowChart.controlPanel.importTitle', this.lang),
      zoomOutTitle: I18N.parserText('flowChart.controlPanel.zoomOutTitle', this.lang),
      zoomInTitle: I18N.parserText('flowChart.controlPanel.zoomInTitle', this.lang),
      fitTitle: I18N.parserText('flowChart.controlPanel.fitTitle', this.lang),
      backTitle: I18N.parserText('flowChart.controlPanel.backTitle', this.lang),
      forwardTitle: I18N.parserText('flowChart.controlPanel.forwardTitle', this.lang),
      setEdgeTypeTitle: I18N.parserText('flowChart.controlPanel.setEdgeTypeTitle', this.lang), // 添加这一行
    }
  }

  updateControlPanelTexts() {
    const controlItems = this.blot.domNode.querySelectorAll('.ql-flow-chart-control-item')
    controlItems.forEach((item) => {
      const icon = item.querySelector('i')
      if (icon) {
        const iconClass = icon.className.replace('ql-flow-chart-control-', '')
        if (this.texts[`${iconClass}Title`]) {
          (item as HTMLElement).title = this.texts[`${iconClass}Title`]
        }
      }
    })
  }
}

const controlPanelHandlers = new WeakMap<FlowChartPlaceholderBlot, FlowChartControlPanelHandler>()

const DISABLED_OPACITY = '0.5'
const ENABLED_OPACITY = '1'
export function createControlPanel(blot: FlowChartPlaceholderBlot, quill: FluentEditor): void {
  // 右上的控制面板
  const controlPanel = document.createElement('div')
  controlPanel.className = 'ql-flow-chart-control'
  // 左下的控制面板
  const controlLeftDownPanel = document.createElement('div')
  controlLeftDownPanel.className = 'ql-flow-chart-left-down-control'

  const handler = new FlowChartControlPanelHandler(quill, blot)
  controlPanelHandlers.set(blot, handler)
  const zoomOutBtn = createControlItem('zoomOut', handler.getText('zoomOutTitle'), () => handleZoomOut(blot))
  const zoomInBtn = createControlItem('zoomIn', handler.getText('zoomInTitle'), () => handleZoomIn(blot))
  const resetBtn = createControlItem('fit', handler.getText('fitTitle'), () => handleResetZoom(blot))
  const backBtn = createControlItem('back', handler.getText('backTitle'), () => handleUndo(blot))
  const forwardBtn = createControlItem('forward', handler.getText('forwardTitle'), () => handleRedo(blot))
  const setEdgeTypeBtn = createControlItem('setEdgeType', handler.getText('setEdgeTypeTitle'), () => handleSetEdgeType(blot))
  const exportJSON = createControlItem('export', handler.getText('exportTitle'), () => handleExport(blot))
  const importJSON = createControlItem('import', handler.getText('importTitle'), () => handleImport(blot))

  const updateButtonState = (historyData: any) => {
    if (!historyData.data) {
      backBtn.style.opacity = DISABLED_OPACITY
      backBtn.style.cursor = 'not-allowed'
      forwardBtn.style.opacity = DISABLED_OPACITY
      forwardBtn.style.cursor = 'not-allowed'
      return
    }
    const isUndoAvailable = historyData.data.undoAble || historyData.data.undos.length > 0
    const isRedoAvailable = historyData.data.redoAble || historyData.data.redos.length > 0

    if (backBtn) {
      backBtn.style.opacity = isUndoAvailable ? ENABLED_OPACITY : DISABLED_OPACITY
      backBtn.style.cursor = isUndoAvailable ? 'pointer' : 'not-allowed'
    }

    if (forwardBtn) {
      forwardBtn.style.opacity = isRedoAvailable ? ENABLED_OPACITY : DISABLED_OPACITY
      forwardBtn.style.cursor = isRedoAvailable ? 'pointer' : 'not-allowed'
    }
  }
  updateButtonState(blot.flowChart.history)
  blot.flowChart.on('history:change', (data: any) => {
    updateButtonState(data)
  })

  controlPanel.append(zoomOutBtn, zoomInBtn, resetBtn, backBtn, forwardBtn)
  controlLeftDownPanel.append(exportJSON, importJSON)
  setTimeout(() => {
    const controlLeftUpPanel = document.querySelector('.lf-dndpanel') as HTMLElement | null
    controlLeftUpPanel.append(setEdgeTypeBtn)
  }, 0)
  blot.domNode.appendChild(controlPanel)
  blot.domNode.appendChild(controlLeftDownPanel)
}

function handleUndo(blot: FlowChartPlaceholderBlot): void {
  if (blot.flowChart) {
    blot.flowChart.undo()
  }
}

function handleRedo(blot: FlowChartPlaceholderBlot): void {
  if (blot.flowChart) {
    blot.flowChart.redo()
  }
}

function handleZoomIn(blot: FlowChartPlaceholderBlot): void {
  if (blot.flowChart) {
    blot.flowChart.zoom(true)
  }
}

function handleZoomOut(blot: FlowChartPlaceholderBlot): void {
  if (blot.flowChart) {
    blot.flowChart.zoom(false)
  }
}

function handleResetZoom(blot: FlowChartPlaceholderBlot): void {
  if (blot.flowChart) {
    blot.flowChart.resetZoom()
  }
}

function createControlItem(iconClass: string, title: string, onClick: () => void, disabled = false) {
  const controlItem = document.createElement('div')
  controlItem.className = 'ql-flow-chart-control-item'
  console.warn(title)
  controlItem.title = title
  controlItem.style.cursor = disabled ? 'not-allowed' : 'pointer'

  const icon = document.createElement('i')
  icon.className = `ql-flow-chart-control-${iconClass}`
  controlItem.appendChild(icon)

  if (!disabled) {
    controlItem.addEventListener('click', onClick)
  }

  return controlItem
}

function handleExport(blot: FlowChartPlaceholderBlot): void {
  if (blot.flowChart) {
    const data = blot.flowChart.getGraphData()
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '流程图.json'
    a.click()
    URL.revokeObjectURL(url)
  }
}

function handleImport(blot: FlowChartPlaceholderBlot): void {
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = '.json'
  fileInput.style.display = 'none'

  fileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string)
        if (blot.flowChart) {
          blot.flowChart.render(jsonData)
          blot.data = jsonData
          blot.domNode.setAttribute('data-flow-chart', JSON.stringify(jsonData))
        }
      }
      catch (error) {
        alert('文件解析错误，请确保选择的是有效的JSON文件')
      }
    }
    reader.readAsText(file)
  })

  document.body.appendChild(fileInput)
  fileInput.click()
  document.body.removeChild(fileInput)
}

function handleSetEdgeType(blot: FlowChartPlaceholderBlot): void {
  const controlLeftUpPanel = document.querySelector('.lf-dndpanel') as HTMLElement | null
  if (!controlLeftUpPanel) return
  let edgeTypePanel = controlLeftUpPanel.querySelector('.ql-flow-chart-edge-panel') as HTMLElement
  if (!edgeTypePanel) {
    edgeTypePanel = document.createElement('div')
    edgeTypePanel.className = 'ql-flow-chart-edge-panel'
    controlLeftUpPanel.appendChild(edgeTypePanel)
    edgeTypePanel.style.display = 'flex'
    edgeTypePanel.style.justifyContent = 'space-around'
    edgeTypePanel.style.flexWrap = 'nowrap'
    const edgeTypes = [
      {
        name: 'line',
        displayName: '直线',
        icon: lineIcon,
      },
      {
        name: 'polyline',
        displayName: '折线',
        icon: polyLineIcon,
      },
      {
        name: 'bezier',
        displayName: '贝塞尔曲线',
        icon: bezierIcon,
      },
    ]

    edgeTypes.forEach((edgeType) => {
      const edgeItem = document.createElement('div')
      edgeItem.className = 'ql-flow-chart-edge-item'

      const edgeIcon = document.createElement('div')
      edgeIcon.className = `ql-flow-chart-edge-type-icon`
      edgeIcon.style.backgroundImage = `url(${edgeType.icon})`

      edgeItem.appendChild(edgeIcon)

      edgeItem.addEventListener('click', () => {
        const { edges = [] } = blot.flowChart.getSelectElements()
        if (edges.length > 0) {
          edges.forEach((edge) => {
            blot.flowChart.changeEdgeType(edge.id, edgeType.name)
          })
          blot.data = blot.flowChart.getGraphData()
          blot.domNode.setAttribute('data-flow-chart', JSON.stringify(blot.data))
        }

        edgeTypePanel.style.display = 'none'
      })
      edgeTypePanel.appendChild(edgeItem)
    })
  }
  else {
    edgeTypePanel.style.display = 'flex'
    edgeTypePanel.style.justifyContent = 'space-around'
    edgeTypePanel.style.flexWrap = 'nowrap'
  }

  const handleOutsideClick = (e: MouseEvent) => {
    let setEdgeTypeBtn: HTMLElement | null = null
    const controlItems = controlLeftUpPanel.querySelectorAll('.ql-flow-chart-control-item')
    controlItems.forEach((item) => {
      const iconEl = item.querySelector('i')
      if (iconEl && iconEl.className.includes('setEdgeType')) {
        setEdgeTypeBtn = item as HTMLElement
      }
    })
    if (!edgeTypePanel.contains(e.target as Node)
      && (!setEdgeTypeBtn || !setEdgeTypeBtn.contains(e.target as Node))) {
      edgeTypePanel.style.display = 'none'
      document.removeEventListener('click', handleOutsideClick)
    }
  }

  document.removeEventListener('click', handleOutsideClick)
  document.addEventListener('click', handleOutsideClick)
}
