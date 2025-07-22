import type { Root } from 'parchment'
import type { BlockEmbed as TypeBlockEmbed } from 'quill/blots/block'
import Quill from 'quill'
import MindMap from 'simple-mind-map'
import Drag from 'simple-mind-map/src/plugins/Drag.js'
import Export from 'simple-mind-map/src/plugins/Export.js'
import '../assets/mindmap.scss'

const BlockEmbed = Quill.import('blots/block/embed') as typeof TypeBlockEmbed

class MindmapPlaceholderBlot extends BlockEmbed {
  static blotName = 'mindmap-placeholder'
  static tagName = 'div'
  static className = 'ql-mindmap'
  private mm: MindMap | null = null
  private data: any
  private zoomCount = 0
  private contextMenu: HTMLElement | null = null
  private currentNode: any = null
  private resizingHandle: HTMLElement | null = null
  private resizeStartX = 0
  private resizeStartY = 0
  private originalWidth = 0
  private originalHeight = 0
  private resizeHandles: Record<string, HTMLElement> = {}
  private maxWidth = 0

  constructor(scroll: Root, domNode: HTMLElement) {
    super(scroll, domNode)
    this.domNode.classList.add('ql-MindMap-container')
    this.domNode.style.height = '500px'
    this.domNode.style.border = '1px solid #e8e8e8'
    this.data = MindmapPlaceholderBlot.value(this.domNode)
    this.initMindMap()
  }

  static value(domNode: HTMLElement): any {
    const dataStr = JSON.parse(domNode.getAttribute('data-mm'))
    return dataStr.root ? dataStr.root : dataStr
  }

  static create(value: any): HTMLElement {
    const node = super.create() as HTMLElement
    if (value) {
      node.setAttribute('data-mm', JSON.stringify(value))
    }
    return node
  }

  private initMindMap(): void {
    if (this.domNode.isConnected) {
      this.insertMindMapEditor()
    }
    else {
      const observer = new MutationObserver(() => {
        if (this.domNode.isConnected) {
          this.insertMindMapEditor()
          observer.disconnect()
        }
      })
      observer.observe(document.body, { childList: true, subtree: true })
    }
  }

  private insertMindMapEditor(): void {
    this.domNode.style.width = '100%'
    this.domNode.style.height = '500px'
    this.maxWidth = this.domNode.offsetWidth

    MindMap.usePlugin(Drag).usePlugin(Export)
    this.mm = new MindMap({
      el: this.domNode,
      mousewheelAction: 'zoom',
      disableMouseWheelZoom: true,
      data: this.data,
    } as any)

    const handleScroll = () => {
      if (this.mm && this.domNode && this.domNode.isConnected) {
        this.mm.getElRectInfo()
      }
    }

    window.addEventListener('scroll', handleScroll)

    this.domNode.addEventListener('remove', () => {
      window.removeEventListener('scroll', handleScroll)
    })

    this.createControlPanel() // 创建控制面板
    this.initContextMenu() // 初始化右键菜单
    this.initResizeHandles() // 初始化调整大小的手柄
    this.mm.on('node_tree_render_end', () => {
      this.data = this.mm.getData({})
      this.domNode.setAttribute('data-mm', JSON.stringify(this.data))
      this.scroll.update([], {})
    })
    if (this.mm) {
      this.mm.setData(this.data)
    }
  }

  // 右键菜单
  private initContextMenu(): void {
    this.contextMenu = document.createElement('div')
    this.contextMenu.className = 'mindmap-context-menu'
    this.contextMenu.style.position = 'fixed'
    this.contextMenu.style.background = 'white'
    this.contextMenu.style.borderRadius = '4px'
    this.contextMenu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)'
    this.contextMenu.style.padding = '5px 0'
    this.contextMenu.style.zIndex = '1000'
    this.contextMenu.style.display = 'block'
    this.contextMenu.style.visibility = 'visible'
    this.contextMenu.style.opacity = '1'
    this.contextMenu.style.width = '120px'
    this.contextMenu.style.height = 'auto'
    document.body.appendChild(this.contextMenu)

    // 添加菜单项
    this.addContextMenuItem('复制', () => this.handleCopy())
    this.addContextMenuItem('剪切', () => this.handleCut())
    this.addContextMenuItem('粘贴', () => this.handlePaste())

    // 监听节点右键点击事件
    if (this.mm) {
      this.mm.on('node_contextmenu', (e: any, node: any) => {
        e.preventDefault()
        e.stopPropagation()
        this.currentNode = node
        if (this.contextMenu) {
          this.contextMenu.style.display = 'block'
          this.contextMenu.style.left = `${e.clientX}px`
          this.contextMenu.style.top = `${e.clientY}px`
        }
      })
    }

    // 隐藏菜单的逻辑
    const hideMenu = () => {
      if (this.contextMenu) {
        this.contextMenu.style.display = 'none'
        this.currentNode = null
      }
    }

    this.mm.on('node_click', hideMenu)
    this.mm.on('draw_click', hideMenu)
    this.mm.on('expand_btn_click', hideMenu)
    document.addEventListener('click', (e) => {
      if (this.contextMenu && !this.contextMenu.contains(e.target as Node)) {
        hideMenu()
      }
    })
  }

  private addContextMenuItem(text: string, onClick: () => void): void {
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
    this.contextMenu!.appendChild(item)
  }

  private handleCopy(): void {
    this.mm.renderer.copy()
    this.hideContextMenu()
  }

  private handleCut(): void {
    this.mm.renderer.cut()
    this.hideContextMenu()
  }

  private handlePaste(): void {
    this.mm.renderer.paste()
    this.hideContextMenu()
  }

  private hideContextMenu(): void {
    if (this.contextMenu) {
      this.contextMenu.style.display = 'none'
    }
  }

  private createControlPanel(): void {
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
    const zoomOutBtn = this.createControlItem('zoomOut', '缩小', '缩小思维导图', () => this.handleZoomOut())
    const zoomInBtn = this.createControlItem('zoomIn', '放大', '放大思维导图', () => this.handleZoomIn())
    const resetBtn = this.createControlItem('fit', '适应', '恢复逻辑原有尺寸', () => this.handleResetZoom())
    const backBtn = this.createControlItem('back', '上一步', '回退到上一步', () => {
      if (!isStart) {
        this.mm.execCommand('BACK')
      }
    })
    const forwardBtn = this.createControlItem('forward', '下一步', '前进到下一步', () => {
      if (!isEnd) {
        this.mm.execCommand('FORWARD')
      }
    })
    const exportJSON = this.createControlItem('export', '导出', '导出JSON文件', () => this.handleExport())
    const importJSON = this.createControlItem('import', '导入', '导入JSON文件', () => this.handleImport())
    const insertChildNode = this.createControlItem('inserChildNode', '子节点', '插入子节点', () => this.handleInsertChildNode())
    const insertNode = this.createControlItem('inserNode', '同级节点', '插入同级节点', () => this.handleInsertNode())
    const insertParentNode = this.createControlItem('inserParentNode', '父节点', '插入父节点', () => this.handleInsertParentNode())
    const removeNode = this.createControlItem('removeNode', '删除', '删除节点', () => this.handleRemoveNode())

    const updateButtonState = (index: number, len: number) => {
      isStart = index <= 0
      isEnd = index >= len - 1
      backBtn.style.cursor = isStart ? 'not-allowed' : 'pointer'
      backBtn.style.opacity = isStart ? '0.5' : '1'
      forwardBtn.style.cursor = isEnd ? 'not-allowed' : 'pointer'
      forwardBtn.style.opacity = isEnd ? '0.5' : '1'
    }

    this.mm.on('back_forward', (index: number, len: number) => {
      updateButtonState(index, len)
    })
    controlPanel.append(zoomOutBtn, zoomInBtn, resetBtn, backBtn, forwardBtn)
    this.domNode.appendChild(controlPanel)
    controlLeftDownPanel.append(exportJSON, importJSON)
    this.domNode.appendChild(controlLeftDownPanel)
    controlLeftUpPanel.append(insertChildNode, insertNode, insertParentNode, removeNode)
    this.domNode.appendChild(controlLeftUpPanel)
  }

  private handleInsertChildNode(): void {
    this.mm.execCommand('INSERT_CHILD_NODE')
  }

  private handleInsertNode(): void {
    this.mm.execCommand('INSERT_NODE')
  }

  private handleInsertParentNode(): void {
    this.mm.execCommand('INSERT_PARENT_NODE')
  }

  private handleRemoveNode(): void {
    this.mm.execCommand('REMOVE_CURRENT_NODE')
  }

  private createControlItem(iconClass: string, text: string, title: string, onClick: () => void, disabled = false) {
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

  private handleExport(): void {
    this.mm.getElRectInfo()
    if (this.mm) {
      this.mm.export('json', true, '思维导图')
    }
  }

  private handleImport(): void {
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
          if (this.mm) {
            if (jsonData.root) {
              this.mm.setFullData(jsonData)
            }
            else {
              this.mm.setData(jsonData)
            }
            this.mm.view.reset()
            this.data = this.mm.getData({})
            this.domNode.setAttribute('data-mm', JSON.stringify(this.data))
            this.scroll.update([], {})
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

  private handleZoomIn(): void {
    if (this.mm && this.mm.view) {
      const containerRect = this.mm.el.getBoundingClientRect()
      const cx = containerRect.width / 2
      const cy = containerRect.height / 2
      this.mm.view.enlarge(cx, cy, false)
      this.zoomCount++
    }
  }

  private handleZoomOut(): void {
    if (this.mm && this.mm.view) {
      const containerRect = this.mm.el.getBoundingClientRect()
      const cx = containerRect.width / 2
      const cy = containerRect.height / 2
      this.mm.view.narrow(cx, cy, false)
      this.zoomCount--
    }
  }

  private handleResetZoom(): void {
    if (!this.mm || !this.mm.view || this.zoomCount === 0) return
    const containerRect = this.mm.el.getBoundingClientRect()
    const centerX = containerRect.width / 2
    const centerY = containerRect.height / 2
    const operationCount = Math.abs(this.zoomCount)
    const isEnlarge = this.zoomCount < 0
    for (let i = 0; i < operationCount; i++) {
      if (isEnlarge) {
        this.mm.view.enlarge(centerX, centerY, false)
      }
      else {
        this.mm.view.narrow(centerX, centerY, false)
      }
    }
    this.zoomCount = 0
  }

  private initResizeHandles(): void {
  // 创建调整大小的手柄
    this.resizeHandles = {
      bottomRight: this.createResizeHandle('bottom-right', 'nwse-resize'),
      bottomLeft: this.createResizeHandle('bottom-left', 'nesw-resize'),
      topRight: this.createResizeHandle('top-right', 'nesw-resize'),
      topLeft: this.createResizeHandle('top-left', 'nwse-resize'),
    }

    // 将手柄添加到容器
    Object.values(this.resizeHandles).forEach((handle) => {
      this.domNode.appendChild(handle)
    })
  }

  private createResizeHandle(position: string, cursor: string): HTMLElement {
    const handle = document.createElement('div')
    handle.className = 'mindmap-resize-handle'
    handle.style.position = 'absolute'
    handle.style.width = '10px'
    handle.style.height = '10px'
    handle.style.background = '#CCCCCC'
    handle.style.cursor = cursor
    handle.style.zIndex = '10'
    handle.style.userSelect = 'none'

    // 设置手柄位置
    switch (position) {
      case 'bottom-right':
        handle.style.bottom = '0'
        handle.style.right = '0'
        break
      case 'bottom-left':
        handle.style.bottom = '0'
        handle.style.left = '0'
        break
      case 'top-right':
        handle.style.top = '0'
        handle.style.right = '0'
        break
      case 'top-left':
        handle.style.top = '0'
        handle.style.left = '0'
        break
    }

    handle.addEventListener('mousedown', this.onResizeStart)
    return handle
  }

  private onResizeStart = (e: MouseEvent) => {
    if (!(e.target instanceof HTMLElement)) return

    this.resizingHandle = e.target
    this.resizeStartX = e.clientX
    this.resizeStartY = e.clientY
    this.originalWidth = this.domNode.offsetWidth
    this.originalHeight = this.domNode.offsetHeight

    document.addEventListener('mousemove', this.onResizing)
    document.addEventListener('mouseup', this.onResizeEnd)
    e.preventDefault()
  }

  private onResizing = (e: MouseEvent) => {
    if (!this.resizingHandle) return

    const deltaX = e.clientX - this.resizeStartX
    const deltaY = e.clientY - this.resizeStartY
    let newWidth = this.originalWidth
    let newHeight = this.originalHeight

    // 根据手柄位置计算新的尺寸
    switch (this.resizingHandle.style.cursor) {
      case 'nwse-resize':
        newWidth = this.originalWidth + deltaX
        newHeight = this.originalHeight + deltaY
        break
      case 'nesw-resize':
        newWidth = this.originalWidth - deltaX
        newHeight = this.originalHeight + deltaY
        break
    }

    // 限制最小尺寸
    newWidth = Math.max(newWidth, 200)
    newHeight = Math.max(newHeight, 200)
    // 限制最大宽度不超过父容器宽度
    newWidth = Math.min(newWidth, this.maxWidth)

    // 应用新尺寸
    this.domNode.style.width = `${newWidth}px`
    this.domNode.style.height = `${newHeight}px`
    if (this.mm && this.mm.view) {
      this.mm.getElRectInfo()
      const svgElement = this.domNode.querySelector('svg')
      if (svgElement) {
        svgElement.style.width = '100%'
        svgElement.style.height = '100%'
        this.mm.getElRectInfo()
      }
    }
  }

  private onResizeEnd = () => {
    this.resizingHandle = null
    document.removeEventListener('mousemove', this.onResizing)
    document.removeEventListener('mouseup', this.onResizeEnd)
  }

  value(): any {
    return this.data
  }
}

Quill.register(MindmapPlaceholderBlot)
export class MindModule {
  quill: Quill
  toolbar: any
  mmContainer: HTMLElement | null = null
  mm: MindMap | null = null
  tempDiv: HTMLElement | null = null

  constructor(quill: Quill, options: any) {
    this.quill = quill
    this.toolbar = quill.getModule('toolbar')
    const domNode = document.querySelector('.ql-mind')

    if (domNode) {
      domNode.addEventListener('click', () => {
        this.insertMindMapEditor()
      })
    }
  }

  private insertMindMapEditor(): void {
    const range = this.quill.getSelection()
    if (range) {
      const defaultData = {
        data: {
          text: '根节点',
          expand: true,
          uid: '36bae545-da0b-4c08-be14-ff05f7f05d0a',
          isActive: false,
        },
        children: [
          {
            data: {
              text: '二级节点',
              uid: 'ef0895d2-b5cc-4214-b0ee-e29f8f02420d',
              expand: true,
              richText: false,
              isActive: false,
            },
            children: [],
          },
        ],
        smmVersion: '0.14.0-fix.1',
      }
      this.quill.insertEmbed(range.index, 'mindmap-placeholder', defaultData, 'user')
      this.quill.setSelection(range.index + 1, 0)
    }
  }
}
