import type FluentEditor from '../../../core/fluent-editor'
import type FlowchartBlot from '../formats/flow-chart-blot'
import { CHANGE_LANGUAGE_EVENT } from '../../../config'
import { I18N } from '../../../modules/i18n'
import { registerFlowChartI18N } from '../i18n'

class ControlPanelHandler {
  private texts: Record<string, string>
  private lang: string
  getText(key: keyof Record<string, string>): string {
    return this.texts[key]
  }

  constructor(private quill: FluentEditor, private blot: FlowchartBlot) {
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
      export: I18N.parserText('flowChart.controlPanel.export', this.lang),
      import: I18N.parserText('flowChart.controlPanel.import', this.lang),

      exportTitle: I18N.parserText('flowChart.controlPanel.exportTitle', this.lang),
      importTitle: I18N.parserText('flowChart.controlPanel.importTitle', this.lang),
    }
  }

  updateControlPanelTexts() {
    const controlItems = this.blot.domNode.querySelectorAll('.flow-chart-control-item')
    controlItems.forEach((item) => {
      const icon = item.querySelector('i')
      if (icon) {
        const iconClass = icon.className.split('-')[3]
        if (this.texts[iconClass]) {
          const textSpan = item.querySelector('.flow-chart-control-text')
          if (textSpan) {
            textSpan.textContent = this.texts[iconClass]
          }
          (item as HTMLElement).title = this.texts[`${iconClass}Title`] || ''
        }
      }
    })
  }
}

const controlPanelHandlers = new WeakMap<FlowchartBlot, ControlPanelHandler>()
const ENABLED_OPACITY = '1'

export function createControlPanel(blot: FlowchartBlot, quill: FluentEditor): void {
  // 左下的控制面板
  const controlLeftDownPanel = document.createElement('div')
  controlLeftDownPanel.className = 'flow-chart-left-down-control'

  const handler = new ControlPanelHandler(quill, blot)
  controlPanelHandlers.set(blot, handler)

  const exportJSON = createControlItem('export', handler.getText('export'), handler.getText('exportTitle'), () => handleExport(blot))
  const importJSON = createControlItem('import', handler.getText('import'), handler.getText('importTitle'), () => handleImport(blot))

  controlLeftDownPanel.append(exportJSON, importJSON)
  blot.domNode.appendChild(controlLeftDownPanel)
}

function createControlItem(iconClass: string, text: string, title: string, onClick: () => void, disabled = false) {
  const controlItem = document.createElement('div')
  controlItem.className = 'flow-chart-control-item'
  controlItem.title = title
  controlItem.style.cursor = disabled ? 'not-allowed' : 'pointer'
  controlItem.style.opacity = disabled ? '0.5' : ENABLED_OPACITY

  const icon = document.createElement('i')
  icon.className = `flow-chart-control-${iconClass}`
  console.warn(icon)
  const textSpan = document.createElement('span')
  textSpan.className = 'flow-chart-control-text'
  textSpan.textContent = text

  controlItem.appendChild(icon)
  controlItem.appendChild(textSpan)

  if (!disabled) {
    controlItem.addEventListener('click', onClick)
  }

  return controlItem
}

function handleExport(blot: FlowchartBlot): void {
  if (blot.flowChart) {
    const data = blot.flowChart.getGraphData()
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'flowchart.json'
    a.click()
    URL.revokeObjectURL(url)
  }
}

function handleImport(blot: FlowchartBlot): void {
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
          blot.scroll.update([], {})
        }
      }
      catch (error) {
        console.error('Failed to import flowchart data:', error)
      }
    }
    reader.readAsText(file)
  })

  document.body.appendChild(fileInput)
  fileInput.click()
  document.body.removeChild(fileInput)
}
