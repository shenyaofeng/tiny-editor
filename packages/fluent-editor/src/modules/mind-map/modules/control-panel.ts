import type FluentEditor from '../../../core/fluent-editor'
import type MindMapPlaceholderBlot from '../formats/mind-map-blot'
import { nodeIconList } from 'simple-mind-map/src/svg/icons'
import { CHANGE_LANGUAGE_EVENT } from '../../../config'
import { I18N } from '../../../modules/i18n'
import { registerMindMapI18N } from '../i18n'

class MindMapControlPanelHandler {
  private texts: Record<string, string>
  private lang: string
  getText(key: keyof Record<string, string>): string {
    return this.texts[key]
  }

  constructor(private quill: FluentEditor, private blot: MindMapPlaceholderBlot) {
    registerMindMapI18N(I18N)
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
      zoomOutTitle: I18N.parserText('mindMap.controlPanel.zoomOutTitle', this.lang),
      zoomInTitle: I18N.parserText('mindMap.controlPanel.zoomInTitle', this.lang),
      fitTitle: I18N.parserText('mindMap.controlPanel.fitTitle', this.lang),
      backTitle: I18N.parserText('mindMap.controlPanel.backTitle', this.lang),
      forwardTitle: I18N.parserText('mindMap.controlPanel.forwardTitle', this.lang),
      exportTitle: I18N.parserText('mindMap.controlPanel.exportTitle', this.lang),
      importTitle: I18N.parserText('mindMap.controlPanel.importTitle', this.lang),
      inserChildNodeTitle: I18N.parserText('mindMap.controlPanel.inserChildNodeTitle', this.lang),
      inserNodeTitle: I18N.parserText('mindMap.controlPanel.inserNodeTitle', this.lang),
      inserParentNodeTitle: I18N.parserText('mindMap.controlPanel.inserParentNodeTitle', this.lang),
      removeNodeTitle: I18N.parserText('mindMap.controlPanel.removeNodeTitle', this.lang),
      insertIconTitle: I18N.parserText('mindMap.controlPanel.insertIconTitle', this.lang),
    }
  }

  updateControlPanelTexts() {
    const controlItems = this.blot.domNode.querySelectorAll('.ql-mind-map-control-item')
    controlItems.forEach((item) => {
      const icon = item.querySelector('i')
      if (icon) {
        const iconClass = icon.className.split('-')[4]
        if (this.texts[iconClass]) {
          const textSpan = item.querySelector('.ql-mind-map-control-text')
          if (textSpan) {
            textSpan.textContent = this.texts[iconClass]
          }
          (item as HTMLElement).title = this.texts[`${iconClass}Title`] || ''
        }
      }
    })
  }
}

const controlPanelHandlers = new WeakMap<MindMapPlaceholderBlot, MindMapControlPanelHandler>()

const DISABLED_OPACITY = '0.5'
const ENABLED_OPACITY = '1'
export function createControlPanel(blot: MindMapPlaceholderBlot, quill: FluentEditor): void {
  let isStart = true
  let isEnd = true
  let selectedNodes: any[] = []
  blot.mindMap.on('node_active', (...args: unknown[]) => {
    selectedNodes = Array.isArray(args[1]) ? args[1] : []
  })
  // 右上的控制面板
  const controlPanel = document.createElement('div')
  controlPanel.className = 'ql-mind-map-control'
  // 左下的控制面板
  const controlLeftDownPanel = document.createElement('div')
  controlLeftDownPanel.className = 'ql-mind-map-left-down-control'
  // 左上的控制面板
  const controlLeftUpPanel = document.createElement('div')
  controlLeftUpPanel.className = 'ql-mind-map-left-up-control'

  const handler = new MindMapControlPanelHandler(quill, blot)
  controlPanelHandlers.set(blot, handler)

  const zoomOutBtn = createControlItem('zoomOut', handler.getText('zoomOutTitle'), () => handleZoomOut(blot))
  const zoomInBtn = createControlItem('zoomIn', handler.getText('zoomInTitle'), () => handleZoomIn(blot))
  const resetBtn = createControlItem('fit', handler.getText('fitTitle'), () => handleResetZoom(blot))
  const backBtn = createControlItem('back', handler.getText('backTitle'), () => {
    if (!isStart) {
      blot.mindMap.execCommand('BACK')
    }
  })
  const forwardBtn = createControlItem('forward', handler.getText('forwardTitle'), () => {
    if (!isEnd) {
      blot.mindMap.execCommand('FORWARD')
    }
  })
  const exportJSON = createControlItem('export', handler.getText('exportTitle'), () => handleExport(blot))
  const importJSON = createControlItem('import', handler.getText('importTitle'), () => handleImport(blot))
  const insertChildNode = createControlItem('inserChildNode', handler.getText('inserChildNodeTitle'), () => handleInsertChildNode(blot))
  const insertNode = createControlItem('inserNode', handler.getText('inserNodeTitle'), () => handleInsertNode(blot))
  const insertParentNode = createControlItem('inserParentNode', handler.getText('inserParentNodeTitle'), () => handleInsertParentNode(blot))
  const removeNode = createControlItem('removeNode', handler.getText('removeNodeTitle'), () => handleRemoveNode(blot))
  const insertIconBtn = createControlItem('insertIcon', handler.getText('insertIconTitle'), () => handleInsertIcon(blot, selectedNodes))
  const updateButtonState = (index: number, len: number) => {
    isStart = index <= 0
    isEnd = index >= len - 1
    backBtn.style.cursor = isStart ? 'not-allowed' : 'pointer'
    backBtn.style.opacity = isStart ? DISABLED_OPACITY : ENABLED_OPACITY
    forwardBtn.style.cursor = isEnd ? 'not-allowed' : 'pointer'
    forwardBtn.style.opacity = isEnd ? DISABLED_OPACITY : ENABLED_OPACITY
  }

  blot.mindMap.on('back_forward', (index: number, len: number) => {
    updateButtonState(index, len)
  })
  controlPanel.append(zoomOutBtn, zoomInBtn, resetBtn, backBtn, forwardBtn)
  blot.domNode.appendChild(controlPanel)
  controlLeftDownPanel.append(exportJSON, importJSON)
  blot.domNode.appendChild(controlLeftDownPanel)
  controlLeftUpPanel.append(insertChildNode, insertNode, insertParentNode, removeNode, insertIconBtn)
  blot.domNode.appendChild(controlLeftUpPanel)
}

function createControlItem(iconClass: string, title: string, onClick: () => void, disabled = false) {
  const controlItem = document.createElement('div')
  controlItem.className = 'ql-mind-map-control-item'
  controlItem.title = title
  controlItem.style.cursor = disabled ? 'not-allowed' : 'pointer'
  controlItem.style.opacity = disabled ? DISABLED_OPACITY : ENABLED_OPACITY

  const icon = document.createElement('i')
  icon.className = `ql-mind-map-control-${iconClass}`
  controlItem.appendChild(icon)

  if (!disabled) {
    controlItem.addEventListener('click', onClick)
  }

  return controlItem
}

function handleInsertChildNode(blot: MindMapPlaceholderBlot): void {
  blot.mindMap.execCommand('INSERT_CHILD_NODE')
}

function handleInsertNode(blot: MindMapPlaceholderBlot): void {
  blot.mindMap.execCommand('INSERT_NODE')
}

function handleInsertParentNode(blot: MindMapPlaceholderBlot): void {
  blot.mindMap.execCommand('INSERT_PARENT_NODE')
}

function handleRemoveNode(blot: MindMapPlaceholderBlot): void {
  blot.mindMap.execCommand('REMOVE_CURRENT_NODE')
}

function handleExport(blot: MindMapPlaceholderBlot): void {
  blot.mindMap.getElRectInfo()
  if (blot.mindMap) {
    blot.mindMap.export('json', true, '思维导图')
  }
}

function handleInsertIcon(blot: MindMapPlaceholderBlot, selectedNodes: any[]): void {
  let iconList = []
  iconList = nodeIconList
  const leftUpControl = blot.domNode.querySelector('.ql-mind-map-left-up-control') as HTMLElement
  const iconPanel = document.createElement('div')
  iconPanel.className = 'ql-mind-map-icon-panel'
  iconPanel.style.display = 'none'
  iconPanel.style.borderRadius = 'inherit'
  iconPanel.style.width = '200px'
  iconPanel.style.height = '270px'
  iconPanel.style.position = 'absolute'
  iconPanel.style.left = '45px'
  iconPanel.style.top = '60px'
  iconPanel.style.backgroundColor = 'white'
  iconPanel.style.border = '1px solid #ccc'
  iconPanel.style.padding = '10px'
  iconPanel.style.zIndex = '1000'
  iconPanel.style.maxHeight = '400px'
  iconPanel.style.overflowY = 'auto'

  iconList.forEach((group) => {
    const groupTitle = document.createElement('h4')
    groupTitle.textContent = ''
    groupTitle.style.margin = '10px 0 5px'
    groupTitle.style.fontSize = '14px'
    iconPanel.appendChild(groupTitle)

    const groupContainer = document.createElement('div')
    groupContainer.style.display = 'flex'
    groupContainer.style.flexWrap = 'wrap'
    groupContainer.style.gap = '10px'

    group.list.forEach((icon: { icon: string, name: string }) => {
      const iconItem = document.createElement('div')
      iconItem.style.width = '25px'
      iconItem.style.height = '25px'
      iconItem.style.display = 'flex'
      iconItem.style.alignItems = 'center'
      iconItem.style.justifyContent = 'center'
      iconItem.style.cursor = 'pointer'
      iconItem.style.border = '1px solid #eee'
      iconItem.style.borderRadius = '4px'
      iconItem.style.padding = '2px'
      iconItem.innerHTML = icon.icon
      iconItem.title = icon.name

      iconItem.addEventListener('click', () => {
        if (selectedNodes.length > 0) {
          const node = selectedNodes[0]
          if (node.getData('icon') && node.getData('icon')[0] === `${group.type}_${icon.name}`) {
            node.setIcon([])
          }
          else {
            node.setIcon([`${group.type}_${icon.name}`])
          }
          blot.data = blot.mindMap.getData({})
          blot.domNode.setAttribute('data-mind-map', JSON.stringify(blot.data))
          blot.scroll.update([], {})
        }
        leftUpControl.removeChild(iconPanel)
      })
      groupContainer.appendChild(iconItem)
    })
    iconPanel.appendChild(groupContainer)
  })

  iconPanel.style.display = 'block'
  leftUpControl.appendChild(iconPanel)
  const handleOutsideClick = (e: MouseEvent) => {
    if (!iconPanel.contains(e.target as Node)) {
      iconPanel.style.display = 'none'
      document.removeEventListener('click', handleOutsideClick)
    }
  }
  setTimeout(() => {
    document.addEventListener('click', handleOutsideClick)
  }, 0)
}

function handleImport(blot: MindMapPlaceholderBlot): void {
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = '.json'
  fileInput.style.display = 'none'

  // 监听文件选择事件
  fileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string)
        if (blot.mindMap) {
          if (jsonData.root) {
            blot.mindMap.setFullData(jsonData)
          }
          else {
            blot.mindMap.setData(jsonData)
          }
          blot.mindMap.view.reset()
          blot.data = blot.mindMap.getData({})
          blot.domNode.setAttribute('data-mind-map', JSON.stringify(blot.data))
          blot.scroll.update([], {})
        }
      }
      catch (error) {
        alert('文件解析错误，请确保选择的是有效的JSON文件')
      }
    }
    reader.readAsText(file)
  })

  // 触发文件选择对话框
  document.body.appendChild(fileInput)
  fileInput.click()
  document.body.removeChild(fileInput)
}

function handleZoomIn(blot: MindMapPlaceholderBlot): void {
  if (blot.mindMap && blot.mindMap.view) {
    const containerRect = blot.mindMap.el.getBoundingClientRect()
    const cx = containerRect.width / 2
    const cy = containerRect.height / 2
    blot.mindMap.view.enlarge(cx, cy, false)
    blot.zoomCount++
  }
}

function handleZoomOut(blot: MindMapPlaceholderBlot): void {
  if (blot.mindMap && blot.mindMap.view) {
    const containerRect = blot.mindMap.el.getBoundingClientRect()
    const cx = containerRect.width / 2
    const cy = containerRect.height / 2
    blot.mindMap.view.narrow(cx, cy, false)
    blot.zoomCount--
  }
}

function handleResetZoom(blot: MindMapPlaceholderBlot): void {
  if (!blot.mindMap || !blot.mindMap.view || blot.zoomCount === 0) return
  const containerRect = blot.mindMap.el.getBoundingClientRect()
  const centerX = containerRect.width / 2
  const centerY = containerRect.height / 2
  const operationCount = Math.abs(blot.zoomCount)
  const isEnlarge = blot.zoomCount < 0
  for (let i = 0; i < operationCount; i++) {
    if (isEnlarge) {
      blot.mindMap.view.enlarge(centerX, centerY, false)
    }
    else {
      blot.mindMap.view.narrow(centerX, centerY, false)
    }
  }
  blot.zoomCount = 0
}
