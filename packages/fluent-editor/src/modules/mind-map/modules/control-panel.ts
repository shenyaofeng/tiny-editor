import type FluentEditor from '../../../core/fluent-editor'
import type MindMapPlaceholderBlot from '../formats/mind-map-blot'
import { nodeIconList } from 'simple-mind-map/src/svg/icons'
import { CHANGE_LANGUAGE_EVENT } from '../../../config'
import { I18N } from '../../../modules/i18n'
import { registerMindMapI18N } from '../i18n'
import catalogOrganizationIcon from '../icons/catalogOrganizationIcon.png'
import contractIcon from '../icons/contractIcon.png'
import expandIcon from '../icons/expandIcon.png'
import fishboneIcon from '../icons/fishboneIcon.png'
import logicalStructureIcon from '../icons/logicalStructureIcon.png'
import mindMapIcon from '../icons/mindMapIcon.png'
import organizationStructureIcon from '../icons/organizationStructureIcon.png'
import timelineIcon from '../icons/timelineIcon.png'

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
    const textKeys = [
      'zoomOutTitle',
      'zoomInTitle',
      'fitTitle',
      'backTitle',
      'forwardTitle',
      'inserChildNodeTitle',
      'inserNodeTitle',
      'inserParentNodeTitle',
      'removeNodeTitle',
      'insertIconTitle',
      'setLayoutTitle',
      'logicalStructureLayout',
      'catalogOrganizationLayout',
      'mindMapLayout',
      'organizationStructureLayout',
      'timelineLayout',
      'fishboneLayout',
      'panelStatusTitle',
    ]

    return textKeys.reduce((acc, key) => {
      if (!key.includes('Title')) {
        acc[key] = I18N.parserText(`mindMap.layout.${key.replace('Layout', '')}`, this.lang)
      }
      else {
        acc[key] = I18N.parserText(`mindMap.controlPanel.${key}`, this.lang)
      }
      return acc
    }, {} as Record<string, string>)
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
  // 中间的控制面板
  const controlPanel = document.createElement('div')
  controlPanel.className = 'ql-mind-map-control'
  // 右上的控制面板
  const controlRightUpPanel = document.createElement('div')
  controlRightUpPanel.className = 'ql-mind-map-right-up-control'
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
  const insertChildNode = createControlItem('inserChildNode', handler.getText('inserChildNodeTitle'), () => handleInsertChildNode(blot))
  const insertNode = createControlItem('inserNode', handler.getText('inserNodeTitle'), () => handleInsertNode(blot))
  const insertParentNode = createControlItem('inserParentNode', handler.getText('inserParentNodeTitle'), () => handleInsertParentNode(blot))
  const removeNode = createControlItem('removeNode', handler.getText('removeNodeTitle'), () => handleRemoveNode(blot))
  const insertIconBtn = createControlItem('insertIcon', handler.getText('insertIconTitle'), () => handleInsertIcon(blot, selectedNodes))
  const setLayoutBtn = createControlItem('setLayoutIcon', handler.getText('setLayoutTitle'), () => handleSetLayoutBtn(blot))
  const panelStatusBtn = createControlItem('panelStatus', handler.getText('panelStatusTitle'), () => handlePanelStatusBtn(blot))
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
  controlRightUpPanel.append(panelStatusBtn)
  blot.domNode.appendChild(controlRightUpPanel)
  controlLeftUpPanel.append(insertChildNode, insertNode, insertParentNode, removeNode, insertIconBtn, setLayoutBtn)
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

function handleInsertIcon(blot: MindMapPlaceholderBlot, selectedNodes: any[]): void {
  (blot as any).selectedNodes = selectedNodes
  const heightStr = blot.domNode.getAttribute('height') || '500px'
  const height = Number.parseInt(heightStr.replace(/[^\d.]/g, ''), 10) || 500
  let iconList = []
  iconList = nodeIconList
  const leftUpControl = blot.domNode.querySelector('.ql-mind-map-left-up-control') as HTMLElement
  let iconPanel = leftUpControl.querySelector('.ql-mind-map-icon-panel') as HTMLElement
  if (!iconPanel) {
    iconPanel = document.createElement('div')
    iconPanel.className = 'ql-mind-map-icon-panel'

    iconList.forEach((group) => {
      const groupContainer = document.createElement('div')
      groupContainer.className = 'ql-mind-map-icon-group-container'

      group.list.forEach((icon: { icon: string, name: string }) => {
        const iconItem = document.createElement('div')
        iconItem.className = 'ql-mind-map-icon-item'
        iconItem.innerHTML = icon.icon

        iconItem.addEventListener('click', () => {
          const currentSelectedNodes = (blot as any).selectedNodes || []
          if (currentSelectedNodes.length > 0) {
            const node = currentSelectedNodes[0]

            if (node.getData('icon') && node.getData('icon')[0] === `${group.type}_${icon.name}`) {
              node.setIcon([])
            }
            else {
              node.setIcon([`${group.type}_${icon.name}`])
            }
            blot.data = blot.mindMap.getData({})
            blot.domNode.setAttribute('data-mind-map', JSON.stringify(blot.data))
          }
          iconPanel.style.display = 'none'
        })
        groupContainer.appendChild(iconItem)
      })
      iconPanel.appendChild(groupContainer)
    })
    if (height < 395) {
      iconPanel.style.height = `${height - 130}px`
    }
    else {
      iconPanel.style.height = '270px'
    }
    leftUpControl.appendChild(iconPanel)
  }
  else {
    if (height < 395) {
      iconPanel.style.height = `${height - 130}px`
    }
    else {
      iconPanel.style.height = '270px'
    }
    iconPanel.style.display = 'block'
  }

  const handleOutsideClick = (e: MouseEvent) => {
    let insertIconBtn: HTMLElement | null = null
    const controlItems = leftUpControl.querySelectorAll('.ql-mind-map-control-item')

    controlItems.forEach((item) => {
      const iconEl = item.querySelector('i')
      if (iconEl && iconEl.className.includes('insertIcon')) {
        insertIconBtn = item as HTMLElement
      }
    })

    if (!iconPanel.contains(e.target as Node) && (!insertIconBtn || !insertIconBtn.contains(e.target as Node))) {
      iconPanel.style.display = 'none'
      document.removeEventListener('click', handleOutsideClick)
    }
  }
  document.removeEventListener('click', handleOutsideClick)
  document.addEventListener('click', handleOutsideClick)
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
  blot.mindMap.renderer.setRootNodeCenter()
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
function handleSetLayoutBtn(blot: MindMapPlaceholderBlot): void {
  const handler = controlPanelHandlers.get(blot)
  const leftUpControl = blot.domNode.querySelector('.ql-mind-map-left-up-control') as HTMLElement
  let layoutPanel = leftUpControl.querySelector('.ql-mind-map-layout-panel') as HTMLElement
  const heightStr = blot.domNode.getAttribute('height') || '500'
  const height = Number.parseInt(heightStr.replace(/[^\d.]/g, ''), 10) || 500

  if (!layoutPanel) {
    layoutPanel = document.createElement('div')
    layoutPanel.className = 'ql-mind-map-layout-panel'

    const layouts = [
      {
        name: 'logicalStructure',
        displayName: handler?.getText('logicalStructureLayout'),
        icon: logicalStructureIcon,
      },
      {
        name: 'catalogOrganization',
        displayName: handler?.getText('catalogOrganizationLayout'),
        icon: catalogOrganizationIcon,
      },
      {
        name: 'mindMap',
        displayName: handler?.getText('mindMapLayout'),
        icon: mindMapIcon,
      },
      {
        name: 'organizationStructure',
        displayName: handler?.getText('organizationStructureLayout'),
        icon: organizationStructureIcon,
      },
      {
        name: 'timeline',
        displayName: handler?.getText('timelineLayout'),
        icon: timelineIcon,
      },
      {
        name: 'fishbone',
        displayName: handler?.getText('fishboneLayout'),
        icon: fishboneIcon,
      },
    ]

    layouts.forEach((layout) => {
      const layoutItem = document.createElement('div')
      layoutItem.className = 'ql-mind-map-layout-item'

      const iconContainer = document.createElement('div')
      iconContainer.className = 'ql-mind-map-layout-icon-container'

      const img = document.createElement('div')
      img.className = 'ql-mind-map-layout-icon'
      img.style.backgroundImage = `url(${layout.icon})`

      iconContainer.appendChild(img)

      const nameText = document.createElement('div')
      nameText.className = 'ql-mind-map-layout-name'
      nameText.textContent = layout.displayName

      layoutItem.appendChild(iconContainer)
      layoutItem.appendChild(nameText)
      layoutItem.addEventListener('click', () => {
        blot.mindMap.setLayout(layout.name)
        blot.data = blot.mindMap.getData({})
        blot.domNode.setAttribute('data-mind-map', JSON.stringify(blot.data))
        layoutPanel.style.display = 'none'
      })
      layoutPanel.appendChild(layoutItem)
    })
    leftUpControl.appendChild(layoutPanel)
    if (height < 395) {
      console.warn(height)
      layoutPanel.style.height = `${height - 130}px`
    }
    else {
      layoutPanel.style.height = '270px'
    }
  }
  else {
    if (height < 395) {
      layoutPanel.style.height = `${height - 130}px`
    }
    else {
      layoutPanel.style.height = '270px'
    }
    layoutPanel.style.display = 'block'
  }

  const handleOutsideClick = (e: MouseEvent) => {
    let setLayoutBtn: HTMLElement | null = null
    const controlItems = leftUpControl.querySelectorAll('.ql-mind-map-control-item')

    controlItems.forEach((item) => {
      const iconEl = item.querySelector('i')
      if (iconEl && iconEl.className.includes('setLayoutIcon')) {
        setLayoutBtn = item as HTMLElement
      }
    })

    if (!layoutPanel.contains(e.target as Node) && (!setLayoutBtn || !setLayoutBtn.contains(e.target as Node))) {
      layoutPanel.style.display = 'none'
      document.removeEventListener('click', handleOutsideClick)
    }
  }
  document.removeEventListener('click', handleOutsideClick)
  document.addEventListener('click', handleOutsideClick)
}
function handlePanelStatusBtn(blot: MindMapPlaceholderBlot): void {
  const leftUpControl = document.querySelector('.ql-mind-map-left-up-control') as HTMLElement | null
  const control = document.querySelector('.ql-mind-map-control') as HTMLElement | null
  const panelStatusIcon = document.querySelector('.ql-mind-map-control-panelStatus') as HTMLElement | null
  if (!leftUpControl || !control) return
  const isVisible = leftUpControl.style.display !== 'none' && control.style.display !== 'none'
  if (isVisible) {
    leftUpControl.style.display = 'none'
    control.style.display = 'none'
    if (panelStatusIcon) {
      panelStatusIcon.style.backgroundImage = `url(${contractIcon})`
    }
  }
  else {
    leftUpControl.style.display = 'inline-flex'
    control.style.display = 'flex'
    if (panelStatusIcon) {
      panelStatusIcon.style.backgroundImage = `url(${expandIcon})`
    }
  }
}
