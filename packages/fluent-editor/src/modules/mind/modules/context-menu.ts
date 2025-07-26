import type MindmapPlaceholderBlot from '../formats/mind-blot'

export function initContextMenu(blot: MindmapPlaceholderBlot): void {
  blot.contextMenu = document.createElement('div')
  blot.contextMenu.className = 'mindmap-context-menu'
  blot.contextMenu.style.position = 'fixed'
  blot.contextMenu.style.background = 'white'
  blot.contextMenu.style.borderRadius = '4px'
  blot.contextMenu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)'
  blot.contextMenu.style.padding = '5px 0'
  blot.contextMenu.style.zIndex = '1000'
  blot.contextMenu.style.display = 'block'
  blot.contextMenu.style.visibility = 'visible'
  blot.contextMenu.style.opacity = '1'
  blot.contextMenu.style.width = '120px'
  blot.contextMenu.style.height = 'auto'
  document.body.appendChild(blot.contextMenu)

  // 添加菜单项
  addContextMenuItem(blot, '复制', () => handleCopy(blot))
  addContextMenuItem(blot, '剪切', () => handleCut(blot))
  addContextMenuItem(blot, '粘贴', () => handlePaste(blot))
  addContextMenuItem(blot, '删除内容', () => handleDeleteContent(blot))

  // 监听节点右键点击事件
  if (blot.mm) {
    blot.mm.on('node_contextmenu', (e: any, node: any) => {
      e.preventDefault()
      e.stopPropagation()
      blot.currentNode = node
      if (blot.contextMenu) {
        blot.contextMenu.style.display = 'block'
        blot.contextMenu.style.left = `${e.clientX}px`
        blot.contextMenu.style.top = `${e.clientY}px`
      }
    })
  }

  // 隐藏菜单的逻辑
  const hideMenu = () => {
    if (blot.contextMenu) {
      blot.contextMenu.style.display = 'none'
      blot.currentNode = null
    }
  }

  blot.mm.on('node_click', hideMenu)
  blot.mm.on('draw_click', hideMenu)
  blot.mm.on('expand_btn_click', hideMenu)
  document.addEventListener('click', (e) => {
    if (blot.contextMenu && !blot.contextMenu.contains(e.target as Node)) {
      hideMenu()
    }
  })
}

function addContextMenuItem(blot: MindmapPlaceholderBlot, text: string, onClick: () => void): void {
  const item = document.createElement('div')
  item.className = 'mindmap-context-menu-item'
  item.textContent = text
  item.style.padding = '5px 15px'
  item.style.cursor = 'pointer'
  item.style.whiteSpace = 'nowrap'
  item.addEventListener('click', onClick)
  item.addEventListener('mouseenter', () => {
    item.style.background = '#f5f5f5'
  })
  item.addEventListener('mouseleave', () => {
    item.style.background = 'white'
  })
  blot.contextMenu!.appendChild(item)
}

function handleCopy(blot: MindmapPlaceholderBlot): void {
  blot.mm.renderer.copy()
  hideContextMenu(blot)
}

function handleCut(blot: MindmapPlaceholderBlot): void {
  blot.mm.renderer.cut()
  hideContextMenu(blot)
}

function handlePaste(blot: MindmapPlaceholderBlot): void {
  blot.mm.renderer.paste()
  hideContextMenu(blot)
}

function handleDeleteContent(blot: MindmapPlaceholderBlot): void {
  if (blot.currentNode) {
    blot.currentNode.setText('')
    blot.data = blot.mm.getData({})
    blot.domNode.setAttribute('data-mm', JSON.stringify(blot.data))
    blot.scroll.update([], {})
  }
  hideContextMenu(blot)
}

function hideContextMenu(blot: MindmapPlaceholderBlot): void {
  if (blot.contextMenu) {
    blot.contextMenu.style.display = 'none'
  }
}
