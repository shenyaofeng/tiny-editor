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
      console.warn(value)
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

  private debounce(func: Function, wait: number) {
    let timeout: number | null = null
    return function (this: any, ...args: any[]) {
      const context = this
      if (timeout !== null) {
        clearTimeout(timeout)
      }
      timeout = window.setTimeout(() => {
        func.apply(context, args)
      }, wait)
    }
  }

  private insertMindMapEditor(): void {
    this.domNode.style.width = '100%'
    this.domNode.style.height = '500px'
<<<<<<< HEAD
    MindMap.usePlugin(Drag)
    MindMap.usePlugin(Export)
=======

    MindMap.usePlugin(Drag).usePlugin(Export)
>>>>>>> 3895259 (fix:node content delete)
    this.mm = new MindMap({
      el: this.domNode,
      enableFreeDrag: false,
      mousewheelAction: 'zoom',
      disableMouseWheelZoom: true,
      data: this.data,
    } as any)

<<<<<<< HEAD
    const handleScroll = () => {
      this.mm.getElRectInfo()
    }
=======
    const handleScroll = this.debounce(() => {
      if (this.mm && this.domNode && this.domNode.isConnected) {
        this.mm.getElRectInfo()
      }
    }, 100)
>>>>>>> 3895259 (fix:node content delete)

    window.addEventListener('scroll', handleScroll, { passive: true })

    this.domNode.addEventListener('remove', () => {
      window.removeEventListener('scroll', handleScroll)
    })

    this.createControlPanel()
    this.initContextMenu() // 初始化右键菜单
    this.mm.on('node_tree_render_end', () => {
      this.data = this.mm.getData({})
      this.domNode.setAttribute('data-mm', JSON.stringify(this.data))
      this.scroll.update([], {})
    })
    if (this.mm) {
      this.mm.setData(this.data)
    }
  }

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
    else {
      console.warn('错误: this.mm 为 null')
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
    // 鼠标悬停效果
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
    // 左上的控制面板
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
    const backBtn = this.createControlItem('back', '回退', '回退到上一步', () => {
      if (!isStart) {
        this.mm.execCommand('BACK')
      }
    })
    const forwardBtn = this.createControlItem('forward', '前进', '前进到下一步', () => {
      if (!isEnd) {
        this.mm.execCommand('FORWARD')
      }
    })
    const exportImage = this.createControlItem('export', '导出', '导出思维导图', () => this.handleExport())
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
    controlLeftDownPanel.append(exportImage)
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
    this.mm.export('png', true, 'mindMapExport')
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
