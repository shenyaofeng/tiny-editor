import type MindmapPlaceholderBlot from '../formats/mind-blot'

export function createControlPanel(blot: MindmapPlaceholderBlot): void {
  let isStart = true
  let isEnd = true
  // 右上的控制面板
  const controlPanel = document.createElement('div')
  controlPanel.className = 'mindmap-control'
  // 左下的控制面板
  const controlLeftDownPanel = document.createElement('div')
  controlLeftDownPanel.className = 'mindmap-left-down-control'
  // 左上的控制面板
  const controlLeftUpPanel = document.createElement('div')
  controlLeftUpPanel.className = 'mindmap-left-up-control'
  const zoomOutBtn = createControlItem('zoomOut', '缩小', '缩小思维导图', () => handleZoomOut(blot))
  const zoomInBtn = createControlItem('zoomIn', '放大', '放大思维导图', () => handleZoomIn(blot))
  const resetBtn = createControlItem('fit', '适应', '恢复逻辑原有尺寸', () => handleResetZoom(blot))
  const backBtn = createControlItem('back', '上一步', '回退到上一步', () => {
    if (!isStart) {
      blot.mm.execCommand('BACK')
    }
  })
  const forwardBtn = createControlItem('forward', '下一步', '前进到下一步', () => {
    if (!isEnd) {
      blot.mm.execCommand('FORWARD')
    }
  })
  const exportJSON = createControlItem('export', '导出', '导出JSON文件', () => handleExport(blot))
  const importJSON = createControlItem('import', '导入', '导入JSON文件', () => handleImport(blot))
  const insertChildNode = createControlItem('inserChildNode', '子节点', '插入子节点', () => handleInsertChildNode(blot))
  const insertNode = createControlItem('inserNode', '同级节点', '插入同级节点', () => handleInsertNode(blot))
  const insertParentNode = createControlItem('inserParentNode', '父节点', '插入父节点', () => handleInsertParentNode(blot))
  const removeNode = createControlItem('removeNode', '删除', '删除节点', () => handleRemoveNode(blot))

  const updateButtonState = (index: number, len: number) => {
    isStart = index <= 0
    isEnd = index >= len - 1
    backBtn.style.cursor = isStart ? 'not-allowed' : 'pointer'
    backBtn.style.opacity = isStart ? '0.5' : '1'
    forwardBtn.style.cursor = isEnd ? 'not-allowed' : 'pointer'
    forwardBtn.style.opacity = isEnd ? '0.5' : '1'
  }

  blot.mm.on('back_forward', (index: number, len: number) => {
    updateButtonState(index, len)
  })
  controlPanel.append(zoomOutBtn, zoomInBtn, resetBtn, backBtn, forwardBtn)
  blot.domNode.appendChild(controlPanel)
  controlLeftDownPanel.append(exportJSON, importJSON)
  blot.domNode.appendChild(controlLeftDownPanel)
  controlLeftUpPanel.append(insertChildNode, insertNode, insertParentNode, removeNode)
  blot.domNode.appendChild(controlLeftUpPanel)
}

function createControlItem(iconClass: string, text: string, title: string, onClick: () => void, disabled = false) {
  const controlItem = document.createElement('div')
  controlItem.className = 'mindmap-control-item'
  controlItem.title = title
  controlItem.style.cursor = disabled ? 'not-allowed' : 'pointer'
  controlItem.style.opacity = disabled ? '0.5' : '1'

  const icon = document.createElement('i')
  icon.className = `mindmap-control-${iconClass}`

  const textSpan = document.createElement('span')
  textSpan.className = 'mindmap-control-text'
  textSpan.textContent = text

  controlItem.appendChild(icon)
  controlItem.appendChild(textSpan)

  if (!disabled) {
    controlItem.addEventListener('click', onClick)
  }

  return controlItem
}

function handleInsertChildNode(blot: MindmapPlaceholderBlot): void {
  blot.mm.execCommand('INSERT_CHILD_NODE')
}

function handleInsertNode(blot: MindmapPlaceholderBlot): void {
  blot.mm.execCommand('INSERT_NODE')
}

function handleInsertParentNode(blot: MindmapPlaceholderBlot): void {
  blot.mm.execCommand('INSERT_PARENT_NODE')
}

function handleRemoveNode(blot: MindmapPlaceholderBlot): void {
  blot.mm.execCommand('REMOVE_CURRENT_NODE')
}

function handleExport(blot: MindmapPlaceholderBlot): void {
  blot.mm.getElRectInfo()
  if (blot.mm) {
    blot.mm.export('json', true, '思维导图')
  }
}

function handleImport(blot: MindmapPlaceholderBlot): void {
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
        if (blot.mm) {
          if (jsonData.root) {
            blot.mm.setFullData(jsonData)
          }
          else {
            blot.mm.setData(jsonData)
          }
          blot.mm.view.reset()
          blot.data = blot.mm.getData({})
          blot.domNode.setAttribute('data-mm', JSON.stringify(blot.data))
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

function handleZoomIn(blot: MindmapPlaceholderBlot): void {
  if (blot.mm && blot.mm.view) {
    const containerRect = blot.mm.el.getBoundingClientRect()
    const cx = containerRect.width / 2
    const cy = containerRect.height / 2
    blot.mm.view.enlarge(cx, cy, false)
    blot.zoomCount++
  }
}

function handleZoomOut(blot: MindmapPlaceholderBlot): void {
  if (blot.mm && blot.mm.view) {
    const containerRect = blot.mm.el.getBoundingClientRect()
    const cx = containerRect.width / 2
    const cy = containerRect.height / 2
    blot.mm.view.narrow(cx, cy, false)
    blot.zoomCount--
  }
}

function handleResetZoom(blot: MindmapPlaceholderBlot): void {
  if (!blot.mm || !blot.mm.view || blot.zoomCount === 0) return
  const containerRect = blot.mm.el.getBoundingClientRect()
  const centerX = containerRect.width / 2
  const centerY = containerRect.height / 2
  const operationCount = Math.abs(blot.zoomCount)
  const isEnlarge = blot.zoomCount < 0
  for (let i = 0; i < operationCount; i++) {
    if (isEnlarge) {
      blot.mm.view.enlarge(centerX, centerY, false)
    }
    else {
      blot.mm.view.narrow(centerX, centerY, false)
    }
  }
  blot.zoomCount = 0
}
